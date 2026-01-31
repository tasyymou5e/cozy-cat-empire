/**
 * @fileoverview WeeklyEventBanner - Display today's active weekly event
 *
 * Shows a banner with the current day's bonus event.
 * Designed to be displayed in the game header.
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWeeklyEvents } from '@/hooks/useWeeklyEvents';
import { Calendar } from 'lucide-react';

interface WeeklyEventBannerProps {
  /** Whether to show compact version (icon only) */
  compact?: boolean;
  /** Optional click handler for showing full calendar */
  onShowCalendar?: () => void;
}

export function WeeklyEventBanner({ compact = false, onShowCalendar }: WeeklyEventBannerProps) {
  const { todayEvent, allEvents, currentDay } = useWeeklyEvents();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`cursor-pointer bg-gradient-to-r ${todayEvent.bgGradient} border-primary/30 hover:border-primary/50 transition-colors`}
              onClick={onShowCalendar}
            >
              <span className="mr-1">{todayEvent.emoji}</span>
              <span className="hidden sm:inline">{todayEvent.multiplier}x</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">
                {todayEvent.emoji} {todayEvent.name}
              </div>
              <p className="text-sm text-muted-foreground">{todayEvent.description}</p>
              <div className="flex gap-1 pt-1 border-t">
                {allEvents.slice(0, 7).map((event, idx) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      idx === currentDay
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    title={event.name}
                  >
                    {dayNames[idx]}
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${todayEvent.bgGradient} border border-primary/20 cursor-pointer hover:border-primary/40 transition-colors`}
      onClick={onShowCalendar}
    >
      <span className="text-lg">{todayEvent.emoji}</span>
      <div className="flex flex-col">
        <span className="text-xs font-semibold leading-tight">{todayEvent.name}</span>
        <span className="text-xs text-muted-foreground leading-tight">{todayEvent.description}</span>
      </div>
      <Calendar className="h-3 w-3 text-muted-foreground ml-auto" />
    </div>
  );
}

/**
 * Full weekly calendar popup/dialog content
 */
export function WeeklyEventCalendar() {
  const { allEvents, currentDay } = useWeeklyEvents();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Weekly Event Calendar
      </h3>
      <div className="grid gap-2">
        {allEvents.slice(0, 7).map((event, idx) => (
          <div
            key={event.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              idx === currentDay
                ? `bg-gradient-to-r ${event.bgGradient} border-2 border-primary`
                : 'bg-muted/50 border border-transparent'
            }`}
          >
            <span className="text-2xl">{event.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{dayNames[idx]}</span>
                {idx === currentDay && (
                  <Badge variant="default" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="text-sm font-semibold text-primary">{event.name}</div>
              <div className="text-xs text-muted-foreground">{event.description}</div>
            </div>
            <Badge variant="outline" className="font-mono">
              {event.multiplier}x
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
