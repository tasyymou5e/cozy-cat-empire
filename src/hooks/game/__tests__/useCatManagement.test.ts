/**
 * @fileoverview Tests for useCatManagement hook
 * 
 * Tests cat lifecycle operations: adding, selling, renaming, comforting.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatManagement } from '../useCatManagement';
import { 
  createMockDependencies, 
  createMockCat, 
  createMockGameState 
} from '@/test/mocks/gameHookMocks';

describe('useCatManagement', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('addCat', () => {
    it('should add a stray cat for free', () => {
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('stray');
      });
      
      const state = mockDeps.getState();
      expect(state.cats).toHaveLength(1);
      expect(state.cats[0].type).toBe('stray');
      expect(state.money).toBe(500); // No cost
    });

    it('should add an adopted cat for $50', () => {
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('adopted');
      });
      
      const state = mockDeps.getState();
      expect(state.cats).toHaveLength(1);
      expect(state.cats[0].type).toBe('adopted');
      expect(state.money).toBe(450); // 500 - 50
    });

    it('should add a pure cat for $200', () => {
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('pure');
      });
      
      const state = mockDeps.getState();
      expect(state.cats).toHaveLength(1);
      expect(state.cats[0].type).toBe('pure');
      expect(state.money).toBe(300); // 500 - 200
    });

    it('should not add cat when no space available', () => {
      mockDeps = createMockDependencies({ 
        space: 1, 
        cats: [createMockCat()] 
      });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('stray');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(1);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should not add cat when not enough money', () => {
      mockDeps = createMockDependencies({ money: 10 });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('pure'); // Costs $200
      });
      
      expect(mockDeps.getState().cats).toHaveLength(0);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should track challenge progress when adding cat', () => {
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addCat('stray');
      });
      
      expect(mockDeps.deps.onChallengeProgress).toHaveBeenCalledWith('collect_cats', 1);
    });
  });

  describe('sellCat', () => {
    it('should remove cat and add money', () => {
      const cat = createMockCat({ id: 'cat-1', value: 100, showWins: 0 });
      mockDeps = createMockDependencies({ cats: [cat], money: 100 });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.sellCat('cat-1');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(0);
      expect(mockDeps.getState().money).toBe(200); // 100 + 100
    });

    it('should calculate sell price with show win bonus', () => {
      const cat = createMockCat({ id: 'cat-1', value: 100, showWins: 5 });
      mockDeps = createMockDependencies({ cats: [cat], money: 0 });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.sellCat('cat-1');
      });
      
      // 100 * (1 + 5 * 0.1) = 100 * 1.5 = 150
      expect(mockDeps.getState().money).toBe(150);
    });

    it('should remove cat relationships when sold', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.sellCat('cat-1');
      });
      
      expect(mockDeps.deps.relationshipSystem.removeCatRelationships).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('renameCat', () => {
    it('should rename cat successfully', () => {
      const cat = createMockCat({ id: 'cat-1', name: 'OldName' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      let success: boolean = false;
      act(() => {
        success = result.current.renameCat('cat-1', 'NewName');
      });
      
      expect(success).toBe(true);
      expect(mockDeps.getState().cats[0].name).toBe('NewName');
    });

    it('should reject empty names', () => {
      const cat = createMockCat({ id: 'cat-1', name: 'OldName' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      let success: boolean = true;
      act(() => {
        success = result.current.renameCat('cat-1', '   ');
      });
      
      expect(success).toBe(false);
      expect(mockDeps.getState().cats[0].name).toBe('OldName');
    });

    it('should reject names longer than 20 characters', () => {
      const cat = createMockCat({ id: 'cat-1', name: 'OldName' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      let success: boolean = true;
      act(() => {
        success = result.current.renameCat('cat-1', 'ThisNameIsTooLongForACat');
      });
      
      expect(success).toBe(false);
    });

    it('should reject duplicate names (case-insensitive)', () => {
      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });
      mockDeps = createMockDependencies({ cats: [cat1, cat2] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      let success: boolean = true;
      act(() => {
        success = result.current.renameCat('cat-2', 'whiskers');
      });
      
      expect(success).toBe(false);
    });
  });

  describe('comfortCat', () => {
    it('should increase happiness and health', () => {
      const cat = createMockCat({ id: 'cat-1', happiness: 30, health: 70 });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.comfortCat('cat-1');
      });
      
      const updatedCat = mockDeps.getState().cats[0];
      expect(updatedCat.happiness).toBe(60); // 30 + 30
      expect(updatedCat.health).toBe(75); // 70 + 5
    });

    it('should cap happiness and health at 100', () => {
      const cat = createMockCat({ id: 'cat-1', happiness: 90, health: 98 });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.comfortCat('cat-1');
      });
      
      const updatedCat = mockDeps.getState().cats[0];
      expect(updatedCat.happiness).toBe(100);
      expect(updatedCat.health).toBe(100);
    });
  });

  describe('addReceivedCat', () => {
    it('should add cat with new ID', () => {
      mockDeps = createMockDependencies({ space: 5 });
      const giftedCat = createMockCat({ id: 'original-id', name: 'GiftCat' });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addReceivedCat(giftedCat);
      });
      
      const cats = mockDeps.getState().cats;
      expect(cats).toHaveLength(1);
      expect(cats[0].name).toBe('GiftCat');
      expect(cats[0].id).not.toBe('original-id'); // New ID assigned
    });

    it('should reject when no space', () => {
      mockDeps = createMockDependencies({ space: 1, cats: [createMockCat()] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.addReceivedCat(createMockCat());
      });
      
      expect(mockDeps.getState().cats).toHaveLength(1);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  describe('setSpecialization', () => {
    it('should set specialization on unspecialized cat', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.setSpecialization('cat-1', 'show_star');
      });
      
      const updatedCat = mockDeps.getState().cats[0];
      expect(updatedCat.specialization?.type).toBe('show_star');
      expect(updatedCat.specialization?.level).toBe(1);
      expect(updatedCat.specialization?.xp).toBe(0);
    });

    it('should not change already specialized cat', () => {
      const cat = createMockCat({ 
        id: 'cat-1',
        specialization: { type: 'dynasty_builder', level: 3, xp: 100, specializedAt: '' }
      });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useCatManagement(mockDeps.deps));
      
      act(() => {
        result.current.setSpecialization('cat-1', 'show_star');
      });
      
      expect(mockDeps.getState().cats[0].specialization?.type).toBe('dynasty_builder');
    });
  });
});
