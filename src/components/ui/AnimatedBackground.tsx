import { cn } from '@/lib/utils';

/**
 * Props for the AnimatedBackground component
 */
interface AnimatedBackgroundProps {
  /** Content to render within the background */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Background style variant */
  variant?: 'default' | 'auth' | 'cozy' | 'minimal' | 'game';
}

/**
 * AnimatedBackground - Animated gradient background with floating orbs
 *
 * Provides a visually appealing animated background with different variants
 * for different page contexts. Includes floating decorative blur effects.
 *
 * @example
 * ```tsx
 * <AnimatedBackground variant="auth" className="min-h-screen">
 *   <LoginForm />
 * </AnimatedBackground>
 * ```
 */

export function AnimatedBackground({
  children,
  className,
  variant = 'default',
}: AnimatedBackgroundProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden',
        variant === 'auth' && 'auth-cozy-bg',
        variant === 'cozy' &&
          'bg-gradient-to-br from-[hsl(var(--primary)/0.1)] via-background to-[hsl(var(--accent)/0.15)]',
        variant === 'game' && 'bg-background',
        variant === 'default' && 'bg-background',
        className
      )}
    >
      {/* Bokeh bubbles for auth variant */}
      {variant === 'auth' && (
        <>
          <div className="bokeh-bubble w-32 h-32 top-[8%] left-[5%]" style={{ animationDelay: '0s' }} />
          <div className="bokeh-bubble w-48 h-48 top-[15%] right-[8%]" style={{ animationDelay: '1s' }} />
          <div className="bokeh-bubble w-24 h-24 bottom-[25%] left-[12%]" style={{ animationDelay: '2s' }} />
          <div className="bokeh-bubble w-40 h-40 bottom-[18%] right-[15%]" style={{ animationDelay: '0.5s' }} />
          <div className="bokeh-bubble w-20 h-20 top-[40%] left-[25%]" style={{ animationDelay: '1.5s' }} />
          <div className="bokeh-bubble w-36 h-36 top-[55%] right-[5%]" style={{ animationDelay: '2.5s' }} />
          <div className="bokeh-bubble w-28 h-28 bottom-[40%] left-[3%]" style={{ animationDelay: '3s' }} />
          <div className="bokeh-bubble w-16 h-16 top-[75%] right-[25%]" style={{ animationDelay: '0.8s' }} />
        </>
      )}

      {/* Warm cozy orbs for cozy variant */}
      {variant === 'cozy' && (
        <>
          <div className="absolute top-10 left-[10%] w-80 h-80 bg-[hsl(var(--primary)/0.15)] rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-[5%] w-96 h-96 bg-[hsl(var(--accent)/0.2)] rounded-full blur-3xl animate-float animate-delay-200" />
          <div className="absolute top-1/3 right-[15%] w-64 h-64 bg-[hsl(var(--primary)/0.1)] rounded-full blur-2xl animate-float animate-delay-400" />
          <div className="absolute bottom-1/3 left-[20%] w-48 h-48 bg-[hsl(var(--accent)/0.12)] rounded-full blur-2xl animate-float animate-delay-300" />
        </>
      )}

      {/* Subtle orbs for game variant */}
      {variant === 'game' && (
        <>
          <div className="absolute top-10 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-float opacity-50" />
          <div className="absolute bottom-40 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float animate-delay-300 opacity-40" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
