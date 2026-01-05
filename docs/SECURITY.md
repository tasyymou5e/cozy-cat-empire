# Cat Farm - Security Design

## Overview
This document covers all security measures, authentication, authorization, and Row-Level Security (RLS) policies implemented in Cat Farm.

---

## Authentication

### Supabase Auth
Cat Farm uses Supabase Authentication with email/password.

**Configuration:**
- Auto-confirm email signups enabled (for development)
- Password minimum length: 6 characters
- Email validation via Zod schema
- Password reset via edge function

### Auth Flow
```
User visits /auth
    ↓
Sign Up: email + password
    ↓
Supabase creates auth.users record
    ↓
Trigger: handle_new_user() creates profiles record
    ↓
User redirected to / (game)
    ↓
AuthContext provides user session
```

### Session Management
```typescript
// AuthContext.tsx
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

### Email Redirect
Sign-up includes proper email redirect configuration:
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/`
  },
});
```

### Password Reset
Password reset is handled via an edge function:
```typescript
// supabase/functions/send-password-reset/index.ts
const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
```

---

## Admin Authentication

### Role-Based Access Control
Admins are identified via the `user_roles` table:

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL, -- 'admin' | 'moderator' | 'user'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

### has_role() Function
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Admin Route Protection
```typescript
// AdminRoute.tsx
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading, user } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      logAuthAttempt({ attemptType: 'access_denied', ... });
      navigate('/catking');
    }
  }, [loading, user, isAdmin]);

  if (!isAdmin) return null;
  return <>{children}</>;
}
```

---

## Row-Level Security (RLS)

All tables have RLS enabled with appropriate policies.

### profiles
```sql
-- Anyone can view profiles (for social features)
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### game_saves
```sql
-- Users can only access their own saves
CREATE POLICY "Users can view their own saves"
ON public.game_saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves"
ON public.game_saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saves"
ON public.game_saves FOR UPDATE USING (auth.uid() = user_id);
```

### player_stats
```sql
-- Leaderboard is public
CREATE POLICY "Anyone can view leaderboard"
ON public.player_stats FOR SELECT USING (true);

-- Users can only manage their own stats
CREATE POLICY "Users can insert their own stats"
ON public.player_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.player_stats FOR UPDATE USING (auth.uid() = user_id);
```

### player_friends
```sql
-- Users can view their friendships
CREATE POLICY "Users can view their own friends"
ON public.player_friends FOR SELECT
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.player_friends FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Both parties can update friendship status
CREATE POLICY "Users can update their friend requests"
ON public.player_friends FOR UPDATE
USING ((auth.uid() = friend_id) OR (auth.uid() = user_id));

-- Both parties can delete friendships
CREATE POLICY "Users can delete friendships"
ON public.player_friends FOR DELETE
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));
```

### cat_gifts
```sql
-- Users can view their sent/received gifts
CREATE POLICY "Users can view their gifts"
ON public.cat_gifts FOR SELECT
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- Users can send gifts
CREATE POLICY "Users can send gifts"
ON public.cat_gifts FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Recipients can update gift status
CREATE POLICY "Recipients can update gift status"
ON public.cat_gifts FOR UPDATE
USING (auth.uid() = recipient_id);
```

### trade_offers
```sql
-- Users can view their trades
CREATE POLICY "Users can view their trades"
ON public.trade_offers FOR SELECT
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- Users can create trades
CREATE POLICY "Users can create trades"
ON public.trade_offers FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Both parties can update trades
CREATE POLICY "Users can update their trades"
ON public.trade_offers FOR UPDATE
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
```

### weekly_challenges
```sql
-- Anyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
ON public.weekly_challenges FOR SELECT
USING (is_active = true);

-- No user INSERT/UPDATE/DELETE (managed by edge functions)
```

### error_logs
```sql
-- Authenticated users can insert errors
CREATE POLICY "Authenticated users can insert errors"
ON public.error_logs FOR INSERT
WITH CHECK (true);

-- Users can only view their own errors
CREATE POLICY "Users can view their own errors"
ON public.error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Note: No UPDATE or DELETE allowed via RLS
-- Cleanup is performed by cleanup-error-logs edge function using service role
-- Automatic cleanup: Daily at 3 AM UTC, deletes logs older than 30 days
```

### Admin Tables
```sql
-- Only admins can access admin activity log
CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auth attempts log - anyone can insert, only admins can view
CREATE POLICY "Anyone can log auth attempts"
ON public.auth_attempts_log FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view auth attempts"
ON public.auth_attempts_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
```

---

## Input Validation

### Client-Side Validation (Zod)
```typescript
// Auth validation
const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Signup validation (includes display name and username)
const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  displayName: z.string()
    .trim()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(30, { message: 'Display name must be 30 characters or less' })
    .regex(/^[a-zA-Z0-9\s_-]+$/, { 
      message: 'Only letters, numbers, spaces, underscores, and hyphens allowed' 
    }),
  username: z.string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be 20 characters or less' })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, { 
      message: 'Username must start with a letter and contain only letters, numbers, and underscores' 
    }),
});
```

### Profanity Filter
The `validate-display-name` edge function includes a comprehensive profanity filter:

**Features:**
- 100+ common profane words blocked
- Leetspeak detection (e.g., `@$$` → `ass`, `sh1t` → `shit`)
- Repeated character normalization (e.g., `fuuuuck` → `fuck`)
- Spacing bypass detection (e.g., `f.u.c.k`, `s_h_i_t`)
- Whitelist for common false positives (Scunthorpe problem)
- Multi-language support (English primary, basic Spanish/Portuguese)

