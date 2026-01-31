import { GiftReceivedDialog } from './GiftReceivedDialog';
import { TradeReceivedDialog } from './TradeReceivedDialog';
import { MilestonePopup } from './MilestonePopup';
import { DailyRewardsPanel } from './DailyRewardsPanel';
import { WhatsNewPopup } from './WhatsNewPopup';
import { OrphanRecoveryDialog } from './OrphanRecoveryDialog';
import { Milestone } from '@/types/milestones';
import { VIPTier } from '@/types/dailyRewards';
import { Cat, Resources } from '@/types/game';
import { CatGiftStatus } from '@/hooks/useCatGifts';
import { OrphanedCat } from '@/hooks/useOrphanDetection';

interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;
  message: string | null;
  status: CatGiftStatus;
  created_at: string;
  sender_name?: string;
}

interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: Cat[];
  offered_money: number;
  offered_resources: Partial<Resources>;
  requested_cats: Cat[];
  requested_money: number;
  requested_resources: Partial<Resources>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;
  sender_name?: string;
}

interface CatFarmDialogsProps {
  // Gift
  newGiftAlert: CatGift | null;
  onAcceptGift: (giftId: string) => Promise<void>;
  onDeclineGift: (giftId: string) => Promise<void>;
  onClearGift: () => void;

  // Trade
  newTradeAlert: TradeOffer | null;
  onAcceptTrade: (tradeId: string) => Promise<void>;
  onDeclineTrade: (tradeId: string) => Promise<void>;
  onClearTrade: () => void;

  // Milestone
  pendingMilestone: Milestone | null;
  onClaimMilestone: () => void;
  onDismissMilestone: () => void;

  // Daily Rewards
  loginStreak: number;
  loginLongestStreak: number;
  totalLogins: number;
  canClaimDailyReward: boolean;
  showDailyRewardsModal: boolean;
  onCloseDailyRewardsModal: () => void;
  onClaimDailyReward: () => void;
  vipTier: VIPTier | null;
  isVIP: boolean;

  // What's New
  showWhatsNew: boolean;
  onCloseWhatsNew: () => void;

  // Orphan Recovery
  orphanedCats: OrphanedCat[];
  showOrphanDialog: boolean;
  onRecoverOrphans: (cats: OrphanedCat[]) => Promise<void>;
  onDismissOrphans: () => void;
}

export function CatFarmDialogs({
  newGiftAlert,
  onAcceptGift,
  onDeclineGift,
  onClearGift,
  newTradeAlert,
  onAcceptTrade,
  onDeclineTrade,
  onClearTrade,
  pendingMilestone,
  onClaimMilestone,
  onDismissMilestone,
  loginStreak,
  loginLongestStreak,
  totalLogins,
  canClaimDailyReward,
  showDailyRewardsModal,
  onCloseDailyRewardsModal,
  onClaimDailyReward,
  vipTier,
  isVIP,
  showWhatsNew,
  onCloseWhatsNew,
  orphanedCats,
  showOrphanDialog,
  onRecoverOrphans,
  onDismissOrphans,
}: CatFarmDialogsProps) {
  return (
    <>
      {/* Milestone Celebration Popup */}
      <MilestonePopup
        milestone={pendingMilestone}
        onClaim={onClaimMilestone}
        onDismiss={onDismissMilestone}
      />

      {/* Gift Received Popup */}
      <GiftReceivedDialog
        gift={newGiftAlert}
        onAccept={onAcceptGift}
        onDecline={onDeclineGift}
        onClose={onClearGift}
      />

      {/* Trade Received Popup */}
      <TradeReceivedDialog
        trade={newTradeAlert}
        onAccept={onAcceptTrade}
        onDecline={onDeclineTrade}
        onClose={onClearTrade}
      />

      {/* Daily Login Rewards Modal */}
      <DailyRewardsPanel
        currentStreak={loginStreak}
        longestStreak={loginLongestStreak}
        totalLogins={totalLogins}
        canClaim={canClaimDailyReward}
        showModal={showDailyRewardsModal}
        onCloseModal={onCloseDailyRewardsModal}
        onClaim={onClaimDailyReward}
        vipTier={vipTier}
        isVIP={isVIP}
      />

      {/* What's New Popup */}
      <WhatsNewPopup open={showWhatsNew} onClose={onCloseWhatsNew} />

      {/* Orphan Recovery Dialog */}
      <OrphanRecoveryDialog
        orphanedCats={orphanedCats}
        open={showOrphanDialog}
        onClose={onDismissOrphans}
        onRecover={onRecoverOrphans}
      />
    </>
  );
}