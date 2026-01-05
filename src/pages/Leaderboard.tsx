import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Volume2, VolumeX, Sun, Moon, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlobalLeaderboardPanel } from '@/components/game/GlobalLeaderboardPanel';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export default function Leaderboard() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setVolume } = useSoundEffects();
  
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setVolume(soundOn ? 0.5 : 0);
  }, [soundOn, setVolume]);

  const toggleSound = () => setSoundOn((v) => !v);

  return (
    <div className="min-h-screen bg-background">
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
        <GlobalLeaderboardPanel userId={user?.id} />
      </main>
    </div>
  );
}
