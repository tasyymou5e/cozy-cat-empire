/**
 * Cat Name Generation Data and Utilities
 * 
 * This module provides breed-specific, personality-based, and universal
 * name suggestions for cats, along with a random name generator function.
 */

import { CatBreed, CatPersonality } from '@/types/game';

/**
 * Breed-specific cat names organized by breed type
 */
export const BREED_NAMES: Record<CatBreed, string[]> = {
  'siamese': ['Sakura', 'Miko', 'Yuki', 'Suki', 'Kiko', 'Hana', 'Wasabi', 'Tempura', 'Sake', 'Nori', 'Tofu', 'Mochi'],
  'persian': ['Duchess', 'Prince', 'Valentino', 'Anastasia', 'Cleopatra', 'Empress', 'Countess', 'Marquis', 'Vivienne', 'Reginald'],
  'maine-coon': ['Bear', 'Moose', 'Timber', 'Ranger', 'Hunter', 'Maple', 'Everest', 'Grizzly', 'Kodiak', 'Aspen', 'Summit'],
  'british-shorthair': ['Winston', 'Churchill', 'Wellington', 'Sherlock', 'Watson', 'Paddington', 'Biscuit', 'Earl Grey', 'Crumpet'],
  'ragdoll': ['Marshmallow', 'Velvet', 'Cashmere', 'Fluffernutter', 'Snuggles', 'Cloud', 'Pillow', 'Cottontail', 'Silky'],
  'bengal': ['Rajah', 'Sheba', 'Zara', 'Jungle', 'Safari', 'Tigris', 'Savanna', 'Leo', 'Panther', 'Aztec', 'Sahara'],
  'tabby': ['Stripes', 'Marble', 'Autumn', 'Caramel', 'Butterscotch', 'Toffee', 'Cinnamon', 'Tiger', 'Amber'],
  'stray': ['Scrappy', 'Lucky', 'Rascal', 'Scout', 'Maverick', 'Bandit', 'Dusty', 'Patches', 'Scruffy', 'Streetwise'],
};

/**
 * Personality-based cat names organized by personality type
 */
export const PERSONALITY_NAMES: Record<CatPersonality, string[]> = {
  'lazy': ['Snoozer', 'Dreamer', 'Sleepy', 'Cozy', 'Lounger', 'Napkin', 'Slumber', 'Dozer', 'Yawnie', 'Pillow'],
  'playful': ['Zoom', 'Bounce', 'Sparky', 'Frisky', 'Zippy', 'Turbo', 'Rocket', 'Dash', 'Peppy', 'Zinger'],
  'affectionate': ['Cuddles', 'Sweetie', 'Honey', 'Lovebug', 'Snugglepuff', 'Huggy', 'Smoochie', 'Darling', 'Angel'],
  'independent': ['Maverick', 'Solo', 'Rebel', 'Sphinx', 'Mystery', 'Enigma', 'Lone Wolf', 'Rogue', 'Drifter'],
  'curious': ['Scout', 'Explorer', 'Sherlock', 'Detective', 'Peepers', 'Nosy', 'Snoop', 'Inquisitor', 'Seeker'],
  'shy': ['Whisper', 'Shadow', 'Misty', 'Ghost', 'Phantom', 'Bashful', 'Wallflower', 'Timid', 'Hush'],
};

/**
 * Universal cat names that work for any breed or personality
 */
export const UNIVERSAL_NAMES = [
  'Whiskers', 'Mittens', 'Luna', 'Oliver', 'Bella', 'Max', 'Coco',
  'Biscuit', 'Muffin', 'Cookie', 'Sir Fluffington', 'Lord Meowington',
  'Gandalf', 'Yoda', 'Dumbledore', 'Felix', 'Ginger', 'Pepper',
];

/**
 * Generate a random name appropriate for a cat based on its breed and personality
 * 
 * @param breed - The cat's breed
 * @param personality - The cat's personality
 * @returns A random name from breed-specific, personality-based, or universal names
 */
export function generateRandomCatName(breed: CatBreed, personality: CatPersonality): string {
  const breedNames = BREED_NAMES[breed] || [];
  const personalityNames = PERSONALITY_NAMES[personality] || [];
  const combinedNames = [...breedNames, ...personalityNames, ...UNIVERSAL_NAMES];
  return combinedNames[Math.floor(Math.random() * combinedNames.length)];
}

/**
 * Get all possible names for a cat based on its breed and personality
 * 
 * @param breed - The cat's breed
 * @param personality - The cat's personality
 * @returns Array of all applicable names
 */
export function getAllPossibleNames(breed: CatBreed, personality: CatPersonality): string[] {
  const breedNames = BREED_NAMES[breed] || [];
  const personalityNames = PERSONALITY_NAMES[personality] || [];
  return [...breedNames, ...personalityNames, ...UNIVERSAL_NAMES];
}
