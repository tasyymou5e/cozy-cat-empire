/**
 * @fileoverview Shared types and utilities for game domain hooks
 * 
 * This file provides the foundation for the modular useGameState refactor.
 * All domain hooks receive dependencies through GameHookDependencies and
 * must return actions matching the GameActions interface.
 * 
 * @module hooks/game/types
 */

import { 
  Cat, GameState, CAT_NAMES, BREEDS, PERSONALITIES, 
  CatBreed, MarketListing, Achievement, ACHIEVEMENT_DEFS, Resources
} from '@/types/game';
import { TrickId } from '@/types/grading';
import { CatAppearance } from '@/types/catAppearance';
import { ShowTier } from '@/types/showEvents';
import { SoundType } from '../useSoundEffects';
import { ChallengeType } from '@/types/challenges';
import { LogActivityParams } from '../usePlayerActivityLog';
import { useRelationships } from '../useRelationships';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';

// ============================================================================
// Relationship Save Data Type
// ============================================================================

/**
 * Data structure for saving and loading cat relationships to/from storage.
 * Contains all relationship state needed to restore the relationship system.
 */
export interface RelationshipSaveData {
  /** Array of all cat-to-cat relationships */
  relationships: CatRelationship[];
  /** History of relationship events */
  events: RelationshipEvent[];
  /** Current maintenance streak (consecutive days all relationships maintained) */
  maintenanceStreak?: number;
  /** Longest maintenance streak achieved */
  longestMaintenanceStreak?: number;
  /** Last day maintenance was performed */
  lastMaintenanceDay?: number | null;
}

// ============================================================================
// Type Definitions
// ============================================================================

/** React setState function for GameState */
export type GameStateSetter = React.Dispatch<React.SetStateAction<GameState>>;

/** Available message types for user feedback */
export type MessageType = 'info' | 'success' | 'warning' | 'error';

/**
 * Function signature for displaying messages to the user.
 * Backward compatible with the original showMessage implementation.
 * 
 * @param msg - The message text to display
 * @param type - The type of message (affects styling and behavior)
 */
export type ShowMessageFn = (msg: string, type?: MessageType) => void;

/** Return type of the useRelationships hook */
export type RelationshipSystem = ReturnType<typeof useRelationships>;

/**
 * Dependencies shared across all domain hooks.
 * 
 * This object provides consistent access to game state and shared utilities.
 * Each domain hook receives this as input and uses it to interact with
 * the game state and other systems.
 * 
 * @example
 * ```typescript
 * function useMyDomainHook(deps: GameHookDependencies) {
 *   const { setState, showMessage, playSound } = deps;
 *   // Use dependencies to implement domain logic
 * }
 * ```
 */
export interface GameHookDependencies {
  /** Current game state (read-only snapshot) */
  state: GameState;
  /** Function to update game state */
  setState: GameStateSetter;
  /** Display a message to the user */
  showMessage: ShowMessageFn;
  /** Play a sound effect (optional) */
  playSound?: (type: SoundType) => void;
  /** Report progress on weekly challenges (optional) */
  onChallengeProgress?: (type: ChallengeType, increment?: number) => void;
  /** Log player activity for analytics (optional) */
  logActivity?: (params: LogActivityParams) => void;
  /** Cat relationship management system */
  relationshipSystem: RelationshipSystem;
  /** Total number of kittens bred this session */
  kittensBreed: number;
  /** Setter for kittens bred count */
  setKittensBreed: React.Dispatch<React.SetStateAction<number>>;
  /** Check and unlock achievements based on new state */
  checkAchievements: (newState: GameState, extraKittens?: number, wasBestFriendBreed?: boolean) => GameState;
}

