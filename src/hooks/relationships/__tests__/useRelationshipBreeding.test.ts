/**
 * @fileoverview Tests for useRelationshipBreeding hook
 * @module hooks/relationships/__tests__/useRelationshipBreeding.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRelationshipBreeding } from '../useRelationshipBreeding';
import { CatRelationship } from '@/types/relationships';

describe('useRelationshipBreeding', () => {
  describe('getBreedingCompatibility', () => {
    it('should allow breeding with neutral message when no relationship', () => {
      const mockGetRelationship = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(0);
      expect(compatibility.message).toBe('Neutral - no relationship bonus');
    });

    it('should return canBreed=false for enemies', () => {
      const mockGetRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: -80,
        level: 'enemy',
        lastInteraction: 1,
      } as CatRelationship);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(false);
      expect(compatibility.bonus).toBe(0);
      expect(compatibility.message).toBe('Enemies refuse to breed!');
    });

    it('should return -10 bonus for rivals', () => {
      const mockGetRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: -30,
        level: 'rival',
        lastInteraction: 1,
      } as CatRelationship);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(-10);
      expect(compatibility.message).toContain('50%');
      expect(compatibility.message).toContain('failure');
    });

    it('should return 0 bonus for neutral', () => {
      const mockGetRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: 10,
        level: 'neutral',
        lastInteraction: 1,
      } as CatRelationship);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(0);
      expect(compatibility.message).toBe('Neutral relationship');
    });

    it('should return +10 bonus for friends', () => {
      const mockGetRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: 40,
        level: 'friend',
        lastInteraction: 1,
      } as CatRelationship);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(10);
      expect(compatibility.message).toContain('+10%');
      expect(compatibility.message).toContain('health');
    });

    it('should return +20 bonus for best friends', () => {
      const mockGetRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: 80,
        level: 'bestFriend',
        lastInteraction: 1,
      } as CatRelationship);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');

      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(20);
      expect(compatibility.message).toContain('+20%');
      expect(compatibility.message).toContain('stats');
    });

    it('should call getRelationship with correct cat IDs', () => {
      const mockGetRelationship = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() =>
        useRelationshipBreeding({ getRelationship: mockGetRelationship })
      );

      result.current.getBreedingCompatibility('cat-123', 'cat-456');

      expect(mockGetRelationship).toHaveBeenCalledWith('cat-123', 'cat-456');
    });
  });
});
