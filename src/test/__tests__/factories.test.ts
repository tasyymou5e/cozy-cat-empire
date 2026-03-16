/**
 * @fileoverview Mock factory integration tests
 *
 * Validates that all mock factories produce well-typed objects
 * with sensible defaults and support overrides.
 */

import { describe, it, expect } from 'vitest';
import {
  createMockProfile,
  createMockTradeOffer,
  createMockGift,
  createMockChallenge,
  createMockChallengeProgress,
  createMockGalleryPhoto,
} from '@/test/mocks/factories';

describe('Mock Factories', () => {
  it('createMockProfile generates valid profile with defaults', () => {
    const profile = createMockProfile();
    expect(profile.id).toBeDefined();
    expect(profile.display_name).toBe('TestPlayer');
    expect(profile.avatar_emoji).toBe('😺');
  });

  it('createMockProfile accepts overrides', () => {
    const profile = createMockProfile({ display_name: 'CatLord', id: 'fixed-id' });
    expect(profile.display_name).toBe('CatLord');
    expect(profile.id).toBe('fixed-id');
  });

  it('createMockTradeOffer generates valid trade', () => {
    const trade = createMockTradeOffer();
    expect(trade.status).toBe('pending');
    expect(trade.offered_money).toBe(100);
    expect(new Date(trade.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('createMockGift generates valid gift', () => {
    const gift = createMockGift({ message: 'Enjoy!' });
    expect(gift.status).toBe('pending');
    expect(gift.message).toBe('Enjoy!');
    expect(gift.cat_data).toHaveProperty('name');
  });

  it('createMockChallenge generates valid challenge', () => {
    const challenge = createMockChallenge({ difficulty: 'hard' });
    expect(challenge.is_active).toBe(true);
    expect(challenge.difficulty).toBe('hard');
    expect(challenge.target_value).toBe(3);
  });

  it('createMockChallengeProgress generates valid progress', () => {
    const progress = createMockChallengeProgress({ current_progress: 2, completed: true });
    expect(progress.completed).toBe(true);
    expect(progress.current_progress).toBe(2);
  });

  it('createMockGalleryPhoto generates valid photo', () => {
    const photo = createMockGalleryPhoto({ isFavorite: true });
    expect(photo.syncStatus).toBe('local');
    expect(photo.isFavorite).toBe(true);
    expect(photo.imageDataUrl).toContain('data:image');
  });
});