/**
 * Complete interface for all game actions.
 * 
 * This ensures type safety when composing domain hooks and provides
 * a unified API surface for game interactions.
 * 
 * Total: 44 actions across 9 domains:
 * - Cat Management: 10 actions
 * - Resources: 6 actions
 * - Training: 4 actions
 * - Shows: 1 action
 * - Breeding: 1 action
 * - Bulk Actions: 6 actions
 * - Save/Load: 6 actions
 * - Costumes: 2 actions
 * - Core/Daily: 8 actions
 */
export interface GameActions {
  // ============ Cat Management (10 actions) ============
  /**
   * Add a new cat to the player's collection
   * @param type - The type of cat to add ('stray', 'adopted', or 'pure')
   */
  addCat: (type: Cat['type']) => void;
  
  /**
   * Buy a cat from the market
   * @param listingId - ID of the market listing to purchase
   */
  buyFromMarket: (listingId: string) => void;
  
  /**
   * Sell a cat from the player's collection
   * @param catId - ID of the cat to sell
   */
  sellCat: (catId: string) => void;
  
  /**
   * Rename a cat
   * @param catId - ID of the cat to rename
   * @param newName - The new name for the cat (1-20 characters)
   * @returns true if rename was successful, false otherwise
   */
  renameCat: (catId: string, newName: string) => boolean;
  
  /**
   * Comfort an unhappy cat to improve their happiness
   * @param catId - ID of the cat to comfort
   */
  comfortCat: (catId: string) => void;
  
  /**
   * Add a cat received from a gift or trade
   * @param cat - The cat object to add (will be given a new ID)
   */
  addReceivedCat: (cat: Cat) => void;
  
  /**
   * Update a cat's visual appearance
   * @param catId - ID of the cat to update
   * @param appearance - The new appearance configuration
   */
  updateCatAppearance: (catId: string, appearance: CatAppearance) => void;
  
  /**
   * Update a cat's AI-generated portrait URL
   * @param catId - ID of the cat to update
   * @param portraitUrl - URL of the new portrait
   * @param hash - Optional appearance hash for change detection
   */
  updateCatPortrait: (catId: string, portraitUrl: string, hash?: string) => void;
  
  /**
   * Set a specialization on a cat
   * @param catId - ID of the cat to specialize
   * @param type - The specialization type
   */
  setSpecialization: (catId: string, type: import('@/types/specializations').SpecializationType) => void;
  
  /**
   * Add XP to a specialized cat
   * @param catId - ID of the cat to add XP to
   * @param amount - Amount of XP to add
   */
  addSpecializationXP: (catId: string, amount: number) => void;

  // ============ Resources (6 actions) ============
  /**
   * Purchase resources from the shop
   * @param resource - Type of resource to buy
   * @param cost - Cost in coins
   */
  buyResource: (resource: keyof Resources, cost: number) => void;
  
  /**
   * Feed all cats (uses 1 food per cat)
   */
  feedCats: () => void;
  
  /**
   * Feed a single cat
   * @param catId - ID of the cat to feed
   */
  feedSingleCat: (catId: string) => void;
  
  /**
   * Use toys for group playtime (improves happiness)
   */
  useToys: () => void;
  
  /**
   * Heal a cat with medicine (restores full health)
   * @param catId - ID of the cat to heal
   */
  useMedicine: (catId: string) => void;
  
  /**
   * Add reward coins and optional resources
   * @param coins - Amount of coins to add
   * @param resources - Optional resources to add
   */
  addReward: (coins: number, resources?: Partial<Resources>) => void;

  // ============ Training (4 actions) ============
  /**
   * Train a cat on a specific trick
   * @param catId - ID of the cat to train
   * @param trickId - ID of the trick to learn
   */
  trainCat: (catId: string, trickId: TrickId) => void;
  
  /**
   * Rest a tired cat (improves rest level)
   * @param catId - ID of the cat to rest
   */
  restCat: (catId: string) => void;
  
  /**
   * Do a group activity with cats in a relationship group
   * @param groupId - ID of the cat group
   * @param activityType - Type of activity to perform
   */
  doGroupActivity: (groupId: string, activityType: 'play' | 'treat' | 'nap') => void;
  
