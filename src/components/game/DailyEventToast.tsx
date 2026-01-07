import { useEffect, useState } from 'react';
import { DailyEvent } from '@/types/dailyEvents';
import { Badge } from '@/components/ui/badge';

interface DailyEventToastProps {
  event: DailyEvent | null;
  onDismiss: () => void;
}

export function DailyEventToast({ event, onDismiss }: DailyEventToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [event, onDismiss]);

  if (!event) return null;

  const effectColors = {
    positive: 'border-green-400 bg-green-50 dark:bg-green-900/30',
    negative: 'border-red-400 bg-red-50 dark:bg-red-900/30',
    neutral: 'border-blue-400 bg-blue-50 dark:bg-blue-900/30',
  };

  const effectBadge = {
    positive: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    negative: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    neutral: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };

  return (
    <div
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50 
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div
        className={`
        flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg max-w-md
        ${effectColors[event.effect]}
      `}
      >
        <span className="text-3xl animate-bounce">{event.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold">{event.name}</h4>
            <Badge className={effectBadge[event.effect]}>
              {event.effect === 'positive'
                ? '✨ Good'
                : event.effect === 'negative'
                  ? '⚠️ Bad'
                  : 'ℹ️ Event'}
            </Badge>
          </div>
          <p className="text-sm text-foreground/80">{event.description}</p>

          {/* Effect details */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {event.moneyChange && event.moneyChange !== 0 && (
              <span className={event.moneyChange > 0 ? 'text-green-600' : 'text-red-600'}>
                💰 {event.moneyChange > 0 ? '+' : ''}
                {event.moneyChange}
              </span>
            )}
            {event.resourceChange &&
              Object.entries(event.resourceChange).map(
                ([key, val]) =>
                  val !== 0 && (
                    <span key={key} className={val > 0 ? 'text-green-600' : 'text-red-600'}>
                      {key === 'food' && '🍖'}
                      {key === 'medicine' && '💊'}
                      {key === 'toys' && '🎾'}
                      {key === 'treats' && '🍬'} {val > 0 ? '+' : ''}
                      {val}
                    </span>
                  )
              )}
            {event.catEffect?.healthChange && (
              <span
                className={event.catEffect.healthChange > 0 ? 'text-green-600' : 'text-red-600'}
              >
                ❤️ {event.catEffect.healthChange > 0 ? '+' : ''}
                {event.catEffect.healthChange}
              </span>
            )}
            {event.catEffect?.happinessChange && (
              <span
                className={event.catEffect.happinessChange > 0 ? 'text-green-600' : 'text-red-600'}
              >
                😊 {event.catEffect.happinessChange > 0 ? '+' : ''}
                {event.catEffect.happinessChange}
              </span>
            )}
            {event.reputationChange && (
              <span className="text-purple-600">⭐ +{event.reputationChange} rep</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
