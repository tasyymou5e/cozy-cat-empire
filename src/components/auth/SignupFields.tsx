import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, AtSign, Shuffle, Loader2, Check, AlertCircle } from 'lucide-react';
import { AVATAR_OPTIONS } from './types';

interface SignupFieldsProps {
  avatarEmoji: string;
  displayName: string;
  username: string;
  isSubmitting: boolean;
  // Display name validation
  isCheckingName: boolean;
  nameError: string;
  nameAvailable: boolean | null;
  nameSuggestions: string[];
  onAvatarChange: (emoji: string) => void;
  onDisplayNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onNameBlur: () => void;
  onUsernameBlur: () => void;
  onRegenerateNameSuggestions: () => void;
  onSelectNameSuggestion: (s: string) => void;
  // Username validation
  isCheckingUsername: boolean;
  usernameError: string;
  usernameAvailable: boolean | null;
  usernameSuggestions: string[];
  onRegenerateUsernameSuggestions: () => void;
  onSelectUsernameSuggestion: (s: string) => void;
}

export function SignupFields({
  avatarEmoji,
  displayName,
  username,
  isSubmitting,
  isCheckingName,
  nameError,
  nameAvailable,
  nameSuggestions,
  onAvatarChange,
  onDisplayNameChange,
  onUsernameChange,
  onNameBlur,
  onUsernameBlur,
  onRegenerateNameSuggestions,
  onSelectNameSuggestion,
  isCheckingUsername,
  usernameError,
  usernameAvailable,
  usernameSuggestions,
  onRegenerateUsernameSuggestions,
  onSelectUsernameSuggestion,
}: SignupFieldsProps) {
  return (
    <>
      {/* Avatar Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 font-serif">Choose your avatar</Label>
        <div className="flex flex-wrap gap-2 justify-center">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onAvatarChange(emoji)}
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

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className="flex items-center gap-2 font-serif">
          <User className="h-4 w-4 text-primary" />
          Display Name *
        </Label>
        <div className="relative">
          <Input
            id="displayName"
            type="text"
            placeholder="CatLover42"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            onBlur={onNameBlur}
            disabled={isSubmitting}
            required
            maxLength={30}
            className={`bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20 pr-10 ${
              nameError ? 'border-destructive' : nameAvailable === true ? 'border-green-500' : ''
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingName && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {nameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {nameAvailable === false && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Shown on leaderboards (3-30 chars, letters, numbers, spaces, _ -)
        </p>
        {nameError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <span>😿</span> {nameError}
          </p>
        )}
        <SuggestionChips
          suggestions={nameSuggestions}
          onSelect={onSelectNameSuggestion}
          onRegenerate={onRegenerateNameSuggestions}
        />
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-primary" />
          Username *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</div>
          <Input
            id="username"
            type="text"
            placeholder="coolcat"
            value={username}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              onUsernameChange(value);
            }}
            onBlur={onUsernameBlur}
            disabled={isSubmitting}
            required
            maxLength={20}
            className={`bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 focus:ring-primary/20 pl-8 pr-10 ${
              usernameError ? 'border-destructive' : usernameAvailable === true ? 'border-green-500' : ''
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {usernameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
            {usernameAvailable === false && <AlertCircle className="h-4 w-4 text-destructive" />}
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
        <SuggestionChips
          suggestions={usernameSuggestions}
          onSelect={onSelectUsernameSuggestion}
          onRegenerate={onRegenerateUsernameSuggestions}
          prefix="@"
        />
      </div>
    </>
  );
}

function SuggestionChips({
  suggestions,
  onSelect,
  onRegenerate,
  prefix = '',
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
  onRegenerate: () => void;
  prefix?: string;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Try one of these:</span>
        <button
          type="button"
          onClick={onRegenerate}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Shuffle className="h-3 w-3" />
          More
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 transition-colors"
          >
            {prefix}{suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
