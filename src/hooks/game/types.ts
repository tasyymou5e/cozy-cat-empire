/**
 * Shared types and utilities for game domain hooks
 * 
 * This file provides the foundation for the modular useGameState refactor.
 * All domain hooks receive dependencies through GameHookDependencies and
 * must return actions matching the GameActions interface.
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

/** Data structure for saving/loading relationships */
export interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
}

// ============================================================================
// Type Definitions
// ============================================================================

/** React setState function for GameState */
export type GameStateSetter = React.Dispatch<React.SetStateAction<GameState>>;

/** Message types */
export type MessageType = 'info' | 'success' | 'warning' | 'error';

/** Message display function signature (backward compatible) */
export type ShowMessageFn = (msg: string, type?: MessageType) => void;

/** Relationship system return type */
export type RelationshipSystem = ReturnType<typeof useRelationships>;

/**
 * Dependencies passed to all domain hooks
 * This object is shared across hooks to maintain consistent state access
 */
export interface GameHookDependencies {
  state: GameState;
  setState: GameStateSetter;
  showMessage: ShowMessageFn;
  playSound?: (type: SoundType) => void;
  onChallengeProgress?: (type: ChallengeType, increment?: number) => void;
  logActivity?: (params: LogActivityParams) => void;
  relationshipSystem: RelationshipSystem;
  kittensBreed: number;
  setKittensBreed: React.Dispatch<React.SetStateAction<number>>;
  checkAchievements: (newState: GameState, extraKittens?: number, wasBestFriendBreed?: boolean) => GameState;
}

/**
 * Complete interface for all game actions
 * This ensures type safety when composing domain hooks
 * 
 * Total: 42 actions across 9 domains
 */
export interface GameActions {
  // ============ Cat Management (8 actions) ============
  /** Add a new cat by type (stray, adopted, pure) */
  addCat: (type: Cat['type']) => void;
  /** Buy a cat from the market */
  buyFromMarket: (listingId: string) => void;
  /** Sell a cat */
  sellCat: (catId: string) => void;
  /** Rename a cat */
  renameCat: (catId: string, newName: string) => boolean;
  /** Comfort an unhappy cat */
  comfortCat: (catId: string) => void;
  /** Add a cat received from gift/trade */
  addReceivedCat: (cat: Cat) => void;
  /** Update cat's visual appearance */
  updateCatAppearance: (catId: string, appearance: CatAppearance) => void;
  /** Update cat's AI portrait URL */
  updateCatPortrait: (catId: string, portraitUrl: string, hash?: string) => void;
  /** Set specialization on a cat */
  setSpecialization: (catId: string, type: import('@/types/specializations').SpecializationType) => void;
  /** Add XP to a specialized cat */
  addSpecializationXP: (catId: string, amount: number) => void;

  // ============ Resources (6 actions) ============
  /** Purchase resources from shop */
  buyResource: (resource: keyof Resources, cost: number) => void;
  /** Feed all cats */
  feedCats: () => void;
  /** Feed a single cat */
  feedSingleCat: (catId: string) => void;
  /** Use toys for playtime */
  useToys: () => void;
  /** Heal a cat with medicine */
  useMedicine: (catId: string) => void;
  /** Add reward (coins + resources) from daily login, etc. */
  addReward: (coins: number, resources?: Partial<Resources>) => void;

  // ============ Training (4 actions) ============
  /** Train a cat on a specific trick */
  trainCat: (catId: string, trickId: TrickId) => void;
  /** Rest a tired cat */
  restCat: (catId: string) => void;
  /** Do a group activity with cats */
  doGroupActivity: (groupId: string, activityType: 'play' | 'treat' | 'nap') => void;
  /** Socialize two cats together */
  socializeCats: (cat1Id: string, cat2Id: string) => void;

  // ============ Shows (1 action) ============
  /** Enter cats in a show competition */
  catShow: (tier?: ShowTier) => void;

  // ============ Breeding (1 action) ============
  /** Breed two cats to create a kitten */
  breedCats: (cat1Id: string, cat2Id: string) => void;

  // ============ Bulk Actions (6 actions) ============
  /** Heal all sick cats (health < 70) */
  healAllSickCats: () => void;
  /** Rest all tired cats (restLevel < 50) */
  restAllTiredCats: () => void;
  /** Comfort all unhappy cats (happiness < 50) */
  comfortAllUnhappyCats: () => void;
  /** Train all available cats for the day */
  trainAllAvailableCats: () => void;
  /** Sell multiple cats at once */
  sellSelectedCats: (catIds: string[]) => void;
  /** Socialize all neglected relationships */
  socializeAllNeglected: () => void;

  // ============ Save/Load (6 actions) ============
  /** Save game to localStorage */
  saveGame: () => void;
  /** Load game from localStorage */
  loadGame: () => void;
  /** Check if a saved game exists */
  hasSaveGame: () => boolean;
  /** Get the day from saved game */
  getSaveDay: () => number | null;
  /** Reset game to initial state */
  resetGame: () => void;
  /** Load from cloud save data */
  loadFromData: (
    gameState: GameState, 
    kittens: number, 
    relationshipData?: { relationships: any[]; events: any[] }
  ) => void;

  // ============ Costumes (2 actions) ============
  /** Purchase a costume */
  buyCostume: (costumeId: string) => void;
  /** Equip or unequip a costume on a cat */
  equipCostume: (catId: string, costumeId: string | null) => void;

  // ============ Core/Daily (8 actions) ============
  /** Complete a chore for money */
  doChore: (choreId: string, baseReward: number) => void;
  /** Upgrade housing */
  upgradeHouse: () => void;
  /** Advance to next day */
  nextDay: () => void;
  /** Process random daily event */
  processDailyEvent: () => void;
  /** Clear current daily event */
  clearDailyEvent: () => void;
  /** Dismiss current message */
  dismissMessage: () => void;
  /** Deduct money from game state */
  deductMoney: (amount: number, reason: string) => boolean;
  /** Set money directly (for backend sync) */
  setMoney: (newMoney: number) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Generate a unique ID */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/** Create default trick progress object with all tricks at 0 */
export const createDefaultTrickProgress = (): Record<TrickId, number> => ({
  sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0
});

/** Get a random breed based on cat type */
export const getRandomBreed = (type: Cat['type']): CatBreed => {
  if (type === 'stray') return 'stray';
  if (type === 'adopted') {
    const breeds: CatBreed[] = ['stray', 'tabby', 'persian'];
    return breeds[Math.floor(Math.random() * breeds.length)];
  }
  const pureBreeds: CatBreed[] = ['persian', 'siamese', 'maine-coon', 'british-shorthair', 'ragdoll', 'bengal'];
  return pureBreeds[Math.floor(Math.random() * pureBreeds.length)];
};

/** Create initial achievements from definitions */
export const createInitialAchievements = (): Achievement[] => 
  ACHIEVEMENT_DEFS.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    target: a.target,
    unlocked: false,
  }));

/** Generate market listings for cat shop */
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

/** Create the initial game state */
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

/** LocalStorage key for saves */
export const SAVE_KEY = 'cat-farm-save';

/** Show cooldown in days */
export const SHOW_COOLDOWN_DAYS = 20;
