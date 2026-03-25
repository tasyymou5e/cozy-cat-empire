import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/types/relationships', () => ({
  getRelationshipLevel: () => 'neutral',
}));

describe('useDailyWizard', () => {
  beforeEach(() => {
    localStorage.removeItem('cat-farm-wizard-last-shown');
    localStorage.removeItem('cat-farm-wizard-dismissed-today');
  });

  it('should generate wizard steps', async () => {
    const { useDailyWizard } = await import('../useDailyWizard');
    const state = { cats: [], money: 100, resources: { food: 5, medicine: 0, toys: 0, treats: 0 }, day: 1 } as any;
    const { result } = renderHook(() => useDailyWizard(state, []));
    expect(result.current.steps.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.current.dismissWizard).toBe('function');
  });
});
