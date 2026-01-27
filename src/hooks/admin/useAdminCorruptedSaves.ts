/**
 * @fileoverview useAdminCorruptedSaves - Admin hook for detecting and repairing corrupted game saves
 *
 * Provides functionality to:
 * - Scan all game saves for corruption issues
 * - Detect negative values, NaN, invalid data types
 * - Repair individual or bulk saves
 * - Log all repair actions to admin activity log
 *
 * @module hooks/admin/useAdminCorruptedSaves
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActivityLog } from './useAdminActivityLog';
import { Json } from '@/integrations/supabase/types';

/**
 * Types of corruption that can be detected
 */
export type CorruptionType =
  | 'negative_earnings'
  | 'negative_money'
  | 'invalid_money'
  | 'bad_cat_data'
  | 'bad_resources'
  | 'invalid_house'
  | 'missing_fields';

/**
 * Single issue detected in a game save
 */
export interface CorruptionIssue {
  type: CorruptionType;
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Corrupted save with user info and detected issues
 */
export interface CorruptedSave {
  userId: string;
  email: string | null;
  displayName: string | null;
  lastPlayedAt: string | null;
  issues: CorruptionIssue[];
  gameState: Record<string, unknown>;
}

/**
 * Statistics about corruption across all saves
 */
export interface CorruptionStats {
  totalSaves: number;
  corruptedSaves: number;
  negativeEarnings: number;
  negativeMoney: number;
  invalidMoney: number;
  badCatData: number;
  badResources: number;
  invalidHouse: number;
  missingFields: number;
}

/**
 * Result of a repair operation
 */
export interface RepairResult {
  userId: string;
  issuesFound: string[];
  changesApplied: string[];
  success: boolean;
  error?: string;
}

const VALID_HOUSE_SIZES = ['apartment', 'house', 'mansion', 'farm'];

/**
 * Detect corruption issues in a game state
 */
export function detectCorruption(gameState: Record<string, unknown>): CorruptionIssue[] {
  const issues: CorruptionIssue[] = [];

  // Check totalMoneyEarned
  const totalMoneyEarned = gameState.totalMoneyEarned;
  if (typeof totalMoneyEarned !== 'number' || !isFinite(totalMoneyEarned)) {
    issues.push({
      type: 'invalid_money',
      field: 'totalMoneyEarned',
      currentValue: totalMoneyEarned,
      suggestedValue: 0,
      severity: 'critical',
    });
  } else if (totalMoneyEarned < 0) {
    issues.push({
      type: 'negative_earnings',
      field: 'totalMoneyEarned',
      currentValue: totalMoneyEarned,
      suggestedValue: 0,
      severity: 'high',
    });
  }

  // Check money
  const money = gameState.money;
  if (typeof money !== 'number' || !isFinite(money)) {
    issues.push({
      type: 'invalid_money',
      field: 'money',
      currentValue: money,
      suggestedValue: 100,
      severity: 'critical',
    });
  } else if (money < 0) {
    issues.push({
      type: 'negative_money',
      field: 'money',
      currentValue: money,
      suggestedValue: 0,
      severity: 'high',
    });
  }

  // Check resources
  const resources = gameState.resources as Record<string, unknown> | undefined;
  if (resources && typeof resources === 'object') {
    for (const [key, value] of Object.entries(resources)) {
      if (typeof value !== 'number' || !isFinite(value) || value < 0) {
        issues.push({
          type: 'bad_resources',
          field: `resources.${key}`,
          currentValue: value,
          suggestedValue: 0,
          severity: 'medium',
        });
      }
    }
  }

  // Check cats array
  const cats = gameState.cats;
  if (Array.isArray(cats)) {
    cats.forEach((cat, index) => {
      if (typeof cat !== 'object' || cat === null) {
        issues.push({
          type: 'bad_cat_data',
          field: `cats[${index}]`,
          currentValue: cat,
          suggestedValue: 'remove',
          severity: 'high',
        });
        return;
      }

      const catObj = cat as Record<string, unknown>;

      // Check cat numeric fields
      const numericFields = ['health', 'happiness', 'hunger', 'age', 'value', 'grade'];
      for (const field of numericFields) {
        const val = catObj[field];
        if (typeof val !== 'number' || !isFinite(val) || val < 0) {
          issues.push({
            type: 'bad_cat_data',
            field: `cats[${index}].${field}`,
            currentValue: val,
            suggestedValue: field === 'health' || field === 'happiness' || field === 'hunger' ? 100 : 0,
            severity: 'medium',
          });
        }
      }
    });
  }

  // Check house size
  const houseSize = gameState.houseSize;
  if (typeof houseSize !== 'string' || !VALID_HOUSE_SIZES.includes(houseSize)) {
    issues.push({
      type: 'invalid_house',
      field: 'houseSize',
      currentValue: houseSize,
      suggestedValue: 'apartment',
      severity: 'low',
    });
  }

  // Check for missing required fields
  const requiredFields = ['cats', 'money', 'day', 'resources'];
  for (const field of requiredFields) {
    if (!(field in gameState) || gameState[field] === undefined || gameState[field] === null) {
      issues.push({
        type: 'missing_fields',
        field,
        currentValue: undefined,
        suggestedValue: field === 'cats' ? [] : field === 'money' ? 100 : field === 'day' ? 1 : {},
        severity: 'high',
      });
    }
  }

  return issues;
}

/**
 * Apply repairs to a game state
 */
export function repairGameState(
  gameState: Record<string, unknown>
): { repairedState: Record<string, unknown>; changes: string[] } {
  const changes: string[] = [];
  const repairedState = { ...gameState };

  // Fix totalMoneyEarned
  const totalMoneyEarned = repairedState.totalMoneyEarned;
  if (typeof totalMoneyEarned !== 'number' || !isFinite(totalMoneyEarned) || totalMoneyEarned < 0) {
    changes.push(`totalMoneyEarned: ${totalMoneyEarned} → 0`);
    repairedState.totalMoneyEarned = 0;
  }

  // Fix money
  const money = repairedState.money;
  if (typeof money !== 'number' || !isFinite(money)) {
    changes.push(`money: ${money} → 100`);
    repairedState.money = 100;
  } else if (money < 0) {
    changes.push(`money: ${money} → 0`);
    repairedState.money = 0;
  }

  // Fix resources
  const resources = repairedState.resources as Record<string, unknown> | undefined;
  if (resources && typeof resources === 'object') {
    const fixedResources = { ...resources };
    for (const [key, value] of Object.entries(fixedResources)) {
      if (typeof value !== 'number' || !isFinite(value) || value < 0) {
        changes.push(`resources.${key}: ${value} → 0`);
        fixedResources[key] = 0;
      }
    }
    repairedState.resources = fixedResources;
  } else {
    changes.push('resources: missing → default');
    repairedState.resources = { food: 5, medicine: 2, toys: 2, treats: 3 };
  }

  // Fix cats array
  const cats = repairedState.cats;
  if (Array.isArray(cats)) {
    const fixedCats = cats
      .filter((cat) => typeof cat === 'object' && cat !== null)
      .map((cat, index) => {
        const catObj = cat as Record<string, unknown>;
        const fixedCat = { ...catObj };

        // Clamp numeric fields
        if (typeof fixedCat.health !== 'number' || !isFinite(fixedCat.health as number)) {
          changes.push(`cats[${index}].health: ${fixedCat.health} → 100`);
          fixedCat.health = 100;
        } else {
          fixedCat.health = Math.max(0, Math.min(100, fixedCat.health as number));
        }

        if (typeof fixedCat.happiness !== 'number' || !isFinite(fixedCat.happiness as number)) {
          changes.push(`cats[${index}].happiness: ${fixedCat.happiness} → 100`);
          fixedCat.happiness = 100;
        } else {
          fixedCat.happiness = Math.max(0, Math.min(100, fixedCat.happiness as number));
        }

        if (typeof fixedCat.hunger !== 'number' || !isFinite(fixedCat.hunger as number)) {
          changes.push(`cats[${index}].hunger: ${fixedCat.hunger} → 100`);
          fixedCat.hunger = 100;
        } else {
          fixedCat.hunger = Math.max(0, Math.min(100, fixedCat.hunger as number));
        }

        if (typeof fixedCat.age !== 'number' || !isFinite(fixedCat.age as number) || (fixedCat.age as number) < 0) {
          changes.push(`cats[${index}].age: ${fixedCat.age} → 0`);
          fixedCat.age = 0;
        }

        if (typeof fixedCat.value !== 'number' || !isFinite(fixedCat.value as number) || (fixedCat.value as number) < 0) {
          changes.push(`cats[${index}].value: ${fixedCat.value} → 30`);
          fixedCat.value = 30;
        }

        if (typeof fixedCat.grade !== 'number' || !isFinite(fixedCat.grade as number)) {
          changes.push(`cats[${index}].grade: ${fixedCat.grade} → 1`);
          fixedCat.grade = 1;
        } else {
          fixedCat.grade = Math.max(1, Math.min(20, fixedCat.grade as number));
        }

        return fixedCat;
      });

    if (fixedCats.length !== cats.length) {
      changes.push(`Removed ${cats.length - fixedCats.length} invalid cat entries`);
    }
    repairedState.cats = fixedCats;
  } else {
    changes.push('cats: invalid → []');
    repairedState.cats = [];
  }

  // Fix house size
  const houseSize = repairedState.houseSize;
  if (typeof houseSize !== 'string' || !VALID_HOUSE_SIZES.includes(houseSize)) {
    changes.push(`houseSize: ${houseSize} → apartment`);
    repairedState.houseSize = 'apartment';
  }

  // Ensure required fields exist
  if (!('day' in repairedState) || typeof repairedState.day !== 'number') {
    changes.push(`day: ${repairedState.day} → 1`);
    repairedState.day = 1;
  }

  return { repairedState, changes };
}

/**
 * Hook to fetch and analyze corrupted saves
 */
export function useAdminCorruptedSaves() {
  return useQuery({
    queryKey: ['admin-corrupted-saves'],
    queryFn: async (): Promise<{ saves: CorruptedSave[]; stats: CorruptionStats }> => {
      // Fetch all game saves with profile info (admin only via RLS)
      const { data: saves, error } = await supabase
        .from('game_saves')
        .select(`
          user_id,
          game_state,
          last_played_at,
          profiles!inner(email, display_name)
        `)
        .limit(500);

      if (error) throw error;

      const stats: CorruptionStats = {
        totalSaves: saves?.length || 0,
        corruptedSaves: 0,
        negativeEarnings: 0,
        negativeMoney: 0,
        invalidMoney: 0,
        badCatData: 0,
        badResources: 0,
        invalidHouse: 0,
        missingFields: 0,
      };

      const corruptedSaves: CorruptedSave[] = [];

      for (const save of saves || []) {
        const gameState = save.game_state as Record<string, unknown>;
        const issues = detectCorruption(gameState);

        if (issues.length > 0) {
          stats.corruptedSaves++;

          // Count issue types
          for (const issue of issues) {
            switch (issue.type) {
              case 'negative_earnings':
                stats.negativeEarnings++;
                break;
              case 'negative_money':
                stats.negativeMoney++;
                break;
              case 'invalid_money':
                stats.invalidMoney++;
                break;
              case 'bad_cat_data':
                stats.badCatData++;
                break;
              case 'bad_resources':
                stats.badResources++;
                break;
              case 'invalid_house':
                stats.invalidHouse++;
                break;
              case 'missing_fields':
                stats.missingFields++;
                break;
            }
          }

          const profile = save.profiles as { email: string | null; display_name: string | null } | null;

          corruptedSaves.push({
            userId: save.user_id,
            email: profile?.email || null,
            displayName: profile?.display_name || null,
            lastPlayedAt: save.last_played_at,
            issues,
            gameState,
          });
        }
      }

      return { saves: corruptedSaves, stats };
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to repair a single game save
 */
export function useRepairGameSave() {
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();

  return useMutation({
    mutationFn: async ({
      userId,
      dryRun = false,
    }: {
      userId: string;
      dryRun?: boolean;
    }): Promise<RepairResult> => {
      // Fetch current save
      const { data: save, error: fetchError } = await supabase
        .from('game_saves')
        .select('game_state')
        .eq('user_id', userId)
        .single();

      if (fetchError || !save) {
        return {
          userId,
          issuesFound: [],
          changesApplied: [],
          success: false,
          error: 'Failed to fetch save',
        };
      }

      const gameState = save.game_state as Record<string, unknown>;
      const issues = detectCorruption(gameState);
      const issuesFound = issues.map((i) => `${i.field}: ${i.currentValue}`);

      if (issues.length === 0) {
        return {
          userId,
          issuesFound: [],
          changesApplied: [],
          success: true,
        };
      }

      const { repairedState, changes } = repairGameState(gameState);

      if (dryRun) {
        return {
          userId,
          issuesFound,
          changesApplied: changes,
          success: true,
        };
      }

      // Apply repair to database
      const { error: updateError } = await supabase
        .from('game_saves')
        .update({
          game_state: repairedState as unknown as Json,
          last_played_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return {
          userId,
          issuesFound,
          changesApplied: [],
          success: false,
          error: 'Failed to update save',
        };
      }

      // Log admin activity
      await logActivity({
        actionType: 'game_save_repair',
        actionDescription: `Repaired ${issues.length} issues in game save`,
        targetUserId: userId,
        targetTable: 'game_saves',
        metadata: { issues: issuesFound, changes },
      });

      return {
        userId,
        issuesFound,
        changesApplied: changes,
        success: true,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corrupted-saves'] });
    },
  });
}

/**
 * Hook to repair multiple game saves in bulk
 */
export function useBulkRepairGameSaves() {
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();

  return useMutation({
    mutationFn: async (userIds: string[]): Promise<{ results: RepairResult[]; totalFixed: number }> => {
      const results: RepairResult[] = [];
      let totalFixed = 0;

      for (const userId of userIds) {
        // Fetch save
        const { data: save, error: fetchError } = await supabase
          .from('game_saves')
          .select('game_state')
          .eq('user_id', userId)
          .single();

        if (fetchError || !save) {
          results.push({
            userId,
            issuesFound: [],
            changesApplied: [],
            success: false,
            error: 'Failed to fetch',
          });
          continue;
        }

        const gameState = save.game_state as Record<string, unknown>;
        const issues = detectCorruption(gameState);

        if (issues.length === 0) {
          results.push({
            userId,
            issuesFound: [],
            changesApplied: [],
            success: true,
          });
          continue;
        }

        const { repairedState, changes } = repairGameState(gameState);

        const { error: updateError } = await supabase
          .from('game_saves')
          .update({
            game_state: repairedState as unknown as Json,
            last_played_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          results.push({
            userId,
            issuesFound: issues.map((i) => `${i.field}: ${i.currentValue}`),
            changesApplied: [],
            success: false,
            error: 'Failed to update',
          });
        } else {
          totalFixed++;
          results.push({
            userId,
            issuesFound: issues.map((i) => `${i.field}: ${i.currentValue}`),
            changesApplied: changes,
            success: true,
          });
        }
      }

      // Log bulk action
      await logActivity({
        actionType: 'bulk_game_save_repair',
        actionDescription: `Bulk repaired ${totalFixed}/${userIds.length} game saves`,
        targetTable: 'game_saves',
        metadata: { userCount: userIds.length, fixedCount: totalFixed },
      });

      return { results, totalFixed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corrupted-saves'] });
    },
  });
}
