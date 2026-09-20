import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth, logAuthAttempt } from '@/hooks/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Crown, Shield, AlertTriangle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function AdminAuth() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, user } = useAuth();
  const { isAdmin, loading: adminLoading, checked } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [notice, setNotice] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);

  // Check admin status when user changes
  useEffect(() => {
    // Don't do anything while still loading or checking
    if (adminLoading || !checked) {
      return;
    }

    if (user && isAdmin) {
      // Log successful admin login
      logAuthAttempt({
        email: user.email || 'unknown',
        attemptType: 'admin_login',
        success: true,
        userId: user.id,
      });
      navigate('/catking/dashboard');
    } else if (user && !isAdmin && checked && !bootstrapping) {
      // Log access denied - only when we've definitively checked
      logAuthAttempt({
        email: user.email || 'unknown',
        attemptType: 'access_denied',
        success: false,
        userId: user.id,
        errorMessage: 'User does not have admin role',
      });
      setAccessDenied(true);
      signOut();
    }
  }, [user, isAdmin, adminLoading, checked, navigate, signOut]);

  const handleSignUp = async (validated: { email: string; password: string }) => {
    const { error: signUpError } = await signUp(validated.email, validated.password, {
      display_name: 'Cat King Admin',
      avatar_emoji: '👑',
    });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Sign in immediately — if email confirmation is required this fails and
    // we tell the user to confirm first.
    const { error: signInError } = await signIn(validated.email, validated.password);
    if (signInError) {
      setNotice('Account created. Check your email to confirm it, then sign in here.');
      setMode('signin');
      return;
    }

    // First-admin bootstrap: grants admin only if no admin exists yet.
    try {
      const { bootstrapAdmin } = await import('@/lib/admin/bootstrapAdmin.functions');
      const result = await bootstrapAdmin({ data: validated });
      if (!result.granted) {
        setNotice(
          result.reason === 'admin_exists'
            ? 'Account created. An existing admin must grant you access from the Users page.'
            : 'Account created, but admin access could not be granted.'
        );
      }
      // If granted, the admin check in useEffect picks up the new role and redirects.
    } catch {
      setNotice('Account created, but admin setup failed. Please contact an administrator.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setAccessDenied(false);
    setIsSubmitting(true);

    try {
      const validated = authSchema.parse({ email, password });

      if (mode === 'signup') {
        await handleSignUp(validated);
        return;
      }

      const { error: signInError } = await signIn(validated.email, validated.password);

      if (signInError) {
        // Log failed login attempt
        await logAuthAttempt({
          email: validated.email,
          attemptType: 'admin_login_failed',
          success: false,
          errorMessage: signInError.message,
        });
        setError(signInError.message);
      }
      // Admin check happens in useEffect after auth state changes
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        await logAuthAttempt({
          email,
          attemptType: 'admin_login_failed',
          success: false,
          errorMessage: 'Unexpected error during login',
        });
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900">
        <div className="text-amber-200 flex items-center gap-2">
          <Shield className="h-5 w-5 animate-pulse" />
          Verifying credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-4">
      <Card className="w-full max-w-md bg-amber-950/90 border-amber-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="relative">
              <Crown className="h-16 w-16 text-yellow-500" />
              <Shield className="h-8 w-8 text-amber-300 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-amber-100">Cat King Portal</CardTitle>
          <CardDescription className="text-amber-300/80">
            Administrative access only
          </CardDescription>
        </CardHeader>

        <CardContent>
          {accessDenied && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">
                Access Denied. You do not have administrative privileges.
              </p>
            </div>
          )}

          {notice && (
            <div className="mb-4 p-3 rounded-lg bg-amber-900/50 border border-amber-600">
              <p className="text-amber-200 text-sm">{notice}</p>
            </div>
          )}

          {error && !accessDenied && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-amber-900/50 border-amber-700 text-amber-100 placeholder:text-amber-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-amber-900/50 border-amber-700 text-amber-100 placeholder:text-amber-500"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-primary-foreground dark:text-foreground font-semibold"
            >
              {isSubmitting
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Authenticating...'
                : mode === 'signup'
                  ? 'Create Admin Account'
                  : 'Access Portal'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setNotice('');
              }}
              className="text-amber-300/80 hover:text-amber-200 text-sm underline"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <p className="mt-6 text-center text-amber-500/60 text-xs">
            🔒 This portal is for authorized personnel only
          </p>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-amber-300/70 hover:text-amber-200 text-xs underline"
            >
              ← Back to the game
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
