import { Link } from 'react-router-dom';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { NotificationCenter } from './NotificationCenter';
import { AutoSaveIndicator, AutoSaveStatus } from './AutoSaveIndicator';
import { WeeklyEventBanner } from './WeeklyEventBanner';
import { cn } from '@/lib/utils';
import {
  Volume2,
  VolumeX,
  Music,
  Music2,
  Settings,
  LogIn,
  LogOut,
  User,
  Sun,
  Moon,
  CalendarDays,
  Keyboard,
  Sparkles,
  RotateCcw,
  Castle,
  MoreVertical,
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
  onShowDailyWizard?: () => void;

  // User
  user: { id: string; email?: string } | null;
  onSignOut: () => void;
  onManualSave: () => void;
  onResetGame: () => void;

  // Auto-save status
  autoSaveStatus: AutoSaveStatus;
  hasLoadedCloud: boolean;

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
  onShowDailyWizard,
  user,
  onSignOut,
  onManualSave,
  onResetGame,
  autoSaveStatus,
  hasLoadedCloud,
  isVIP,
  vipTier,
  canClaimDailyReward,
  isMobile,
}: GameHeaderProps) {
  // Mobile: slim single-row toolbar with overflow menu
  if (isMobile) {
    return (
      <header className="h-12 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 shrink-0 pt-safe">
        {/* Left: compact day/money */}
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-medium">📅 <AnimatedCounter value={day} /></span>
          <span className="flex items-center gap-1 font-bold text-gradient-gold">💰 <AnimatedCounter value={money} prefix="$" /></span>
        </div>

        {/* Right: essential icons + overflow */}
        <div className="flex items-center gap-0.5">
          {/* Daily Wizard */}
          {onShowDailyWizard && (
            <Button variant="ghost" size="icon" onClick={onShowDailyWizard} className="h-10 w-10">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </Button>
          )}

          {/* Daily Rewards with indicator */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowDailyRewards}
              className={cn('h-10 w-10 relative', canClaimDailyReward && 'animate-bounce-gentle')}
            >
              <CalendarDays className="h-4 w-4" />
              {canClaimDailyReward && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <NotificationCenter userId={user?.id} onNavigate={() => {}} />

          {/* Auto-Save */}
          <AutoSaveIndicator
            status={autoSaveStatus}
            isLoggedIn={!!user}
            hasLoadedCloud={hasLoadedCloud}
            onManualSave={user ? onManualSave : undefined}
            compact
          />

          {/* Overflow menu: audio, theme, profile, etc. */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                {/* VIP Badge */}
                {user && isVIP && vipTier && (
                  <Badge
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs cursor-pointer w-full justify-center"
                    onClick={onShowDailyRewards}
                  >
                    {vipTier.emoji} {vipTier.name}
                  </Badge>
                )}

                {/* Empire */}
                {user && (
                  <Link to="/empire" className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors">
                    <Castle className="h-4 w-4 text-primary" />
                    My Empire
                  </Link>
                )}

                {/* Audio controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-2">
                      {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} SFX
                    </label>
                    <Button variant="ghost" size="sm" onClick={onToggleSound} className="h-7 px-2 compact-btn">
                      {soundOn ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <Slider value={[sfxVolume]} onValueChange={onSfxVolumeChange} max={100} step={5} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-2">
                      {musicOn ? <Music2 className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4" />} Music
                    </label>
                    <Button variant="ghost" size="sm" onClick={onToggleMusic} className="h-7 px-2 compact-btn">
                      {musicOn ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <Slider value={[musicVolume]} onValueChange={onMusicVolumeChange} max={100} step={5} />
                </div>

                <div className="border-t pt-2 space-y-1">
                  <button onClick={onThemeChange} className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button onClick={onShowWhatsNew} className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Sparkles className="h-4 w-4" /> What's New
                  </button>
                  <button onClick={onResetGame} className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <RotateCcw className="h-4 w-4" /> New Game
                  </button>
                </div>

                {/* Auth */}
                <div className="border-t pt-2">
                  {user ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <Button variant="outline" size="sm" className="w-full compact-btn" onClick={onSignOut}>
                        <LogOut className="h-4 w-4 mr-2" /> Log Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="w-full compact-btn gap-2">
                        <LogIn className="h-4 w-4" /> Log In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
    );
  }

  // Desktop / Tablet layout (unchanged)
  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      {/* Left: Quick Stats + Weekly Event */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
            <span>📅</span>
            <span className="font-medium">Day <AnimatedCounter value={day} /></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
            <span>💰</span>
            <span className="font-bold text-gradient-gold"><AnimatedCounter value={money} prefix="$" /></span>
          </div>
          {/* Weekly Event Banner */}
          <WeeklyEventBanner compact />
        </div>
      </div>

      {/* Right: Essential Actions */}
      <div className="flex items-center gap-1">
        {/* Daily Wizard Button */}
        {onShowDailyWizard && (
          <Button variant="ghost" size="icon" onClick={onShowDailyWizard} title="Daily Wizard" className="relative">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </Button>
        )}

        {/* Empire Button - Featured */}
        {user && (
          <Link to="/empire">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/50 hover:bg-primary/10 hover:border-primary"
              title="My Empire"
            >
              <Castle className="h-4 w-4 text-primary" />
              <span className="font-medium">Empire</span>
            </Button>
          </Link>
        )}

        {/* VIP Badge */}
        {user && isVIP && vipTier && (
          <Badge
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs cursor-pointer mr-1"
            onClick={onShowDailyRewards}
          >
            {vipTier.emoji} {vipTier.name}
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

                <button
                  onClick={onShowShortcutsHelp}
                  className="flex items-center gap-2 w-full text-sm p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </button>

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

        {/* Auto-Save Status Indicator */}
        <AutoSaveIndicator
          status={autoSaveStatus}
          isLoggedIn={!!user}
          hasLoadedCloud={hasLoadedCloud}
          onManualSave={user ? onManualSave : undefined}
          compact={false}
        />

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
                {autoSaveStatus.lastSaveTime && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(autoSaveStatus.lastSaveTime).toLocaleTimeString()}
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
              Log In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}

