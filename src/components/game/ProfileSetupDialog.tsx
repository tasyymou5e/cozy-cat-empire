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
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AVATAR_OPTIONS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱'];
const SKIP_KEY = 'profile_setup_skipped';

interface ProfileSetupDialogProps {
  userId: string | undefined;
}

export function ProfileSetupDialog({ userId }: ProfileSetupDialogProps) {
  const { profile, loading, updateProfile } = usePlayerProfile(userId);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !userId) return;
    
    // Check if user needs setup (no display_name) and hasn't skipped before
    const hasSkipped = localStorage.getItem(SKIP_KEY) === userId;
    const needsSetup = !profile?.display_name;
    
    if (needsSetup && !hasSkipped) {
      setOpen(true);
      setAvatarEmoji(profile?.avatar_emoji || '😺');
    }
  }, [profile, loading, userId]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    setSaving(true);
    const result = await updateProfile(displayName.trim(), avatarEmoji);
    setSaving(false);

    if (result.success) {
      toast.success('Profile set up successfully! 🎉');
      setOpen(false);
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
  };

  const handleSkip = () => {
    if (userId) {
      localStorage.setItem(SKIP_KEY, userId);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to Cat Farm!
          </DialogTitle>
          <DialogDescription>
            Let's set up your profile so other players can recognize you.
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
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              This is how other players will see you on the leaderboard.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={saving || !displayName.trim()}>
            {saving ? 'Saving...' : (
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
