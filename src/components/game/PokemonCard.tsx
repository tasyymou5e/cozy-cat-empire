import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { getGradeTier, getGradeStars, GradeTier } from '@/types/grading';
import { getBreedType } from '@/config/breedTypes';
import { generateMoves, getEvolutionStage, getRetreatCost, getCardNumber } from '@/lib/cardMoves';
import { CatVisual } from './CatVisual';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';
import { QRCodeSVG } from 'qrcode.react';

interface PokemonCardProps {
  cat: Cat;
  equippedCostumeId?: string;
  className?: string;
  showFlip?: boolean;
  onClick?: () => void;
  isOwned?: boolean;
  profileBaseUrl?: string;
}

const TIER_FRAME: Record<GradeTier, { frameClass: string; holoLevel: number; label: string; stars: string }> = {
  common: { frameClass: 'pokemon-frame-common', holoLevel: 0, label: 'Common', stars: '★' },
  uncommon: { frameClass: 'pokemon-frame-uncommon', holoLevel: 1, label: 'Uncommon', stars: '★★' },
  rare: { frameClass: 'pokemon-frame-rare', holoLevel: 2, label: 'Rare', stars: '★★★' },
  veryRare: { frameClass: 'pokemon-frame-legendary', holoLevel: 3, label: 'Legendary', stars: '★★★★' },
  ultraRare: { frameClass: 'pokemon-frame-mythic', holoLevel: 4, label: 'Mythic', stars: '★H' },
};

