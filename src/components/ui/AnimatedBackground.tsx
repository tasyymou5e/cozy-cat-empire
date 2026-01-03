import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'auth' | 'cozy' | 'minimal' | 'game';
}

export function AnimatedBackground({ 
  children, 
  className,
  variant = 'default' 
}: AnimatedBackgroundProps) {
  return (
    <div className={cn(
      "relative min-h-screen overflow-hidden",
      variant === 'auth' && "animated-gradient-bg",
      variant === 'cozy' && "bg-gradient-to-br from-[hsl(var(--primary)/0.1)] via-background to-[hsl(var(--accent)/0.15)]",
      variant === 'game' && "bg-background",
      variant === 'default' && "bg-background",
      className
    )}>
      {/* Floating Decorative Orbs - Only for auth variant */}
      {variant === 'auth' && (
        <>
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float animate-delay-200" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-float animate-delay-400" />
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
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}