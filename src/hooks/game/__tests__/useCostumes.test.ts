/**
 * @fileoverview Tests for useCostumes hook
 *
 * Tests costume purchasing and equipping operations including:
 * - Purchasing valid/invalid costumes
 * - Ownership validation
 * - Equipping/unequipping costumes
 * - Error handling for invalid operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCostumes } from '../useCostumes';
import { createMockDependencies, createMockCat } from '@/test/mocks/gameHookMocks';

describe('useCostumes', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('buyCostume', () => {
    it('should purchase a valid costume', () => {
      mockDeps = createMockDependencies({ money: 500 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('party_hat'); // costs $50
      });

      const state = mockDeps.getState();
      expect(state.ownedCostumes).toContain('party_hat');
      expect(state.money).toBe(450);
    });

    it('should reject purchase when not enough money', () => {
      mockDeps = createMockDependencies({ money: 10 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('crown'); // costs $300
      });

      expect(mockDeps.getState().ownedCostumes).not.toContain('crown');
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'error' }));
      expect(mockDeps.getSounds()).toContain('error');
    });

    it('should reject duplicate purchase', () => {
      mockDeps = createMockDependencies({
        money: 500,
        ownedCostumes: ['party_hat'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('party_hat');
      });

      expect(mockDeps.getState().money).toBe(500); // No deduction
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should reject invalid costume ID', () => {
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('invalid_costume_id');
      });

      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: 'Costume not found!', type: 'error' })
      );
    });

    it('should play coin sound on successful purchase', () => {
      mockDeps = createMockDependencies({ money: 500 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('party_hat');
      });

      expect(mockDeps.getSounds()).toContain('coin');
    });
  });

  describe('equipCostume', () => {
    it('should equip owned costume to cat', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: ['crown'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBe('crown');
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'success' }));
    });

    it('should unequip costume when costumeId is null', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        catCostumes: { 'cat-1': 'crown' },
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', null);
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });

    it('should reject equipping unowned costume', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: [], // No costumes owned
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: "You don't own this costume!", type: 'error' })
      );
      expect(mockDeps.getSounds()).toContain('error');
    });

    it('should reject equipping to non-existent cat', () => {
      mockDeps = createMockDependencies({
        cats: [],
        ownedCostumes: ['crown'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('non-existent-cat', 'crown');
      });

      expect(Object.keys(mockDeps.getState().catCostumes)).toHaveLength(0);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: 'Cat not found!', type: 'error' })
      );
    });

    it('should reject equipping invalid costume ID', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: ['invalid_costume'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'invalid_costume');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: 'Invalid costume!', type: 'error' })
      );
    });

    it('should allow switching costumes on same cat', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: ['crown', 'party_hat'],
        catCostumes: { 'cat-1': 'party_hat' },
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBe('crown');
    });

    it('should allow same costume on multiple cats', () => {
      const cats = [createMockCat({ id: 'cat-1' }), createMockCat({ id: 'cat-2' })];
      mockDeps = createMockDependencies({
        cats,
        ownedCostumes: ['crown'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'crown');
        result.current.equipCostume('cat-2', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBe('crown');
      expect(mockDeps.getState().catCostumes['cat-2']).toBe('crown');
    });
  });

  describe('seasonal costumes', () => {
    it('should allow purchasing seasonal costumes when in season', () => {
      // The Winter Wonderland season includes snowflake_collar
      mockDeps = createMockDependencies({ money: 500 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.buyCostume('snowflake_collar'); // Winter seasonal, costs $150
      });

      const state = mockDeps.getState();
      expect(state.ownedCostumes).toContain('snowflake_collar');
      expect(state.money).toBe(350); // 500 - 150
    });

    it('should allow equipping purchased seasonal costumes', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: ['snowflake_collar'],
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'snowflake_collar');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBe('snowflake_collar');
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'success' }));
    });

    it('should find all seasonal costumes via getCostumeById', () => {
      // Test that the lookup function finds costumes from all seasons
      const { getCostumeById } = require('@/types/costumes');

      // Winter costumes
      expect(getCostumeById('snowflake_collar')).toBeDefined();
      expect(getCostumeById('ice_queen_crown')).toBeDefined();
      expect(getCostumeById('aurora_wings')).toBeDefined();

      // Spring costumes
      expect(getCostumeById('cherry_blossom_bow')).toBeDefined();
      expect(getCostumeById('butterfly_wings')).toBeDefined();
      expect(getCostumeById('flower_crown')).toBeDefined();

      // Summer costumes
      expect(getCostumeById('beach_hat')).toBeDefined();
      expect(getCostumeById('surfboard')).toBeDefined();
      expect(getCostumeById('tropical_outfit')).toBeDefined();

      // Autumn costumes
      expect(getCostumeById('leaf_scarf')).toBeDefined();
      expect(getCostumeById('pumpkin_hat')).toBeDefined();
      expect(getCostumeById('harvest_outfit')).toBeDefined();
    });

    it('should reject purchasing unowned seasonal costume equip', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({
        cats: [cat],
        ownedCostumes: [], // No costumes owned
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));

      act(() => {
        result.current.equipCostume('cat-1', 'ice_queen_crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: "You don't own this costume!", type: 'error' })
      );
    });
  });
});
