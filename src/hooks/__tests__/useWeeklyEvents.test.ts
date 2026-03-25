import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/types/weeklyEvents', () => ({
  WEEKLY_EVENTS: [],
  getEventForDay: () => ({ name: 'Test Day', emoji: '🎉', bonusType: 'show_earnings', multiplier: 1.5, dayOfWeek: 0 }),
}));

describe('useWeeklyEvents', () => {
  it('should return today event', async () => {
    const { useWeeklyEvents } = await import('../useWeeklyEvents');
    const { result } = renderHook(() => useWeeklyEvents());
    const event = result.current.getTodayEvent();
    expect(event).toBeDefined();
    expect(event.name).toBe('Test Day');
  });

  it('should return multiplier for bonus type', async () => {
    const { useWeeklyEvents } = await import('../useWeeklyEvents');
    const { result } = renderHook(() => useWeeklyEvents());
    const mult = result.current.getEventMultiplier('show_earnings' as any);
    expect(typeof mult).toBe('number');
  });
});
