import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('useAICatAdvisor', () => {
  it('should initialize with empty chat state', async () => {
    const { useAICatAdvisor } = await import('../useAICatAdvisor');
    const { result } = renderHook(() => useAICatAdvisor());
    expect(result.current.isChatLoading).toBe(false);
    expect(result.current.chatMessages).toEqual([]);
    expect(typeof result.current.sendChatMessage).toBe('function');
  });
});
