import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { FriendsPanel } from '../FriendsPanel';
import { PlayerProfilePanel } from '../PlayerProfilePanel';
import { CatGiftingPanel } from '../CatGiftingPanel';
import { TradingPanel } from '../TradingPanel';
import { CoopChallengesPanel } from '../CoopChallengesPanel';
import { Cat, Resources } from '@/types/game';
import type { Friend } from '@/hooks/useFriends';
import type { ActiveCoopChallenge, CoopChallengeInvite, CoopChallenge } from '@/types/coopChallenges';

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
          <FriendsPanel userId={userId} />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="profile" className="mt-0">
        <PanelErrorBoundary panelName="PlayerProfilePanel">
          <PlayerProfilePanel userId={userId} />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="gifts" className="mt-0">
        <PanelErrorBoundary panelName="CatGiftingPanel">
          <CatGiftingPanel 
            userId={userId} 
            cats={cats}
            onGiftSent={(catId) => dispatchAction('SELL_CAT', { catId })}
            onGiftReceived={onGiftReceived}
            catCostumes={catCostumes}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="trading" className="mt-0">
        <PanelErrorBoundary panelName="TradingPanel">
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
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="coop" className="mt-0">
        <PanelErrorBoundary panelName="CoopChallengesPanel">
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
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
