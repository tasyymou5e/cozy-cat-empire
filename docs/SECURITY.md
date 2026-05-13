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

-- Admins can send gifts (for admin gifting feature)
CREATE POLICY "Admins can send gifts"
ON public.cat_gifts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Recipients can update gift status
CREATE POLICY "Recipients can update gift status"
ON public.cat_gifts FOR UPDATE
USING (auth.uid() = recipient_id);

-- Admins can view all gifts (for moderation)
CREATE POLICY "Admins can view all gifts"
ON public.cat_gifts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any gift (for moderation/revocation)
CREATE POLICY "Admins can update gifts"
ON public.cat_gifts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete gifts
CREATE POLICY "Admins can delete gifts"
ON public.cat_gifts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
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

**RLS Policies (Exact):**
```sql
-- Authenticated users can insert their own error logs
-- Enforces: auth present, user_id matches caller or is null,
--           message length <= 5000, stack length <= 10000
CREATE POLICY "Authenticated users can insert own error logs"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND ((user_id IS NULL) OR (user_id = auth.uid()))
  AND (char_length(COALESCE(error_message, ''::text)) <= 5000)
  AND (char_length(COALESCE(error_stack, ''::text)) <= 10000)
);

-- Users can view only their own errors
CREATE POLICY "Users can view their own errors"
ON public.error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
ON public.error_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update error logs (e.g. mark resolved)
CREATE POLICY "Admins can update error logs"
ON public.error_logs FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete error logs
CREATE POLICY "Admins can delete error logs"
ON public.error_logs FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
```

**SECURITY DEFINER RPC — `log_client_error_secure`:**

> The canonical error messages used in the `RAISE EXCEPTION` statements below are
> defined as shared constants in **`src/constants/telemetryErrors.ts`**.
> If you change a message in the SQL, you must update the TS constants and
> all test assertions that import them.

```sql
CREATE OR REPLACE FUNCTION public.log_client_error_secure(
  _error_type         text,
  _error_message      text,
  _error_stack        text DEFAULT NULL,
  _component_name     text DEFAULT NULL,
  _route              text DEFAULT NULL,
  _user_agent         text DEFAULT NULL,
  _metadata           jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _meta jsonb := coalesce(_metadata, '{}'::jsonb);
  _clean_type text := btrim(coalesce(_error_type, ''));
  _clean_msg text := btrim(coalesce(_error_message, ''));
BEGIN
  -- error_type: required, must match [a-z][a-z0-9_]{2,49}
  IF _clean_type !~ '^[a-z][a-z0-9_]{2,49}$' THEN
    RAISE EXCEPTION 'Invalid error_type';
  END IF;

  -- error_message: required, length-bounded
  IF char_length(_clean_msg) = 0 THEN
    RAISE EXCEPTION 'error_message required';
  END IF;
  IF char_length(_clean_msg) > 5000 THEN
    RAISE EXCEPTION 'error_message too long';
  END IF;

  -- length caps on optional fields
  IF char_length(coalesce(_error_stack, '')) > 10000 THEN
    RAISE EXCEPTION 'error_stack too long';
  END IF;
  IF char_length(coalesce(_component_name, '')) > 200 THEN
    RAISE EXCEPTION 'component_name too long';
  END IF;
  IF char_length(coalesce(_route, '')) > 500 THEN
    RAISE EXCEPTION 'route too long';
  END IF;
  IF char_length(coalesce(_user_agent, '')) > 500 THEN
    RAISE EXCEPTION 'user_agent too long';
  END IF;

  -- metadata: must be an object, capped at 8 KB
  IF jsonb_typeof(_meta) <> 'object' THEN
    RAISE EXCEPTION 'metadata must be an object';
  END IF;
  IF octet_length(_meta::text) > 8192 THEN
    RAISE EXCEPTION 'metadata too large';
  END IF;

  INSERT INTO public.error_logs (
    user_id, error_type, error_message, error_stack,
    component_name, route, user_agent, metadata
  )
  VALUES (
    auth.uid(),
    _clean_type,
    _clean_msg,
    LEFT(coalesce(_error_stack, ''), 10000),
    LEFT(coalesce(_component_name, ''), 200),
    LEFT(coalesce(_route, ''), 500),
    LEFT(coalesce(_user_agent, ''), 500),
    _meta
  );
END;
$$;
```

