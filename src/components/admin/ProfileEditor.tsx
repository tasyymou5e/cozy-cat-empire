import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActivityLog } from '@/hooks/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, Shuffle, AlertCircle, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

interface ProfileEditorProps {
  userId: string;
  currentDisplayName: string | null;
  currentAvatarEmoji: string | null;
  currentUsername: string | null;
  onSave?: () => void;
}

export function ProfileEditor({
  userId,
  currentDisplayName,
  currentAvatarEmoji,
  currentUsername,
  onSave,
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [avatarEmoji, setAvatarEmoji] = useState(currentAvatarEmoji || '😺');
  const [username, setUsername] = useState(currentUsername || '');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Display name validation
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  // Username validation
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();

  const generateNameSuggestions = (baseName: string): string[] => {
    const suggestions: string[] = [];
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '');

    suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
    suggestions.push(`${clean}_${Math.floor(Math.random() * 99)}`);

    const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers'];
    suggestions.push(`${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);

    const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
    suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`);

    suggestions.push(`${clean}${new Date().getFullYear()}`);

    return suggestions.slice(0, 5);
  };

  const generateUsernameSuggestions = (baseName: string): string[] => {
    const suggestions: string[] = [];
    const clean = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const base = /^[a-zA-Z]/.test(clean) ? clean : `cat${clean}`;

    suggestions.push(`${base}${Math.floor(Math.random() * 999)}`);
    suggestions.push(`${base}_${Math.floor(Math.random() * 99)}`);
    suggestions.push(`${base}_cat`);
    suggestions.push(`meow_${base}`);

    return suggestions.slice(0, 5);
  };

  const checkNameAvailability = useCallback(
    async (name: string) => {
      const trimmed = name.trim();

      if (trimmed.length < 3) {
        setNameError('Display name must be at least 3 characters');
        setNameAvailable(null);
        return;
      }
      if (trimmed.length > 30) {
        setNameError('Display name must be 30 characters or less');
        setNameAvailable(null);
        return;
      }
      if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
        setNameError('Only letters, numbers, spaces, underscores, and hyphens allowed');
        setNameAvailable(null);
        return;
      }

      setNameError(null);
      setIsCheckingName(true);

      try {
        const { data, error } = await supabase.functions.invoke('validate-display-name', {
          body: { displayName: trimmed, action: 'validate', excludeUserId: userId },
        });

        if (error) throw error;

        if (data.profanityViolation) {
          setNameError('Display name contains inappropriate content');
          setNameAvailable(false);
          setNameSuggestions([]);
        } else if (!data.available) {
          setNameError('This name is already taken');
          setNameAvailable(false);
          setNameSuggestions(data.suggestions || generateNameSuggestions(trimmed));
        } else if (!data.valid) {
          setNameError(data.error || 'Invalid display name');
          setNameAvailable(null);
        } else {
          setNameAvailable(true);
          setNameSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to check name availability:', err);
        // Fallback to local check
        const { data: localData } = await supabase
          .from('profiles')
          .select('id, display_name')
          .ilike('display_name', trimmed)
          .limit(1);

        const isTaken = localData && localData.length > 0 && localData[0].id !== userId;
        setNameAvailable(!isTaken);

        if (isTaken) {
          setNameSuggestions(generateNameSuggestions(trimmed));
        } else {
          setNameSuggestions([]);
        }
      } finally {
        setIsCheckingName(false);
      }
    },
    [userId]
  );

  const checkUsernameAvailability = useCallback(
    async (name: string) => {
      const trimmed = name.trim().toLowerCase();

      if (!trimmed) {
        setUsernameError(null);
        setUsernameAvailable(null);
        return;
      }

      if (trimmed.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        setUsernameAvailable(null);
        return;
      }
      if (trimmed.length > 20) {
        setUsernameError('Username must be 20 characters or less');
        setUsernameAvailable(null);
        return;
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
        setUsernameError(
          'Username must start with a letter and contain only letters, numbers, and underscores'
        );
        setUsernameAvailable(null);
        return;
      }

      setUsernameError(null);
      setIsCheckingUsername(true);

      try {
        const { data, error } = await supabase.functions.invoke('validate-display-name', {
          body: { username: trimmed, action: 'validate_username', excludeUserId: userId },
        });

        if (error) throw error;

        if (data.profanityViolation) {
          setUsernameError('Username contains inappropriate content');
          setUsernameAvailable(false);
          setUsernameSuggestions([]);
        } else if (!data.available) {
          setUsernameError('This username is already taken');
          setUsernameAvailable(false);
          setUsernameSuggestions(data.suggestions || generateUsernameSuggestions(trimmed));
        } else if (!data.valid) {
          setUsernameError(data.error || 'Invalid username');
          setUsernameAvailable(null);
        } else {
          setUsernameAvailable(true);
          setUsernameSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to check username availability:', err);
        // Fallback
        const { data: localData } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', trimmed)
          .limit(1);

        const isTaken = localData && localData.length > 0 && localData[0].id !== userId;
        setUsernameAvailable(!isTaken);

        if (isTaken) {
          setUsernameSuggestions(generateUsernameSuggestions(trimmed));
        } else {
          setUsernameSuggestions([]);
        }
      } finally {
        setIsCheckingUsername(false);
      }
    },
    [userId]
  );

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    const trimmedUsername = username.trim().toLowerCase();

    // Validate display name
    if (trimmedName.length < 3) {
      setNameError('Display name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 30) {
      setNameError('Display name must be 30 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
      setNameError('Only letters, numbers, spaces, underscores, and hyphens allowed');
      return;
    }

    // Validate username if provided
    if (trimmedUsername && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername)) {
      setUsernameError('Invalid username format');
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for this change',
        variant: 'destructive',
      });
      return;
    }

    if (nameAvailable === false || usernameAvailable === false) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before saving',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Final profanity check
      const { data: nameCheck } = await supabase.functions.invoke('validate-display-name', {
        body: { displayName: trimmedName, action: 'validate', excludeUserId: userId },
      });

      if (nameCheck?.profanityViolation) {
        setNameError('Display name contains inappropriate content');
        setNameAvailable(false);
        setIsSaving(false);
        return;
      }

      if (!nameCheck?.available) {
        setNameError('This name is already taken');
        setNameAvailable(false);
        setNameSuggestions(nameCheck?.suggestions || []);
        setIsSaving(false);
        return;
      }

      if (trimmedUsername) {
        const { data: usernameCheck } = await supabase.functions.invoke('validate-display-name', {
          body: { username: trimmedUsername, action: 'validate_username', excludeUserId: userId },
        });

        if (usernameCheck?.profanityViolation) {
          setUsernameError('Username contains inappropriate content');
          setUsernameAvailable(false);
          setIsSaving(false);
          return;
        }

        if (!usernameCheck?.available) {
          setUsernameError('This username is already taken');
          setUsernameAvailable(false);
          setUsernameSuggestions(usernameCheck?.suggestions || []);
          setIsSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: trimmedName,
          avatar_emoji: avatarEmoji,
          username: trimmedUsername || null,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      await logActivity({
        actionType: 'profile_repair',
        actionDescription: `Updated profile for user`,
        targetUserId: userId,
        targetTable: 'profiles',
        metadata: {
          reason: reason.trim(),
          changes: {
            display_name: { from: currentDisplayName, to: trimmedName },
            avatar_emoji: { from: currentAvatarEmoji, to: avatarEmoji },
            username: { from: currentUsername, to: trimmedUsername || null },
          },
        },
      });

      toast({
        title: 'Profile Updated',
        description: 'User profile has been successfully updated',
      });

      onSave?.();
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors =
    nameError || usernameError || nameAvailable === false || usernameAvailable === false;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatarEmoji(emoji)}
              className={cn(
                'w-10 h-10 text-xl rounded-lg border-2 transition-all hover:scale-110',
                avatarEmoji === emoji
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <div className="relative">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setNameAvailable(null);
              setNameSuggestions([]);
              setNameError(null);
            }}
            onBlur={() => checkNameAvailability(displayName)}
            placeholder="Enter display name"
            className={cn(
              'pr-10',
              nameError && 'border-destructive',
              nameAvailable === true && 'border-green-500',
              nameAvailable === false && 'border-orange-500'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingName && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {nameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {nameAvailable === false && <AlertCircle className="h-4 w-4 text-orange-500" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          3-30 characters, letters/numbers/spaces/underscores/hyphens only
        </p>

        {nameError && <p className="text-xs text-destructive">{nameError}</p>}

        {nameAvailable === false && nameSuggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-orange-500">Name taken. Try one of these:</p>
            <div className="flex flex-wrap gap-1">
              {nameSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setDisplayName(suggestion);
                    checkNameAvailability(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setNameSuggestions(generateNameSuggestions(displayName))}
              >
                <Shuffle className="h-3 w-3 mr-1" />
                More
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-1">
          <AtSign className="h-3 w-3" />
          Username (optional)
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</div>
          <Input
            id="username"
            value={username}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              setUsername(value);
              setUsernameAvailable(null);
              setUsernameSuggestions([]);
              setUsernameError(null);
            }}
            onBlur={() => checkUsernameAvailability(username)}
            placeholder="coolcat"
            className={cn(
              'pl-8 pr-10',
              usernameError && 'border-destructive',
              usernameAvailable === true && 'border-green-500',
              usernameAvailable === false && 'border-orange-500'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingUsername && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {usernameAvailable === false && <AlertCircle className="h-4 w-4 text-orange-500" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          For @mentions (3-20 chars, starts with letter, a-z, 0-9, _)
        </p>

        {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}

        {usernameAvailable === false && usernameSuggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-orange-500">Username taken. Try one of these:</p>
            <div className="flex flex-wrap gap-1">
              {usernameSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setUsername(suggestion);
                    checkUsernameAvailability(suggestion);
                  }}
                >
                  @{suggestion}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setUsernameSuggestions(generateUsernameSuggestions(username))}
              >
                <Shuffle className="h-3 w-3 mr-1" />
                More
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Change *</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this change being made?"
          rows={2}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving || !displayName.trim() || !reason.trim() || !!hasErrors}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          '💾 Save Profile'
        )}
      </Button>
    </div>
  );
}
