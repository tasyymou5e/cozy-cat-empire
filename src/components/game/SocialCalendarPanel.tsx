import { useMemo } from 'react';
import { Cat } from '@/types/game';
import { 
  CatRelationship, 
  getDecayInfo, 
  getDecayWarningColor,
  getDecayWarningText,
  getRelationshipEmoji,
  RELATIONSHIP_DECAY,
} from '@/types/relationships';
import { CatVisual } from './CatVisual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, Heart } from 'lucide-react';

interface SocialCalendarPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  currentDay: number;
  catCostumes?: Record<string, string>;
  onSocialize?: (cat1Id: string, cat2Id: string) => void;
}

interface RelationshipWithDecay extends CatRelationship {
  decayInfo: ReturnType<typeof getDecayInfo>;
}

function RelationshipSection({ 
  title, 
  icon: Icon,
  items, 
  cats, 
  catCostumes,
  colorClass,
}: { 
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: RelationshipWithDecay[];
  cats: Cat[];
  catCostumes?: Record<string, string>;
  colorClass: string;
}) {
  const getCatName = (catId: string) => cats.find(c => c.id === catId)?.name || 'Unknown';
  const getCat = (catId: string) => cats.find(c => c.id === catId);
  
  if (items.length === 0) return null;
  
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-3 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <h4 className="font-medium">{title}</h4>
        <Badge variant="outline" className="ml-auto text-xs">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map(rel => {
          const cat1 = getCat(rel.catId1);
          const cat2 = getCat(rel.catId2);
          
          return (
            <div 
              key={`${rel.catId1}-${rel.catId2}`}
              className={`p-3 rounded-lg border ${getDecayWarningColor(rel.decayInfo.decayLevel) || 'bg-secondary/30 border-border'}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {cat1 && <CatVisual cat={cat1} size="xs" equippedCostumeId={catCostumes?.[rel.catId1]} />}
                  <span className="font-medium text-sm truncate">{getCatName(rel.catId1)}</span>
                </div>
                <span className="text-lg">{getRelationshipEmoji(rel.level)}</span>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="font-medium text-sm truncate">{getCatName(rel.catId2)}</span>
                  {cat2 && <CatVisual cat={cat2} size="xs" equippedCostumeId={catCostumes?.[rel.catId2]} />}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  Last interaction: {rel.decayInfo.daysSinceInteraction === 0 ? 'Today' : `${rel.decayInfo.daysSinceInteraction} day${rel.decayInfo.daysSinceInteraction > 1 ? 's' : ''} ago`}
                </span>
                {rel.decayInfo.isDecaying && (
                  <span className="font-medium">
                    {getDecayWarningText(rel.decayInfo.decayLevel)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SocialCalendarPanel - Dedicated view for relationship maintenance
 * 
 * Shows all cat relationships sorted by urgency, helping players identify
 * which relationships need attention before they decay.
 */
export function SocialCalendarPanel({ 
  cats, 
  relationships, 
  currentDay, 
  catCostumes,
}: SocialCalendarPanelProps) {
  // Sort relationships by days since interaction (most neglected first)
  const sortedRelationships = useMemo(() => {
    return [...relationships]
      .map(rel => ({
        ...rel,
        decayInfo: getDecayInfo(rel, currentDay),
      }))
      .sort((a, b) => b.decayInfo.daysSinceInteraction - a.decayInfo.daysSinceInteraction);
  }, [relationships, currentDay]);
  
  // Group by urgency
  const urgent = sortedRelationships.filter(r => r.decayInfo.decayLevel === 'severe');
  const warning = sortedRelationships.filter(r => r.decayInfo.decayLevel === 'moderate');
  const attention = sortedRelationships.filter(r => r.decayInfo.decayLevel === 'light');
  const healthy = sortedRelationships.filter(r => r.decayInfo.decayLevel === 'none');
  
  const totalNeeds = urgent.length + warning.length + attention.length;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          📅 Social Calendar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Keep your cats connected! Relationships fade without regular interaction.
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {urgent.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {urgent.length} Urgent
            </Badge>
          )}
          {warning.length > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-600 gap-1">
              <Clock className="h-3 w-3" />
              {warning.length} Warning
            </Badge>
          )}
          {attention.length > 0 && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 gap-1">
              💭 {attention.length} Attention
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {healthy.length} Healthy
          </Badge>
        </div>
        
        {relationships.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No relationships yet.</p>
            <p className="text-sm mt-1">Cats will form bonds over time!</p>
          </div>
        ) : totalNeeds === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-4">✨</span>
            <p className="text-green-600 font-medium">All relationships are healthy!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Great job keeping your cats connected.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-72">
            <RelationshipSection 
              title="🚨 Urgent (7+ days)" 
              icon={AlertTriangle}
              items={urgent} 
              cats={cats}
              catCostumes={catCostumes}
              colorClass="text-red-600"
            />
            <RelationshipSection 
              title="⚠️ Warning (5-6 days)" 
              icon={Clock}
              items={warning} 
              cats={cats}
              catCostumes={catCostumes}
              colorClass="text-orange-600"
            />
            <RelationshipSection 
              title="💭 Needs Attention (3-4 days)" 
              icon={Clock}
              items={attention} 
              cats={cats}
              catCostumes={catCostumes}
              colorClass="text-yellow-600"
            />
            <RelationshipSection 
              title="✅ Healthy (0-2 days)" 
              icon={CheckCircle}
              items={healthy} 
              cats={cats}
              catCostumes={catCostumes}
              colorClass="text-green-600"
            />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