  /**
   * Socialize two cats together (improves relationship)
   * @param cat1Id - ID of the first cat
   * @param cat2Id - ID of the second cat
   */
  socializeCats: (cat1Id: string, cat2Id: string) => void;

  // ============ Shows (1 action) ============
  /**
   * Enter cats in a show competition
   * @param tier - Show tier to enter (defaults to 'local')
   */
  catShow: (tier?: ShowTier) => void;

  // ============ Breeding (1 action) ============
  /**
   * Breed two cats to create a kitten
   * @param cat1Id - ID of the first parent
   * @param cat2Id - ID of the second parent
   */
  breedCats: (cat1Id: string, cat2Id: string) => void;

  // ============ Bulk Actions (6 actions) ============
  /** Heal all sick cats (health < 70) using medicine */
  healAllSickCats: () => void;
  
  /** Rest all tired cats (restLevel < 50) */
  restAllTiredCats: () => void;
  
  /** Comfort all unhappy cats (happiness < 50) */
  comfortAllUnhappyCats: () => void;
  
  /** Train all available cats for the day */
  trainAllAvailableCats: () => void;
  
  /**
   * Sell multiple cats at once
   * @param catIds - Array of cat IDs to sell
   */
  sellSelectedCats: (catIds: string[]) => void;
  
  /** Socialize all neglected relationships (2+ days since interaction) */
  socializeAllNeglected: () => void;

  // ============ Save/Load (6 actions) ============
  /** Save game to localStorage */
  saveGame: () => void;
  
  /** Load game from localStorage */
  loadGame: () => void;
  
  /** Check if a saved game exists in localStorage */
  hasSaveGame: () => boolean;
  
  /** Get the day from saved game (null if no save) */
  getSaveDay: () => number | null;
  
  /** Reset game to initial state and clear save */
  resetGame: () => void;
  
  /**
   * Load game from cloud save data
   * @param gameState - The game state to load
   * @param kittens - Kittens bred count
   * @param relationshipData - Optional relationship data
   */
  loadFromData: (
    gameState: GameState, 
    kittens: number, 
    relationshipData?: { relationships: any[]; events: any[] }
  ) => void;

  // ============ Costumes (2 actions) ============
  /**
   * Purchase a costume
   * @param costumeId - ID of the costume to buy
   */
  buyCostume: (costumeId: string) => void;
  
  /**
   * Equip or unequip a costume on a cat
   * @param catId - ID of the cat
   * @param costumeId - ID of costume to equip (null to unequip)
   */
  equipCostume: (catId: string, costumeId: string | null) => void;

  // ============ Core/Daily (8 actions) ============
  /**
   * Complete a chore for money
   * @param choreId - ID of the chore type
   * @param baseReward - Base coin reward for the chore
   */
  doChore: (choreId: string, baseReward: number) => void;
  
  /** Upgrade housing (apartment → house → mansion → farm) */
  upgradeHouse: () => void;
  
  /** Advance to next day (processes daily updates) */
  nextDay: () => void;
  
  /** Process random daily event */
  processDailyEvent: () => void;
  
  /** Clear current daily event */
  clearDailyEvent: () => void;
  
  /** Dismiss current message */
  dismissMessage: () => void;
  
  /**
   * Deduct money from game state (with validation)
   * @param amount - Amount to deduct
   * @param reason - Reason for deduction (shown in message)
   * @returns true if deduction was successful
   */
  deductMoney: (amount: number, reason: string) => boolean;
  
