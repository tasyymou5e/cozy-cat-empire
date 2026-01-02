import { useMemo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { PERSONALITY_COMPATIBILITY, CatRelationship, getRelationshipEmoji } from '@/types/relationships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';

interface MatchmakingPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  onSocialize: (cat1Id: string, cat2Id: string) => void;
  treats: number;
}

interface MatchSuggestion {
  cat1: Cat;
  cat2: Cat;
  compatibility: number;
  currentRelationship: CatRelationship | null;
  reason: string;
}

export function MatchmakingPanel({ cats, relationships, onSocialize, treats }: MatchmakingPanelProps) {
  const suggestions = useMemo(() => {
    if (cats.length < 2) return [];

    const matches: MatchSuggestion[] = [];

    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const cat1 = cats[i];
        const cat2 = cats[j];
        
        const compatibility = PERSONALITY_COMPATIBILITY[cat1.personality][cat2.personality];
        const currentRel = relationships.find(
          r => (r.catId1 === cat1.id && r.catId2 === cat2.id) ||
               (r.catId1 === cat2.id && r.catId2 === cat1.id)
        ) || null;

        // Generate reason based on personalities
        let reason = '';
        if (compatibility >= 15) {
          reason = `${cat1.personality} and ${cat2.personality} personalities are highly compatible!`;
        } else if (compatibility >= 5) {
          reason = `${cat1.personality} and ${cat2.personality} could get along well.`;
        } else if (compatibility >= 0) {
          reason = `Neutral compatibility - worth a try!`;
        } else {
          reason = `${cat1.personality} and ${cat2.personality} may clash, but opposites can attract!`;
        }

        matches.push({
          cat1,
          cat2,
          compatibility,
          currentRelationship: currentRel,
          reason,
        });
      }
    }

    // Sort by: 1) No existing strong relationship, 2) High compatibility
    return matches
      .filter(m => !m.currentRelationship || m.currentRelationship.score < 60) // Not already best friends
      .sort((a, b) => {
        // Prioritize pairs without relationships or with low relationships
        const aHasRel = a.currentRelationship ? 1 : 0;
        const bHasRel = b.currentRelationship ? 1 : 0;
        if (aHasRel !== bHasRel) return aHasRel - bHasRel;
        
        // Then sort by compatibility
        return b.compatibility - a.compatibility;
      })
      .slice(0, 5); // Top 5 suggestions
  }, [cats, relationships]);

  const getCompatibilityBadge = (compat: number) => {
    if (compat >= 15) return { label: 'Excellent', className: 'bg-green-100 text-green-700 border-green-200' };
    if (compat >= 5) return { label: 'Good', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (compat >= 0) return { label: 'Neutral', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    return { label: 'Risky', className: 'bg-orange-100 text-orange-700 border-orange-200' };
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Matchmaking
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Suggested cat pairs based on personality compatibility
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Need at least 2 cats for matchmaking suggestions.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((match, idx) => {
                const badge = getCompatibilityBadge(match.compatibility);
                return (
                  <div
                    key={`${match.cat1.id}-${match.cat2.id}`}
                    className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{match.cat1.name}</span>
                        <span className="text-pink-500">💕</span>
                        <span className="font-medium text-sm">{match.cat2.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">{match.reason}</p>
                    
                    <div className="flex items-center justify-between">
                      {match.currentRelationship && (
                        <span className="text-xs text-muted-foreground">
                          Current: {getRelationshipEmoji(match.currentRelationship.level)} {match.currentRelationship.level}
                        </span>
                      )}
                      {!match.currentRelationship && (
                        <span className="text-xs text-muted-foreground">No relationship yet</span>
                      )}
                      
                      <button
                        onClick={() => onSocialize(match.cat1.id, match.cat2.id)}
                        disabled={treats < 2}
                        className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🤝 Socialize
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
