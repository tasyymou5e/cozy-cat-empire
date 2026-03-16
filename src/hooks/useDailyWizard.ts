import { useState, useCallback, useMemo, useEffect } from 'react';
import { Cat, GameState } from '@/types/game';
import { CatRelationship } from '@/types/relationships';

export interface WizardStep {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: WizardItem[];
  targetTab?: string;
}

export interface WizardItem {
  id: string;
  label: string;
  emoji: string;
  done: boolean;
  action?: string;
  targetTab?: string;
}

const WIZARD_STORAGE_KEY = 'cat-farm-wizard-last-shown';
const WIZARD_DISMISSED_KEY = 'cat-farm-wizard-dismissed-today';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyWizard(
  state: GameState,
  relationships: CatRelationship[] = [],
) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  const today = getTodayStr();

  // Check if wizard was already shown today
  const wasDismissedToday = useMemo(() => {
    try {
      return localStorage.getItem(WIZARD_DISMISSED_KEY) === today;
    } catch {
      return false;
    }
  }, [today]);

  // Auto-open on first visit each day
  useEffect(() => {
    if (!hasAutoShown && !wasDismissedToday) {
      const lastShown = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (lastShown !== today) {
        // Small delay so UI settles
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasAutoShown(true);
          localStorage.setItem(WIZARD_STORAGE_KEY, today);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [today, wasDismissedToday, hasAutoShown]);

  // Compute steps from game state
  const steps = useMemo((): WizardStep[] => {
    const hungryCats = state.cats.filter(c => c.hunger < 40);
    const sickCats = state.cats.filter(c => c.health < 70);
    const sadCats = state.cats.filter(c => c.happiness < 50);
    const trainableCats = state.cats.filter(c => c.lastTrainingDay !== state.day && c.restLevel >= 30);
    const canBreed = state.cats.length >= 2 && state.breedingCooldown === 0 && state.cats.length < state.space;

    const result: WizardStep[] = [];

    // Step 1: Cat Care
    const careItems: WizardItem[] = [];
    if (hungryCats.length > 0) {
      careItems.push({
        id: 'feed',
        label: `Feed ${hungryCats.length} hungry cat${hungryCats.length > 1 ? 's' : ''}`,
        emoji: '🍖',
        done: false,
        targetTab: 'resources',
      });
    }
    if (sickCats.length > 0) {
      careItems.push({
        id: 'heal',
        label: `Heal ${sickCats.length} sick cat${sickCats.length > 1 ? 's' : ''}`,
        emoji: '💊',
        done: false,
        targetTab: 'bulk',
      });
    }
    if (sadCats.length > 0) {
      careItems.push({
        id: 'comfort',
        label: `Comfort ${sadCats.length} unhappy cat${sadCats.length > 1 ? 's' : ''}`,
        emoji: '💗',
        done: false,
        targetTab: 'bulk',
      });
    }
    if (careItems.length === 0) {
      careItems.push({ id: 'all-good', label: 'All cats are happy & healthy!', emoji: '✅', done: true });
    }
    result.push({
      id: 'care',
      title: 'Cat Care',
      emoji: '🐱',
      description: 'Check on your cats\' well-being',
      items: careItems,
      targetTab: 'bulk',
    });

    // Step 2: Daily Chores
    result.push({
      id: 'chores',
      title: 'Do Your Chores',
      emoji: '🧹',
      description: 'Earn money by completing chores',
      items: [
        { id: 'chore-1', label: 'Complete chores to earn money', emoji: '💰', done: false, targetTab: 'chores' },
      ],
      targetTab: 'chores',
    });

    // Step 3: Training
    if (trainableCats.length > 0) {
      result.push({
        id: 'training',
        title: 'Train Your Cats',
        emoji: '🎯',
        description: `${trainableCats.length} cat${trainableCats.length > 1 ? 's' : ''} ready for training`,
        items: trainableCats.slice(0, 3).map(c => ({
          id: `train-${c.id}`,
          label: `Train ${c.name}`,
          emoji: '🎓',
          done: false,
          targetTab: 'training',
        })),
        targetTab: 'training',
      });
    }

    // Step 4: Breeding
    if (canBreed) {
      result.push({
        id: 'breeding',
        title: 'Breeding Opportunities',
        emoji: '💕',
        description: 'Ready to breed a new kitten!',
        items: [
          { id: 'breed', label: 'Visit the breeding panel', emoji: '🍼', done: false, targetTab: 'breeding' },
        ],
        targetTab: 'breeding',
      });
    }

    // Step 5: Summary
    result.push({
      id: 'summary',
      title: 'Ready to Play!',
      emoji: '🚀',
      description: `Day ${state.day} — $${state.money.toLocaleString()} — ${state.cats.length} cats`,
      items: [
        { id: 'go', label: 'Start your day!', emoji: '🎮', done: false },
      ],
    });

    return result;
  }, [state]);

  const openWizard = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dismissForToday = useCallback(() => {
    try {
      localStorage.setItem(WIZARD_DISMISSED_KEY, today);
    } catch { /* ignore */ }
    setIsOpen(false);
  }, [today]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      closeWizard();
    }
  }, [currentStep, steps.length, closeWizard]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  return {
    isOpen,
    steps,
    currentStep,
    openWizard,
    closeWizard,
    dismissForToday,
    nextStep,
    prevStep,
    setCurrentStep,
    totalSteps: steps.length,
    progress: steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0,
  };
}
