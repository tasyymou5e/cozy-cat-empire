import { useCallback } from 'react';
import { getCostumeById } from '@/types/costumes';
import { GameHookDependencies } from './types';

export interface CostumeActions {
  buyCostume: (costumeId: string) => void;
  equipCostume: (catId: string, costumeId: string | null) => void;
}

export function useCostumes(deps: GameHookDependencies): CostumeActions {
  const { setState, showMessage, playSound } = deps;

  const buyCostume = useCallback((costumeId: string) => {
    const costume = getCostumeById(costumeId);
    if (!costume) {
      showMessage("Costume not found!", 'error');
      return;
    }
    
    setState(prev => {
      if (prev.ownedCostumes.includes(costumeId)) {
        showMessage("You already own this costume!", 'warning');
        return prev;
      }
      if (prev.money < costume.price) {
        showMessage("Not enough money!", 'error');
        playSound?.('error');
        return prev;
      }
      
      showMessage(`Bought ${costume.name}! ${costume.emoji}`, 'success');
      playSound?.('coin');
      return {
        ...prev,
        money: prev.money - costume.price,
        ownedCostumes: [...prev.ownedCostumes, costumeId],
      };
    });
  }, [setState, showMessage, playSound]);

  const equipCostume = useCallback((catId: string, costumeId: string | null) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      const newCatCostumes = { ...prev.catCostumes };
      if (costumeId === null) {
        delete newCatCostumes[catId];
        showMessage(`Removed ${cat.name}'s costume.`, 'info');
      } else {
        const costume = getCostumeById(costumeId);
        if (costume) {
          newCatCostumes[catId] = costumeId;
          showMessage(`${cat.name} is now wearing ${costume.name}! ${costume.emoji}`, 'success');
        }
      }
      
      return { 
        ...prev, 
        catCostumes: newCatCostumes,
      };
    });
  }, [setState, showMessage]);

  return { buyCostume, equipCostume };
}
