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
import { Mail, Lock, PawPrint, User, Shuffle, Loader2 } from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

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

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');
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
      
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = queryParams.get('code');
      const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash');
      const hashType = hashParams.get('type');
      const queryType = queryParams.get('type');
      
      const hasRecoveryTokens = (accessToken && refreshToken) || code || tokenHash;
      const isRecoveryType = hashType === 'recovery' || queryType === 'recovery';
      
      if (!hasRecoveryTokens && !isRecoveryType) return;
      
      setIsRecoveryFlow(true);
      setIsProcessingRecovery(true);
      setError('');
      
      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) throw error;
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) throw error;
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });
          
          if (error) throw error;
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');
          
          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
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

  useEffect(() => {
    if (user && !loading && !isRecoveryFlow && mode !== 'update-password') {
      navigate('/');
    }
  }, [user, loading, navigate, mode, isRecoveryFlow]);

  // Check display name availability
  const checkDisplayNameAvailability = async (name: string): Promise<boolean> => {
    const sanitized = name.trim();
    if (sanitized.length < 3) return false;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .ilike('display_name', sanitized)
      .limit(1);
    
    return !error && (!data || data.length === 0);
  };

  // Generate name suggestions
  const generateNameSuggestions = (baseName: string): string[] => {
    const suggestions: string[] = [];
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '');
    
    if (clean.length < 2) return suggestions;
    
    // Add random numbers
    suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
    suggestions.push(`${clean}_${Math.floor(Math.random() * 99)}`);
    
    // Add cat-themed suffixes
    const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers', 'Furry'];
    suggestions.push(`${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
    
    // Add prefixes
    const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
    suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`);
    
    // Year-based
    suggestions.push(`${clean}${new Date().getFullYear()}`);
    
    return suggestions.slice(0, 5);
  };

  // Check name on blur
  const handleNameBlur = async () => {
    if (mode !== 'signup' || !displayName.trim()) return;
    
    // Validate format first
    const formatResult = signupSchema.shape.displayName.safeParse(displayName);
    if (!formatResult.success) {
      setNameError(formatResult.error.errors[0].message);
      setNameSuggestions([]);
      return;
    }
    
    setIsCheckingName(true);
    setNameError('');
    setNameSuggestions([]);
    
    const isAvailable = await checkDisplayNameAvailability(displayName);
    
    if (!isAvailable) {
      setNameError('This name is already taken');
      setNameSuggestions(generateNameSuggestions(displayName));
    }
    
    setIsCheckingName(false);
  };

  // Regenerate suggestions
  const handleRegenerateSuggestions = () => {
    if (displayName.trim()) {
      setNameSuggestions(generateNameSuggestions(displayName));
    }
  };

  // Select a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setDisplayName(suggestion);
    setNameError('');
    setNameSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'update-password') {
      const result = passwordUpdateSchema.safeParse({ password, confirmPassword });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
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

    // Login mode
    if (mode === 'login') {
      const result = authSchema.safeParse({ email, password });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);
      try {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Signup mode - validate with signup schema
    const result = signupSchema.safeParse({ email, password, displayName });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Check name availability before signup
    setIsSubmitting(true);
    const isAvailable = await checkDisplayNameAvailability(displayName);
    
    if (!isAvailable) {
      setNameError('This name is already taken');
      setNameSuggestions(generateNameSuggestions(displayName));
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, {
        display_name: displayName.trim(),
        avatar_emoji: avatarEmoji,
      });
      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess('Account created! You can now log in.');
        setMode('login');
        setDisplayName('');
        setAvatarEmoji('😺');
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
    setNameError('');
    setNameSuggestions([]);
  };

  if (loading || isProcessingRecovery) {
    return (
      <AnimatedBackground variant="cozy" className="flex items-center justify-center">
        <LoadingCat size="lg" text={isProcessingRecovery ? "Verifying reset link..." : "Preparing your cozy kingdom..."} />
      </AnimatedBackground>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back to your cozy cat kingdom!';
      case 'signup': return 'Create your cat empire profile!';
      case 'forgot-password': return "Don't worry, we'll help you get back in";
      case 'update-password': return 'Almost there! Set your new password';
    }
  };

  return (
    <AnimatedBackground variant="cozy" className="flex items-center justify-center p-4">
      <FloatingDecorations variant="cats" density="medium" />
      
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-end gap-1">
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>😺</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>🐱</span>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>😸</span>
          </div>
          <p className="text-muted-foreground text-sm">Build your purr-fect cat empire 🐾</p>
        </div>

        {/* Auth Card with Cat Ears */}
        <div className="relative">
          {/* Cat Ears */}
          <div className="absolute -top-3 left-8 w-6 h-6 bg-primary/20 rotate-[-30deg] rounded-tl-full rounded-tr-full border-2 border-primary/30" />
          <div className="absolute -top-3 right-8 w-6 h-6 bg-primary/20 rotate-[30deg] rounded-tl-full rounded-tr-full border-2 border-primary/30" />
          
          <GlassCard className="border-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]">
            <GlassCardHeader className="text-center pb-4">
              <GlassCardTitle className="text-gradient-primary text-2xl">
                Cozy Cat Empire
              </GlassCardTitle>
              <GlassCardDescription className="text-base">{getTitle()}</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar Selection - Signup Only */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Choose your avatar
                    </Label>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatarEmoji(emoji)}
                          className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${
                            avatarEmoji === emoji
                              ? 'bg-primary/20 ring-2 ring-primary scale-110'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Name - Signup Only */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Display Name *
                    </Label>
                    <div className="relative">
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="CatLover42"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setNameError('');
                          setNameSuggestions([]);
                        }}
                        onBlur={handleNameBlur}
                        disabled={isSubmitting}
                        required
                        maxLength={30}
                        className={`bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20 ${
                          nameError ? 'border-destructive' : ''
                        }`}
                      />
                      {isCheckingName && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Shown on leaderboards (3-30 chars, letters, numbers, spaces, _ -)
                    </p>
                    
                    {/* Name Error */}
                    {nameError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span>😿</span> {nameError}
                      </p>
                    )}
                    
                    {/* Name Suggestions */}
                    {nameSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Try one of these:</span>
                          <button
                            type="button"
                            onClick={handleRegenerateSuggestions}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Shuffle className="h-3 w-3" />
                            More
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {nameSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode !== 'update-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'update-password') && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      {mode === 'update-password' ? 'New Password' : 'Password'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                )}

                {mode === 'update-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                      className="bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-center gap-2">
                    <span>😿</span> {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-lg text-sm text-[hsl(var(--success))] flex items-center gap-2">
                    <span>😻</span> {success}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-primary/20" 
                  disabled={isSubmitting || (mode === 'signup' && !!nameError)}
                >
                  <PawPrint className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Log In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : mode === 'update-password'
                    ? 'Update Password'
                    : 'Send Reset Email'}
                </Button>
              </form>

              <div className="mt-5 text-center text-sm space-y-2">
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
                      className="text-primary hover:underline transition-colors font-medium"
                    >
                      Don't have an account? Sign up
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:underline transition-colors font-medium"
                  >
                    Already have an account? Log in
                  </button>
                )}
                {(mode === 'forgot-password' || mode === 'update-password') && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:underline transition-colors font-medium"
                  >
                    Back to login
                  </button>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Footer Decoration */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2 text-xl">
            <span className="animate-float" style={{ animationDelay: '0s' }}>🐱</span>
            <span className="animate-float" style={{ animationDelay: '0.2s' }}>😺</span>
            <span className="animate-float" style={{ animationDelay: '0.4s' }}>🐈‍⬛</span>
            <span className="animate-float" style={{ animationDelay: '0.6s' }}>😻</span>
            <span className="animate-float" style={{ animationDelay: '0.8s' }}>😸</span>
          </div>
          <p className="text-muted-foreground text-xs">Made with 💜 for cat lovers</p>
        </div>
      </div>
    </AnimatedBackground>
  );
}
