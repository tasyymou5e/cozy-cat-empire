import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'auth' | 'minimal';
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
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
