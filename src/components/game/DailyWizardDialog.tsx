import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { WizardStep } from '@/hooks/useDailyWizard';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DailyWizardDialogProps {
  open: boolean;
  onClose: () => void;
  onDismissForToday: () => void;
  steps: WizardStep[];
  currentStep: number;
  progress: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function DailyWizardDialog({
  open,
  onClose,
  onDismissForToday,
  steps,
  currentStep,
  progress,
  totalSteps,
  onNext,
  onPrev,
  onNavigateTab,
}: DailyWizardDialogProps) {
  const step = steps[currentStep];
  if (!step) return null;

  const isLastStep = currentStep === totalSteps - 1;

  const handleItemAction = (targetTab?: string) => {
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={onDismissForToday}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Don't show today
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Header */}
        <DialogHeader className="px-6 pt-3 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">{step.emoji}</span>
            {step.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        </DialogHeader>

        {/* Items */}
        <div className="px-6 py-4 space-y-2 flex-1 overflow-y-auto">
          {step.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                item.done
                  ? 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30'
                  : 'bg-card/80 border-border hover:border-primary/30 hover:bg-card'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className={`flex-1 text-sm font-medium ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {item.label}
              </span>
              {!item.done && item.targetTab && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                  onClick={() => handleItemAction(item.targetTab)}
                >
                  Do it →
                </Button>
              )}
              {item.done && (
                <Badge variant="outline" className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                  Done
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-5 pt-2 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            size="sm"
            onClick={isLastStep ? onClose : onNext}
            className="gap-1 bg-primary text-primary-foreground"
          >
            {isLastStep ? '🎮 Let\'s Go!' : 'Next'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
