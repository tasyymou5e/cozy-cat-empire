/**
 * @fileoverview Extended mock factories for domain types
 *
 * Provides reusable factory functions for profiles, trade offers,
 * gifts, challenges, and gallery photos used across test suites.
 *
 * @module test/mocks/factories
 */

import type { WeeklyChallenge, PlayerChallengeProgress } from '@/types/challenges';
import type { GalleryPhoto } from '@/types/gallery';

// ── Profile ──────────────────────────────────────────────────────────────

export interface MockProfile {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  username: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export function createMockProfile(overrides: Partial<MockProfile> = {}): MockProfile {
  const id = overrides.id ?? `user-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    display_name: 'TestPlayer',
    avatar_emoji: '😺',
    username: `player_${id.slice(0, 6)}`,
    email: `${id}@test.local`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Trade Offer ──────────────────────────────────────────────────────────

export interface MockTradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: unknown[];
  offered_money: number;
  offered_resources: Record<string, number>;
  requested_cats: unknown[];
  requested_money: number;
  requested_resources: Record<string, number>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export function createMockTradeOffer(overrides: Partial<MockTradeOffer> = {}): MockTradeOffer {
  return {
    id: `trade-${Math.random().toString(36).slice(2, 10)}`,
    sender_id: 'sender-1',
    recipient_id: 'recipient-1',
    offered_cats: [],
    offered_money: 100,
    offered_resources: {},
    requested_cats: [],
    requested_money: 0,
    requested_resources: {},
    message: null,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Cat Gift ─────────────────────────────────────────────────────────────

export interface MockCatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Record<string, unknown>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export function createMockGift(overrides: Partial<MockCatGift> = {}): MockCatGift {
  return {
    id: `gift-${Math.random().toString(36).slice(2, 10)}`,
    sender_id: 'sender-1',
    recipient_id: 'recipient-1',
    cat_data: { id: 'cat-1', name: 'GiftCat', breed: 'tabby', grade: 5 },
    message: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Weekly Challenge ─────────────────────────────────────────────────────

export function createMockChallenge(
  overrides: Partial<WeeklyChallenge> = {},
): WeeklyChallenge {
  return {
    id: `challenge-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Show Starter',
    description: 'Win 3 cat shows',
    emoji: '🏆',
    challenge_type: 'show_wins',
    target_value: 3,
    reward_coins: 150,
    reward_badge: null,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    difficulty: 'easy',
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockChallengeProgress(
  overrides: Partial<PlayerChallengeProgress> = {},
): PlayerChallengeProgress {
  return {
    id: `progress-${Math.random().toString(36).slice(2, 10)}`,
    user_id: 'user-1',
    challenge_id: 'challenge-1',
    current_progress: 0,
    completed: false,
    completed_at: null,
    reward_claimed: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Gallery Photo ────────────────────────────────────────────────────────

export function createMockGalleryPhoto(
  overrides: Partial<GalleryPhoto> = {},
): GalleryPhoto {
  return {
    id: `photo-${Math.random().toString(36).slice(2, 10)}`,
    catId: 'cat-1',
    catName: 'Whiskers',
    imageDataUrl: 'data:image/png;base64,AAAA',
    backgroundId: 'nature-meadow',
    poseId: 'sitting',
    frameId: 'polaroid',
    stickerCount: 0,
    createdAt: new Date().toISOString(),
    isFavorite: false,
    syncStatus: 'local',
    ...overrides,
  };
}
