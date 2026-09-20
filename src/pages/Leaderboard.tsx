import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Volume2, VolumeX, Sun, Moon, Settings2, Trophy } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GameLayout } from '@/components/layouts/GameLayout';
import { GlobalLeaderboardPanel } from '@/components/game/GlobalLeaderboardPanel';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setVolume } = useSound();

  const [soundOn, setSoundOn] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setVolume(soundOn ? 0.5 : 0);
  }, [soundOn, setVolume]);

  const toggleSound = () => setSoundOn((v) => !v);

  return (
    <GameLayout currentPage="/leaderboard">
      <div className="min-h-screen cozy-page-bg">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Breadcrumbs items={[{ label: 'Global Leaderboard' }]} />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-3">
                  <button
                    onClick={toggleSound}
                    className="flex items-center gap-2 w-full text-sm font-medium hover:text-primary transition-colors"
                  >
                    {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    {soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
                  </button>
                  <div className="border-t pt-3">
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-2 w-full text-sm font-medium hover:text-primary transition-colors"
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="container max-w-4xl py-8 px-4">
          {user ? (
            <GlobalLeaderboardPanel userId={user.id} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card/60 p-10 text-center">
              <Trophy className="h-10 w-10 text-primary" />
              <h2 className="text-xl font-semibold">Sign in to see the leaderboard</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Player rankings and progress are only visible to signed-in players. Create a free
                account or sign in to see where you stand.
              </p>
              <Button onClick={() => navigate({ to: '/auth' })}>Sign in</Button>
            </div>
          )}
        </main>
      </div>
    </GameLayout>
  );
}
