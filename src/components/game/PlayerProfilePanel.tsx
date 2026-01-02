import { useState, useEffect } from 'react';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerProfilePanelProps {
  userId: string | undefined;
}

const AVATAR_OPTIONS = ['😺', '😸', '😻', '😽', '🐱', '🐈', '🐈‍⬛', '😼', '🙀', '😿', '😾', '🦁', '🐯', '🐆', '🐅', '🎀'];

export function PlayerProfilePanel({ userId }: PlayerProfilePanelProps) {
  const { profile, loading, updateProfile } = usePlayerProfile(userId);
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarEmoji(profile.avatar_emoji || '😺');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const nameChanged = displayName !== (profile.display_name || '');
      const emojiChanged = avatarEmoji !== (profile.avatar_emoji || '😺');
      setHasChanges(nameChanged || emojiChanged);
    }
  }, [displayName, avatarEmoji, profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    setSaving(true);
    const result = await updateProfile(displayName.trim(), avatarEmoji);
    setSaving(false);

    if (result.success) {
      toast.success('Profile updated!');
      setHasChanges(false);
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Log in to customize your profile!
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading profile...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Preview */}
        <div className="flex items-center justify-center py-4">
          <div className="text-7xl">{avatarEmoji}</div>
        </div>

        {/* Avatar Selection */}
        <div className="space-y-2">
          <Label>Choose your avatar</Label>
          <div className="grid grid-cols-8 gap-1">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                className={`text-2xl p-1 rounded hover:bg-muted transition-colors ${
                  avatarEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="Enter your display name..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">
            This name will be visible on the leaderboard and to friends.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full"
        >
          {saving ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-pulse" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
