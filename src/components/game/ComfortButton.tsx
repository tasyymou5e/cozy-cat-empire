import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';

/**
 * Props for the ComfortButton component
 */
interface ComfortButtonProps {
  /** ID of the cat to comfort */
  catId: string;
  /** Name of the cat (for display) */
  catName: string;
  /** Callback when comforting is complete */
  onComfort: (catId: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/** Duration in seconds for the comfort action */
const COMFORT_DURATION = 20;

/**
 * ComfortButton - Hold-to-comfort interaction for upset cats
 * 
 * Provides a 20-second hold interaction to comfort cats that are unhappy
 * or stressed. Shows progress bar during comforting with cancel option.
 * 
 * @example
 * ```tsx
 * <ComfortButton
 *   catId="cat123"
 *   catName="Whiskers"
 *   onComfort={handleComfort}
 * />
 * ```
 */

export function ComfortButton({ catId, catName, onComfort, disabled }: ComfortButtonProps) {
  const [isComforting, setIsComforting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(COMFORT_DURATION);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isComforting && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 0.1;
          setProgress(((COMFORT_DURATION - newTime) / COMFORT_DURATION) * 100);
          return newTime;
        });
      }, 100);
    } else if (timeRemaining <= 0 && isComforting) {
      // Comforting complete
      onComfort(catId);
      setIsComforting(false);
      setTimeRemaining(COMFORT_DURATION);
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isComforting, timeRemaining, catId, onComfort]);

  const handleClick = useCallback(() => {
    if (!isComforting && !disabled) {
      setIsComforting(true);
      setTimeRemaining(COMFORT_DURATION);
      setProgress(0);
    }
  }, [isComforting, disabled]);

  const handleCancel = useCallback(() => {
    setIsComforting(false);
    setTimeRemaining(COMFORT_DURATION);
    setProgress(0);
  }, []);

  if (isComforting) {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-3 w-3 text-pink-500 animate-pulse" />
          <span>Comforting {catName}...</span>
          <span className="ml-auto font-mono">{Math.ceil(timeRemaining)}s</span>
        </div>
        <Progress value={progress} className="h-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCancel}
          className="w-full text-xs text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="w-full text-xs gap-1"
    >
      <Heart className="h-3 w-3 text-pink-500" />
      Hug & Pet (20s)
    </Button>
  );
}
