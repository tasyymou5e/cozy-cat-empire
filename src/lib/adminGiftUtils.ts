/**
 * Admin gift utilities for generating cats to gift to users.
 * These functions are used by the admin panel to create valid cat objects.
 */

import { Cat, CatBreed, CatPersonality, BREEDS, PERSONALITIES } from '@/types/game';
import { TrickId, TRICKS } from '@/types/grading';

/** Parameters for generating an admin gift cat */
export interface AdminGiftCatParams {
  breed: CatBreed;
  grade: number;
  name: string;
}

/** Default trick progress (0 for all tricks) */
const defaultTrickProgress: Record<TrickId, number> = TRICKS.reduce(
  (acc, trick) => ({ ...acc, [trick.id]: 0 }),
  {} as Record<TrickId, number>
);

/**
 * Get a random personality from the available list
 */
export function randomPersonality(): CatPersonality {
  return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
}

/**
 * Calculate cat value based on breed and grade
 */
export function calculateCatValue(breed: CatBreed, grade: number): number {
  const breedData = BREEDS[breed];
  const baseValue = breedData?.baseValue || 100;
  // Value increases with grade: +10% per grade level
  return Math.round(baseValue * (1 + (grade - 1) * 0.1));
}

/**
 * Generate a valid cat object for admin gifting.
 * Creates a cat with full stats and proper defaults.
 */
export function generateAdminGiftCat(params: AdminGiftCatParams): Cat {
  const { breed, grade, name } = params;

  // Validate grade
  const validGrade = Math.max(1, Math.min(20, grade));

  // Determine cat type based on breed
  const catType = breed === 'stray' ? 'stray' : 'pure';

  return {
    id: crypto.randomUUID(),
    type: catType,
    breed,
    name,
    health: 100,
    happiness: 100,
    hunger: 100,
    value: calculateCatValue(breed, validGrade),
    age: 1,
    personality: randomPersonality(),
    showWins: 0,
    isForSale: false,
    grade: validGrade,
    tricksLearned: [],
    trickProgress: { ...defaultTrickProgress },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
  };
}

/** Breed options for the admin gift form */
export const BREED_OPTIONS: { value: CatBreed; label: string; emoji: string }[] = [
  { value: 'stray', label: 'Stray', emoji: '🐱' },
  { value: 'tabby', label: 'Tabby', emoji: '🐈' },
  { value: 'persian', label: 'Persian', emoji: '😸' },
  { value: 'siamese', label: 'Siamese', emoji: '😼' },
  { value: 'maine-coon', label: 'Maine Coon', emoji: '🦁' },
  { value: 'british-shorthair', label: 'British Shorthair', emoji: '🐱' },
  { value: 'ragdoll', label: 'Ragdoll', emoji: '😻' },
  { value: 'bengal', label: 'Bengal', emoji: '🐆' },
];

/** Get breed emoji for display */
export function getBreedEmoji(breed: CatBreed): string {
  return BREED_OPTIONS.find((b) => b.value === breed)?.emoji || '🐱';
}
