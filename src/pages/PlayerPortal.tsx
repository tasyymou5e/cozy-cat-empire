import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GameLayout } from '@/components/layouts/GameLayout';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsOverviewCards } from '@/components/stats/StatsOverviewCards';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Cat as CatIcon,
  Coins,
  Heart,
  Loader2,
  LogIn,
  Mail,
  RefreshCw,
  Send,
  Star,
  Trophy,
  User,
  Utensils,
} from 'lucide-react';
import { GradeBadge } from '@/components/game/GradeBadge';
import { CatAvatar } from '@/components/game/CatAvatar';
import type { Cat } from '@/types/game';

const logger = createLogger('PlayerPortal');
const MAX_BODY = 4000;
const LEADERBOARD_SIZE = 10;

type PortalBoardCategory = 'grade' | 'days' | 'wealth';

const PORTAL_BOARD_COLUMNS: Record<PortalBoardCategory, string> = {
  grade: 'highest_cat_grade',
  days: 'total_days_survived',
  wealth: 'total_money_earned',
};

interface PortalBoardEntry {
  user_id: string;
  display_name: string | null;
  avatar_emoji: string;
  highest_cat_grade: number;
  total_days_survived: number;
  total_money_earned: number;
}

interface PortalMessage {
  id: string;
  direction: 'to_player' | 'from_player';
  body: string;
  read_by_player: boolean;
  created_at: string;
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleString();
}

/**
 * PlayerPortal - one place for a signed-in player to see their own account:
 * messages from the team, their profile, and their cat stats.
 */
