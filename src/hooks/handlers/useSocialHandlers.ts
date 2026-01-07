/**
 * @fileoverview Social interaction handlers for CatFarm
 *
 * Handles gift/trade popup responses and quick socialize actions.
 *
 * @module hooks/handlers/useSocialHandlers
 */

import { useCallback, useEffect } from 'react';
import type { CatFarmState } from '../useCatFarmState';

interface SocialHandlersDeps {
  farmState: CatFarmState;
}

/**
 * Hook providing social interaction handlers
 */
export function useSocialHandlers({ farmState }: SocialHandlersDeps) {
  const { sound, confetti, gifts, trading, actions, ui } = farmState;

  const { playSound } = sound;
  const { fireConfetti } = confetti;

  // Play sound when receiving gift
  useEffect(() => {
    if (gifts.newGiftAlert) {
      playSound?.('giftReceived');
    }
  }, [gifts.newGiftAlert, playSound]);

  // Play sound when receiving trade
  useEffect(() => {
    if (trading.newTradeAlert) {
      playSound?.('tradeReceived');
    }
  }, [trading.newTradeAlert, playSound]);

  // Handle accepting gift from popup
  const handleAcceptGiftFromPopup = useCallback(
    async (giftId: string) => {
      const cat = await gifts.acceptGift(giftId);
      if (cat) {
        actions.addReceivedCat?.(cat);
        playSound?.('success');
        fireConfetti();
      }
      gifts.clearNewGift();
    },
    [gifts, actions, playSound, fireConfetti]
  );

  const handleDeclineGiftFromPopup = useCallback(
    async (giftId: string) => {
      await gifts.declineGift(giftId);
      gifts.clearNewGift();
    },
    [gifts]
  );

  // Handle accepting trade from popup
  const handleAcceptTradeFromPopup = useCallback(
    async (tradeId: string) => {
      const trade = await trading.acceptTrade(tradeId);
      if (trade) {
        if (trade.offered_cats) {
          for (const cat of trade.offered_cats) {
            actions.addReceivedCat?.(cat);
          }
        }
        if (trade.offered_money) {
          actions.addReward?.(trade.offered_money, {});
        }
        playSound?.('success');
        fireConfetti();
      }
      trading.clearNewTrade();
    },
    [trading, actions, playSound, fireConfetti]
  );

  const handleDeclineTradeFromPopup = useCallback(
    async (tradeId: string) => {
      await trading.declineTrade(tradeId);
      trading.clearNewTrade();
    },
    [trading]
  );

  // Quick Socialize
  const handleQuickSocialize = useCallback(
    (cat1Id: string, cat2Id: string) => {
      ui.setQuickSocializePair({ cat1Id, cat2Id });
      ui.setSideTab('social');
      playSound?.('click');
    },
    [ui, playSound]
  );

  const clearQuickSocializePair = useCallback(() => {
    ui.setQuickSocializePair(null);
  }, [ui]);

  return {
    handleAcceptGiftFromPopup,
    handleDeclineGiftFromPopup,
    handleAcceptTradeFromPopup,
    handleDeclineTradeFromPopup,
    handleQuickSocialize,
    clearQuickSocializePair,
  };
}
