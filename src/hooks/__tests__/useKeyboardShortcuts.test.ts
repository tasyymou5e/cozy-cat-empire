import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/lib/router-compat', () => ({ useNavigate: () => vi.fn() }));

describe('useKeyboardShortcuts', () => {
  it('should register keyboard event listeners on window', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const { useKeyboardShortcuts } = await import('../useKeyboardShortcuts');
    renderHook(() => useKeyboardShortcuts({}));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });
});