export function PokemonCard({ cat, equippedCostumeId, className, showFlip = true, onClick, isOwned = true, profileBaseUrl }: PokemonCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  const tier = getGradeTier(cat.grade);
  const breedType = getBreedType(cat.breed);
  const breedInfo = BREEDS[cat.breed];
  const [move1, move2] = useMemo(() => generateMoves(cat), [cat]);
  const tierFrame = TIER_FRAME[tier];
  const retreatCost = getRetreatCost(cat);
  const cardNum = getCardNumber(cat);
  const qrUrl = profileBaseUrl ? `${profileBaseUrl}/collection` : `https://cozy-cat-empire.lovable.app/collection`;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isFlipped || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -15;
    const tiltY = (x - 0.5) * 15;
    setTilt({ x: tiltX, y: tiltY });
    setShinePos({ x: x * 100, y: y * 100 });
  }, [isFlipped]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isFlipped || !cardRef.current) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * -10, y: (x - 0.5) * 10 });
    setShinePos({ x: x * 100, y: y * 100 });
  }, [isFlipped]);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('cardFlip');
    setIsFlipped(!isFlipped);
    setTilt({ x: 0, y: 0 });
  };

  const holoOpacity = isHovering ? Math.min(tierFrame.holoLevel * 0.2, 0.8) : 0;

  return (
    <div
      className={cn('pokemon-card-scene', className)}
      style={{ perspective: '1500px' }}
      onClick={onClick}
    >
      <div
        ref={cardRef}
        className={cn(
          'pokemon-card-wrapper relative',
          isFlipped && 'pokemon-card-flipped'
        )}
        style={{
          width: 320,
          height: 448,
          transformStyle: 'preserve-3d',
          transition: isFlipped
            ? 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'transform 0.1s ease-out',
          transform: isFlipped
            ? 'rotateY(180deg)'
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
      >
        {/* FRONT FACE */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl overflow-hidden',
            tierFrame.frameClass
          )}
          style={{ backfaceVisibility: 'hidden', pointerEvents: isFlipped ? 'none' : 'auto' }}
        >
          {/* Gold/Silver Frame */}
          <div className="pokemon-card-frame absolute inset-0 rounded-2xl p-3">
            <div className="pokemon-card-inner relative w-full h-full rounded-xl overflow-hidden flex flex-col"
              style={{ background: 'linear-gradient(180deg, hsl(35 30% 93%) 0%, hsl(30 25% 88%) 100%)' }}
            >
              {/* Texture overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Header: Evolution + HP */}
              <div className="flex justify-between items-center px-3 pt-2 pb-1 relative z-10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {getEvolutionStage(cat)}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-destructive" style={{ fontFamily: 'monospace' }}>
                    {cat.health}
                  </span>
                  <span className="text-sm font-bold text-destructive">HP</span>
                </div>
              </div>

              {/* Name + Type */}
              <div className="flex justify-between items-center px-3 pb-1 relative z-10">
                <h3 className="text-lg font-extrabold text-foreground uppercase tracking-tight truncate">
                  {cat.name}
                </h3>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-sm"
                  style={{ background: breedType.gradient }}
                  title={breedType.name}
                >
                  {breedType.icon}
                </div>
              </div>

              {/* Image area */}
              <div className="mx-3 h-[140px] rounded-lg overflow-hidden relative"
                style={{
                  background: breedType.imageGradient,
                  border: `3px solid ${tier === 'veryRare' || tier === 'ultraRare' ? 'hsl(40 85% 55%)' : 'hsl(0 0% 75%)'}`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <CatVisual cat={cat} equippedCostumeId={equippedCostumeId} size="lg" animated />
                </div>
                {/* Cosmos stars for Legendary+ */}
                {tierFrame.holoLevel >= 3 && (
                  <div className="pokemon-cosmos-stars absolute inset-0 pointer-events-none" />
                )}
              </div>

              {/* Description bar */}
              <div className="mx-3 mt-1.5 px-2 py-1 rounded text-center text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  background: tier === 'veryRare' || tier === 'ultraRare'
                    ? 'linear-gradient(90deg, hsl(40 75% 55%), hsl(45 80% 65%), hsl(40 75% 55%))'
                    : 'linear-gradient(90deg, hsl(0 0% 72%), hsl(0 0% 82%), hsl(0 0% 72%))',
                  color: 'hsl(0 0% 25%)',
                }}
              >
                {breedInfo.name} Cat. Grade {cat.grade} · Age {cat.age}d
              </div>

              {/* Moves */}
              <div className="flex-1 px-3 py-1.5 flex flex-col gap-1.5 relative z-10">
                {/* Move 1 */}
                <div className="rounded border-2 px-2 py-1.5"
                  style={{ borderColor: 'hsl(40 60% 70%)', background: 'hsl(40 20% 95% / 0.9)' }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: move1.energyCost }).map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full shadow-sm"
                          style={{ background: breedType.gradient, border: '1px solid hsl(0 0% 70%)' }}
                        />
                      ))}
                      <span className="text-[11px] font-extrabold uppercase ml-1">{move1.name}</span>
                    </div>
                    <span className="text-base font-extrabold" style={{ fontFamily: 'monospace' }}>
                      {move1.damage}
                    </span>
                  </div>
                  <p className="text-[8px] text-muted-foreground italic leading-tight">{move1.description}</p>
                </div>

                {/* Move 2 */}
                <div className="rounded border-2 px-2 py-1.5"
                  style={{ borderColor: 'hsl(40 60% 70%)', background: 'hsl(40 20% 95% / 0.9)' }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: move2.energyCost }).map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full shadow-sm"
                          style={{ background: breedType.gradient, border: '1px solid hsl(0 0% 70%)' }}
                        />
                      ))}
                      <span className="text-[11px] font-extrabold uppercase ml-1">{move2.name}</span>
                    </div>
                    <span className="text-base font-extrabold" style={{ fontFamily: 'monospace' }}>
                      {move2.damage}
                    </span>
                  </div>
                  <p className="text-[8px] text-muted-foreground italic leading-tight">{move2.description}</p>
                </div>
              </div>

              {/* Weakness / Resistance / Retreat */}
              <div className="flex justify-between items-center px-3 py-1 border-t-2 mx-3 text-[9px]"
                style={{ borderColor: 'hsl(40 60% 70%)' }}
              >
                <div className="text-center">
                  <div className="font-bold uppercase text-[7px] text-muted-foreground">weakness</div>
                  <div>{breedType.weaknessIcon}+30</div>
                </div>
                <div className="text-center">
                  <div className="font-bold uppercase text-[7px] text-muted-foreground">resistance</div>
                  <div>{breedType.resistanceIcon}-20</div>
                </div>
                <div className="text-center">
                  <div className="font-bold uppercase text-[7px] text-muted-foreground">retreat</div>
                  <div>{'⭐'.repeat(retreatCost)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center px-3 py-1.5 text-[8px] text-muted-foreground">
                <span className="tracking-widest" style={{ color: 'hsl(40 80% 50%)' }}>
                  {tierFrame.stars}
                </span>
                <span>Lv.{cat.age} · {cardNum}</span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, hsl(40 75% 55%), hsl(35 60% 45%))' }}
                >
                  C
                </div>
              </div>
            </div>
          </div>

          {/* Holo overlay */}
          {tierFrame.holoLevel >= 2 && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay transition-opacity duration-300"
              style={{
                opacity: holoOpacity,
                background: tierFrame.holoLevel >= 4
                  ? `linear-gradient(${shinePos.x * 3.6}deg, rgba(255,0,110,0.3), rgba(131,56,236,0.3), rgba(58,134,255,0.3), rgba(6,255,165,0.3), rgba(255,190,11,0.3))`
                  : tierFrame.holoLevel >= 3
                    ? `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,215,0,0.4), rgba(255,100,100,0.2), rgba(100,200,255,0.2), transparent 70%)`
                    : `linear-gradient(125deg, transparent 0%, rgba(255,255,255,0.3) ${shinePos.x}%, transparent 100%)`,
              }}
            />
          )}

          {/* Shine sweep */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovering && tierFrame.holoLevel >= 1 ? 0.6 : 0,
              background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            }}
          />

          {/* Flip button */}
          {showFlip && (
            <button
              onClick={handleFlip}
              className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors backdrop-blur-sm"
            >
              🔄
            </button>
          )}

          {/* Unowned overlay */}
          {!isOwned && (
            <div className="absolute inset-0 rounded-2xl z-20 flex items-center justify-center"
              style={{ background: 'linear-gradient(180deg, hsl(0 0% 10% / 0.85), hsl(0 0% 5% / 0.92))' }}
            >
              <div className="text-center space-y-2">
                <div className="text-5xl opacity-30">❓</div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Not Collected</p>
                <p className="text-[10px] text-white/25">{breedInfo.name} Cat</p>
              </div>
            </div>
          )}
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Teal outer frame */}
          <div className="absolute inset-0 rounded-2xl p-1"
            style={{ background: 'linear-gradient(135deg, hsl(168 70% 42%), hsl(172 65% 50%), hsl(168 70% 42%))' }}
          >
            {/* Coral inner frame */}
            <div className="w-full h-full rounded-xl p-1"
              style={{ background: 'linear-gradient(135deg, hsl(12 80% 70%), hsl(15 85% 75%), hsl(12 80% 70%))' }}
            >
              {/* Card content */}
              <div className="relative w-full h-full rounded-lg overflow-hidden flex flex-col items-center justify-between p-5"
                style={{ background: 'linear-gradient(180deg, hsl(38 40% 95%) 0%, hsl(35 35% 90%) 50%, hsl(38 40% 95%) 100%)' }}
              >
                {/* Paw print watermark pattern */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ctext x='15' y='35' font-size='20'%3E🐾%3C/text%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px',
                  }}
                />

                {/* Floating hearts */}
                <div className="absolute top-4 left-4 text-sm pokemon-floating-heart" style={{ animationDelay: '0s' }}>💕</div>
                <div className="absolute top-12 right-5 text-xs pokemon-floating-heart" style={{ animationDelay: '1.5s' }}>💕</div>
                <div className="absolute bottom-20 left-6 text-xs pokemon-floating-heart" style={{ animationDelay: '0.8s' }}>💕</div>

                {/* Corner accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-md" style={{ borderColor: 'hsl(168 60% 50%)' }} />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-md" style={{ borderColor: 'hsl(168 60% 50%)' }} />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-md" style={{ borderColor: 'hsl(168 60% 50%)' }} />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-md" style={{ borderColor: 'hsl(168 60% 50%)' }} />

                {/* Logo area */}
                <div className="w-full rounded-xl border-2 p-4 flex flex-col items-center justify-center relative z-10"
                  style={{ borderColor: 'hsl(168 50% 60%)', background: 'hsl(168 30% 96% / 0.9)' }}
                >
                  <div className="flex items-center justify-between w-full text-base mb-1">
                    <span className="pokemon-twinkle-star">✨</span>
                    <span className="pokemon-twinkle-star" style={{ animationDelay: '0.5s' }}>⭐</span>
                  </div>
                  {/* Circular logo badge */}
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center my-1"
                    style={{ background: 'linear-gradient(135deg, hsl(168 70% 42%), hsl(172 65% 50%))', boxShadow: '0 4px 12px hsl(168 60% 40% / 0.3)' }}
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="absolute -bottom-1 -right-1 text-lg bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm">🐱</span>
                  </div>
                  <div className="flex items-center justify-between w-full text-base mt-1">
                    <span className="pokemon-twinkle-star" style={{ animationDelay: '1s' }}>✨</span>
                    <span className="pokemon-twinkle-star" style={{ animationDelay: '1.5s' }}>⭐</span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mt-3 relative z-10">
                  <h3 className="text-lg font-extrabold uppercase tracking-widest leading-tight"
                    style={{ color: 'hsl(25 50% 30%)' }}
                  >Happy Cat</h3>
                  <h3 className="text-lg font-extrabold uppercase tracking-widest leading-tight"
                    style={{ color: 'hsl(25 50% 30%)' }}
                  >Homestead</h3>
                </div>


                {/* Tagline */}
                <p className="text-[10px] text-center italic mt-1 relative z-10"
                  style={{ color: 'hsl(25 30% 45%)' }}
                >
                  Where every cat finds their perfect sunny spot 🌻
                </p>

                {/* QR Code */}
                <div className="bg-white p-1.5 rounded-lg shadow-sm mt-2 relative z-10">
                  <QRCodeSVG value={qrUrl} size={48} level="L" />
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center w-full mt-2 text-[8px] relative z-10"
                  style={{ color: 'hsl(25 20% 55%)' }}
                >
                  <span>© 2026 Cozy Cat Empire</span>
                  <span>CCE-{cardNum}</span>
                </div>

                {/* Flip button on back */}
                {showFlip && (
                  <button
                    onClick={handleFlip}
                    className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors backdrop-blur-sm"
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
