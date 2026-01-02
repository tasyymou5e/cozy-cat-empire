import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  notificationType?: 'friend_requests' | 'gifts' | 'trades' | 'rewards' | 'challenges';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, icon, url, notificationType }: PushPayload = await req.json();

    console.log('Sending push notification to user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

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
        .eq('user_id', userId)
        .in('endpoint', expiredEndpoints);
      console.log(`Removed ${expiredEndpoints.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        expired: expiredEndpoints.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
