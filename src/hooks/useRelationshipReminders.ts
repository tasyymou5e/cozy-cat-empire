import { useMemo, useEffect, useRef } from 'react';
import { CatRelationship, getDecayInfo, RELATIONSHIP_DECAY } from '@/types/relationships';
import { Cat } from '@/types/game';
import { toast } from '@/hooks/use-toast';

/**
 * useRelationshipReminders - Shows toast notifications for relationships needing attention
 * 
 * Monitors cat relationships and shows reminders when relationships are about to decay
 * or are actively losing points. Shows toast once per day on game load.
 * 
 * @param relationships - Array of all cat relationships
 * @param cats - Array of all cats
 * @param currentDay - Current game day
 * @param enabled - Whether reminders are enabled
 * @returns Object with attention counts and relationships needing attention
 */
export function useRelationshipReminders(
  relationships: CatRelationship[],
  cats: Cat[],
  currentDay: number,
  enabled: boolean = true
) {
  const hasShownToday = useRef<number | null>(null);
  
  // Find relationships needing attention (2+ days since last interaction)
  const needsAttention = useMemo(() => {
    return relationships.filter(rel => {
      const info = getDecayInfo(rel, currentDay);
      return info.daysSinceInteraction >= 2 && rel.score > RELATIONSHIP_DECAY.MIN_DECAY_SCORE;
    });
  }, [relationships, currentDay]);
  
  // Count actively decaying relationships
  const decayingCount = useMemo(() => 
    relationships.filter(rel => getDecayInfo(rel, currentDay).isDecaying).length,
    [relationships, currentDay]
  );
  
  // Count relationships about to decay (in warning zone: 2 days but not yet decaying)
  const warningCount = useMemo(() => {
    return relationships.filter(rel => {
      const info = getDecayInfo(rel, currentDay);
      return info.daysSinceInteraction >= 2 && !info.isDecaying;
    }).length;
  }, [relationships, currentDay]);
  
  // Show toast on game load if relationships need attention
  useEffect(() => {
    if (!enabled || hasShownToday.current === currentDay) return;
    if (needsAttention.length === 0) return;
    if (cats.length < 2) return;
    
    hasShownToday.current = currentDay;
    
    const getCatName = (id: string) => cats.find(c => c.id === id)?.name || 'Unknown';
    
    if (decayingCount > 0) {
      toast({
        title: "⚠️ Cat Bonds Fading!",
        description: `${decayingCount} relationship${decayingCount > 1 ? 's are' : ' is'} losing points. Visit the Socialize panel to reconnect your cats!`,
        duration: 8000,
      });
    } else if (warningCount > 0) {
      // Warning before decay starts
      const firstRel = needsAttention[0];
      toast({
        title: "💭 Time to Socialize!",
        description: `${getCatName(firstRel.catId1)} and ${getCatName(firstRel.catId2)} haven't played together in a while.`,
        duration: 6000,
      });
    }
  }, [currentDay, enabled, needsAttention, decayingCount, warningCount, cats]);
  
  return {
    needsAttentionCount: needsAttention.length,
    decayingCount,
    warningCount,
    needsAttention,
  };
}
