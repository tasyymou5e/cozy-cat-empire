/**
 * @fileoverview Save data migration utility
 *
 * Handles upgrading old save formats to the current schema.
 * Each migration function transforms data from version N to N+1.
 *
 * @module lib/saveMigration
 */

import { GameState, Cat, Resources, Achievement, ACHIEVEMENT_DEFS } from '@/types/game';
import { TrickId } from '@/types/grading';
import { isValidGameState } from '@/types/guards';

// ============================================================================
// Version Constants
// ============================================================================

/** Current save format version */
export const CURRENT_SAVE_VERSION = 3;

/** Minimum supported version (older saves cannot be migrated) */
const MIN_SUPPORTED_VERSION = 1;

// ============================================================================
// Types
// ============================================================================

/** Raw save data before migration */
export interface RawSaveData {
  version?: number;
  state?: unknown;
  game_state?: unknown;
  kittensBreed?: number;
  kittens_bred?: number;
  relationships?: unknown;
  savedAt?: string;
  last_played_at?: string;
}

/** Migrated save data */
export interface MigratedSaveData {
  version: number;
  state: GameState;
  kittensBreed: number;
  relationships: {
    relationships: unknown[];
    events: unknown[];
    maintenanceStreak?: number;
    longestMaintenanceStreak?: number;
    lastMaintenanceDay?: number | null;
  };
  savedAt: string;
}

/** Migration result */
export interface MigrationResult {
  success: true;
  data: MigratedSaveData;
  migratedFrom: number;
  warnings: string[];
}

/** Migration error */
export interface MigrationError {
  success: false;
  error: string;
  details?: string;
}

export type MigrationOutcome = MigrationResult | MigrationError;

// ============================================================================
// Default Values
// ============================================================================

/** Default resources for missing or invalid resource data */
const DEFAULT_RESOURCES: Resources = {
  food: 10,
  medicine: 5,
  toys: 5,
  treats: 5,
};

/** Create default cat stats for missing fields */
function getDefaultCatFields(): Partial<Cat> {
  return {
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
    tricksLearned: [],
    trickProgress: {} as Record<TrickId, number>,
    showWins: 0,
    isForSale: false,
  };
}

/** Valid trick IDs for validation */
const VALID_TRICK_IDS: TrickId[] = ['sit', 'paw', 'rollOver', 'jump', 'fetch'];

/** Create default achievements from definitions */
function createDefaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    target: def.target,
    unlocked: false,
  }));
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Detect save format version from raw data.
 * Older saves may not have a version field.
 */
function detectVersion(data: RawSaveData): number {
  // Explicit version field
  if (typeof data.version === 'number') {
    return data.version;
  }

  // Check for cloud save format (game_state instead of state)
  const state = (data.game_state ?? data.state) as Record<string, unknown> | undefined;
  if (!state) {
    return 1; // Assume oldest version for corrupted data
  }

  // Version 2+ has catCostumes
  if ('catCostumes' in state && typeof state.catCostumes === 'object') {
    // Version 3+ has proper achievement structure
    if (Array.isArray(state.achievements) && state.achievements.length > 0) {
      const firstAch = state.achievements[0] as Record<string, unknown>;
      if ('unlockedAt' in firstAch || firstAch.unlocked !== undefined) {
        return 3;
      }
    }
    return 2;
  }

  return 1;
}

/**
 * Migrate from version 1 to version 2.
 * Adds: catCostumes, ownedCostumes, restLevel, feedingScore
 */
function migrateV1ToV2(state: Record<string, unknown>): Record<string, unknown> {
  const migrated = { ...state };

  // Add costume tracking
  if (!('ownedCostumes' in migrated)) {
    migrated.ownedCostumes = [];
  }
  if (!('catCostumes' in migrated)) {
    migrated.catCostumes = {};
  }

  // Migrate cats
  if (Array.isArray(migrated.cats)) {
    migrated.cats = migrated.cats.map((cat: unknown) => {
      if (typeof cat !== 'object' || cat === null) return cat;
      const catObj = cat as Record<string, unknown>;
      return {
        ...catObj,
        restLevel: catObj.restLevel ?? 100,
        feedingScore: catObj.feedingScore ?? 0,
        lastTrainingDay: catObj.lastTrainingDay ?? 0,
      };
    });
  }

  return migrated;
}

