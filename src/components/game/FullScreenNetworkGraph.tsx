import { useState, useMemo, useRef, useCallback } from 'react';
import { Cat } from '@/types/game';
import { 
  CatRelationship, 
  RelationshipLevel,
  getRelationshipLevel,
  getRelationshipEmoji 
} from '@/types/relationships';
import { CatVisual } from './CatVisual';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface FullScreenNetworkGraphProps {
  cats: Cat[];
  relationships: CatRelationship[];
  catCostumes?: Record<string, string>;
  onCatClick?: (catId: string) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const RELATIONSHIP_COLORS: Record<RelationshipLevel, string> = {
  bestFriend: '#EC4899',
  friend: '#22C55E',
  neutral: '#9CA3AF',
  rival: '#F97316',
  enemy: '#EF4444',
};

const RELATIONSHIP_LABELS: Record<RelationshipLevel, string> = {
  bestFriend: 'Best Friends',
  friend: 'Friends',
  neutral: 'Neutral',
  rival: 'Rivals',
  enemy: 'Enemies',
};

export function FullScreenNetworkGraph({ 
  cats, 
  relationships,
  catCostumes,
  onCatClick 
}: FullScreenNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [hoveredRelationship, setHoveredRelationship] = useState<CatRelationship | null>(null);
  const [showNeutral, setShowNeutral] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const width = 800;
  const height = 600;
  
  // Calculate node positions using force-directed layout
  const nodePositions = useMemo(() => {
    if (cats.length === 0) return [];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const padding = 80;
    
    const positions: NodePosition[] = cats.map((cat, i) => {
      const angle = (2 * Math.PI * i) / cats.length;
      const radius = Math.min(width, height) / 2 - padding;
      return {
        id: cat.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    
    const iterations = 80;
    const repulsion = 2000;
    const attraction = 0.03;
    
    for (let iter = 0; iter < iterations; iter++) {
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
      
      for (const rel of relationships) {
        const node1 = positions.find(p => p.id === rel.catId1);
        const node2 = positions.find(p => p.id === rel.catId2);
        if (!node1 || !node2) continue;
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        
        const factor = rel.score * attraction * 0.01;
        const fx = dx * factor;
        const fy = dy * factor;
        
        node1.x += fx;
        node1.y += fy;
        node2.x -= fx;
        node2.y -= fy;
      }
      
      for (const pos of positions) {
        pos.x = Math.max(padding, Math.min(width - padding, pos.x));
        pos.y = Math.max(padding, Math.min(height - padding, pos.y));
      }
      
      for (const pos of positions) {
        pos.x += (centerX - pos.x) * 0.01;
        pos.y += (centerY - pos.y) * 0.01;
      }
    }
    
    return positions;
  }, [cats, relationships]);
  
  const visibleRelationships = useMemo(() => {
    return relationships.filter(rel => {
      if (!showNeutral && rel.level === 'neutral') return false;
      return true;
    });
  }, [relationships, showNeutral]);
  
  const getConnectedCatIds = (catId: string): Set<string> => {
    const connected = new Set<string>();
    relationships.forEach(rel => {
      if (rel.catId1 === catId) connected.add(rel.catId2);
      if (rel.catId2 === catId) connected.add(rel.catId1);
    });
    return connected;
  };
  
  const getCatName = (catId: string) => cats.find(c => c.id === catId)?.name || 'Unknown';
  
  const stats = useMemo(() => {
    const bestFriends = relationships.filter(r => r.level === 'bestFriend').length;
    const friends = relationships.filter(r => r.level === 'friend').length;
    const rivals = relationships.filter(r => r.level === 'rival').length;
    const enemies = relationships.filter(r => r.level === 'enemy').length;
    return { bestFriends, friends, rivals, enemies };
  }, [relationships]);

  const handleCatClick = useCallback((catId: string) => {
    if (selectedCatId === catId) {
      setSelectedCatId(null);
    } else {
      setSelectedCatId(catId);
    }
    onCatClick?.(catId);
  }, [selectedCatId, onCatClick]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedCatId(null);
  };

  if (cats.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No cats to display
      </div>
    );
  }

  const activeCatId = selectedCatId || hoveredCatId;
  const connectedCatIds = activeCatId ? getConnectedCatIds(activeCatId) : new Set<string>();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="show-neutral-full" 
              checked={showNeutral} 
              onCheckedChange={setShowNeutral}
            />
            <Label htmlFor="show-neutral-full" className="text-sm">Show neutral</Label>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetView}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400">
            💕 {stats.bestFriends}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400">
            💚 {stats.friends}
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400">
            😾 {stats.rivals}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400">
            💔 {stats.enemies}
          </Badge>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        ref={containerRef}
        className="relative bg-secondary/20 rounded-xl border border-border overflow-hidden"
        style={{ height: 600 }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
            width: '100%',
            height: '100%',
          }}
        >
          {/* SVG for connection lines */}
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="bestFriendGradientFull" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EC4899">
                  <animate attributeName="stop-color" values="#EC4899;#F472B6;#EC4899" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#F472B6">
                  <animate attributeName="stop-color" values="#F472B6;#EC4899;#F472B6" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              
              <filter id="glowFull" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {visibleRelationships.map(rel => {
              const pos1 = nodePositions.find(p => p.id === rel.catId1);
              const pos2 = nodePositions.find(p => p.id === rel.catId2);
              if (!pos1 || !pos2) return null;
              
              const level = getRelationshipLevel(rel.score);
              const color = RELATIONSHIP_COLORS[level];
              const strokeWidth = Math.max(2, Math.min(6, Math.abs(rel.score) / 20));
              
              const isHighlighted = activeCatId && 
                (rel.catId1 === activeCatId || rel.catId2 === activeCatId);
              const isHoveredLine = hoveredRelationship?.catId1 === rel.catId1 && 
                hoveredRelationship?.catId2 === rel.catId2;
              const isFaded = activeCatId && !isHighlighted;
              
              const lineStyle = level === 'neutral' ? '6,6' : undefined;
              
              return (
                <g key={`${rel.catId1}-${rel.catId2}`}>
                  <line
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={level === 'bestFriend' ? 'url(#bestFriendGradientFull)' : color}
                    strokeWidth={isHighlighted || isHoveredLine ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={lineStyle}
                    strokeLinecap="round"
                    opacity={isFaded ? 0.1 : isHighlighted ? 1 : 0.6}
                    filter={isHighlighted ? 'url(#glowFull)' : undefined}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredRelationship(rel)}
                    onMouseLeave={() => setHoveredRelationship(null)}
                  />
                  
                  {level === 'bestFriend' && !isFaded && (
                    <text
                      x={(pos1.x + pos2.x) / 2}
                      y={(pos1.y + pos2.y) / 2}
                      fontSize="14"
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
                      fontSize="14"
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
            const isSelected = selectedCatId === pos.id;
            const isConnected = connectedCatIds.has(pos.id);
            const isFaded = activeCatId && !isHovered && !isSelected && !isConnected;
            
            const catRels = relationships.filter(r => r.catId1 === pos.id || r.catId2 === pos.id);
            const avgScore = catRels.length > 0 
              ? catRels.reduce((sum, r) => sum + r.score, 0) / catRels.length 
              : 0;
            
            return (
              <div
                key={pos.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer
                  ${isHovered || isSelected ? 'scale-125 z-20' : 'z-10'}
                  ${isFaded ? 'opacity-20' : 'opacity-100'}
                `}
                style={{ 
                  left: `${(pos.x / width) * 100}%`, 
                  top: `${(pos.y / height) * 100}%`,
                }}
                onMouseEnter={() => setHoveredCatId(pos.id)}
                onMouseLeave={() => setHoveredCatId(null)}
                onClick={() => handleCatClick(pos.id)}
              >
                <div 
                  className={`rounded-full p-1 ${
                    isSelected ? 'ring-4 ring-primary ring-opacity-80' :
                    avgScore > 30 ? 'ring-2 ring-green-400 ring-opacity-50' :
                    avgScore < -30 ? 'ring-2 ring-red-400 ring-opacity-50' : ''
                  }`}
                >
                  <CatVisual cat={cat} size="sm" equippedCostumeId={catCostumes?.[cat.id]} />
                </div>
                <p className={`text-xs text-center mt-1 font-medium truncate max-w-16 ${
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
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-3 shadow-lg z-30 text-sm animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{getCatName(hoveredRelationship.catId1)}</span>
                <span className="text-lg">{getRelationshipEmoji(hoveredRelationship.level)}</span>
                <span className="font-medium">{getCatName(hoveredRelationship.catId2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-muted-foreground">
                <span>{RELATIONSHIP_LABELS[hoveredRelationship.level]}</span>
                <Badge variant="outline" className="text-xs">
                  {hoveredRelationship.score > 0 ? '+' : ''}{hoveredRelationship.score}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {Object.entries(RELATIONSHIP_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-2">
            <div 
              className="w-6 h-1 rounded-full" 
              style={{ 
                backgroundColor: color,
                opacity: level === 'neutral' ? 0.5 : 1 
              }}
            />
            <span className="text-muted-foreground">
              {RELATIONSHIP_LABELS[level as RelationshipLevel]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
