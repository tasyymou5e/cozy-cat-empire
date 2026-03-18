import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { QuickAccessMenu } from './QuickAccessMenu';
import { NotificationCenter } from './NotificationCenter';
import {
  Volume2,
  VolumeX,
  Music,
  Music2,
  Settings2,
  Keyboard,
  LogIn,
  LogOut,
  User,
  Cloud,
  Sun,
  Moon,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { VIPTier } from '@/types/dailyRewards';

interface CatFarmHeaderProps {
  // Audio
  musicOn: boolean;
  soundOn: boolean;
  currentMoodLabel: string;
  sfxVolume: number;
  musicVolume: number;
  onToggleMusic: () => void;
  onToggleSound: () => void;
  onSfxVolumeChange: (value: number[]) => void;
  onMusicVolumeChange: (value: number[]) => void;

  // Theme
  theme: string | undefined;
  onThemeChange: () => void;

  // Navigation
  recentTabs: Array<{ tab: string; label: string; icon: string; timestamp: number }>;
  onNavigateTab: (tab: string) => void;
  onShowShortcutsHelp: () => void;
  onShowWhatsNew: () => void;
  onShowDailyRewards: () => void;

  // User
  user: { id: string; email?: string } | null;
  onSignOut: () => void;
  lastCloudSave: string | null;
  cloudSyncing: boolean;
  onCloudSave: () => void;
  onLocalSave: () => void;
  onResetGame: () => void;

  // VIP
  isVIP: boolean;
  vipTier: VIPTier | null;
  canClaimDailyReward: boolean;

  // Mobile
  isMobile: boolean;
}

export function CatFarmHeader({
  musicOn,
  soundOn,
  currentMoodLabel,
  sfxVolume,
  musicVolume,
  onToggleMusic,
  onToggleSound,
  onSfxVolumeChange,
  onMusicVolumeChange,
  theme,
  onThemeChange,
  recentTabs,
  onNavigateTab,
  onShowShortcutsHelp,
  onShowWhatsNew,
  onShowDailyRewards,
  user,
  onSignOut,
  lastCloudSave,
  cloudSyncing,
  onCloudSave,
  onLocalSave,
  onResetGame,
  isVIP,
  vipTier,
  canClaimDailyReward,
  isMobile,
}: CatFarmHeaderProps) {
  return (
    <header className="game-header">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">🐱 Cat Farm</h1>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Build your 100-acre cat empire!
        </span>
      </div>
      <div className="flex items-center gap-2">
        {musicOn && currentMoodLabel && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{currentMoodLabel}</span>
        )}

        {/* Quick Access Menu */}
        <QuickAccessMenu recentTabs={recentTabs} onNavigateTab={onNavigateTab} />

        {/* Audio Settings Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Audio settings">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="h-4 w-4" /> Sound Effects
                  </label>
                  <span className="text-xs text-muted-foreground">{sfxVolume}%</span>
                </div>
                <Slider
                  value={[sfxVolume]}
                  onValueChange={onSfxVolumeChange}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Music className="h-4 w-4" /> Music
                  </label>
                  <span className="text-xs text-muted-foreground">{musicVolume}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  onValueChange={onMusicVolumeChange}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="border-t pt-3">
                <button
                  onClick={onThemeChange}
                  className="flex items-center gap-2 w-full text-sm font-medium hover:text-primary transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMusic}
          title={musicOn ? 'Stop music' : 'Play ambient music'}
        >
          {musicOn ? <Music2 className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSound}
          title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowShortcutsHelp}
            title="Keyboard Shortcuts (?)"
            className="min-h-10 min-w-10"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        )}

        {/* What's New Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowWhatsNew}
          title="What's New"
          className="min-h-10 min-w-10"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        {/* Notification Center */}
        <NotificationCenter userId={user?.id} onNavigate={onNavigateTab} />

        {/* VIP Badge */}
        {user && isVIP && vipTier && (
          <Badge
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-foreground font-bold text-xs animate-vip-glow cursor-pointer"
            onClick={onShowDailyRewards}
          >
            {vipTier.emoji} {vipTier.name}
          </Badge>
        )}

        {/* Daily Rewards Button */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDailyRewards}
            title="Daily Rewards"
            className={`min-h-10 min-w-10 relative ${canClaimDailyReward ? 'animate-bounce-gentle' : ''}`}
          >
            <CalendarDays className="h-4 w-4" />
            {canClaimDailyReward && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        )}

        {/* Cloud sync indicator */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloudSave}
            disabled={cloudSyncing}
            title={cloudSyncing ? 'Syncing...' : 'Sync to cloud'}
            className="min-h-10 min-w-10"
          >
            {cloudSyncing ? (
              <Cloud className="h-4 w-4 animate-pulse text-primary" />
            ) : (
              <Cloud className="h-4 w-4 text-green-500" />
            )}
          </Button>
        )}

        {!user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLocalSave}
            title="Save (S)"
            className="min-h-10 min-w-10"
          >
            💾
          </Button>
        )}

        {/* Auth buttons */}
        {user ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="min-h-10 gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{user.email?.split('@')[0]}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium truncate">{user.email}</p>
                {lastCloudSave && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(lastCloudSave).toLocaleTimeString()}
                  </p>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={onSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm" className="min-h-10 gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Log In</span>
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetGame}
          className="min-h-10 min-w-10 hidden sm:flex"
        >
          New Game
        </Button>
      </div>
    </header>
  );
}
