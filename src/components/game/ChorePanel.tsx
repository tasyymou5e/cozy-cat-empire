import { Button } from '@/components/ui/button';
import { CHORE_TYPES } from '@/types/game';

/**
 * Props for the ChorePanel component
 */
interface ChorePanelProps {
  /** Callback when completing a chore */
  onDoChore: (choreId: string, reward: number) => void;
}

/**
 * ChorePanel - Chore completion interface for earning money
 *
 * Displays available chores that players can complete to earn cat money.
 * Each chore has a base reward with potential bonus earnings.
 *
 * @example
 * ```tsx
 * <ChorePanel onDoChore={handleDoChore} />
 * ```
 */

export function ChorePanel({ onDoChore }: ChorePanelProps) {
  return (
    <div className="chore-panel">
      <h3 className="font-bold text-lg mb-3">🧹 Chores</h3>
      <p className="text-xs text-muted-foreground mb-3">Do chores to earn cat money!</p>

      <div className="space-y-2">
        {CHORE_TYPES.map((chore) => (
          <Button
            key={chore.id}
            variant="outline"
            onClick={() => onDoChore(chore.id, chore.baseReward)}
            className="w-full justify-between h-auto py-2"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{chore.emoji}</span>
              <span>{chore.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">+${chore.baseReward}+</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
