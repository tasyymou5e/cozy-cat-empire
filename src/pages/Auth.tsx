import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import { PawPrint, RefreshCw } from 'lucide-react';

import {
  AuthHero,
  LoginForm,
  SignupFields,
  ForgotPasswordForm,
  UpdatePasswordForm,
  AuthFooter,
  AuthMode,
  authSchema,
  signupSchema,
  emailSchema,
  passwordUpdateSchema,
} from '@/components/auth';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { backgroundUrl, isLoading: bgLoading, regenerate, currentSeason } = useAuthBackground();
  const { isAdmin } = useAdminAuth();
  useCriticalPrefetch();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
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
          const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
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

  // --- Validation helpers ---
  const generateNameSuggestions = (baseName: string): string[] => {
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length < 2) return [];
    const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers', 'Furry'];
    const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
    return [
      `${clean}${Math.floor(Math.random() * 999)}`,
      `${clean}_${Math.floor(Math.random() * 99)}`,
      `${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`,
      `${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`,
      `${clean}${new Date().getFullYear()}`,
    ].slice(0, 5);
  };

  const generateUsernameSuggestions = (baseName: string): string[] => {
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (clean.length < 2) return [];
    const base = /^[a-zA-Z]/.test(clean) ? clean : `cat${clean}`;
    return [
      `${base}${Math.floor(Math.random() * 999)}`,
      `${base}_${Math.floor(Math.random() * 99)}`,
      `${base}_cat`,
      `meow_${base}`,
      `${base}${new Date().getFullYear()}`,
    ].slice(0, 5);
  };

  const validateDisplayName = async (name: string) => {
    const sanitized = name.trim();
    if (sanitized.length < 3) { setNameError('Display name must be at least 3 characters'); setNameAvailable(null); setNameSuggestions([]); return; }
    const formatResult = signupSchema.shape.displayName.safeParse(sanitized);
    if (!formatResult.success) { setNameError(formatResult.error.errors[0].message); setNameAvailable(null); setNameSuggestions([]); return; }
    setIsCheckingName(true); setNameError(''); setNameSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', { body: { displayName: sanitized, action: 'validate' } });
      if (error) throw error;
      if (data.profanityViolation) { setNameError('Display name contains inappropriate content'); setNameAvailable(false); }
      else if (!data.available) { setNameError('This name is already taken'); setNameAvailable(false); setNameSuggestions(data.suggestions || []); }
      else if (!data.valid) { setNameError(data.error || 'Invalid display name'); setNameAvailable(null); }
      else { setNameAvailable(true); }
    } catch {
      const { data } = await supabase.from('profiles').select('display_name').ilike('display_name', sanitized).limit(1);
      const isAvailable = !data || data.length === 0;
      setNameAvailable(isAvailable);
      if (!isAvailable) { setNameError('This name is already taken'); setNameSuggestions(generateNameSuggestions(sanitized)); }
    } finally { setIsCheckingName(false); }
  };

  const validateUsername = async (name: string) => {
    const sanitized = name.trim().toLowerCase();
    if (sanitized.length < 3) { setUsernameError('Username must be at least 3 characters'); setUsernameAvailable(null); setUsernameSuggestions([]); return; }
    const formatResult = signupSchema.shape.username.safeParse(sanitized);
    if (!formatResult.success) { setUsernameError(formatResult.error.errors[0].message); setUsernameAvailable(null); setUsernameSuggestions([]); return; }
    setIsCheckingUsername(true); setUsernameError(''); setUsernameSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', { body: { username: sanitized, action: 'validate_username' } });
      if (error) throw error;
      if (data.profanityViolation) { setUsernameError('Username contains inappropriate content'); setUsernameAvailable(false); }
      else if (!data.available) { setUsernameError('This username is already taken'); setUsernameAvailable(false); setUsernameSuggestions(data.suggestions || []); }
      else if (!data.valid) { setUsernameError(data.error || 'Invalid username'); setUsernameAvailable(null); }
      else { setUsernameAvailable(true); }
    } catch {
      const { data } = await supabase.from('profiles').select('username').ilike('username', sanitized).limit(1);
      const isAvailable = !data || data.length === 0;
      setUsernameAvailable(isAvailable);
      if (!isAvailable) { setUsernameError('This username is already taken'); setUsernameSuggestions(generateUsernameSuggestions(sanitized)); }
    } finally { setIsCheckingUsername(false); }
  };

  const handleNameBlur = () => { if (mode !== 'signup' || !displayName.trim()) return; validateDisplayName(displayName); };
  const handleUsernameBlur = () => { if (mode !== 'signup' || !username.trim()) return; validateUsername(username); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (mode === 'update-password') {
      const result = passwordUpdateSchema.safeParse({ password, confirmPassword });
      if (!result.success) { setError(result.error.errors[0].message); return; }
      setIsSubmitting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('Session expired. Please request a new password reset link.'); setIsRecoveryFlow(false); setMode('forgot-password'); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          if (error.message.includes('session')) { setError('Session expired. Please request a new password reset link.'); setIsRecoveryFlow(false); setMode('forgot-password'); }
          else setError(error.message);
        } else { setSuccess('Password updated successfully! You can now log in.'); setPassword(''); setConfirmPassword(''); setIsRecoveryFlow(false); setMode('login'); }
      } finally { setIsSubmitting(false); }
      return;
    }

    if (mode === 'forgot-password') {
      const result = emailSchema.safeParse({ email });
      if (!result.success) { setError(result.error.errors[0].message); return; }
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
        if (error) setError(error.message); else setSuccess('Password reset email sent! Check your inbox.');
      } finally { setIsSubmitting(false); }
      return;
    }

    if (mode === 'login') {
      const result = authSchema.safeParse({ email, password });
      if (!result.success) { setError(result.error.errors[0].message); return; }
      setIsSubmitting(true);
      try {
        const { error } = await signIn(email, password);
        if (error) setError(error.message.includes('Invalid login credentials') ? 'Invalid email or password. Please try again.' : error.message);
      } finally { setIsSubmitting(false); }
      return;
    }

    // Signup
    const result = signupSchema.safeParse({ email, password, displayName, username: username.toLowerCase() });
    if (!result.success) { setError(result.error.errors[0].message); return; }
    if (nameAvailable === false || usernameAvailable === false) { setError('Please fix the validation errors before continuing.'); return; }

    setIsSubmitting(true);
    try {
      const { data: nameCheck } = await supabase.functions.invoke('validate-display-name', { body: { displayName: displayName.trim(), action: 'validate' } });
      if (nameCheck?.profanityViolation) { setNameError('Display name contains inappropriate content'); setNameAvailable(false); setIsSubmitting(false); return; }
      if (!nameCheck?.available) { setNameError('This name is already taken'); setNameSuggestions(nameCheck?.suggestions || generateNameSuggestions(displayName)); setNameAvailable(false); setIsSubmitting(false); return; }

      const { data: usernameCheck } = await supabase.functions.invoke('validate-display-name', { body: { username: username.trim().toLowerCase(), action: 'validate_username' } });
      if (usernameCheck?.profanityViolation) { setUsernameError('Username contains inappropriate content'); setUsernameAvailable(false); setIsSubmitting(false); return; }
      if (!usernameCheck?.available) { setUsernameError('This username is already taken'); setUsernameSuggestions(usernameCheck?.suggestions || generateUsernameSuggestions(username)); setUsernameAvailable(false); setIsSubmitting(false); return; }

      const { error } = await signUp(email, password, { display_name: displayName.trim(), avatar_emoji: avatarEmoji, username: username.trim().toLowerCase() });
      if (error) {
        setError(error.message.includes('already registered') ? 'This email is already registered. Please log in instead.' : error.message);
      } else {
        setSuccess('Account created! You can now log in.');
        setMode('login'); setDisplayName(''); setUsername(''); setAvatarEmoji('😺'); setNameAvailable(null); setUsernameAvailable(null);
      }
    } finally { setIsSubmitting(false); }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode); setError(''); setSuccess(''); setConfirmPassword('');
    setNameError(''); setNameSuggestions([]); setNameAvailable(null);
    setUsernameError(''); setUsernameSuggestions([]); setUsernameAvailable(null);
  };

  if (loading || isProcessingRecovery) {
    return (
      <AnimatedBackground variant="auth" className="flex items-center justify-center">
        <LoadingCat size="lg" text={isProcessingRecovery ? 'Verifying reset link...' : 'Preparing your cozy kingdom...'} />
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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try { await regenerate(); } finally { setIsRegenerating(false); }
  };

  const hasSignupErrors = nameError || usernameError || nameAvailable === false || usernameAvailable === false;

  const getSubmitLabel = () => {
    if (isSubmitting) return 'Please wait...';
    if (mode === 'login') return 'Enter Your Kingdom 🏰';
    if (mode === 'signup') return 'Start Your Empire! 🚀';
    if (mode === 'update-password') return 'Update Password';
    return 'Send Reset Email';
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8">
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

      {/* AI-generated background */}
      {backgroundUrl && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ backgroundImage: `url(${backgroundUrl})`, opacity: bgLoading ? 0 : 1 }}
        />
      )}
      <div className={`fixed inset-0 transition-opacity duration-700 ${backgroundUrl ? 'opacity-0' : 'opacity-100'}`}>
        <AnimatedBackground variant="auth" className="h-full"><div /></AnimatedBackground>
      </div>
      <div className="fixed inset-0 bg-white/25 backdrop-blur-[1px]" />
      <SeasonalParticles season={currentSeason || getCurrentRealSeason()} density="medium" className="opacity-70" />
      <AnimatedFarmCats count={4} className="opacity-80" interactive soundEnabled />
      <FloatingDecorations variant="kawaii-cats" density="high" parallax className="opacity-60" />

      {/* Split-panel layout */}
      <div className="relative z-10 auth-split-layout">
        {/* Left: Hero panel */}
        <div className="auth-hero-panel flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 pointer-events-none z-[1]">
            <div className="bokeh-bubble w-32 h-32 top-[8%] left-[5%] opacity-40" style={{ animationDelay: '0s' }} />
            <div className="bokeh-bubble w-48 h-48 top-[15%] right-[8%] opacity-40" style={{ animationDelay: '1s' }} />
            <div className="bokeh-bubble w-24 h-24 bottom-[25%] left-[12%] opacity-40" style={{ animationDelay: '2s' }} />
            <div className="bokeh-bubble w-40 h-40 bottom-[18%] right-[15%] opacity-40" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="relative z-10">
            <AuthHero mode={mode} />
          </div>

          {/* Social Proof */}
          <div className="relative z-10 text-center space-y-3 mt-6">
            <p className="page-heading text-sm italic text-foreground/70 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
              🐾 Join thousands of cat lovers worldwide! 🐾
            </p>
            <div className="flex justify-center gap-2 text-xl">
              {['🐱', '😺', '🐈‍⬛', '😻', '😸'].map((emoji, i) => (
                <span key={emoji} className="animate-float" style={{ animationDelay: `${i * 0.2}s` }}>{emoji}</span>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Made with 💜 for cat lovers</p>
          </div>
        </div>

        {/* Right: Form panel */}
        <div className="auth-form-panel flex flex-col justify-center">
          <GlassCard className="border-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)] !backdrop-blur-lg !bg-card/70 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none rounded-t-none lg:rounded-tl-none">
            <GlassCardHeader className="text-center pb-4">
              <GlassCardTitle className="page-heading text-gradient-primary text-2xl lg:text-3xl">Cozy Cat Empire</GlassCardTitle>
              <GlassCardDescription className="text-base font-serif">{getTitle()}</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <SignupFields
                    avatarEmoji={avatarEmoji}
                    displayName={displayName}
                    username={username}
                    isSubmitting={isSubmitting}
                    isCheckingName={isCheckingName}
                    nameError={nameError}
                    nameAvailable={nameAvailable}
                    nameSuggestions={nameSuggestions}
                    onAvatarChange={setAvatarEmoji}
                    onDisplayNameChange={(v) => { setDisplayName(v); setNameError(''); setNameSuggestions([]); setNameAvailable(null); }}
                    onUsernameChange={(v) => { setUsername(v); setUsernameError(''); setUsernameSuggestions([]); setUsernameAvailable(null); }}
                    onNameBlur={handleNameBlur}
                    onUsernameBlur={handleUsernameBlur}
                    onRegenerateNameSuggestions={() => displayName.trim() && setNameSuggestions(generateNameSuggestions(displayName))}
                    onSelectNameSuggestion={(s) => { setDisplayName(s); setNameError(''); setNameSuggestions([]); setNameAvailable(null); validateDisplayName(s); }}
                    isCheckingUsername={isCheckingUsername}
                    usernameError={usernameError}
                    usernameAvailable={usernameAvailable}
                    usernameSuggestions={usernameSuggestions}
                    onRegenerateUsernameSuggestions={() => username.trim() && setUsernameSuggestions(generateUsernameSuggestions(username))}
                    onSelectUsernameSuggestion={(s) => { setUsername(s); setUsernameError(''); setUsernameSuggestions([]); setUsernameAvailable(null); validateUsername(s); }}
                  />
                )}

                {mode === 'login' && (
                  <LoginForm
                    email={email}
                    password={password}
                    isSubmitting={isSubmitting}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                  />
                )}

                {mode === 'forgot-password' && (
                  <ForgotPasswordForm email={email} isSubmitting={isSubmitting} onEmailChange={setEmail} />
                )}

                {mode === 'update-password' && (
                  <UpdatePasswordForm
                    password={password}
                    confirmPassword={confirmPassword}
                    isSubmitting={isSubmitting}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                  />
                )}

                {mode === 'signup' && (
                  <LoginForm
                    email={email}
                    password={password}
                    isSubmitting={isSubmitting}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                  />
                )}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive flex items-center gap-2">
                    <span>😿</span> {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-xl text-sm text-[hsl(var(--success))] flex items-center gap-2">
                    <span>😻</span> {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 relative overflow-hidden group"
                  disabled={isSubmitting || (mode === 'signup' && !!hasSignupErrors)}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <PawPrint className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">{getSubmitLabel()}</span>
                </Button>
              </form>

              <AuthFooter mode={mode} onSwitchMode={switchMode} />
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
