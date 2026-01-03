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
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  // Handle password recovery from URL on mount
  useEffect(() => {
    const handleRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      // Check for tokens - be forgiving and detect recovery even without type=recovery
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = queryParams.get('code');
      const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash');
      const hashType = hashParams.get('type');
      const queryType = queryParams.get('type');
      
      // Detect recovery if type=recovery OR if we have recovery-like tokens
      const hasRecoveryTokens = (accessToken && refreshToken) || code || tokenHash;
      const isRecoveryType = hashType === 'recovery' || queryType === 'recovery';
      
      if (!hasRecoveryTokens && !isRecoveryType) return;
      
      setIsRecoveryFlow(true);
      setIsProcessingRecovery(true);
      setError('');
      
      try {
        // Method 1: Hash tokens (implicit flow)
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) throw error;
          
          // Verify session was actually created
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        // Method 2: PKCE code flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) throw error;
          
          // Verify session was actually created
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        // Method 3: Token hash flow (OTP)
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });
          
          if (error) throw error;
          
          // Verify session was actually created
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        // No valid tokens found
        throw new Error('Invalid or expired password reset link');
        
      } catch (err: any) {
        console.error('Recovery error:', err);
        setError('Password reset link is invalid or expired. Please request a new one.');
        setIsRecoveryFlow(false);
      } finally {
        setIsProcessingRecovery(false);
      }
    };
    
    handleRecovery();
    
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password');
        setIsRecoveryFlow(true);
        setSuccess('');
        setError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (but not during recovery flow)
  useEffect(() => {
    if (user && !loading && !isRecoveryFlow && mode !== 'update-password') {
      navigate('/');
    }
  }, [user, loading, navigate, mode, isRecoveryFlow]);

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
        // Verify we have an active session before updating
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Session expired. Please request a new password reset link.');
          setIsRecoveryFlow(false);
          setMode('forgot-password');
          return;
        }
        
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          if (error.message.includes('session')) {
            setError('Session expired. Please request a new password reset link.');
            setIsRecoveryFlow(false);
            setMode('forgot-password');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Password updated successfully! You can now log in.');
          setPassword('');
          setConfirmPassword('');
          setIsRecoveryFlow(false);
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

  if (loading || isProcessingRecovery) {
    return (
      <AnimatedBackground variant="auth" className="flex items-center justify-center">
        <LoadingCat size="lg" text={isProcessingRecovery ? "Verifying reset link..." : "Loading your cat empire..."} />
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
