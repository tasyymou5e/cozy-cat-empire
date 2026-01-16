import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ PROFANITY FILTER ============

// Comprehensive profanity word list (English focused, expandable)
const PROFANITY_LIST = [
  // Common profanity
  'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'crap', 'damn', 'dick', 
  'fuck', 'fucking', 'fucker', 'shit', 'shitty', 'piss', 'cock', 'pussy', 
  'cunt', 'fag', 'faggot', 'slut', 'whore', 'retard', 'retarded',
  // Slurs and hate speech
  'nigger', 'nigga', 'kike', 'spic', 'chink', 'gook', 'wetback',
  // Sexual content
  'porn', 'xxx', 'nude', 'nudes', 'penis', 'vagina', 'dildo', 'masturbat',
  // Offensive terms
  'nazi', 'hitler', 'rape', 'rapist', 'molest', 'pedo', 'pedophile',
  // Gaming toxicity
  'kys', 'kill yourself', 'cancer', 'aids',
];

// Leetspeak mappings for bypassing filters
const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', 
  '+': 't', '(': 'c', ')': 'o', '|': 'i', '&': 'and',
};

// Common false positives to whitelist (Scunthorpe problem)
const WHITELIST = [
  'class', 'classic', 'assist', 'assessment', 'bass', 'mass', 'pass',
  'cassette', 'assume', 'assassin', 'cockatoo', 'peacock', 'hancock',
  'scunthorpe', 'arsenal', 'therapist', 'analyst', 'shitake', 'shiitake',
];

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace leetspeak characters
  for (const [leet, letter] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }
  
  // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  
  // Remove spaces/underscores/dots between letters (e.g., "f.u.c.k" -> "fuck")
  normalized = normalized.replace(/[\s_.,-]/g, '');
  
  return normalized;
}

function checkProfanity(text: string): { clean: boolean; violations: string[] } {
  const original = text.toLowerCase();
  const normalized = normalizeText(text);
  
  // Check whitelist first
  for (const safe of WHITELIST) {
    if (original.includes(safe)) {
      // If the word is in whitelist, skip checking for that word
      return { clean: true, violations: [] };
    }
  }
  
  const violations: string[] = [];
  
  for (const word of PROFANITY_LIST) {
    // Check both original and normalized versions
    if (normalized.includes(word) || original.includes(word)) {
      // For short words (3 chars), require exact match to avoid false positives
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
  
  // Remove duplicates
  return { clean: violations.length === 0, violations: [...new Set(violations)] };
}

// ============ VALIDATION ============

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
  
  if (sanitized.length < MIN_LENGTH) {
    return { valid: false, error: `Display name must be at least ${MIN_LENGTH} characters` };
  }
  
  if (sanitized.length > MAX_LENGTH_DISPLAY) {
    return { valid: false, error: `Display name must be ${MAX_LENGTH_DISPLAY} characters or less` };
  }
  
  if (!DISPLAY_NAME_REGEX.test(sanitized)) {
    return { valid: false, error: 'Only letters, numbers, spaces, underscores, and hyphens allowed' };
  }
  
  return { valid: true };
}

function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const sanitized = username.trim().toLowerCase();
  
  if (sanitized.length < MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_LENGTH} characters` };
  }
  
  if (sanitized.length > MAX_LENGTH_USERNAME) {
    return { valid: false, error: `Username must be ${MAX_LENGTH_USERNAME} characters or less` };
  }
  
  if (!USERNAME_REGEX.test(sanitized)) {
    return { valid: false, error: 'Username must start with a letter and contain only letters, numbers, and underscores' };
  }
  
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
  
  // Ensure starts with letter
  const base = /^[a-zA-Z]/.test(clean) ? clean : `cat${clean}`;
  
  suggestions.push(`${base}${Math.floor(Math.random() * 999)}`);
  suggestions.push(`${base}_${Math.floor(Math.random() * 99)}`);
  suggestions.push(`${base}_cat`);
  suggestions.push(`meow_${base}`);
  suggestions.push(`${base}${new Date().getFullYear()}`);
  
  return suggestions.slice(0, 5);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { displayName, username, action = 'validate', excludeUserId } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============ VALIDATE USERNAME ============
    if (action === 'validate_username' && username) {
      const sanitized = username.trim().toLowerCase();
      
      // Format validation
      const formatCheck = validateUsernameFormat(sanitized);
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
      
      // Profanity check
      const profanityCheck = checkProfanity(sanitized);
      if (!profanityCheck.clean) {
        console.log(`[PROFANITY] Username blocked: ${sanitized}, violations: ${profanityCheck.violations.join(', ')}`);
        return new Response(
          JSON.stringify({
            valid: false,
            available: false,
            error: 'Username contains inappropriate content',
            profanityViolation: true,
            sanitized,
          } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Check availability
      const query = supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', sanitized)
        .limit(1);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Failed to check availability' } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Check if taken by another user
      const isTaken = data && data.length > 0 && (!excludeUserId || data[0].id !== excludeUserId);
      
      if (isTaken) {
        const suggestions = generateUsernameSuggestions(sanitized);
        return new Response(
          JSON.stringify({
            valid: true,
            available: false,
            sanitized,
            error: 'This username is already taken',
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
    }

    // ============ VALIDATE DISPLAY NAME ============
    if (!displayName || typeof displayName !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Display name is required' } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const sanitized = sanitizeDisplayName(displayName);
    
    // Format validation
    const formatCheck = validateDisplayNameFormat(sanitized);
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
    
    // Profanity check
    const profanityCheck = checkProfanity(sanitized);
    if (!profanityCheck.clean) {
      console.log(`[PROFANITY] Display name blocked: ${sanitized}, violations: ${profanityCheck.violations.join(', ')}`);
      return new Response(
        JSON.stringify({
          valid: false,
          available: false,
          error: 'Display name contains inappropriate content',
          profanityViolation: true,
          sanitized,
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check availability in database
    const query = supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', sanitized)
      .limit(1);
    
    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to check availability' } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check if taken by another user
    const isTaken = data && data.length > 0 && (!excludeUserId || data[0].id !== excludeUserId);

    if (isTaken) {
      const suggestions = generateDisplayNameSuggestions(sanitized);
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