**Implementation:**
```typescript
// Leetspeak normalization
const LEETSPEAK_MAP = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
};

// Text normalization before checking
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  for (const [leet, letter] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  normalized = normalized.replace(/[\s_.,-]/g, '');
  return normalized;
}
```

### Username Validation Rules

| Rule | Value | Description |
|------|-------|-------------|
| Minimum length | 3 | Short usernames reserved |
| Maximum length | 20 | Fits in UI elements |
| Allowed characters | `a-z`, `0-9`, `_` | Simple, clean format |
| Must start with | Letter | Prevents confusion |
| Case sensitivity | Insensitive | `CoolCat` = `coolcat` |
| Uniqueness | Required | Unique index enforced |

### Data Sanitization
- Error messages truncated to 5,000 characters
- Error stacks truncated to 10,000 characters
- User agent strings captured for debugging
- Display names and usernames validated server-side before storage

---

## Edge Function Security

### Public Edge Functions
These functions have `verify_jwt = false`:
- `process-leaderboard-rewards` - Scheduled task
- `generate-weekly-challenges` - Scheduled task
- `send-push-notification` - Internal notification service
- `send-password-reset` - Public password reset
- `cleanup-error-logs` - Scheduled daily cleanup (called via pg_cron)
- `validate-display-name` - Validates display names and usernames with profanity filter
- `manage-portrait-credits` - Portrait credit management

### Protected Edge Functions
These functions require authentication:
- `generate-cat-portrait` - Uses user context for AI usage tracking
- `admin-delete-user` - Admin-only, uses has_role() check

### Edge Function Environment
```typescript
// Use service role key for privileged operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

---

## Security Best Practices Implemented

### 1. No Client-Side Admin Checks
❌ Never do this:
```typescript
if (localStorage.getItem('isAdmin')) { /* dangerous */ }
```

✅ Always use server-side:
```typescript
// RLS policies or database function
const { data } = await supabase.rpc('has_role', { 
  _user_id: userId, 
  _role: 'admin' 
});
```

### 2. No Sensitive Data in Logs
- Passwords never logged
- Auth tokens never logged
- Personal data minimized in error logs

### 3. Rate Limiting Considerations
- Cloud save: 5-minute intervals
- Notifications: Supabase Realtime handles throttling

### 4. CORS Headers
Edge functions include proper CORS:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## Potential Attack Vectors & Mitigations

### 1. Game State Manipulation
**Risk:** User modifies game state in localStorage/memory.

**Mitigation:**
- Server-side validation for leaderboard submissions
- Player stats synced from cloud save, not client state
- Critical actions use RLS-protected database operations

### 2. Friend Request Spam
**Risk:** Malicious user sends many friend requests.

**Mitigation:**
- RLS prevents duplicate requests
- UI limits shown pending requests
- Future: Rate limiting on friend requests

### 3. Trade Offer Abuse
**Risk:** Expired trades or manipulation.

**Mitigation:**
- 7-day auto-expiration on trades
- Status checks before trade execution
- RLS prevents unauthorized trade modifications

### 4. Gift Bomb Attack
**Risk:** Malicious user sends many unwanted cats.

**Mitigation:**
- Gifts must be accepted (not auto-added)
- Recipients can decline gifts
- UI shows pending count

### 5. Error Log Flooding
**Risk:** Attacker floods error_logs table.

**Mitigation:**
- **Client-side rate limiting**: 10 errors per minute max
- Client-side deduplication (singleton pattern)
- Message length limits (5,000 chars message, 10,000 chars stack)
- **Automatic cleanup**: Daily cron job deletes logs older than 30 days
- Database storage limits apply

### 6. Admin Impersonation
**Risk:** User attempts to access admin features.

**Mitigation:**
- Role checks via database function (SECURITY DEFINER)
- AdminRoute component with server-side verification
- All admin actions logged to admin_activity_log

---

## Security Checklist

### Authentication
- [x] Email/password auth implemented
- [x] Session management with onAuthStateChange
- [x] Auto-confirm for development
- [x] Email redirect URLs configured
- [x] Protected routes redirect to /auth
- [x] Password reset functionality

### Authorization
- [x] RLS enabled on all tables
- [x] Policies check auth.uid()
- [x] Admin roles stored in separate table
- [x] has_role() function with SECURITY DEFINER
- [x] Service role only in edge functions
- [x] Admin route protection

### Data Protection
- [x] JSONB for complex game state
- [x] Input validation with Zod
- [x] No sensitive data exposure in client
- [x] Error messages sanitized

### Network Security
- [x] HTTPS only (Supabase default)
- [x] CORS configured for edge functions
- [x] API keys properly scoped (anon vs service role)

### Audit Logging
- [x] Admin actions logged to admin_activity_log
- [x] Auth attempts logged to auth_attempts_log
- [x] Player activities logged to player_activity_log
- [x] AI usage logged to ai_usage_log

---

## Future Security Improvements

### Recommended Enhancements
1. **Rate Limiting**: Add database rate limits for social actions
2. **IP Blocking**: For abuse prevention
3. **2FA**: Optional two-factor authentication
4. **Data Export**: GDPR compliance endpoint
5. **Account Deletion**: Full data purge capability (partially implemented via admin)
6. **Session Management**: Multiple device session handling
