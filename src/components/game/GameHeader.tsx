import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { NotificationCenter } from './NotificationCenter';
import {
  Volume2,
  VolumeX,
  Music,
  Music2,
  Settings,
  LogIn,
  LogOut,
  User,
  Cloud,
  Sun,
  Moon,
  CalendarDays,
  Keyboard,
  Sparkles,
  RotateCcw,
  Castle,
} from 'lucide-react';
import { VIPTier } from '@/types/dailyRewards';

interface GameHeaderProps {
  // Status
  day: number;
  money: number;

  // Audio
  musicOn: boolean;
  soundOn: boolean;
  sfxVolume: number;
  musicVolume: number;
  onToggleMusic: () => void;
  onToggleSound: () => void;
  onSfxVolumeChange: (value: number[]) => void;
  onMusicVolumeChange: (value: number[]) => void;

  // Theme
  theme: string | undefined;
  onThemeChange: () => void;

  // Actions
  onShowShortcutsHelp: () => void;
  onShowWhatsNew: () => void;
  onShowDailyRewards: () => void;

  // User
  user: { id: string; email?: string } | null;
  onSignOut: () => void;
  lastCloudSave: string | null;
  cloudSyncing: boolean;
  onCloudSave: () => void;
  onResetGame: () => void;

  // VIP
  isVIP: boolean;
  vipTier: VIPTier | null;
  canClaimDailyReward: boolean;

  // Mobile
  isMobile: boolean;
}

export function GameHeader({
  day,
  money,
  musicOn,
  soundOn,
  sfxVolume,
  musicVolume,
  onToggleMusic,
  onToggleSound,
  onSfxVolumeChange,
  onMusicVolumeChange,
  theme,
  onThemeChange,
  onShowShortcutsHelp,
  onShowWhatsNew,
  onShowDailyRewards,
  user,
  onSignOut,
  lastCloudSave,
  cloudSyncing,
  onCloudSave,
  onResetGame,
  isVIP,
  vipTier,
  canClaimDailyReward,
  isMobile,
}: GameHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      {/* Left: Quick Stats (visible on desktop, hidden on mobile since sidebar shows them) */}
      <div className="flex items-center gap-4">
        {!isMobile && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
              <span>📅</span>
              <span className="font-medium">Day {day}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
              <span>💰</span>
              <span className="font-bold text-gradient-gold">${money.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Mobile: Show title */}
        {isMobile && (
          <h1 className="text-lg font-bold text-gradient-primary flex items-center gap-2">
            🐱 Cat Farm
          </h1>
        )}
      </div>

      {/* Right: Essential Actions */}
      <div className="flex items-center gap-1">
        {/* Empire Button - Featured */}
        {user && (
          <Link to="/empire">
            <Button
              variant="outline"
              size={isMobile ? 'icon' : 'sm'}
              className="gap-1.5 border-primary/50 hover:bg-primary/10 hover:border-primary"
              title="My Empire"
            >
              <Castle className="h-4 w-4 text-primary" />
              {!isMobile && <span className="font-medium">Empire</span>}
            </Button>
          </Link>
        )}

        {/* VIP Badge */}
        {user && isVIP && vipTier && (
          <Badge
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs cursor-pointer mr-1"
            onClick={onShowDailyRewards}
          >
            {vipTier.emoji} {!isMobile && vipTier.name}
          </Badge>
        )}

        {/* Daily Rewards */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowDailyRewards}
            title="Daily Rewards"
            className={cn('relative', canClaimDailyReward && 'animate-bounce-gentle')}
          >
            <CalendarDays className="h-4 w-4" />
            {canClaimDailyReward && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <NotificationCenter userId={user?.id} onNavigate={() => {}} />

        {/* Settings Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Settings</h4>
              
              {/* Audio */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-2">
                      {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Sound Effects
                    </label>
                    <Button variant="ghost" size="sm" onClick={onToggleSound} className="h-7 px-2">
                      {soundOn ? 'On' : 'Off'}
                    </Button>
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
                    <label className="text-sm flex items-center gap-2">
                      {musicOn ? <Music2 className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4" />}
                      Music
                    </label>
                    <Button variant="ghost" size="sm" onClick={onToggleMusic} className="h-7 px-2">
                      {musicOn ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={onMusicVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="border-t pt-3 space-y-1">
                <button
                  onClick={onThemeChange}
                  className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                {!isMobile && (
                  <button
                    onClick={onShowShortcutsHelp}
                    className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Keyboard className="h-4 w-4" />
                    Keyboard Shortcuts
                  </button>
                )}

                <button
                  onClick={onShowWhatsNew}
                  className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  What's New
                </button>

                <button
                  onClick={onResetGame}
                  className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted text-destructive transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Game
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Cloud Sync */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloudSave}
            disabled={cloudSyncing}
            title={cloudSyncing ? 'Syncing...' : `Last sync: ${lastCloudSave ? new Date(lastCloudSave).toLocaleTimeString() : 'Never'}`}
          >
            <Cloud className={cn('h-4 w-4', cloudSyncing ? 'animate-pulse text-primary' : 'text-green-500')} />
          </Button>
        )}

        {/* User / Auth */}
        {user ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
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
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              {!isMobile && 'Log In'}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
