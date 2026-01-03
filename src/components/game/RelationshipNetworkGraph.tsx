import { useState, useMemo, useEffect } from 'react';
import { Cat } from '@/types/game';
import { 
  CatRelationship, 
  RelationshipLevel,
  getRelationshipLevel,
  getRelationshipEmoji 
} from '@/types/relationships';
import { CatAvatar } from './CatAvatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RelationshipNetworkGraphProps {
  cats: Cat[];
  relationships: CatRelationship[];
  onCatClick?: (catId: string) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const RELATIONSHIP_COLORS: Record<RelationshipLevel, string> = {
  bestFriend: '#EC4899', // pink-500
  friend: '#22C55E',     // green-500
  neutral: '#9CA3AF',    // gray-400
  rival: '#F97316',      // orange-500
  enemy: '#EF4444',      // red-500
};

const RELATIONSHIP_LABELS: Record<RelationshipLevel, string> = {
  bestFriend: 'Best Friends',
  friend: 'Friends',
  neutral: 'Neutral',
  rival: 'Rivals',
  enemy: 'Enemies',
};

export function RelationshipNetworkGraph({ 
  cats, 
  relationships, 
  onCatClick 
}: RelationshipNetworkGraphProps) {
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [hoveredRelationship, setHoveredRelationship] = useState<CatRelationship | null>(null);
  const [showNeutral, setShowNeutral] = useState(false);
  
  // Calculate node positions using simple force-directed layout
  const nodePositions = useMemo(() => {
    if (cats.length === 0) return [];
    
    const width = 280;
    const height = 240;
    const centerX = width / 2;
    const centerY = height / 2;
    const padding = 40;
    
    // Initialize positions in a circle
    const positions: NodePosition[] = cats.map((cat, i) => {
      const angle = (2 * Math.PI * i) / cats.length;
      const radius = Math.min(width, height) / 2 - padding;
      return {
        id: cat.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    
    // Simple force simulation (run a few iterations)
    const iterations = 50;
    const repulsion = 800;
    const attraction = 0.05;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          positions[i].x -= fx;
          positions[i].y -= fy;
          positions[j].x += fx;
          positions[j].y += fy;
        }
      }
      
      // Attraction for positive relationships, repulsion for negative
      for (const rel of relationships) {
        const node1 = positions.find(p => p.id === rel.catId1);
        const node2 = positions.find(p => p.id === rel.catId2);
        if (!node1 || !node2) continue;
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Positive score = attract, negative = repel
        const factor = rel.score * attraction * 0.01;
        const fx = dx * factor;
        const fy = dy * factor;
        
        node1.x += fx;
        node1.y += fy;
        node2.x -= fx;
        node2.y -= fy;
      }
      
      // Keep nodes within bounds
      for (const pos of positions) {
        pos.x = Math.max(padding, Math.min(width - padding, pos.x));
        pos.y = Math.max(padding, Math.min(height - padding, pos.y));
      }
      
      // Center gravity
      for (const pos of positions) {
        pos.x += (centerX - pos.x) * 0.01;
        pos.y += (centerY - pos.y) * 0.01;
      }
    }
    
    return positions;
  }, [cats, relationships]);
  
  // Filter relationships based on settings
  const visibleRelationships = useMemo(() => {
    return relationships.filter(rel => {
      if (!showNeutral && rel.level === 'neutral') return false;
      return true;
    });
  }, [relationships, showNeutral]);
  
  // Get connections for a hovered cat
  const getConnectedCatIds = (catId: string): Set<string> => {
    const connected = new Set<string>();
    relationships.forEach(rel => {
      if (rel.catId1 === catId) connected.add(rel.catId2);
      if (rel.catId2 === catId) connected.add(rel.catId1);
    });
    return connected;
  };
  
  const getCatName = (catId: string) => cats.find(c => c.id === catId)?.name || 'Unknown';
  
  // Calculate statistics
  const stats = useMemo(() => {
    const bestFriends = relationships.filter(r => r.level === 'bestFriend').length;
    const friends = relationships.filter(r => r.level === 'friend').length;
    const rivals = relationships.filter(r => r.level === 'rival').length;
    const enemies = relationships.filter(r => r.level === 'enemy').length;
    return { bestFriends, friends, rivals, enemies };
  }, [relationships]);

  if (cats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No cats to display
      </div>
    );
  }

  const connectedCatIds = hoveredCatId ? getConnectedCatIds(hoveredCatId) : new Set<string>();

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch 
            id="show-neutral" 
            checked={showNeutral} 
            onCheckedChange={setShowNeutral}
          />
          <Label htmlFor="show-neutral" className="text-xs">Show neutral</Label>
        </div>
        <div className="flex gap-1 text-xs">
          <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200">
            💕 {stats.bestFriends}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            💚 {stats.friends}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            💔 {stats.enemies}
          </Badge>
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative bg-secondary/20 rounded-lg border border-border overflow-hidden" style={{ height: 240 }}>
        {/* SVG for connection lines */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 280 240"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Animated gradient for best friends */}
            <linearGradient id="bestFriendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EC4899">
                <animate attributeName="stop-color" values="#EC4899;#F472B6;#EC4899" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#F472B6">
                <animate attributeName="stop-color" values="#F472B6;#EC4899;#F472B6" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            
            {/* Filter for glow effect */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Connection lines */}
          {visibleRelationships.map(rel => {
            const pos1 = nodePositions.find(p => p.id === rel.catId1);
            const pos2 = nodePositions.find(p => p.id === rel.catId2);
            if (!pos1 || !pos2) return null;
            
            const level = getRelationshipLevel(rel.score);
            const color = RELATIONSHIP_COLORS[level];
            const strokeWidth = Math.max(1, Math.min(4, Math.abs(rel.score) / 25));
            
            const isHighlighted = hoveredCatId && 
              (rel.catId1 === hoveredCatId || rel.catId2 === hoveredCatId);
            const isHoveredLine = hoveredRelationship?.catId1 === rel.catId1 && 
              hoveredRelationship?.catId2 === rel.catId2;
            const isFaded = hoveredCatId && !isHighlighted;
            
            const lineStyle = level === 'neutral' ? '4,4' : undefined;
            
            return (
              <g key={`${rel.catId1}-${rel.catId2}`}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={level === 'bestFriend' ? 'url(#bestFriendGradient)' : color}
                  strokeWidth={isHighlighted || isHoveredLine ? strokeWidth + 1 : strokeWidth}
                  strokeDasharray={lineStyle}
                  strokeLinecap="round"
                  opacity={isFaded ? 0.15 : isHighlighted ? 1 : 0.7}
                  filter={isHighlighted ? 'url(#glow)' : undefined}
                  className={`transition-all duration-200 cursor-pointer ${
                    level === 'bestFriend' ? 'animate-[line-pulse_2s_ease-in-out_infinite]' :
                    level === 'enemy' ? 'animate-[line-tension_0.5s_ease-in-out_infinite]' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelationship(rel)}
                  onMouseLeave={() => setHoveredRelationship(null)}
                />
                
                {/* Decorations for special relationships */}
                {level === 'bestFriend' && !isFaded && (
                  <text
                    x={(pos1.x + pos2.x) / 2}
                    y={(pos1.y + pos2.y) / 2}
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    💕
                  </text>
                )}
                {level === 'enemy' && !isFaded && (
                  <text
                    x={(pos1.x + pos2.x) / 2}
                    y={(pos1.y + pos2.y) / 2}
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    ⚡
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Cat nodes */}
        {nodePositions.map(pos => {
          const cat = cats.find(c => c.id === pos.id);
          if (!cat) return null;
          
          const isHovered = hoveredCatId === pos.id;
          const isConnected = connectedCatIds.has(pos.id);
          const isFaded = hoveredCatId && !isHovered && !isConnected;
          
          // Calculate node glow based on relationships
          const catRels = relationships.filter(r => r.catId1 === pos.id || r.catId2 === pos.id);
          const avgScore = catRels.length > 0 
            ? catRels.reduce((sum, r) => sum + r.score, 0) / catRels.length 
            : 0;
          
          return (
            <div
              key={pos.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer
                ${isHovered ? 'scale-125 z-20' : 'z-10'}
                ${isFaded ? 'opacity-30' : 'opacity-100'}
              `}
              style={{ 
                left: `${(pos.x / 280) * 100}%`, 
                top: `${(pos.y / 240) * 100}%`,
              }}
              onMouseEnter={() => setHoveredCatId(pos.id)}
              onMouseLeave={() => setHoveredCatId(null)}
              onClick={() => onCatClick?.(pos.id)}
            >
              <div 
                className={`rounded-full p-0.5 ${
                  avgScore > 30 ? 'ring-2 ring-green-400 ring-opacity-50' :
                  avgScore < -30 ? 'ring-2 ring-red-400 ring-opacity-50' : ''
                } ${isHovered ? 'animate-[node-highlight_1s_ease-in-out_infinite]' : ''}`}
                style={{
                  '--highlight-color': avgScore > 0 ? '#22C55E40' : '#EF444440'
                } as React.CSSProperties}
              >
                <CatAvatar cat={cat} size="xs" showCostume={false} />
              </div>
              <p className={`text-[10px] text-center mt-0.5 font-medium truncate max-w-12 ${
                isFaded ? 'text-muted-foreground/50' : 'text-foreground'
              }`}>
                {cat.name}
              </p>
            </div>
          );
        })}

        {/* Tooltip for hovered relationship */}
        {hoveredRelationship && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow-lg z-30 text-xs animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{getCatName(hoveredRelationship.catId1)}</span>
              <span>{getRelationshipEmoji(hoveredRelationship.level)}</span>
              <span className="font-medium">{getCatName(hoveredRelationship.catId2)}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-muted-foreground">
              <span>{RELATIONSHIP_LABELS[hoveredRelationship.level]}</span>
              <Badge variant="outline" className="text-[10px] h-4">
                {hoveredRelationship.score > 0 ? '+' : ''}{hoveredRelationship.score}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center text-[10px]">
        {Object.entries(RELATIONSHIP_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1">
            <div 
              className="w-4 h-0.5 rounded-full" 
              style={{ 
                backgroundColor: color,
                opacity: level === 'neutral' ? 0.5 : 1 
              }}
            />
            <span className="text-muted-foreground capitalize">
              {level === 'bestFriend' ? 'Best' : level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
