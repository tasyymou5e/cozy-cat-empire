import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation regex - matches client-side
const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s_-]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;

interface ValidationResult {
  valid: boolean;
  available?: boolean;
  sanitized?: string;
  error?: string;
  suggestions?: string[];
}

function sanitizeDisplayName(name: string): string {
  return name.trim();
}

function validateFormat(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeDisplayName(name);
  
  if (sanitized.length < MIN_LENGTH) {
    return { valid: false, error: `Display name must be at least ${MIN_LENGTH} characters` };
  }
  
  if (sanitized.length > MAX_LENGTH) {
    return { valid: false, error: `Display name must be ${MAX_LENGTH} characters or less` };
  }
  
  if (!DISPLAY_NAME_REGEX.test(sanitized)) {
    return { valid: false, error: 'Only letters, numbers, spaces, underscores, and hyphens allowed' };
  }
  
  return { valid: true };
}

function generateSuggestions(baseName: string): string[] {
  const suggestions: string[] = [];
  const clean = baseName.replace(/[^a-zA-Z0-9]/g, '');
  
  if (clean.length < 2) return suggestions;
  
  // Add random numbers
  suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
  suggestions.push(`${clean}_${Math.floor(Math.random() * 99)}`);
  
  // Cat-themed suffixes
  const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers', 'Furry'];
  suggestions.push(`${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
  
  // Prefixes
  const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
  suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`);
  
  // Year-based
  suggestions.push(`${clean}${new Date().getFullYear()}`);
  
  return suggestions.slice(0, 5);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { displayName, action = 'validate' } = await req.json();
    
    if (!displayName || typeof displayName !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Display name is required' } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const sanitized = sanitizeDisplayName(displayName);
    
    // Validate format first
    const formatCheck = validateFormat(sanitized);
    if (!formatCheck.valid) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: formatCheck.error,
          sanitized 
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check availability in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .ilike('display_name', sanitized)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to check availability' } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isAvailable = !data || data.length === 0;

    if (!isAvailable) {
      const suggestions = generateSuggestions(sanitized);
      return new Response(
        JSON.stringify({
          valid: true,
          available: false,
          sanitized,
          error: 'This name is already taken',
          suggestions
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        available: true,
        sanitized
      } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
