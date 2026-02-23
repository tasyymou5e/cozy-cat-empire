import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/GlassCard';
import { LoadingCat } from '@/components/ui/LoadingCat';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { AnimatedFarmCats } from '@/components/ui/AnimatedFarmCats';
import { SeasonalParticles } from '@/components/ui/SeasonalParticles';
import { useAuthBackground } from '@/hooks/useAuthBackground';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useCriticalPrefetch } from '@/hooks/usePrefetch';
import { getCurrentRealSeason } from '@/lib/seasonUtils';
import { cn } from '@/lib/utils';
import {
  Mail,
  Lock,
  PawPrint,
  User,
  AtSign,
  Shuffle,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  displayName: z
    .string()
    .trim()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(30, { message: 'Display name must be 30 characters or less' })
    .regex(/^[a-zA-Z0-9\s_-]+$/, {
      message: 'Only letters, numbers, spaces, underscores, and hyphens allowed',
    }),
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be 20 characters or less' })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
      message:
        'Username must start with a letter and contain only letters, numbers, and underscores',
    }),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
});

const passwordUpdateSchema = z
  .object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'update-password';

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { backgroundUrl, isLoading: bgLoading, regenerate, currentSeason } = useAuthBackground();
  const { isAdmin } = useAdminAuth();
  
  // Prefetch main game route while user is on login page
  useCriticalPrefetch();
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');

  // Display name validation state
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  // Username validation state
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw new Error('Failed to establish session');

          setMode('update-password');
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          const {
            data: { session },
          } = await supabase.auth.getSession();
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

          const {
            data: { session },
          } = await supabase.auth.getSession();
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
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

  // Validate display name with edge function (includes profanity check)
  const validateDisplayName = async (name: string) => {
    const sanitized = name.trim();
    if (sanitized.length < 3) {
      setNameError('Display name must be at least 3 characters');
      setNameAvailable(null);
      setNameSuggestions([]);
      return;
    }

    // Client-side format validation first
    const formatResult = signupSchema.shape.displayName.safeParse(sanitized);
    if (!formatResult.success) {
      setNameError(formatResult.error.errors[0].message);
      setNameAvailable(null);
      setNameSuggestions([]);
      return;
    }

    setIsCheckingName(true);
    setNameError('');
    setNameSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', {
        body: { displayName: sanitized, action: 'validate' },
      });

      if (error) throw error;

      if (data.profanityViolation) {
        setNameError('Display name contains inappropriate content');
        setNameAvailable(false);
        setNameSuggestions([]);
      } else if (!data.available) {
        setNameError('This name is already taken');
        setNameAvailable(false);
        setNameSuggestions(data.suggestions || []);
      } else if (!data.valid) {
        setNameError(data.error || 'Invalid display name');
        setNameAvailable(null);
      } else {
        setNameAvailable(true);
      }
    } catch (err) {
      console.error('Failed to validate display name:', err);
      // Fallback to local check
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .ilike('display_name', sanitized)
        .limit(1);

      const isAvailable = !data || data.length === 0;
      setNameAvailable(isAvailable);
      if (!isAvailable) {
        setNameError('This name is already taken');
        setNameSuggestions(generateNameSuggestions(sanitized));
      }
    } finally {
      setIsCheckingName(false);
    }
  };

  // Validate username with edge function (includes profanity check)
  const validateUsername = async (name: string) => {
    const sanitized = name.trim().toLowerCase();
    if (sanitized.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    // Client-side format validation first
    const formatResult = signupSchema.shape.username.safeParse(sanitized);
    if (!formatResult.success) {
      setUsernameError(formatResult.error.errors[0].message);
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');
    setUsernameSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', {
        body: { username: sanitized, action: 'validate_username' },
      });

      if (error) throw error;

      if (data.profanityViolation) {
        setUsernameError('Username contains inappropriate content');
        setUsernameAvailable(false);
        setUsernameSuggestions([]);
      } else if (!data.available) {
        setUsernameError('This username is already taken');
        setUsernameAvailable(false);
        setUsernameSuggestions(data.suggestions || []);
      } else if (!data.valid) {
        setUsernameError(data.error || 'Invalid username');
        setUsernameAvailable(null);
      } else {
        setUsernameAvailable(true);
      }
    } catch (err) {
      console.error('Failed to validate username:', err);
      // Fallback to local check
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', sanitized)
        .limit(1);

      const isAvailable = !data || data.length === 0;
      setUsernameAvailable(isAvailable);
      if (!isAvailable) {
        setUsernameError('This username is already taken');
        setUsernameSuggestions(generateUsernameSuggestions(sanitized));
      }
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Generate name suggestions (fallback)
  const generateNameSuggestions = (baseName: string): string[] => {
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
  };

  // Generate username suggestions (fallback)
  const generateUsernameSuggestions = (baseName: string): string[] => {
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
  };

  // Check name on blur
  const handleNameBlur = () => {
    if (mode !== 'signup' || !displayName.trim()) return;
    validateDisplayName(displayName);
  };

  // Check username on blur
  const handleUsernameBlur = () => {
    if (mode !== 'signup' || !username.trim()) return;
    validateUsername(username);
  };

  // Regenerate suggestions
  const handleRegenerateNameSuggestions = () => {
    if (displayName.trim()) {
      setNameSuggestions(generateNameSuggestions(displayName));
    }
  };

  const handleRegenerateUsernameSuggestions = () => {
    if (username.trim()) {
      setUsernameSuggestions(generateUsernameSuggestions(username));
    }
  };

  // Select a suggestion
  const handleSelectNameSuggestion = (suggestion: string) => {
    setDisplayName(suggestion);
    setNameError('');
    setNameSuggestions([]);
    setNameAvailable(null);
    validateDisplayName(suggestion);
  };

  const handleSelectUsernameSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameError('');
    setUsernameSuggestions([]);
    setUsernameAvailable(null);
    validateUsername(suggestion);
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
    const result = signupSchema.safeParse({
      email,
      password,
      displayName,
      username: username.toLowerCase(),
    });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Check if name validation failed
    if (nameAvailable === false || usernameAvailable === false) {
      setError('Please fix the validation errors before continuing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Final validation via edge function
      const { data: nameCheck } = await supabase.functions.invoke('validate-display-name', {
        body: { displayName: displayName.trim(), action: 'validate' },
      });

      if (nameCheck?.profanityViolation) {
        setNameError('Display name contains inappropriate content');
        setNameAvailable(false);
        setIsSubmitting(false);
        return;
      }

      if (!nameCheck?.available) {
        setNameError('This name is already taken');
        setNameSuggestions(nameCheck?.suggestions || generateNameSuggestions(displayName));
        setNameAvailable(false);
        setIsSubmitting(false);
        return;
      }

      const { data: usernameCheck } = await supabase.functions.invoke('validate-display-name', {
        body: { username: username.trim().toLowerCase(), action: 'validate_username' },
      });

      if (usernameCheck?.profanityViolation) {
        setUsernameError('Username contains inappropriate content');
        setUsernameAvailable(false);
        setIsSubmitting(false);
        return;
      }

      if (!usernameCheck?.available) {
        setUsernameError('This username is already taken');
        setUsernameSuggestions(usernameCheck?.suggestions || generateUsernameSuggestions(username));
        setUsernameAvailable(false);
        setIsSubmitting(false);
        return;
      }

      const { error } = await signUp(email, password, {
        display_name: displayName.trim(),
        avatar_emoji: avatarEmoji,
        username: username.trim().toLowerCase(),
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
        setUsername('');
        setAvatarEmoji('😺');
        setNameAvailable(null);
        setUsernameAvailable(null);
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
    setNameAvailable(null);
    setUsernameError('');
    setUsernameSuggestions([]);
    setUsernameAvailable(null);
  };

  if (loading || isProcessingRecovery) {
    return (
      <AnimatedBackground variant="auth" className="flex items-center justify-center">
        <LoadingCat
          size="lg"
          text={isProcessingRecovery ? 'Verifying reset link...' : 'Preparing your cozy kingdom...'}
        />
      </AnimatedBackground>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome back to your cozy cat kingdom!';
      case 'signup':
        return 'Create your cat empire profile!';
      case 'forgot-password':
        return "Don't worry, we'll help you get back in";
      case 'update-password':
        return 'Almost there! Set your new password';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const hasSignupErrors =
    nameError || usernameError || nameAvailable === false || usernameAvailable === false;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Admin Regenerate Background Button */}
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRegenerate}
          disabled={isRegenerating || bgLoading}
          className="fixed top-4 right-4 z-50 bg-white/50 backdrop-blur-sm hover:bg-white/70 shadow-md"
          title={`Regenerate ${currentSeason} background (Admin only)`}
        >
          <RefreshCw className={cn("h-5 w-5", isRegenerating && "animate-spin")} />
        </Button>
      )}

      {/* AI-generated background image layer */}
      {backgroundUrl && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ 
            backgroundImage: `url(${backgroundUrl})`,
            opacity: bgLoading ? 0 : 1,
          }}
        />
      )}
      
      {/* Fallback gradient (shows while loading or on error) */}
      <div 
        className={`fixed inset-0 transition-opacity duration-700 ${backgroundUrl ? 'opacity-0' : 'opacity-100'}`}
      >
        <AnimatedBackground variant="auth" className="h-full">
          <div />
        </AnimatedBackground>
      </div>
      
      {/* Semi-transparent overlay for form readability */}
      <div className="fixed inset-0 bg-white/25 backdrop-blur-[1px]" />
      
      {/* Seasonal Particles (snow, blossoms, fireflies, leaves) */}
      <SeasonalParticles 
        season={currentSeason || getCurrentRealSeason()} 
        density="medium"
        className="opacity-70"
      />
      
      {/* Animated SVG Cats walking around */}
      <AnimatedFarmCats count={4} className="opacity-80" interactive soundEnabled />
      
      {/* Bokeh bubbles overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-[6]">
        <div className="bokeh-bubble w-32 h-32 top-[8%] left-[5%] opacity-40" style={{ animationDelay: '0s' }} />
        <div className="bokeh-bubble w-48 h-48 top-[15%] right-[8%] opacity-40" style={{ animationDelay: '1s' }} />
        <div className="bokeh-bubble w-24 h-24 bottom-[25%] left-[12%] opacity-40" style={{ animationDelay: '2s' }} />
        <div className="bokeh-bubble w-40 h-40 bottom-[18%] right-[15%] opacity-40" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Floating cat decorations with parallax */}
      <FloatingDecorations variant="kawaii-cats" density="high" parallax className="opacity-60" />

      <div className="relative z-10 w-full max-w-md space-y-5 animate-fade-in-up">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          {/* Glowing background pulse */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          
          <div className="flex justify-center items-end gap-1 relative">
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>
              😺
            </span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>
              🐱
            </span>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>
              😸
            </span>
          </div>

          {/* Big gradient headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-shift_3s_ease-in-out_infinite] bg-clip-text text-transparent drop-shadow-sm">
            Cozy Cat Empire
          </h1>

          {/* Rotating taglines */}
          <div className="h-6 overflow-hidden relative">
            <div className="animate-[tagline-rotate_9s_ease-in-out_infinite] flex flex-col">
              <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">🏰 Build Your Purr-fect Empire!</span>
              <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">🏆 Compete on Global Leaderboards!</span>
              <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">✨ Collect Rare Breeds & Costumes!</span>
            </div>
          </div>

          {/* Feature badges strip */}
          <div className="flex flex-wrap justify-center gap-2 px-2">
            {[
              { emoji: '🐾', label: '50+ Breeds' },
              { emoji: '🏆', label: 'Leaderboards' },
              { emoji: '🎁', label: 'Trade & Gift' },
              { emoji: '❄️', label: 'Seasonal Events' },
            ].map((badge, i) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                {badge.emoji} {badge.label}
              </span>
            ))}
          </div>
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
                    <Label className="flex items-center gap-2">Choose your avatar</Label>
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
                          setNameAvailable(null);
                        }}
                        onBlur={handleNameBlur}
                        disabled={isSubmitting}
                        required
                        maxLength={30}
                        className={`bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20 pr-10 ${
                          nameError
                            ? 'border-destructive'
                            : nameAvailable === true
                              ? 'border-green-500'
                              : ''
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingName && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {nameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                        {nameAvailable === false && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
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
                            onClick={handleRegenerateNameSuggestions}
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
                              onClick={() => handleSelectNameSuggestion(suggestion)}
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

                {/* Username - Signup Only */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-primary" />
                      Username *
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        @
                      </div>
                      <Input
                        id="username"
                        type="text"
                        placeholder="coolcat"
                        value={username}
                        onChange={(e) => {
                          // Only allow valid characters
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setUsername(value);
                          setUsernameError('');
                          setUsernameSuggestions([]);
                          setUsernameAvailable(null);
                        }}
                        onBlur={handleUsernameBlur}
                        disabled={isSubmitting}
                        required
                        maxLength={20}
                        className={`bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20 pl-8 pr-10 ${
                          usernameError
                            ? 'border-destructive'
                            : usernameAvailable === true
                              ? 'border-green-500'
                              : ''
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {usernameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                        {usernameAvailable === false && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For @mentions (3-20 chars, starts with letter, a-z, 0-9, _)
                    </p>

                    {/* Username Error */}
                    {usernameError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span>😿</span> {usernameError}
                      </p>
                    )}

                    {/* Username Suggestions */}
                    {usernameSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Try one of these:</span>
                          <button
                            type="button"
                            onClick={handleRegenerateUsernameSuggestions}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Shuffle className="h-3 w-3" />
                            More
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {usernameSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSelectUsernameSuggestion(suggestion)}
                              className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 transition-colors"
                            >
                              @{suggestion}
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
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-primary/25 relative overflow-hidden group"
                  disabled={isSubmitting || (mode === 'signup' && !!hasSignupErrors)}
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <PawPrint className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">
                  {isSubmitting
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Enter Your Kingdom 🏰'
                      : mode === 'signup'
                        ? 'Start Your Empire! 🚀'
                        : mode === 'update-password'
                          ? 'Update Password'
                          : 'Send Reset Email'}
                  </span>
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

        {/* Social Proof + Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-foreground/70 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
            🐾 Join thousands of cat lovers worldwide! 🐾
          </p>
          <div className="flex justify-center gap-2 text-xl">
            <span className="animate-float" style={{ animationDelay: '0s' }}>
              🐱
            </span>
            <span className="animate-float" style={{ animationDelay: '0.2s' }}>
              😺
            </span>
            <span className="animate-float" style={{ animationDelay: '0.4s' }}>
              🐈‍⬛
            </span>
            <span className="animate-float" style={{ animationDelay: '0.6s' }}>
              😻
            </span>
            <span className="animate-float" style={{ animationDelay: '0.8s' }}>
              😸
            </span>
          </div>
          <p className="text-muted-foreground text-xs">Made with 💜 for cat lovers</p>
        </div>
      </div>
    </div>
  );
}
