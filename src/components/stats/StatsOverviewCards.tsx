import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Cat, Heart, Coins, Award, Star } from 'lucide-react';
import { PlayerStats } from '@/hooks/usePlayerStats';

interface StatsOverviewCardsProps {
  stats: PlayerStats;
}

export function StatsOverviewCards({ stats }: StatsOverviewCardsProps) {
  const cards = [
    {
      label: 'Show Wins',
      value: stats.total_show_wins ?? 0,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Cats Owned',
      value: stats.total_cats_owned ?? 0,
      icon: Cat,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Kittens Bred',
      value: stats.total_kittens_bred ?? 0,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Total Wealth',
      value: `$${(stats.total_money_earned ?? 0).toLocaleString()}`,
      icon: Coins,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Achievements',
      value: stats.achievements_unlocked ?? 0,
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Highest Grade',
      value: stats.highest_cat_grade || '-',
      icon: Star,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 panel-fade-in">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden glass-panel">
          <CardContent className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${card.bgColor} mb-2`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
