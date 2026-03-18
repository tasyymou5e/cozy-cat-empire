import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { Check, Sparkles, Shuffle, Loader2, AtSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('ProfileSetupDialog');

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

interface ProfileSetupDialogProps {
  userId: string | undefined;
}

export function ProfileSetupDialog({ userId }: ProfileSetupDialogProps) {
  const { profile, loading, updateProfile } = usePlayerProfile(userId);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [saving, setSaving] = useState(false);

  // Display name state
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  // Username state
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !userId) return;

    // Only show for legacy users who don't have a display_name
    const needsSetup = !profile?.display_name;

    if (needsSetup) {
      setOpen(true);
      setAvatarEmoji(profile?.avatar_emoji || '😺');
      setUsername(profile?.username || '');
    }
  }, [profile, loading, userId]);

  // Validate display name with edge function
  const validateDisplayName = async (name: string) => {
    const sanitized = name.trim();
    if (sanitized.length < 3) {
      setNameError('Display name must be at least 3 characters');
      setNameAvailable(null);
      return;
    }

    setIsCheckingName(true);
    setNameError('');
    setNameSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', {
        body: { displayName: sanitized, action: 'validate', excludeUserId: userId },
      });

      if (error) throw error;

      if (data.profanityViolation) {
        setNameError('Display name contains inappropriate content');
        setNameAvailable(false);
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
      logger.error('Failed to validate display name:', err);
      // Fallback to local check
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', sanitized)
        .limit(1);

      const isTaken = data && data.length > 0 && data[0].id !== userId;
      setNameAvailable(!isTaken);
      if (isTaken) {
        setNameError('This name is already taken');
        setNameSuggestions(generateNameSuggestions(sanitized));
      }
    } finally {
      setIsCheckingName(false);
    }
  };

  // Validate username with edge function
  const validateUsername = async (name: string) => {
    const sanitized = name.trim().toLowerCase();
    if (!sanitized) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }
    if (sanitized.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');
    setUsernameSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('validate-display-name', {
        body: { username: sanitized, action: 'validate_username', excludeUserId: userId },
      });

      if (error) throw error;

      if (data.profanityViolation) {
        setUsernameError('Username contains inappropriate content');
        setUsernameAvailable(false);
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
      logger.error('Failed to validate username:', err);
      // Fallback
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', sanitized)
        .limit(1);

      const isTaken = data && data.length > 0 && data[0].id !== userId;
      setUsernameAvailable(!isTaken);
      if (isTaken) {
        setUsernameError('This username is already taken');
        setUsernameSuggestions(generateUsernameSuggestions(sanitized));
      }
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Generate name suggestions
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

  const generateUsernameSuggestions = (baseName: string): string[] => {
    const suggestions: string[] = [];
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    if (clean.length < 2) return suggestions;

    const base = /^[a-zA-Z]/.test(clean) ? clean : `cat${clean}`;

    suggestions.push(`${base}${Math.floor(Math.random() * 999)}`);
    suggestions.push(`${base}_${Math.floor(Math.random() * 99)}`);
    suggestions.push(`${base}_cat`);
    suggestions.push(`meow_${base}`);

    return suggestions.slice(0, 5);
  };

  const handleNameBlur = () => {
    if (displayName.trim()) {
      validateDisplayName(displayName);
    }
  };

  const handleUsernameBlur = () => {
    if (username.trim()) {
      validateUsername(username);
    }
  };

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

  const handleSave = async () => {
    const sanitizedName = displayName.trim();
    const sanitizedUsername = username.trim().toLowerCase();

    if (!sanitizedName) {
      toast.error('Please enter a display name');
      return;
    }

    if (sanitizedName.length < 3 || sanitizedName.length > 30) {
      toast.error('Display name must be 3-30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9\s_-]+$/.test(sanitizedName)) {
      toast.error('Invalid characters in display name');
      return;
    }

    if (sanitizedUsername && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(sanitizedUsername)) {
      toast.error('Invalid username format');
      return;
    }

    if (nameAvailable === false || usernameAvailable === false) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSaving(true);

    // Final validation
    try {
      const { data: nameCheck } = await supabase.functions.invoke('validate-display-name', {
        body: { displayName: sanitizedName, action: 'validate', excludeUserId: userId },
      });

      if (nameCheck?.profanityViolation || !nameCheck?.available) {
        setNameError(
          nameCheck?.profanityViolation
            ? 'Display name contains inappropriate content'
            : 'This name is already taken'
        );
        setNameAvailable(false);
        setSaving(false);
        return;
      }

      if (sanitizedUsername) {
        const { data: usernameCheck } = await supabase.functions.invoke('validate-display-name', {
          body: { username: sanitizedUsername, action: 'validate_username', excludeUserId: userId },
        });

        if (usernameCheck?.profanityViolation || !usernameCheck?.available) {
          setUsernameError(
            usernameCheck?.profanityViolation
              ? 'Username contains inappropriate content'
              : 'This username is already taken'
          );
          setUsernameAvailable(false);
          setSaving(false);
          return;
        }
      }
    } catch (err) {
      logger.error('Validation error:', err);
    }

    const result = await updateProfile(sanitizedName, avatarEmoji, sanitizedUsername || undefined);
    setSaving(false);

    if (result.success) {
      toast.success('Profile set up successfully! 🎉');
      setOpen(false);
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
  };

  const hasErrors =
    nameError || usernameError || nameAvailable === false || usernameAvailable === false;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Cannot close without saving */
      }}
    >
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please set up your profile to continue playing. This is required for leaderboards and
            social features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Selection */}
          <div className="space-y-2">
            <Label>Choose your avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`text-3xl p-2 rounded-lg transition-all hover:scale-110 ${
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

          {/* Display Name Input */}
          <div className="space-y-2">
            <Label htmlFor="dialogDisplayName">Display Name *</Label>
            <div className="relative">
              <Input
                id="dialogDisplayName"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setNameError('');
                  setNameSuggestions([]);
                  setNameAvailable(null);
                }}
                onBlur={handleNameBlur}
                maxLength={30}
                className={`pr-10 ${nameError ? 'border-destructive' : nameAvailable === true ? 'border-green-500' : ''}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingName && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {nameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                {nameAvailable === false && <AlertCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, spaces, underscores, hyphens only.
            </p>

            {nameError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span>😿</span> {nameError}
              </p>
            )}

            {nameSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Try one of these:</span>
                  <button
                    type="button"
                    onClick={() => setNameSuggestions(generateNameSuggestions(displayName))}
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

          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="dialogUsername" className="flex items-center gap-1">
              <AtSign className="h-3 w-3" />
              Username (optional)
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </div>
              <Input
                id="dialogUsername"
                placeholder="coolcat"
                value={username}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(value);
                  setUsernameError('');
                  setUsernameSuggestions([]);
                  setUsernameAvailable(null);
                }}
                onBlur={handleUsernameBlur}
                maxLength={20}
                className={`pl-8 pr-10 ${usernameError ? 'border-destructive' : usernameAvailable === true ? 'border-green-500' : ''}`}
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

            {usernameError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span>😿</span> {usernameError}
              </p>
            )}

            {usernameSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Try one of these:</span>
                  <button
                    type="button"
                    onClick={() => setUsernameSuggestions(generateUsernameSuggestions(username))}
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !!hasErrors}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Save Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
