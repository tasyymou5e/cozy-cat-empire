/**
 * @fileoverview Unit tests for save migration utility
 */

import { describe, it, expect } from 'vitest';
import {
  migrateSaveData,
  needsMigration,
  getSaveVersionInfo,
  CURRENT_SAVE_VERSION,
} from '../saveMigration';

describe('saveMigration', () => {
  // ============================================================================
  // Version Detection Tests
  // ============================================================================

  describe('getSaveVersionInfo', () => {
    it('detects v1 saves without version field', () => {
      const v1Save = {
        state: {
          cats: [],
          money: 100,
          day: 1,
        },
      };

      const info = getSaveVersionInfo(v1Save);
      expect(info.currentVersion).toBe(1);
      expect(info.targetVersion).toBe(CURRENT_SAVE_VERSION);
      expect(info.needsMigration).toBe(true);
    });

    it('detects v2 saves with catCostumes', () => {
      const v2Save = {
        state: {
          cats: [],
          money: 100,
          day: 1,
          catCostumes: {},
          ownedCostumes: [],
        },
      };

      const info = getSaveVersionInfo(v2Save);
      expect(info.currentVersion).toBe(2);
    });

    it('detects v3 saves with proper achievements', () => {
      const v3Save = {
        version: 3,
        state: {
          cats: [],
          money: 100,
          day: 1,
          catCostumes: {},
          ownedCostumes: [],
          achievements: [{ id: 'first_cat', unlocked: true }],
        },
      };

      const info = getSaveVersionInfo(v3Save);
      expect(info.currentVersion).toBe(3);
      expect(info.needsMigration).toBe(false);
    });

    it('handles cloud save format (game_state instead of state)', () => {
      const cloudSave = {
        game_state: {
          cats: [],
          money: 100,
          day: 1,
        },
      };

      const info = getSaveVersionInfo(cloudSave);
      expect(info.currentVersion).toBe(1);
    });
  });

  describe('needsMigration', () => {
    it('returns true for v1 saves', () => {
      expect(needsMigration({ state: { cats: [] } })).toBe(true);
    });

    it('returns true for v2 saves', () => {
      expect(
        needsMigration({ state: { cats: [], catCostumes: {} } })
      ).toBe(true);
    });

    it('returns false for current version saves', () => {
      const currentSave = {
        version: CURRENT_SAVE_VERSION,
        state: {
          cats: [],
          catCostumes: {},
          achievements: [{ id: 'test', unlocked: true }],
        },
      };
      expect(needsMigration(currentSave)).toBe(false);
    });

    it('returns true for invalid data', () => {
      expect(needsMigration(null)).toBe(true);
      expect(needsMigration(undefined)).toBe(true);
      expect(needsMigration('string')).toBe(true);
    });
  });

  // ============================================================================
  // Migration Tests
  // ============================================================================

  describe('migrateSaveData', () => {
    describe('v1 → v2 migration', () => {
      it('adds costume tracking fields', () => {
        const v1Save = {
          state: {
            cats: [
              {
                id: 'cat1',
                name: 'Whiskers',
                type: 'stray',
                breed: 'tabby',
                personality: 'playful',
                health: 100,
                happiness: 80,
                hunger: 70,
                value: 50,
                age: 5,
                grade: 3,
              },
            ],
            money: 500,
            space: 5,
            houseSize: 'apartment',
            day: 10,
            resources: { food: 20, medicine: 5, toys: 3, treats: 10 },
          },
        };

        const result = migrateSaveData(v1Save);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.state.ownedCostumes).toEqual([]);
          expect(result.data.state.catCostumes).toEqual({});
        }
      });

      it('adds restLevel and feedingScore to cats', () => {
        const v1Save = {
          state: {
            cats: [
              {
                id: 'cat1',
                name: 'Whiskers',
                type: 'stray',
                breed: 'tabby',
                personality: 'playful',
                health: 100,
                happiness: 80,
                hunger: 70,
                value: 50,
                age: 5,
                grade: 3,
              },
            ],
            money: 100,
            space: 5,
            houseSize: 'apartment',
            day: 1,
            resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
          },
        };

        const result = migrateSaveData(v1Save);

        expect(result.success).toBe(true);
        if (result.success) {
          const cat = result.data.state.cats[0];
          expect(cat.restLevel).toBe(100);
          expect(cat.feedingScore).toBe(0);
          expect(cat.lastTrainingDay).toBe(0);
        }
      });
    });

    describe('v2 → v3 migration', () => {
      it('adds trick tracking fields', () => {
        const v2Save = {
          state: {
            cats: [
              {
                id: 'cat1',
                name: 'Whiskers',
                type: 'stray',
                breed: 'tabby',
                personality: 'playful',
                health: 100,
                happiness: 80,
                hunger: 70,
                value: 50,
                age: 5,
                grade: 3,
                restLevel: 100,
                feedingScore: 0,
              },
            ],
            money: 100,
            space: 5,
            houseSize: 'apartment',
            day: 1,
            resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
            catCostumes: {},
            ownedCostumes: [],
          },
        };

        const result = migrateSaveData(v2Save);

        expect(result.success).toBe(true);
        if (result.success) {
          const cat = result.data.state.cats[0];
          expect(cat.tricksLearned).toEqual([]);
          expect(cat.trickProgress).toEqual({});
        }
      });

      it('preserves existing tricks', () => {
        const v2Save = {
          state: {
            cats: [
              {
                id: 'cat1',
                name: 'Whiskers',
                type: 'stray',
                breed: 'tabby',
                personality: 'playful',
                health: 100,
                happiness: 80,
                hunger: 70,
                value: 50,
                age: 5,
                grade: 3,
                restLevel: 100,
                feedingScore: 0,
                tricksLearned: ['sit', 'paw'],
                trickProgress: { jump: 50 },
              },
            ],
            money: 100,
            space: 5,
            houseSize: 'apartment',
            day: 1,
            resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
            catCostumes: {},
            ownedCostumes: [],
          },
        };

        const result = migrateSaveData(v2Save);

        expect(result.success).toBe(true);
        if (result.success) {
          const cat = result.data.state.cats[0];
          expect(cat.tricksLearned).toEqual(['sit', 'paw']);
          expect(cat.trickProgress).toEqual({ jump: 50 });
        }
      });

      it('adds missing achievements from definitions', () => {
        const v2Save = {
          state: {
            cats: [],
            money: 100,
            space: 5,
            houseSize: 'apartment',
            day: 1,
            resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
            catCostumes: {},
            ownedCostumes: [],
            achievements: [
              { id: 'first_cat', name: 'First Cat', unlocked: true },
            ],
          },
        };

        const result = migrateSaveData(v2Save);

        expect(result.success).toBe(true);
        if (result.success) {
          // Should have more achievements than just the one we provided
          expect(result.data.state.achievements.length).toBeGreaterThan(1);
          // Original unlocked status should be preserved
          const firstCat = result.data.state.achievements.find(
            (a) => a.id === 'first_cat'
          );
          expect(firstCat?.unlocked).toBe(true);
        }
      });
    });

    describe('full v1 → v3 migration', () => {
      it('migrates complete v1 save to v3', () => {
        const v1Save = {
          state: {
            cats: [
              {
                id: 'cat1',
                name: 'Mittens',
                type: 'adopted',
                breed: 'persian',
                personality: 'lazy',
                health: 90,
                happiness: 75,
                hunger: 60,
                value: 200,
                age: 12,
                grade: 5,
                showWins: 3,
              },
            ],
            money: 1500,
            space: 10,
            houseSize: 'house',
            acres: 0,
            day: 25,
            resources: { food: 50, medicine: 10, toys: 15, treats: 20 },
            reputation: 100,
            totalShowWins: 5,
            catsAdopted: 8,
            totalMoneyEarned: 5000,
            marketListings: [],
            achievements: [],
            breedingCooldown: 0,
            showCooldown: 2,
          },
          kittensBreed: 3,
          relationships: {
            relationships: [],
            events: [],
          },
        };

        const result = migrateSaveData(v1Save);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.version).toBe(CURRENT_SAVE_VERSION);
          expect(result.migratedFrom).toBe(1);
          expect(result.warnings.length).toBeGreaterThan(0);

          // Check v2 fields
          expect(result.data.state.ownedCostumes).toBeDefined();
          expect(result.data.state.catCostumes).toBeDefined();

          // Check v3 fields
          const cat = result.data.state.cats[0];
          expect(cat.tricksLearned).toBeDefined();
          expect(cat.trickProgress).toBeDefined();
          expect(cat.restLevel).toBeDefined();

          // Check preserved data
          expect(result.data.state.money).toBe(1500);
          expect(result.data.state.day).toBe(25);
          expect(result.data.kittensBreed).toBe(3);
        }
      });
    });
  });

  // ============================================================================
  // Repair Tests
  // ============================================================================

  describe('data repair', () => {
    it('repairs missing resource fields', () => {
      const brokenSave = {
        state: {
          cats: [],
          money: 100,
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10 }, // Missing other resources
        },
      };

      const result = migrateSaveData(brokenSave);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state.resources.medicine).toBeDefined();
        expect(result.data.state.resources.toys).toBeDefined();
        expect(result.data.state.resources.treats).toBeDefined();
      }
    });

    it('repairs invalid house size', () => {
      const brokenSave = {
        state: {
          cats: [],
          money: 100,
          space: 5,
          houseSize: 'castle', // Invalid
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
      };

      const result = migrateSaveData(brokenSave);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state.houseSize).toBe('apartment');
        expect(result.warnings).toContain(
          'Invalid house size "castle", reset to apartment'
        );
      }
    });

    it('repairs cats with missing fields', () => {
      const brokenSave = {
        state: {
          cats: [
            {
              id: 'cat1',
              // Missing most fields
            },
          ],
          money: 100,
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
      };

      const result = migrateSaveData(brokenSave);

      expect(result.success).toBe(true);
      if (result.success) {
        const cat = result.data.state.cats[0];
        expect(cat.name).toBeDefined();
        expect(cat.type).toBeDefined();
        expect(cat.breed).toBeDefined();
        expect(cat.health).toBeGreaterThanOrEqual(0);
        expect(cat.health).toBeLessThanOrEqual(100);
      }
    });

    it('removes invalid cats from array', () => {
      const brokenSave = {
        state: {
          cats: [
            {
              id: 'valid-cat',
              name: 'Good Cat',
              type: 'stray',
              breed: 'tabby',
              personality: 'playful',
              health: 100,
              happiness: 80,
              hunger: 70,
              value: 50,
              age: 5,
              grade: 3,
            },
            null, // Invalid
            'not a cat', // Invalid
          ],
          money: 100,
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
      };

      const result = migrateSaveData(brokenSave);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state.cats.length).toBe(1);
        expect(result.warnings).toContain('Removed 2 invalid cat(s)');
      }
    });

    it('clamps stat values to valid ranges', () => {
      const brokenSave = {
        state: {
          cats: [
            {
              id: 'cat1',
              name: 'Test',
              type: 'stray',
              breed: 'tabby',
              personality: 'playful',
              health: 150, // Over max
              happiness: -20, // Under min
              hunger: 70,
              value: 50,
              age: 5,
              grade: 25, // Over max grade
            },
          ],
          money: -100, // Negative money
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
      };

      const result = migrateSaveData(brokenSave);

      expect(result.success).toBe(true);
      if (result.success) {
        const cat = result.data.state.cats[0];
        expect(cat.health).toBe(100);
        expect(cat.happiness).toBe(0);
        expect(cat.grade).toBe(20);
        expect(result.data.state.money).toBe(0);
      }
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('returns error for null input', () => {
      const result = migrateSaveData(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as { success: false; error: string };
        expect(errorResult.error).toBe('Invalid save data format');
      }
    });

    it('returns error for missing game state', () => {
      const result = migrateSaveData({});

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as { success: false; error: string };
        expect(errorResult.error).toBe('Missing game state');
      }
    });

    it('returns error for primitive input', () => {
      const result = migrateSaveData('not an object');

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as { success: false; error: string };
        expect(errorResult.error).toBe('Invalid save data format');
      }
    });
  });

  // ============================================================================
  // Relationship Data Tests
  // ============================================================================

  describe('relationship data handling', () => {
    it('preserves valid relationship data', () => {
      const save = {
        state: {
          cats: [],
          money: 100,
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
        relationships: {
          relationships: [
            { cat1Id: 'a', cat2Id: 'b', score: 50 },
          ],
          events: [
            { id: 'evt1', type: 'bonding', cat1Id: 'a', cat2Id: 'b', scoreChange: 10, day: 1, description: 'test' },
          ],
          maintenanceStreak: 5,
        },
      };

      const result = migrateSaveData(save);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relationships.relationships.length).toBe(1);
        expect(result.data.relationships.events.length).toBe(1);
        expect(result.data.relationships.maintenanceStreak).toBe(5);
      }
    });

    it('provides default relationship data when missing', () => {
      const save = {
        state: {
          cats: [],
          money: 100,
          space: 5,
          houseSize: 'apartment',
          day: 1,
          resources: { food: 10, medicine: 5, toys: 5, treats: 5 },
        },
      };

      const result = migrateSaveData(save);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relationships.relationships).toEqual([]);
        expect(result.data.relationships.events).toEqual([]);
      }
    });
  });
});
