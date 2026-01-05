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
import { Check, Sparkles, Shuffle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];

interface ProfileSetupDialogProps {
  userId: string | undefined;
}

export function ProfileSetupDialog({ userId }: ProfileSetupDialogProps) {
  const { profile, loading, updateProfile } = usePlayerProfile(userId);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [saving, setSaving] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (loading || !userId) return;
    
    // Only show for legacy users who don't have a display_name
    // New users set their profile during signup
    const needsSetup = !profile?.display_name;
    
    if (needsSetup) {
      setOpen(true);
      setAvatarEmoji(profile?.avatar_emoji || '😺');
    }
  }, [profile, loading, userId]);

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
    
    suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
    suggestions.push(`${clean}_${Math.floor(Math.random() * 99)}`);
    
    const suffixes = ['Cat', 'Meow', 'Paws', 'Kitty', 'Whiskers', 'Furry'];
    suggestions.push(`${clean}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
    
    const prefixes = ['Sir', 'Lady', 'Captain', 'Chief', 'Master'];
    suggestions.push(`${prefixes[Math.floor(Math.random() * prefixes.length)]}${clean}`);
    
    suggestions.push(`${clean}${new Date().getFullYear()}`);
    
    return suggestions.slice(0, 5);
  };

  // Check name on blur
  const handleNameBlur = async () => {
    if (!displayName.trim()) return;
    
    // Validate format
    const sanitized = displayName.trim();
    if (sanitized.length < 3) {
      setNameError('Display name must be at least 3 characters');
      setNameSuggestions([]);
      return;
    }
    if (sanitized.length > 30) {
      setNameError('Display name must be 30 characters or less');
      setNameSuggestions([]);
      return;
    }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(sanitized)) {
      setNameError('Only letters, numbers, spaces, underscores, and hyphens allowed');
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

  const handleSave = async () => {
    const sanitized = displayName.trim();
    
    if (!sanitized) {
      toast.error('Please enter a display name');
      return;
    }
    
    if (sanitized.length < 3 || sanitized.length > 30) {
      toast.error('Display name must be 3-30 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9\s_-]+$/.test(sanitized)) {
      toast.error('Invalid characters in display name');
      return;
    }

    setSaving(true);
    
    // Check availability before saving
    const isAvailable = await checkDisplayNameAvailability(sanitized);
    if (!isAvailable) {
      setNameError('This name is already taken');
      setNameSuggestions(generateNameSuggestions(displayName));
      setSaving(false);
      return;
    }
    
    const result = await updateProfile(sanitized, avatarEmoji);
    setSaving(false);

    if (result.success) {
      toast.success('Profile set up successfully! 🎉');
      setOpen(false);
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
  };

  // Make dialog non-dismissable for legacy users who need to set up profile
  return (
    <Dialog open={open} onOpenChange={() => {/* Cannot close without saving */}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please set up your profile to continue playing. This is required for leaderboards and social features.
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
                }}
                onBlur={handleNameBlur}
                maxLength={30}
                className={nameError ? 'border-destructive' : ''}
              />
              {isCheckingName && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, spaces, underscores, hyphens only.
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
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={saving || !displayName.trim() || !!nameError}
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
