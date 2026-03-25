import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/types/relationships', () => ({
  getDecayInfo: () => ({ daysSinceInteraction: 0, isDecaying: false, decayAmount: 0 }),
  RELATIONSHIP_DECAY: { MIN_DECAY_SCORE: 10 },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useRelationshipReminders', () => {
  it('should return zero attention count with no decaying relationships', async () => {
    const { useRelationshipReminders } = await import('../useRelationshipReminders');
    const { result } = renderHook(() => useRelationshipReminders([], [], 1, true));
    expect(result.current.needsAttention).toEqual([]);
    expect(result.current.attentionCount).toBe(0);
  });
});
