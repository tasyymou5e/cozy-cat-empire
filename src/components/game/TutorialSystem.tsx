import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  emoji: string;
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Cat Farm! 🐱',
    content: 'Build your cat empire from a small apartment to a 100-acre farm! Let\'s learn the basics.',
    emoji: '👋',
  },
  {
    title: 'Getting Your First Cat',
    content: 'Click "Add Stray" in the Actions tab to get a free cat, or buy one from the Market.',
    emoji: '🐾',
    highlight: 'actions',
  },
  {
    title: 'Caring for Your Cats',
    content: 'Keep cats happy and healthy by feeding them, playing with toys, and healing when sick.',
    emoji: '❤️',
    highlight: 'supplies',
  },
  {
    title: 'Earning Money',
    content: 'Do chores, enter cat shows with high-grade cats (8+), or sell cats at the market.',
    emoji: '💰',
    highlight: 'chores',
  },
  {
    title: 'Cat Grades',
    content: 'Each cat has a grade (1-20). Higher grades win more shows! Train tricks to boost grades.',
    emoji: '⭐',
    highlight: 'training',
  },
  {
    title: 'Breeding',
    content: 'Breed two cats to get kittens! Best friends have higher success rates and better offspring.',
    emoji: '💕',
    highlight: 'breeding',
  },
  {
    title: 'Relationships',
    content: 'Cats form friendships and rivalries. Use treats to socialize and improve relationships.',
    emoji: '🤝',
    highlight: 'social',
  },
  {
    title: 'Comfort Upset Cats',
    content: 'When cats are sad, use the "Hug & Pet" button - hold for 20 seconds to comfort them.',
    emoji: '🤗',
  },
  {
    title: 'Expanding Your Empire',
    content: 'Upgrade your home to hold more cats. Eventually buy a farm and expand up to 100 acres!',
    emoji: '🏠',
  },
  {
    title: 'Keyboard Shortcuts',
    content: 'Press ? anytime to see shortcuts. F=Feed, N=Next Day, S=Save, C=Collection, 1-8=Tabs.',
    emoji: '⌨️',
  },
  {
    title: 'You\'re Ready!',
    content: 'Start small, care for your cats, and grow your empire. Good luck, cat farmer!',
    emoji: '🎉',
  },
];

const STORAGE_KEY = 'cat-farm-tutorial-complete';

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
            <h3 className="text-lg font-bold">{step.title}</h3>
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
          
          <div className="flex gap-1">
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
