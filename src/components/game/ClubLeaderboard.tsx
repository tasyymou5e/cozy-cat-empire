/**
 * @fileoverview Club vs Club Leaderboard component
 *
 * Shows inter-club rankings based on total club XP,
 * encouraging competition between clubs.
 *
 * @module components/game/ClubLeaderboard
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, TrendingUp } from 'lucide-react';

import { createLogger } from '@/lib/logger';

const logger = createLogger('ClubLeaderboard');

interface ClubRanking {
  id: string;
  name: string;
  emoji: string | null;
  totalXp: number;
  memberCount: number;
}

export function ClubLeaderboard() {
  const [rankings, setRankings] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubRankings = async () => {
      try {
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name, emoji, total_xp')
          .order('total_xp', { ascending: false })
          .limit(20);

        if (!clubs) {
          setLoading(false);
          return;
        }

        // Get member counts
        const rankingsWithMembers: ClubRanking[] = await Promise.all(
          clubs.map(async (club) => {
            const { count } = await supabase
              .from('club_members')
              .select('*', { count: 'exact', head: true })
              .eq('club_id', club.id);

            return {
              id: club.id,
              name: club.name,
              emoji: club.emoji,
              totalXp: club.total_xp ?? 0,
              memberCount: count ?? 0,
            };
          })
        );

        setRankings(rankingsWithMembers);
      } catch (err) {
        logger.error('Failed to fetch club rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubRankings();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 0) return <Badge className="bg-yellow-500/80 text-yellow-950">🥇 #1</Badge>;
    if (rank === 1) return <Badge className="bg-gray-400/80 text-gray-900">🥈 #2</Badge>;
    if (rank === 2) return <Badge className="bg-amber-600/80 text-amber-50">🥉 #3</Badge>;
    return <Badge variant="outline">#{rank + 1}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Club Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No clubs yet. Create one to start competing! 🏰
          </p>
        ) : (
          <div className="space-y-2">
            {rankings.map((club, idx) => (
              <div
                key={club.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(idx)}
                  <span className="text-xl">{club.emoji || '🏰'}</span>
                  <div>
                    <div className="font-medium">{club.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {club.memberCount} members
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {club.totalXp.toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
