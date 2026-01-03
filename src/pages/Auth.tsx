import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from '@/components/ui/GlassCard';
import { LoadingCat } from '@/components/ui/LoadingCat';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
});

const passwordUpdateSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'update-password';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect PASSWORD_RECOVERY event for password reset flow
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password');
        setSuccess('');
        setError('');
      }
    });

    // Also check URL hash for recovery token on initial load
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setMode('update-password');
    }

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (but not during password update)
  useEffect(() => {
    if (user && !loading && mode !== 'update-password') {
      navigate('/');
    }
  }, [user, loading, navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Handle password update mode
    if (mode === 'update-password') {
      const result = passwordUpdateSchema.safeParse({ password, confirmPassword });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password updated successfully! You can now log in.');
          setPassword('');
          setConfirmPassword('');
          setMode('login');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'forgot-password') {
      const result = emailSchema.safeParse({ email });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password reset email sent! Check your inbox.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Login or signup
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please log in instead.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Account created! You can now log in.');
          setMode('login');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  if (loading) {
    return (
      <AnimatedBackground variant="auth" className="flex items-center justify-center">
        <LoadingCat size="lg" text="Loading your cat empire..." />
      </AnimatedBackground>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back! Log in to continue your cat empire.';
      case 'signup': return 'Create an account to save your progress.';
      case 'forgot-password': return 'Enter your email to reset your password.';
      case 'update-password': return 'Enter your new password.';
    }
  };

  return (
    <AnimatedBackground variant="auth" className="flex items-center justify-center p-4">
      <FloatingDecorations variant="paws" density="low" />
      
      <GlassCard className="w-full max-w-md animate-fade-in-up">
        <GlassCardHeader className="text-center">
          <div className="text-5xl mb-2 animate-bounce">🐱</div>
          <GlassCardTitle className="text-gradient-primary">Cat Farm</GlassCardTitle>
          <GlassCardDescription>{getTitle()}</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'update-password' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'update-password') && (
              <div className="space-y-2">
                <Label htmlFor="password">{mode === 'update-password' ? 'New Password' : 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            )}

            {mode === 'update-password' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-md text-sm text-[hsl(var(--success))]">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full hover-lift" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Log In'
                : mode === 'signup'
                ? 'Sign Up'
                : mode === 'update-password'
                ? 'Update Password'
                : 'Send Reset Email'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-muted-foreground hover:text-primary hover:underline block w-full transition-colors"
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:underline transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-primary hover:underline transition-colors"
              >
                Already have an account? Log in
              </button>
            )}
            {(mode === 'forgot-password' || mode === 'update-password') && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-primary hover:underline transition-colors"
              >
                Back to login
              </button>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>
    </AnimatedBackground>
  );
}
