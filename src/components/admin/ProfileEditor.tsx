import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActivityLog } from '@/hooks/useAdminActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, Shuffle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s_-]+$/;

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
  const [isChecking, setIsChecking] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();

  const validateDisplayName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return 'Display name must be at least 3 characters';
    if (trimmed.length > 30) return 'Display name must be 30 characters or less';
    if (!DISPLAY_NAME_REGEX.test(trimmed)) {
      return 'Only letters, numbers, spaces, underscores, and hyphens allowed';
    }
    return null;
  };

  const generateSuggestions = (baseName: string): string[] => {
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

  const checkAvailability = useCallback(async (name: string) => {
    const trimmed = name.trim();
    const error = validateDisplayName(trimmed);
    
    if (error) {
      setValidationError(error);
      setNameAvailable(null);
      setNameSuggestions([]);
      return;
    }
    
    setValidationError(null);
    setIsChecking(true);
    
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', trimmed)
        .limit(1);

      if (queryError) throw queryError;

      // If taken by another user (not the current one)
      const isTaken = data && data.length > 0 && data[0].id !== userId;
      setNameAvailable(!isTaken);

      if (isTaken) {
        setNameSuggestions(generateSuggestions(trimmed));
      } else {
        setNameSuggestions([]);
      }
    } catch (err) {
      console.error('Failed to check name availability:', err);
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    
    // Validate
    const error = validateDisplayName(trimmedName);
    if (error) {
      setValidationError(error);
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

    setIsSaving(true);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: trimmedName,
          avatar_emoji: avatarEmoji,
          username: username.trim() || null,
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
            username: { from: currentUsername, to: username.trim() || null },
          },
        },
      });

      toast({
        title: 'Profile Updated',
        description: 'User profile has been successfully updated',
      });

      onSave?.();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
              setValidationError(null);
            }}
            onBlur={() => checkAvailability(displayName)}
            placeholder="Enter display name"
            className={cn(
              validationError && 'border-destructive',
              nameAvailable === true && 'border-green-500',
              nameAvailable === false && 'border-orange-500'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {nameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {nameAvailable === false && <AlertCircle className="h-4 w-4 text-orange-500" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          3-30 characters, letters/numbers/spaces/underscores/hyphens only
        </p>
        
        {validationError && (
          <p className="text-xs text-destructive">{validationError}</p>
        )}
        
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
                    checkAvailability(suggestion);
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
                onClick={() => setNameSuggestions(generateSuggestions(displayName))}
              >
                <Shuffle className="h-3 w-3 mr-1" />
                More
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username (optional)</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
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
        disabled={isSaving || !displayName.trim() || !reason.trim() || nameAvailable === false}
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