/**
 * Migrate from version 2 to version 3.
 * Adds: trickProgress, tricksLearned as arrays, proper achievement structure
 */
function migrateV2ToV3(state: Record<string, unknown>): Record<string, unknown> {
  const migrated = { ...state };

  // Migrate cats - ensure trick arrays exist
  if (Array.isArray(migrated.cats)) {
    migrated.cats = migrated.cats.map((cat: unknown) => {
      if (typeof cat !== 'object' || cat === null) return cat;
      const catObj = cat as Record<string, unknown>;
      return {
        ...catObj,
        tricksLearned: Array.isArray(catObj.tricksLearned) ? catObj.tricksLearned : [],
        trickProgress:
          typeof catObj.trickProgress === 'object' && catObj.trickProgress !== null
            ? catObj.trickProgress
            : {},
      };
    });
  }

  // Ensure all achievements from ACHIEVEMENT_DEFS exist
  const existingAchievements = Array.isArray(migrated.achievements)
    ? (migrated.achievements as Achievement[])
    : [];

  const existingIds = new Set(existingAchievements.map((a) => a.id));
  const defaultAchievements = createDefaultAchievements();

  // Add missing achievements
  const mergedAchievements = [...existingAchievements];
  for (const def of defaultAchievements) {
    if (!existingIds.has(def.id)) {
      mergedAchievements.push(def);
    }
  }

  migrated.achievements = mergedAchievements;

  return migrated;
}

// ============================================================================
// Repair Functions
// ============================================================================

/**
 * Repair individual cat data, filling in missing required fields.
 */
function repairCat(cat: unknown, index: number): Cat | null {
  if (typeof cat !== 'object' || cat === null) {
    console.warn(`Cat at index ${index} is invalid, skipping`);
    return null;
  }

  const catObj = cat as Record<string, unknown>;
  const defaults = getDefaultCatFields();

  // Required string fields
  const id = typeof catObj.id === 'string' ? catObj.id : `repaired-cat-${index}-${Date.now()}`;
  const name = typeof catObj.name === 'string' ? catObj.name : `Cat ${index + 1}`;
  const type =
    catObj.type === 'stray' || catObj.type === 'adopted' || catObj.type === 'pure'
      ? catObj.type
      : 'stray';
  const breed = typeof catObj.breed === 'string' ? catObj.breed : 'stray';
  const personality = typeof catObj.personality === 'string' ? catObj.personality : 'curious';

  // Required number fields with bounds
  const clamp = (val: unknown, min: number, max: number, def: number): number => {
    if (typeof val !== 'number' || Number.isNaN(val)) return def;
    return Math.max(min, Math.min(max, val));
  };

  return {
    id,
    name,
    type: type as Cat['type'],
    breed: breed as Cat['breed'],
    personality: personality as Cat['personality'],
    health: clamp(catObj.health, 0, 100, 100),
    happiness: clamp(catObj.happiness, 0, 100, 80),
    hunger: clamp(catObj.hunger, 0, 100, 80),
    value: typeof catObj.value === 'number' ? Math.max(0, catObj.value) : 50,
    age: typeof catObj.age === 'number' ? Math.max(0, Math.floor(catObj.age)) : 0,
    grade: clamp(catObj.grade, 1, 20, 1),
    showWins:
      typeof catObj.showWins === 'number' ? Math.max(0, Math.floor(catObj.showWins)) : defaults.showWins!,
    isForSale: typeof catObj.isForSale === 'boolean' ? catObj.isForSale : defaults.isForSale!,
    restLevel: clamp(catObj.restLevel, 0, 100, 100),
    feedingScore:
      typeof catObj.feedingScore === 'number'
        ? Math.max(0, catObj.feedingScore)
        : defaults.feedingScore!,
    lastTrainingDay:
      typeof catObj.lastTrainingDay === 'number'
        ? Math.max(0, Math.floor(catObj.lastTrainingDay))
        : defaults.lastTrainingDay!,
    tricksLearned: Array.isArray(catObj.tricksLearned)
      ? catObj.tricksLearned.filter((t): t is TrickId => 
          typeof t === 'string' && VALID_TRICK_IDS.includes(t as TrickId)
        )
      : [],
    trickProgress:
      typeof catObj.trickProgress === 'object' && catObj.trickProgress !== null
        ? (catObj.trickProgress as Record<TrickId, number>)
        : ({} as Record<TrickId, number>),
    // Optional fields
    appearance:
      typeof catObj.appearance === 'object' && catObj.appearance !== null
        ? (catObj.appearance as Cat['appearance'])
        : undefined,
    portraitUrl: typeof catObj.portraitUrl === 'string' ? catObj.portraitUrl : undefined,
    portraitGeneratedAt:
      typeof catObj.portraitGeneratedAt === 'number' ? catObj.portraitGeneratedAt : undefined,
    appearanceHash: typeof catObj.appearanceHash === 'string' ? catObj.appearanceHash : undefined,
    specialization:
      typeof catObj.specialization === 'object' && catObj.specialization !== null
        ? (catObj.specialization as Cat['specialization'])
        : undefined,
  };
}

