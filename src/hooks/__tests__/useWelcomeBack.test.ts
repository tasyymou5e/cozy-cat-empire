import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/components/game/WelcomeBackDialog', () => ({}));

describe('useWelcomeBack', () => {
  it('should not show welcome back for active players', async () => {
    localStorage.setItem('cat-farm-last-session', Date.now().toString());
    const { useWelcomeBack } = await import('../useWelcomeBack');
    const { result } = renderHook(() => useWelcomeBack());
    expect(result.current.showWelcomeBack).toBe(false);
    expect(result.current.welcomeBackBonus).toBeNull();
  });
});
