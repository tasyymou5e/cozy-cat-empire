import { TutorialSystem } from './TutorialSystem';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { RelationshipAnimations } from './RelationshipAnimations';
import { MoodAnimations } from './MoodAnimations';
import { CatActivityPopups } from './CatActivityPopups';
import { DailyEventToast } from './DailyEventToast';
import { Cat } from '@/types/game';
import { RelationshipEvent } from '@/types/relationships';
import { DailyEvent } from '@/types/dailyEvents';

interface CatFarmOverlaysProps {
  // Tutorial
  onHighlightTab: (tab: string | null) => void;
  
  // Keyboard shortcuts
  showShortcutsHelp: boolean;
  onCloseShortcutsHelp: () => void;
  
  // Relationship animations
  events: RelationshipEvent[];
  lastEventId: string;
  
  // Mood animations
  cats: Cat[];
  
  // Cat activity popups
  onCatClick: (catId: string) => void;
  onFeed: (catId: string) => void;
  onComfort: (catId: string) => void;
  onHeal: (catId: string) => void;
  hasFood: boolean;
  hasMedicine: boolean;
  
  // Daily event
  currentDailyEvent: DailyEvent | null;
  onDismissDailyEvent: () => void;
}

export function CatFarmOverlays({
  onHighlightTab,
  showShortcutsHelp,
  onCloseShortcutsHelp,
  events,
  lastEventId,
  cats,
  onCatClick,
  onFeed,
  onComfort,
  onHeal,
  hasFood,
  hasMedicine,
  currentDailyEvent,
  onDismissDailyEvent,
}: CatFarmOverlaysProps) {
  return (
    <>
      <TutorialSystem onHighlightTab={onHighlightTab} />
      <KeyboardShortcutsHelp open={showShortcutsHelp} onClose={onCloseShortcutsHelp} />
      <RelationshipAnimations events={events} lastEventId={lastEventId} />
      <MoodAnimations cats={cats} />
      <CatActivityPopups 
        cats={cats} 
        onCatClick={onCatClick}
        onFeed={onFeed}
        onComfort={onComfort}
        onHeal={onHeal}
        hasFood={hasFood}
        hasMedicine={hasMedicine}
      />
      <DailyEventToast event={currentDailyEvent} onDismiss={onDismissDailyEvent} />
    </>
  );
}