/**
 * Repair resources object, filling in missing fields.
 */
function repairResources(resources: unknown): Resources {
  if (typeof resources !== 'object' || resources === null) {
    return { ...DEFAULT_RESOURCES };
  }

  const res = resources as Record<string, unknown>;
  return {
    food: typeof res.food === 'number' ? Math.max(0, Math.floor(res.food)) : DEFAULT_RESOURCES.food,
    medicine:
      typeof res.medicine === 'number'
        ? Math.max(0, Math.floor(res.medicine))
        : DEFAULT_RESOURCES.medicine,
    toys: typeof res.toys === 'number' ? Math.max(0, Math.floor(res.toys)) : DEFAULT_RESOURCES.toys,
    treats:
      typeof res.treats === 'number' ? Math.max(0, Math.floor(res.treats)) : DEFAULT_RESOURCES.treats,
  };
}

/**
 * Repair the full game state, applying defaults for missing fields.
 */
function repairGameState(state: Record<string, unknown>, warnings: string[]): GameState {
  // Repair cats array
  const rawCats = Array.isArray(state.cats) ? state.cats : [];
  const cats = rawCats.map((cat, i) => repairCat(cat, i)).filter((c): c is Cat => c !== null);

  if (rawCats.length !== cats.length) {
    warnings.push(`Removed ${rawCats.length - cats.length} invalid cat(s)`);
  }

  // Validate house size
  const validHouseSizes = ['apartment', 'house', 'mansion', 'farm'];
  const houseSize = validHouseSizes.includes(state.houseSize as string)
    ? (state.houseSize as GameState['houseSize'])
    : 'apartment';

  if (state.houseSize && !validHouseSizes.includes(state.houseSize as string)) {
    warnings.push(`Invalid house size "${state.houseSize}", reset to apartment`);
  }

  // Repair market listings
  const marketListings = Array.isArray(state.marketListings) ? state.marketListings : [];

  // Repair achievements
  const achievements = Array.isArray(state.achievements)
    ? (state.achievements as Achievement[])
    : createDefaultAchievements();

  return {
    cats,
    money: typeof state.money === 'number' ? Math.max(0, state.money) : 100,
    space: typeof state.space === 'number' ? Math.max(5, Math.floor(state.space)) : 5,
    houseSize,
    acres: typeof state.acres === 'number' ? Math.max(0, Math.floor(state.acres)) : 0,
    day: typeof state.day === 'number' ? Math.max(1, Math.floor(state.day)) : 1,
    resources: repairResources(state.resources),
    reputation: typeof state.reputation === 'number' ? state.reputation : 0,
    totalShowWins:
      typeof state.totalShowWins === 'number' ? Math.max(0, Math.floor(state.totalShowWins)) : 0,
    catsAdopted:
      typeof state.catsAdopted === 'number' ? Math.max(0, Math.floor(state.catsAdopted)) : 0,
    totalMoneyEarned:
      typeof state.totalMoneyEarned === 'number' ? Math.max(0, state.totalMoneyEarned) : 0,
    marketListings: marketListings as GameState['marketListings'],
    achievements,
    breedingCooldown:
      typeof state.breedingCooldown === 'number' ? Math.max(0, Math.floor(state.breedingCooldown)) : 0,
    showCooldown:
      typeof state.showCooldown === 'number' ? Math.max(0, Math.floor(state.showCooldown)) : 0,
    ownedCostumes: Array.isArray(state.ownedCostumes)
      ? state.ownedCostumes.filter((c): c is string => typeof c === 'string')
      : [],
    catCostumes:
      typeof state.catCostumes === 'object' && state.catCostumes !== null
        ? (state.catCostumes as Record<string, string>)
        : {},
  };
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Migrate save data from any version to the current version.
 *
 * @param rawData - Raw save data from localStorage or cloud
 * @returns Migration result with migrated data or error
 *
 * @example
 * ```typescript
 * const saved = localStorage.getItem('catFarmSave');
 * if (saved) {
 *   const result = migrateSaveData(JSON.parse(saved));
 *   if (result.success) {
 *     loadGame(result.data);
 *     if (result.warnings.length) console.warn('Migration warnings:', result.warnings);
 *   } else {
 *     console.error('Migration failed:', result.error);
 *   }
 * }
 * ```
 */
export function migrateSaveData(rawData: unknown): MigrationOutcome {
  const warnings: string[] = [];

  // Validate input is an object
  if (typeof rawData !== 'object' || rawData === null) {
    return {
      success: false,
      error: 'Invalid save data format',
      details: 'Expected an object but received ' + typeof rawData,
    };
  }

  const data = rawData as RawSaveData;

  // Detect version
  const detectedVersion = detectVersion(data);

  if (detectedVersion < MIN_SUPPORTED_VERSION) {
    return {
      success: false,
      error: 'Save format too old',
      details: `Version ${detectedVersion} is no longer supported. Minimum: ${MIN_SUPPORTED_VERSION}`,
    };
  }

  // Extract state (handle both local and cloud formats)
  let state = (data.game_state ?? data.state) as Record<string, unknown> | undefined;

  if (!state || typeof state !== 'object') {
    return {
      success: false,
      error: 'Missing game state',
      details: 'Save data does not contain a valid game state object',
    };
  }

  // Apply migrations sequentially
  let currentVersion = detectedVersion;

  if (currentVersion < 2) {
    state = migrateV1ToV2(state);
    warnings.push('Migrated from v1: Added costume tracking and cat rest levels');
    currentVersion = 2;
  }

  if (currentVersion < 3) {
    state = migrateV2ToV3(state);
    warnings.push('Migrated from v2: Updated trick tracking and achievements');
    currentVersion = 3;
  }

  // Repair any remaining issues
  const repairedState = repairGameState(state, warnings);

  // Validate final result
  if (!isValidGameState(repairedState)) {
    return {
      success: false,
      error: 'Migration produced invalid state',
      details: 'The migrated game state failed validation',
    };
  }

  // Extract relationship data
  const relationships = (data.relationships ?? {
    relationships: [],
    events: [],
  }) as MigratedSaveData['relationships'];

  return {
    success: true,
    data: {
      version: CURRENT_SAVE_VERSION,
      state: repairedState,
      kittensBreed: data.kittensBreed ?? data.kittens_bred ?? 0,
      relationships: {
        relationships: Array.isArray(relationships.relationships) ? relationships.relationships : [],
        events: Array.isArray(relationships.events) ? relationships.events : [],
        maintenanceStreak: relationships.maintenanceStreak ?? 0,
        longestMaintenanceStreak: relationships.longestMaintenanceStreak ?? 0,
        lastMaintenanceDay: relationships.lastMaintenanceDay ?? null,
      },
      savedAt: data.savedAt ?? data.last_played_at ?? new Date().toISOString(),
    },
    migratedFrom: detectedVersion,
    warnings,
  };
}

/**
 * Check if save data needs migration.
 */
export function needsMigration(rawData: unknown): boolean {
  if (typeof rawData !== 'object' || rawData === null) return true;
  const data = rawData as RawSaveData;
  return detectVersion(data) < CURRENT_SAVE_VERSION;
}

/**
 * Get version info for display purposes.
 */
export function getSaveVersionInfo(rawData: unknown): {
  currentVersion: number;
  targetVersion: number;
  needsMigration: boolean;
} {
  const detected = typeof rawData === 'object' && rawData !== null ? detectVersion(rawData as RawSaveData) : 0;
  return {
    currentVersion: detected,
    targetVersion: CURRENT_SAVE_VERSION,
    needsMigration: detected < CURRENT_SAVE_VERSION,
  };
}
