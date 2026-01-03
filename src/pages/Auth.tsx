import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
});

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="text-4xl animate-bounce inline-block">🐱</span>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back! Log in to continue your cat empire.';
      case 'signup': return 'Create an account to save your progress.';
      case 'forgot-password': return 'Enter your email to reset your password.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🐱</div>
          <CardTitle className="text-2xl">Cat Farm</CardTitle>
          <CardDescription>{getTitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md text-sm text-green-600">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Log In'
                : mode === 'signup'
                ? 'Sign Up'
                : 'Send Reset Email'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-muted-foreground hover:text-primary hover:underline block w-full"
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:underline"
                >
                  Don't have an account? Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-primary hover:underline"
              >
                Already have an account? Log in
              </button>
            )}
            {mode === 'forgot-password' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-primary hover:underline"
              >
                Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
