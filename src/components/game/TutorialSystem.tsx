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
  category?: 'basics' | 'economy' | 'cats' | 'social' | 'features';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Cat Farm!',
    content: 'Build your cat empire from a small apartment to a 100-acre farm! Let\'s learn the basics.',
    emoji: '👋',
    category: 'basics',
  },
  {
    title: 'Getting Your First Cat',
    content: 'Click "Add Stray" in the Actions tab to get a free cat, or buy one from the Market.',
    emoji: '🐾',
    highlight: 'actions',
    category: 'basics',
  },
  {
    title: 'Caring for Your Cats',
    content: 'Keep cats happy and healthy by buying food, toys, and medicine from the Supplies tab.',
    emoji: '❤️',
    highlight: 'supplies',
    category: 'basics',
  },
  {
    title: 'Earning Money',
    content: 'Do chores to earn coins. You can also enter cat shows or sell cats at the market.',
    emoji: '💰',
    highlight: 'chores',
    category: 'economy',
  },
  {
    title: 'Cat Grades & Training',
    content: 'Each cat has a grade (1-20). Train tricks to boost grades and win more shows!',
    emoji: '⭐',
    highlight: 'training',
    category: 'cats',
  },
  {
    title: 'Dress Up Your Cats',
    content: 'Buy costumes to make your cats look amazing! Costumes also give bonuses in cat shows.',
    emoji: '👗',
    highlight: 'costumes',
    category: 'cats',
  },
  {
    title: 'Breeding Kittens',
    content: 'Breed two cats to get kittens! Best friends have higher success rates and better offspring.',
    emoji: '💕',
    highlight: 'breeding',
    category: 'cats',
  },
  {
    title: 'Cat Relationships',
    content: 'Cats form friendships and rivalries. Use treats and the Social tab to improve bonds.',
    emoji: '🤝',
    highlight: 'social',
    category: 'cats',
  },
  {
    title: 'Bulk Actions',
    content: 'Save time with bulk actions! Heal all sick cats, rest tired ones, or train everyone at once.',
    emoji: '⚡',
    highlight: 'bulk',
    category: 'features',
  },
  {
    title: 'Make Friends & Trade',
    content: 'Add friends to gift cats or trade with other players. Check the Friends and Trading tabs!',
    emoji: '🎁',
    highlight: 'friends',
    category: 'social',
  },
  {
    title: 'Weekly Challenges',
    content: 'Complete weekly challenges for bonus rewards. Keep your streak going for extra perks!',
    emoji: '🎯',
    highlight: 'challenges',
    category: 'social',
  },
  {
    title: 'Photo Booth & Portraits',
    content: 'Take custom photos of your cats! You can even generate AI portraits that show their look.',
    emoji: '📸',
    category: 'features',
  },
  {
    title: 'Cat Collection',
    content: 'View your cats as beautiful trading cards! Click the grid icon in the header to explore.',
    emoji: '🃏',
    category: 'features',
  },
  {
    title: 'Save Your Progress',
    content: 'Sign in to save your game to the cloud! Your cats will be safe across all your devices.',
    emoji: '☁️',
    category: 'features',
  },
  {
    title: 'Expanding Your Empire',
    content: 'Upgrade from an apartment to a house, mansion, and eventually a 100-acre farm!',
    emoji: '🏠',
    highlight: 'actions',
    category: 'basics',
  },
  {
    title: 'You\'re Ready!',
    content: 'Explore all the tabs, care for your cats, and build your empire. Good luck, cat farmer!',
    emoji: '🎉',
  },
];

const STORAGE_KEY = 'cat-farm-tutorial-complete';

const categoryStyles = {
  basics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  economy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cats: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  social: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  features: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
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
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                  categoryStyles[step.category]
                )}>
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
            <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <p className="text-muted-foreground mb-6 min-h-[60px]">
          {step.content}
        </p>

        {/* Highlight hint */}
        {step.highlight && (
          <div className="mb-4 p-2 rounded bg-primary/10 text-primary text-sm text-center">
            👆 Check the <strong>{step.highlight}</strong> tab
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          <div className="flex gap-1 flex-wrap justify-center max-w-[120px]">
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
              <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
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
