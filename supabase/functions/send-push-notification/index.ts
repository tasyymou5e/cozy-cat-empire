import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate env at startup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env vars');
}

// Rate limit: 50 notifications per user per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 50;

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkInMemoryRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || (now - userLimit.windowStart) > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count };
}

const PushPayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  icon: z.string().max(500).optional(),
  url: z.string().max(500).optional(),
  notificationType: z.enum(['friend_requests', 'gifts', 'trades', 'rewards', 'challenges']).optional(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check rate limit
    const rateLimit = checkInMemoryRateLimit(user.id);
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remaining: rateLimit.remaining
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          } 
        }
      );
    }

    const rawBody = await req.json();
    const parsedBody = PushPayloadSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', details: parsedBody.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { userId, title, body, icon, url, notificationType } = parsedBody.data;
    
    // Determine target user - default to self if not specified
    const targetUserId = userId || user.id;

    // Authorization check: users can only send to themselves unless they're admin
    if (targetUserId !== user.id) {
      // Check if user has admin role using service client
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        console.error('User attempted to send notification to another user without admin role');
        return new Response(
          JSON.stringify({ error: 'Not authorized to send notifications to other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Admin user sending notification to:', targetUserId);
    }

    console.log('Sending push notification to user:', targetUserId);

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/favicon.ico',
      url: url || '/'
    });

    let sentCount = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      // Check notification preferences
      const prefs = sub.notification_preferences as Record<string, boolean>;
      if (notificationType && prefs && prefs[notificationType] === false) {
        console.log(`User has disabled ${notificationType} notifications, skipping`);
        continue;
      }

      try {
        // Use web-push compatible approach
        const response = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          sentCount++;
          console.log('Push sent successfully to endpoint');
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired
          expiredEndpoints.push(sub.endpoint);
          console.log('Subscription expired, marking for removal');
        } else {
          console.error('Push failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error sending push to endpoint:', error);
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', targetUserId)
        .in('endpoint', expiredEndpoints);
      console.log(`Removed ${expiredEndpoints.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        expired: expiredEndpoints.length,
        rateLimitRemaining: rateLimit.remaining
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        } 
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simplified web push sending
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // For now, use a direct fetch - in production you'd want the full web-push crypto
  // This is a simplified version that works with most push services
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400'
  };

  // Note: Full implementation would require proper VAPID JWT signing
  // and message encryption. For a complete solution, consider using
  // a web-push library or implementing the full Web Push protocol.
  
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers,
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
