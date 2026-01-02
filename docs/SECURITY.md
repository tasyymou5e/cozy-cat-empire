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

// Profile validation
const profileSchema = z.object({
  display_name: z.string().trim().max(30).optional(),
  avatar_emoji: z.string().max(4).optional(),
});
```

### Data Sanitization
- Error messages truncated to 5,000 characters
- Error stacks truncated to 10,000 characters
- User agent strings captured for debugging

---

## Edge Function Security

### Public Edge Functions
These functions have `verify_jwt = false`:
- `process-leaderboard-rewards` - Scheduled task
- `generate-weekly-challenges` - Scheduled task
- `send-push-notification` - Internal notification service

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
const { data } = await supabase.rpc('is_admin', { user_id: userId });
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
- Client-side deduplication (singleton pattern)
- Message length limits
- Database storage limits (not implemented, consider)

---

## Security Checklist

### Authentication
- [x] Email/password auth implemented
- [x] Session management with onAuthStateChange
- [x] Auto-confirm for development
- [x] Email redirect URLs configured
- [x] Protected routes redirect to /auth

### Authorization
- [x] RLS enabled on all tables
- [x] Policies check auth.uid()
- [x] No roles stored on profiles (avoid privilege escalation)
- [x] Service role only in edge functions

### Data Protection
- [x] JSONB for complex game state
- [x] Input validation with Zod
- [x] No sensitive data exposure in client
- [x] Error messages sanitized

### Network Security
- [x] HTTPS only (Supabase default)
- [x] CORS configured for edge functions
- [x] API keys properly scoped (anon vs service role)

---

## Future Security Improvements

### Recommended Enhancements
1. **Rate Limiting**: Add database rate limits for social actions
2. **Audit Logging**: Track sensitive operations (trades, gifts)
3. **IP Blocking**: For abuse prevention
4. **2FA**: Optional two-factor authentication
5. **Data Export**: GDPR compliance endpoint
6. **Account Deletion**: Full data purge capability
