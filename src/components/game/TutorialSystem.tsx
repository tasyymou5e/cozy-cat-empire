import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  content: string;
  emoji: string;
  highlight?: string;
  category?: 'basics' | 'economy' | 'cats' | 'social' | 'features' | 'progress';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // Basics Category (Steps 1-5)
  {
    title: 'Welcome to Cat Farm!',
    content:
      "Build your cat empire from a small apartment to a sprawling 100-acre farm! Let's learn the basics.",
    emoji: '🐱',
    category: 'basics',
  },
  {
    title: 'Getting Your First Cat',
    content:
      'Start by adding a stray cat for free, or adopt one for $50. Pure breeds cost more but earn higher value!',
    emoji: '🏠',
    highlight: 'actions',
    category: 'basics',
  },
  {
    title: 'Caring for Your Cats',
    content:
      'Keep your cats happy and healthy! Buy food, medicine, toys, and treats from the Supplies tab.',
    emoji: '🍲',
    highlight: 'supplies',
    category: 'basics',
  },
  {
    title: 'Earning Money',
    content:
      'Complete chores like cleaning litter, grooming cats, and play sessions to earn coins for upgrades.',
    emoji: '💰',
    highlight: 'chores',
    category: 'economy',
  },
  {
    title: 'Bulk Actions',
    content:
      'Manage all your cats at once! Heal sick cats, rest tired ones, or train everyone with a single click.',
    emoji: '⚡',
    highlight: 'bulk',
    category: 'basics',
  },

  // Cats Category (Steps 6-9)
  {
    title: 'Training & Grades',
    content:
      'Train cats to learn tricks like Sit, Paw, and Roll Over. Higher grades mean better show performance and value!',
    emoji: '🎓',
    highlight: 'training',
    category: 'cats',
  },
  {
    title: 'Dress Up Your Cats',
    content:
      'Buy costumes from hats to superhero capes! Dressed-up cats look amazing in shows and photos.',
    emoji: '👑',
    highlight: 'costumes',
    category: 'cats',
  },
  {
    title: 'Breeding Kittens',
    content:
      'Pair compatible cats to breed adorable kittens! Kittens inherit traits and grades from their parents.',
    emoji: '💕',
    highlight: 'breeding',
    category: 'cats',
  },
  {
    title: 'Cat Specializations',
    content:
      'High-grade cats can specialize! Choose Performer, Socialite, Breeder, or Mentor paths for unique bonuses.',
    emoji: '✨',
    highlight: 'specializations',
    category: 'cats',
  },

  // Social Category (Steps 10-12)
  {
    title: 'Cat Relationships',
    content:
      'Cats form friendships and rivalries! Best friends breed better, while enemies may refuse to cooperate.',
    emoji: '💞',
    highlight: 'social',
    category: 'social',
  },
  {
    title: 'Friends, Gifts & Trading',
    content:
      'Add friends to gift cats, trade resources, and compete together. Check the Friends tab to get started!',
    emoji: '🎁',
    highlight: 'friends',
    category: 'social',
  },
  {
    title: 'Co-op Challenges',
    content:
      'Team up with friends on cooperative challenges! Both players contribute progress and share the rewards.',
    emoji: '🤝',
    highlight: 'coop',
    category: 'social',
  },

  // Progress Category (Steps 13-17)
  {
    title: 'Daily Objectives',
    content:
      'Complete 3 daily tasks to earn bonus coins. Finish all objectives for an extra completion reward!',
    emoji: '📋',
    highlight: 'objectives',
    category: 'progress',
  },
  {
    title: 'Weekly Challenges',
    content:
      'Take on weekly challenges for big rewards! Win shows, breed kittens, or earn money to complete them.',
    emoji: '🏆',
    highlight: 'challenges',
    category: 'progress',
  },
  {
    title: 'Season Pass',
    content:
      'Earn XP from activities to unlock tiered rewards! Premium pass holders get exclusive costumes and bonuses.',
    emoji: '📜',
    highlight: 'battlepass',
    category: 'features',
  },
  {
    title: 'Lucky Wheel',
    content:
      'Spin the wheel daily for free prizes including coins, resources, and rare items! VIP players get extra spins.',
    emoji: '🎰',
    highlight: 'wheel',
    category: 'features',
  },
  {
    title: 'Hall of Fame & Collection',
    content:
      'Retire legendary cats to the Hall of Fame for permanent bonuses. Track your breed and costume collection progress!',
    emoji: '👑',
    highlight: 'legacy',
    category: 'features',
  },

  // Finale (Step 18)
  {
    title: "You're Ready!",
    content:
      'Visit the Photo Booth for custom portraits, check the Gallery, and sign in to save progress and unlock VIP login rewards!',
    emoji: '🎉',
    category: 'features',
  },
];

const STORAGE_KEY = 'cat-farm-tutorial-complete';

const categoryStyles: Record<string, string> = {
  basics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  economy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cats: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  social: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  features: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

interface TutorialSystemProps {
  onHighlightTab?: (tab: string | null) => void;
}

export function TutorialSystem({ onHighlightTab }: TutorialSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTutorial(false);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    onHighlightTab?.(step.highlight || null);
  }, [currentStep, onHighlightTab]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenTutorial(true);
    setIsOpen(false);
    onHighlightTab?.(null);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRestart}
        className="text-xs"
        title="Restart Tutorial"
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md p-6 shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{step.emoji}</span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
              {step.category && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium w-fit capitalize',
                    categoryStyles[step.category]
                  )}
                >
                  {step.category}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleComplete}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <p className="text-muted-foreground mb-6 min-h-[60px]">{step.content}</p>

        {/* Highlight hint */}
        {step.highlight && (
          <div className="mb-4 p-2 rounded bg-primary/10 text-primary text-sm text-center">
            👆 Check the <strong>{step.highlight}</strong> tab
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <div className="flex gap-1 flex-wrap justify-center max-w-[140px]">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext}>
            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <>Start Playing! 🎮</>
            ) : (
              <>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        {currentStep < TUTORIAL_STEPS.length - 1 && (
          <button
            onClick={handleComplete}
            className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        )}
      </Card>
    </div>
  );
}
