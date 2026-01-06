import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Cat, Resources } from '@/types/game';
import type { Friend } from '@/hooks/useFriends';
import type { ActiveCoopChallenge, CoopChallengeInvite, CoopChallenge } from '@/types/coopChallenges';

// Lazy load panels for performance
const FriendsPanel = lazy(() => import('../FriendsPanel').then(m => ({ default: m.FriendsPanel })));
const PlayerProfilePanel = lazy(() => import('../PlayerProfilePanel').then(m => ({ default: m.PlayerProfilePanel })));
const CatGiftingPanel = lazy(() => import('../CatGiftingPanel').then(m => ({ default: m.CatGiftingPanel })));
const TradingPanel = lazy(() => import('../TradingPanel').then(m => ({ default: m.TradingPanel })));
const CoopChallengesPanel = lazy(() => import('../CoopChallengesPanel').then(m => ({ default: m.CoopChallengesPanel })));

interface SocialFeaturesPanelsProps {
  userId?: string;
  cats: Cat[];
  money: number;
  resources: Resources;
  catCostumes: Record<string, string>;
  friends: Friend[];
  activeChallenges: ActiveCoopChallenge[];
  pendingInvites: CoopChallengeInvite[];
  sentInvites: CoopChallengeInvite[];
  coopTemplates: CoopChallenge[];
  dispatchAction: (type: string, payload?: Record<string, unknown>) => void;
  onGiftReceived: (cat: Cat) => void;
  onSendCoopInvite: (friendId: string, challengeId: string) => boolean | Promise<boolean>;
  onAcceptCoopInvite: (inviteId: string) => boolean | Promise<boolean>;
  onDeclineCoopInvite: (inviteId: string) => boolean | Promise<boolean>;
  onCancelCoopInvite: (inviteId: string) => boolean | Promise<boolean>;
  onClaimCoopReward: (challengeId: string) => { coins: number; bonus: number } | null | Promise<{ coins: number; bonus: number } | null>;
}

/**
 * Social features panels: Friends, Profile, Gifts, Trading, Co-op
 * Uses React.lazy for code splitting and improved initial load performance.
 */
export function SocialFeaturesPanels({
  userId,
  cats,
  money,
  resources,
  catCostumes,
  friends,
  activeChallenges,
  pendingInvites,
  sentInvites,
  coopTemplates,
  dispatchAction,
  onGiftReceived,
  onSendCoopInvite,
  onAcceptCoopInvite,
  onDeclineCoopInvite,
  onCancelCoopInvite,
  onClaimCoopReward,
}: SocialFeaturesPanelsProps) {
  return (
    <>
      <TabsContent value="friends" className="mt-0">
        <PanelErrorBoundary panelName="FriendsPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <FriendsPanel userId={userId} />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="profile" className="mt-0">
        <PanelErrorBoundary panelName="PlayerProfilePanel">
          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <PlayerProfilePanel userId={userId} />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="gifts" className="mt-0">
        <PanelErrorBoundary panelName="CatGiftingPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <CatGiftingPanel 
              userId={userId} 
              cats={cats}
              onGiftSent={(catId) => dispatchAction('SELL_CAT', { catId })}
              onGiftReceived={onGiftReceived}
              catCostumes={catCostumes}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="trading" className="mt-0">
        <PanelErrorBoundary panelName="TradingPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <TradingPanel 
              userId={userId}
              cats={cats}
              money={money}
              resources={resources}
              onTradeComplete={(removeCats, addCats) => {
                removeCats.forEach(catId => dispatchAction('SELL_CAT', { catId }));
                addCats.forEach(cat => onGiftReceived(cat));
              }}
              catCostumes={catCostumes}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="coop" className="mt-0">
        <PanelErrorBoundary panelName="CoopChallengesPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <CoopChallengesPanel
              userId={userId}
              friends={friends}
              activeChallenges={activeChallenges}
              pendingInvites={pendingInvites}
              sentInvites={sentInvites}
              templates={coopTemplates}
              onSendInvite={onSendCoopInvite}
              onAcceptInvite={onAcceptCoopInvite}
              onDeclineInvite={onDeclineCoopInvite}
              onCancelInvite={onCancelCoopInvite}
              onClaimReward={onClaimCoopReward}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