  /**
   * Set money directly (for backend sync)
   * @param newMoney - New money amount
   */
  setMoney: (newMoney: number) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for cats, listings, etc.
 * @returns A random 9-character alphanumeric ID
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Create default trick progress object with all tricks at 0
 * @returns Object mapping each trick ID to 0 progress
 */
export const createDefaultTrickProgress = (): Record<TrickId, number> => ({
  sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0
});

/**
 * Get a random breed based on cat type
 * 
 * @param type - The cat type (stray, adopted, or pure)
 * @returns A breed appropriate for the cat type
 * 
 * @example
 * ```typescript
 * getRandomBreed('stray')    // Always returns 'stray'
 * getRandomBreed('adopted')  // Returns 'stray', 'tabby', or 'persian'
 * getRandomBreed('pure')     // Returns premium breeds
 * ```
 */
export const getRandomBreed = (type: Cat['type']): CatBreed => {
  if (type === 'stray') return 'stray';
  if (type === 'adopted') {
    const breeds: CatBreed[] = ['stray', 'tabby', 'persian'];
    return breeds[Math.floor(Math.random() * breeds.length)];
  }
  const pureBreeds: CatBreed[] = ['persian', 'siamese', 'maine-coon', 'british-shorthair', 'ragdoll', 'bengal'];
  return pureBreeds[Math.floor(Math.random() * pureBreeds.length)];
};

/**
 * Create initial achievements from definitions
 * @returns Array of achievement objects with unlocked=false
 */
export const createInitialAchievements = (): Achievement[] => 
  ACHIEVEMENT_DEFS.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    target: a.target,
    unlocked: false,
  }));

/**
 * Generate 4 random market listings for the cat shop.
 * Called every 3 days to refresh available cats.
 * 
 * @returns Array of 4 market listings with random cats
 */
export function generateMarketListings(): MarketListing[] {
  const sellers = ['Happy Paws Shelter', 'Elite Breeders', 'Cat Haven', 'Whisker World'];
  const listings: MarketListing[] = [];
  
  for (let i = 0; i < 4; i++) {
    const breed = (['tabby', 'persian', 'siamese', 'maine-coon', 'british-shorthair'] as CatBreed[])[Math.floor(Math.random() * 5)];
    const baseValue = BREEDS[breed].baseValue;
    const usedNames = listings.map(l => l.cat.name);
    const availableNames = CAT_NAMES.filter(n => !usedNames.includes(n));
    
    listings.push({
      id: generateId(),
      cat: {
        id: generateId(),
        type: Math.random() > 0.5 ? 'adopted' : 'pure',
        breed,
        name: availableNames[Math.floor(Math.random() * availableNames.length)],
        health: 80 + Math.floor(Math.random() * 20),
        happiness: 70 + Math.floor(Math.random() * 30),
        hunger: 50 + Math.floor(Math.random() * 30),
        value: baseValue + Math.floor(Math.random() * 100),
        age: 1 + Math.floor(Math.random() * 5),
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0,
        isForSale: false,
        grade: Math.floor(Math.random() * 5) + 1, // Grade 1-5 for market cats
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 70 + Math.floor(Math.random() * 30),
        feedingScore: 0,
        lastTrainingDay: 0,
      },
      price: baseValue + 50 + Math.floor(Math.random() * 150),
      seller: sellers[Math.floor(Math.random() * sellers.length)],
    });
  }
  return listings;
}

/**
 * Create the initial game state for a new game.
 * Called when starting fresh or resetting.
 * 
 * @returns A fresh GameState object with default values
 */
export const createInitialState = (): GameState => ({
  cats: [],
  money: 150,
  space: 5,
  houseSize: 'apartment',
  acres: 0,
  day: 1,
  resources: { food: 10, medicine: 2, toys: 3, treats: 5 },
  reputation: 0,
  totalShowWins: 0,
  catsAdopted: 0,
  totalMoneyEarned: 150,
  marketListings: generateMarketListings(),
  achievements: createInitialAchievements(),
  breedingCooldown: 0,
  showCooldown: 0,
  ownedCostumes: [],
  catCostumes: {},
});

/** LocalStorage key for game saves */
export const SAVE_KEY = 'cat-farm-save';

/** Number of days between cat shows */
export const SHOW_COOLDOWN_DAYS = 20;