export default function PlayerPortal() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfile } = usePlayerProfile(user?.id);
  const { stats, loading: statsLoading, fetchStats } = usePlayerStats(user?.id);

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😺');
  const [username, setUsername] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setAvatarEmoji(profile.avatar_emoji || '😺');
    setUsername(profile.username ?? '');
  }, [profile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile(displayName, avatarEmoji, username);
    setSavingProfile(false);
    if (result.success) {
      toast({ title: 'Profile saved' });
    } else {
      toast({
        title: "Couldn't save your profile",
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Cats (from the player's cloud save)
  const [cats, setCats] = useState<Cat[]>([]);
  const [catCostumes, setCatCostumes] = useState<Record<string, string>>({});
  const [catsLoading, setCatsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCats([]);
      setCatsLoading(false);
      return;
    }
    let cancelled = false;
    const loadCats = async () => {
      const { data, error } = await supabase
        .from('game_saves')
        .select('game_state')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        logger.warn('Failed to load portal cats', error);
      } else {
        const gs = (data?.game_state ?? {}) as { cats?: Cat[]; catCostumes?: Record<string, string> };
        setCats(Array.isArray(gs.cats) ? gs.cats : []);
        setCatCostumes(gs.catCostumes ?? {});
      }
      setCatsLoading(false);
    };
    void loadCats();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Messages
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.direction === 'to_player' && !m.read_by_player).length,
    [messages]
  );

  const loadMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('player_messages')
      .select('id, direction, body, read_by_player, created_at')
      .eq('player_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.warn('Failed to load portal messages', error);
      toast({
        title: "Couldn't load your messages",
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } else {
      setMessages((data ?? []) as PortalMessage[]);
    }
    setMessagesLoading(false);
  }, [user, toast]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  // Live updates for new admin messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`portal-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_messages',
          filter: `player_id=eq.${user.id}`,
        },
        () => {
          void loadMessages();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadMessages]);

  // Mark team messages as read once they're on screen
  useEffect(() => {
    if (!user || unreadCount === 0) return;
    void supabase
      .from('player_messages')
      .update({ read_by_player: true })
      .eq('player_id', user.id)
      .eq('direction', 'to_player')
      .eq('read_by_player', false)
      .then(({ error }) => {
        if (error) logger.warn('Failed to mark messages read', error);
      });
  }, [user, unreadCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!user || !body) return;
    setSending(true);
    const { error } = await supabase.from('player_messages').insert({
      player_id: user.id,
      sender_id: user.id,
      direction: 'from_player',
      body: body.slice(0, MAX_BODY),
      read_by_player: true,
      read_by_admin: false,
    });
    setSending(false);
    if (error) {
      logger.warn('Failed to send portal reply', error);
      toast({
        title: "Couldn't send your message",
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    setDraft('');
    await loadMessages();
  };

  // Leaderboard (public player_stats)
  const [boardCategory, setBoardCategory] = useState<PortalBoardCategory>('grade');
  const [boardEntries, setBoardEntries] = useState<PortalBoardEntry[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);

  const loadBoard = useCallback(async (category: PortalBoardCategory) => {
    setBoardLoading(true);
    const { data, error } = await supabase
      .from('player_stats')
      .select(
        'user_id, display_name, avatar_emoji, highest_cat_grade, total_days_survived, total_money_earned'
      )
      .order(PORTAL_BOARD_COLUMNS[category], { ascending: false })
      .limit(LEADERBOARD_SIZE);
    if (error) {
      logger.warn('Failed to load portal leaderboard', error);
      setBoardEntries([]);
    } else {
      setBoardEntries((data ?? []) as unknown as PortalBoardEntry[]);
    }
    setBoardLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setBoardEntries([]);
      setBoardLoading(false);
      return;
    }
    void loadBoard(boardCategory);
  }, [user, boardCategory, loadBoard]);

  const boardCategories: {
    id: PortalBoardCategory;
    label: string;
    icon: typeof Star;
    value: (e: PortalBoardEntry) => string;
  }[] = [
    { id: 'grade', label: 'Cat Grade', icon: Star, value: (e) => `Grade ${e.highest_cat_grade}` },
    { id: 'days', label: 'Days Survived', icon: CalendarDays, value: (e) => `${e.total_days_survived} days` },
    { id: 'wealth', label: 'Money Earned', icon: Coins, value: (e) => `$${e.total_money_earned.toLocaleString()}` },
  ];

  // Signed-out state
  if (!authLoading && !user) {
    return (
      <GameLayout currentPage="/portal">
        <div className="min-h-screen cozy-page-bg flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2 page-heading">Your Player Portal</h2>
              <p className="text-muted-foreground mb-6">
                Log in to read messages from the Cat Farm team, edit your profile, and track your cat
                stats.
              </p>
              <div className="flex gap-2 justify-center">
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Game
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button>
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout currentPage="/portal">
      <div className="min-h-screen cozy-page-bg">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Breadcrumbs items={[{ label: 'My Portal' }]} />
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl">{profile?.avatar_emoji || '😺'}</span>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold page-heading truncate">
                    {profile?.display_name || 'Your Portal'}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="shrink-0">
                {unreadCount} new message{unreadCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 panel-fade-in">
          <Tabs defaultValue="messages">
            <TabsList className="mb-4 max-w-full overflow-x-auto justify-start">
              <TabsTrigger value="messages" className="gap-2">
                <Mail className="h-4 w-4" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="cats" className="gap-2">
                <CatIcon className="h-4 w-4" />
                My Cats
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Cat Stats
              </TabsTrigger>
            </TabsList>

            {/* MESSAGES */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Messages with the Cat Farm team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading your messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Mail className="h-10 w-10 mx-auto mb-3 opacity-60" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm">
                        Say hello — the team reads every message that lands here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {messages.map((m) => {
                        const mine = m.direction === 'from_player';
                        return (
                          <div
                            key={m.id}
                            className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={cn(
                                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                                mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              <p
                                className={cn(
                                  'mt-1 text-[11px]',
                                  mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}
                              >
                                {mine ? 'You' : '🐱 Cat Farm team'} • {fmtWhen(m.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Write a message to the team…"
                      rows={3}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {draft.length}/{MAX_BODY} • ⌘/Ctrl + Enter to send
                      </span>
                      <Button
                        size="sm"
                        onClick={() => void handleSend()}
                        disabled={sending || !draft.trim()}
                        className="gap-2"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROFILE */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                  {profileLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-6">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="portal-avatar">Avatar</Label>
                        <Input
                          id="portal-avatar"
                          value={avatarEmoji}
                          onChange={(e) => setAvatarEmoji(e.target.value)}
                          className="w-24 text-2xl text-center"
                          maxLength={8}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal-name">Display name</Label>
                        <Input
                          id="portal-name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Shown on leaderboards"
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal-username">Username</Label>
                        <Input
                          id="portal-username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="How friends find you"
                          maxLength={30}
                        />
                      </div>
                      <Button
                        onClick={() => void handleSaveProfile()}
                        disabled={savingProfile || !displayName.trim()}
                      >
                        {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save profile
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CATS */}
            <TabsContent value="cats">
              {catsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your cats…
                </div>
              ) : cats.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <CatIcon className="h-10 w-10 mx-auto mb-3 opacity-60" />
                    <p className="font-medium">No cats saved yet</p>
                    <p className="text-sm">
                      Your cats appear here once your game has saved to the cloud.
                    </p>
                    <Link to="/">
                      <Button variant="outline" size="sm" className="mt-4">
                        Back to Game
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cats.map((cat) => (
                    <Card key={cat.id}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <CatAvatar
                            cat={cat}
                            size="md"
                            animated={false}
                            equippedCostumeId={catCostumes[cat.id]}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold truncate">{cat.name}</p>
                              <GradeBadge grade={cat.grade} showStars={false} size="sm" />
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {cat.breed} • {cat.personality} • Day {cat.age}
                            </p>
                            {cat.showWins > 0 && (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Trophy className="h-3 w-3 text-yellow-500" />
                                {cat.showWins} show win{cat.showWins === 1 ? '' : 's'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {(
                            [
                              { icon: Heart, label: 'Health', value: cat.health },
                              { icon: Star, label: 'Happy', value: cat.happiness },
                              { icon: Utensils, label: 'Fed', value: cat.hunger },
                            ] as const
                          ).map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-2 text-xs">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="w-12 text-muted-foreground">{label}</span>
                              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                                />
                              </div>
                              <span className="w-8 text-right tabular-nums">{value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* STATS */}
            <TabsContent value="stats">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Your totals across every day you've played.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchStats()}
                    disabled={statsLoading}
                  >
                    <RefreshCw
                      className={cn('h-4 w-4 mr-2', statsLoading && 'animate-spin')}
                    />
                    Refresh
                  </Button>
                </div>

                {statsLoading && !stats ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading your cat stats…
                  </div>
                ) : stats ? (
                  <>
                    <StatsOverviewCards stats={stats} />
                    <Card>
                      <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Best cat grade so far:{' '}
                          <span className="font-semibold">{stats.highest_cat_grade ?? 0}</span>
                        </div>
                        <Link to="/stats">
                          <Button variant="outline" size="sm">
                            Full stats dashboard
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-60" />
                      <p className="font-medium">No stats yet</p>
                      <p className="text-sm">Play a few days and your totals will show up here.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </GameLayout>
  );
}
