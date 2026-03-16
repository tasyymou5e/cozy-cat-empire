import { AuthMode } from './types';

interface AuthHeroProps {
  mode: AuthMode;
}

export function AuthHero({ mode }: AuthHeroProps) {
  return (
    <div className="text-center space-y-4">
      {/* Glowing background pulse */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <div className="flex justify-center items-end gap-1 relative">
        <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>😺</span>
        <span className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>🐱</span>
        <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>😸</span>
      </div>

      {/* Big gradient headline — Playfair Display via page-heading */}
      <h1 className="page-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-[length:200%_auto] animate-[gradient-shift_3s_ease-in-out_infinite] bg-clip-text text-transparent drop-shadow-sm">
        Cozy Cat Empire
      </h1>

      {/* Rotating taglines */}
      <div className="h-6 overflow-hidden relative">
        <div className="animate-[tagline-rotate_9s_ease-in-out_infinite] flex flex-col">
          <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">🏰 Build Your Purr-fect Empire!</span>
          <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">🏆 Compete on Global Leaderboards!</span>
          <span className="h-6 flex items-center justify-center text-sm font-semibold text-foreground/80">✨ Collect Rare Breeds & Costumes!</span>
        </div>
      </div>

      {/* Feature badges strip — glass-like */}
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {[
          { emoji: '🐾', label: '50+ Breeds' },
          { emoji: '🏆', label: 'Leaderboards' },
          { emoji: '🎁', label: 'Trade & Gift' },
          { emoji: '❄️', label: 'Seasonal Events' },
        ].map((badge, i) => (
          <span
            key={badge.label}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card/50 backdrop-blur-sm text-primary border border-primary/20 shadow-sm animate-fade-in"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
          >
            {badge.emoji} {badge.label}
          </span>
        ))}
      </div>
    </div>
  );
}
