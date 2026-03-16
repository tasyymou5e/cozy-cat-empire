import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate env at startup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

// ============================================================================
// Input schemas
// ============================================================================

const ValidateDisplayNameSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(100),
  username: z.string().max(100).optional(),
  action: z.enum(["validate", "validate_username"]).default("validate"),
  excludeUserId: z.string().uuid().optional(),
});

// ============================================================================
// Profanity filter
// ============================================================================

const PROFANITY_LIST = [
  'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'crap', 'damn', 'dick', 
  'fuck', 'fucking', 'fucker', 'shit', 'shitty', 'piss', 'cock', 'pussy', 
  'cunt', 'fag', 'faggot', 'slut', 'whore', 'retard', 'retarded',
  'nigger', 'nigga', 'kike', 'spic', 'chink', 'gook', 'wetback',
  'porn', 'xxx', 'nude', 'nudes', 'penis', 'vagina', 'dildo', 'masturbat',
  'nazi', 'hitler', 'rape', 'rapist', 'molest', 'pedo', 'pedophile',
  'kys', 'kill yourself', 'cancer', 'aids',
];

const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', 
  '+': 't', '(': 'c', ')': 'o', '|': 'i', '&': 'and',
};

const WHITELIST = [
  'class', 'classic', 'assist', 'assessment', 'bass', 'mass', 'pass',
  'cassette', 'assume', 'assassin', 'cockatoo', 'peacock', 'hancock',
  'scunthorpe', 'arsenal', 'therapist', 'analyst', 'shitake', 'shiitake',
];

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  for (const [leet, letter] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  normalized = normalized.replace(/[\s_.,-]/g, '');
  return normalized;
}

function checkProfanity(text: string): { clean: boolean; violations: string[] } {
  const original = text.toLowerCase();
  const normalized = normalizeText(text);
  
  for (const safe of WHITELIST) {
    if (original.includes(safe)) {
      return { clean: true, violations: [] };
    }
  }
  
  const violations: string[] = [];
  for (const word of PROFANITY_LIST) {
    if (normalized.includes(word) || original.includes(word)) {
      if (word.length <= 3) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(original) || normalized === word) {
          violations.push(word);
        }
      } else {
        violations.push(word);
      }
    }
  }
  
  return { clean: violations.length === 0, violations: [...new Set(violations)] };
}

// ============================================================================
// Validation helpers
// ============================================================================

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s_-]+$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const MIN_LENGTH = 3;
const MAX_LENGTH_DISPLAY = 30;
const MAX_LENGTH_USERNAME = 20;

interface ValidationResult {
  valid: boolean;
  available?: boolean;
  sanitized?: string;
  error?: string;
  suggestions?: string[];
  profanityViolation?: boolean;
}

function sanitizeDisplayName(name: string): string {
  return name.trim();
}

function validateDisplayNameFormat(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeDisplayName(name);
  if (sanitized.length < MIN_LENGTH) return { valid: false, error: `Display name must be at least ${MIN_LENGTH} characters` };
  if (sanitized.length > MAX_LENGTH_DISPLAY) return { valid: false, error: `Display name must be ${MAX_LENGTH_DISPLAY} characters or less` };
  if (!DISPLAY_NAME_REGEX.test(sanitized)) return { valid: false, error: 'Only letters, numbers, spaces, underscores, and hyphens allowed' };
  return { valid: true };
}

function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const sanitized = username.trim().toLowerCase();
  if (sanitized.length < MIN_LENGTH) return { valid: false, error: `Username must be at least ${MIN_LENGTH} characters` };
  if (sanitized.length > MAX_LENGTH_USERNAME) return { valid: false, error: `Username must be ${MAX_LENGTH_USERNAME} characters or less` };
  if (!USERNAME_REGEX.test(sanitized)) return { valid: false, error: 'Username must start with a letter and contain only letters, numbers, and underscores' };
  return { valid: true };
}

function generateDisplayNameSuggestions(baseName: string): string[] {
  const suggestions: string[] = [];
  const clean = baseName.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length < 2) return suggestions;
  suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
  suggestions.push(`${clean}_${Math.floor(Math.random() * 99)}`);
  const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers', 'Furry'];
  suggestions.push(`${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
  const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
  suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`);
  suggestions.push(`${clean}${new Date().getFullYear()}`);
  return suggestions.slice(0, 5);
}

function generateUsernameSuggestions(baseName: string): string[] {
  const suggestions: string[] = [];
  const clean = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (clean.length < 2) return suggestions;
  const base = /^[a-zA-Z]/.test(clean) ? clean : `cat${clean}`;
  suggestions.push(`${base}${Math.floor(Math.random() * 999)}`);
  suggestions.push(`${base}_${Math.floor(Math.random() * 99)}`);
  suggestions.push(`${base}_cat`);
  suggestions.push(`meow_${base}`);
  suggestions.push(`${base}${new Date().getFullYear()}`);
  return suggestions.slice(0, 5);
}

// ============================================================================
// Main handler
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parsed = ValidateDisplayNameSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ valid: false, error: parsed.error.issues[0]?.message || "Invalid input" } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { displayName, username, action, excludeUserId } = parsed.data;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ============ VALIDATE USERNAME ============
    if (action === 'validate_username' && username) {
      const sanitized = username.trim().toLowerCase();
      
      const formatCheck = validateUsernameFormat(sanitized);
      if (!formatCheck.valid) {
        return new Response(
          JSON.stringify({ valid: false, error: formatCheck.error, sanitized } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      const profanityCheck = checkProfanity(sanitized);
      if (!profanityCheck.clean) {
        console.log(`[PROFANITY] Username blocked: ${sanitized}`);
        return new Response(
          JSON.stringify({ valid: false, available: false, error: 'Username contains inappropriate content', profanityViolation: true, sanitized } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', sanitized)
        .limit(1);
      
      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Failed to check availability' } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      const isTaken = data && data.length > 0 && (!excludeUserId || data[0].id !== excludeUserId);
      
      if (isTaken) {
        const suggestions = generateUsernameSuggestions(sanitized);
        return new Response(
          JSON.stringify({ valid: true, available: false, sanitized, error: 'This username is already taken', suggestions } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ valid: true, available: true, sanitized } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ============ VALIDATE DISPLAY NAME ============
    const sanitized = sanitizeDisplayName(displayName);
    
    const formatCheck = validateDisplayNameFormat(sanitized);
    if (!formatCheck.valid) {
      return new Response(
        JSON.stringify({ valid: false, error: formatCheck.error, sanitized } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const profanityCheck = checkProfanity(sanitized);
    if (!profanityCheck.clean) {
      console.log(`[PROFANITY] Display name blocked: ${sanitized}`);
      return new Response(
        JSON.stringify({ valid: false, available: false, error: 'Display name contains inappropriate content', profanityViolation: true, sanitized } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', sanitized)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to check availability' } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isTaken = data && data.length > 0 && (!excludeUserId || data[0].id !== excludeUserId);

    if (isTaken) {
      const suggestions = generateDisplayNameSuggestions(sanitized);
      return new Response(
        JSON.stringify({ valid: true, available: false, sanitized, error: 'This name is already taken', suggestions } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, available: true, sanitized } as ValidationResult),
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