**RPC Execution Rights:**
```sql
GRANT EXECUTE ON FUNCTION public.log_client_error_secure TO anon, authenticated;
```

**Client Routing:**
- `useErrorLogger.ts` → calls `supabase.rpc('log_client_error_secure', …)`
- Edge functions with `SUPABASE_SERVICE_ROLE_KEY` bypass RLS and are unchanged.

---

### auth_attempts_log

**RLS Policies (Exact):**
```sql
-- Authenticated users can insert their own auth attempts
-- Enforces: auth present, user_id matches caller or is null,
--           attempt_type in allow-list, email <= 254 chars, error_message <= 1000 chars
CREATE POLICY "Authenticated users can insert own auth attempts"
ON public.auth_attempts_log FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND ((user_id IS NULL) OR (user_id = auth.uid()))
  AND (attempt_type = ANY (ARRAY[
    'admin_login'::text,
    'admin_login_failed'::text,
    'access_denied'::text,
    'login'::text,
    'signup'::text,
    'password_reset'::text,
    'logout'::text
  ]))
  AND (char_length(COALESCE(email, ''::text)) <= 254)
  AND (char_length(COALESCE(error_message, ''::text)) <= 1000)
);

-- Admins can view all auth attempts
CREATE POLICY "Admins can view auth attempts"
ON public.auth_attempts_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
```

**SECURITY DEFINER RPC — `log_auth_attempt_secure`:**
```sql
CREATE OR REPLACE FUNCTION public.log_auth_attempt_secure(
  _email          text,
  _attempt_type   text,
  _success        boolean,
  _error_message  text DEFAULT NULL,
  _metadata       jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _attempt_type NOT IN (
    'admin_login',
    'admin_login_failed',
    'access_denied',
    'login',
    'signup',
    'password_reset',
    'logout'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt_type';
  END IF;

  INSERT INTO public.auth_attempts_log (
    email, attempt_type, success, error_message, user_id, metadata
  )
  VALUES (
    LEFT(coalesce(_email, ''), 254),
    _attempt_type,
    coalesce(_success, false),
    LEFT(coalesce(_error_message, ''), 1000),
    auth.uid(),
    coalesce(_metadata, '{}'::jsonb)
  );
END;
$$;
```

**RPC Execution Rights:**
```sql
GRANT EXECUTE ON FUNCTION public.log_auth_attempt_secure TO anon, authenticated;
```

**Allow-List for `attempt_type`:**
| Value | Purpose |
|-------|---------|
| `admin_login` | Successful admin dashboard login |
| `admin_login_failed` | Failed admin dashboard login attempt |
| `access_denied` | Non-admin tried to access admin route |
| `login` | Standard user login |
| `signup` | New user registration |
| `password_reset` | Password reset request |
| `logout` | User sign-out |

**Client Routing:**
- `useAdminActivityLog.ts` → `logAuthAttempt()` calls `supabase.rpc('log_auth_attempt_secure', …)`
- Direct `supabase.from('auth_attempts_log').insert(…)` is no longer used in client code.

---

### Admin Tables
```sql
-- Only admins can access admin activity log
CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
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

## Security Linter Refinements

The security linter functions have been refined to reduce false positives:

### Legitimate Public INSERTs (Excluded from Warnings)
| Table | Reason |
|-------|--------|
| `auth_attempts_log` | Must log failed login attempts from unauthenticated users |
| `tutorial_analytics` | Must track anonymous users in tutorial |
| `error_logs` | Must capture errors before authentication |

### Intentionally Public Tables (Excluded from Admin SELECT Warnings)
| Table | Reason |
|-------|--------|
| `game_config` | Configuration readable by all players |
| `player_stats` | Leaderboard data is public by design |
| `public_leaderboard` | View specifically designed for public access |

### ALL Policy Recognition
The linter now recognizes PostgreSQL `ALL` command policies as covering SELECT access, preventing false positives for tables like `admin_notifications` that use `ALL` instead of individual `SELECT` policies.

---

## Future Security Improvements

### Recommended Enhancements
1. **Rate Limiting**: Add database rate limits for social actions
2. **IP Blocking**: For abuse prevention
3. **2FA**: Optional two-factor authentication
4. **Data Export**: GDPR compliance endpoint
5. **Account Deletion**: Full data purge capability (partially implemented via admin)
6. **Session Management**: Multiple device session handling
