import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Duration in ms */
  duration?: number;
}

/**
 * AnimatedCounter - Displays a number with a flash animation when it changes.
 * Lightweight alternative to full roll-up; uses CSS class toggle.
 */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  className,
  duration = 400,
}: AnimatedCounterProps) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), duration);
      return () => clearTimeout(timer);
    }
  }, [value, duration]);

  return (
    <span className={cn(flash && 'animate-count-flash', className)}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
