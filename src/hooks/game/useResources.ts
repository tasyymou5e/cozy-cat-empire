import { useCallback } from 'react';
import { GameState, Resources } from '@/types/game';
import { GameHookDependencies } from './types';

export interface ResourceActions {
  buyResource: (resource: keyof Resources, cost: number) => void;
  feedCats: () => void;
  feedSingleCat: (catId: string) => void;
  useToys: () => void;
  useMedicine: (catId: string) => void;
  addReward: (coins: number, resources?: Partial<Resources>) => void;
}

export function useResources(deps: GameHookDependencies): ResourceActions {
  const { setState, showMessage, playSound, relationshipSystem } = deps;

  const buyResource = useCallback((resource: keyof Resources, cost: number) => {
    setState(prev => {
      if (prev.money < cost) {
        showMessage("Not enough money!", 'error');
        playSound?.('error');
        return prev;
      }
      showMessage(`Bought 5 ${resource}! 📦`, 'success');
      playSound?.('click');
      return {
        ...prev,
        money: prev.money - cost,
        resources: { ...prev.resources, [resource]: prev.resources[resource] + 5 },
      };
    });
  }, [setState, showMessage, playSound]);

  const feedCats = useCallback(() => {
    setState(prev => {
      const needed = prev.cats.length;
      if (prev.resources.food < needed) {
        if (prev.cats.length >= 2) {
          const rivals = relationshipSystem.relationships.filter(r => r.score <= -20);
          if (rivals.length > 0 && Math.random() < 0.3) {
            const rival = rivals[Math.floor(Math.random() * rivals.length)];
            const cat1 = prev.cats.find(c => c.id === rival.catId1);
            const cat2 = prev.cats.find(c => c.id === rival.catId2);
            if (cat1 && cat2) {
              relationshipSystem.addEvent(cat1, cat2, 'negative', `${cat1.name} and ${cat2.name} fought over the last food`, -10, prev.day);
              playSound?.('hiss');
            }
          }
        }
        showMessage(`Need ${needed} food! Buy more supplies. 🍖`, 'warning');
        playSound?.('error');
        return prev;
      }
      
      if (prev.cats.length >= 2 && Math.random() < 0.2) {
        const shuffled = [...prev.cats].sort(() => Math.random() - 0.5);
        relationshipSystem.addEvent(shuffled[0], shuffled[1], 'positive', `${shuffled[0].name} and ${shuffled[1].name} ate together peacefully`, 2, prev.day);
      }
      
      showMessage("All cats fed! They're happy! 😸", 'success');
      playSound?.('purr');
      return {
        ...prev,
        resources: { ...prev.resources, food: prev.resources.food - needed },
        cats: prev.cats.map(cat => ({
          ...cat,
          hunger: Math.min(100, cat.hunger + 30),
          health: Math.min(100, cat.health + 5),
          happiness: Math.min(100, cat.happiness + 3),
        })),
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem]);

  const feedSingleCat = useCallback((catId: string) => {
    setState(prev => {
      if (prev.resources.food < 1) {
        showMessage("No food available! Buy from shop. 🍖", 'warning');
        playSound?.('error');
        return prev;
      }
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      showMessage(`${cat.name} enjoyed the snack! 😋`, 'success');
      playSound?.('purr');
      return {
        ...prev,
        resources: { ...prev.resources, food: prev.resources.food - 1 },
        cats: prev.cats.map(c => c.id === catId 
          ? { ...c, hunger: Math.min(100, c.hunger + 30), happiness: Math.min(100, c.happiness + 5) } 
          : c
        ),
      };
    });
  }, [setState, showMessage, playSound]);

  const useToys = useCallback(() => {
    setState(prev => {
      const needed = Math.ceil(prev.cats.length / 3);
      if (prev.resources.toys < needed) {
        showMessage(`Need ${needed} toys for playtime! 🎾`, 'warning');
        playSound?.('error');
        return prev;
      }
      
      if (prev.cats.length >= 2) {
        const shuffled = [...prev.cats].sort(() => Math.random() - 0.5);
        relationshipSystem.addEvent(shuffled[0], shuffled[1], 'positive', `${shuffled[0].name} and ${shuffled[1].name} played with toys together`, 5, prev.day);
        playSound?.('friendship');
      }
      
      showMessage("Playtime! Cats are having fun! 🎉", 'success');
      playSound?.('success');
      return {
        ...prev,
        resources: { ...prev.resources, toys: prev.resources.toys - needed },
        cats: prev.cats.map(cat => ({ ...cat, happiness: Math.min(100, cat.happiness + 15) })),
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem]);

  const useMedicine = useCallback((catId: string) => {
    setState(prev => {
      if (prev.resources.medicine < 1) {
        showMessage("No medicine available! Buy from shop. 💊", 'warning');
        playSound?.('error');
        return prev;
      }
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      showMessage(`${cat.name} is feeling better! 💚`, 'success');
      playSound?.('success');
      return {
        ...prev,
        resources: { ...prev.resources, medicine: prev.resources.medicine - 1 },
        cats: prev.cats.map(c => c.id === catId ? { ...c, health: 100 } : c),
      };
    });
  }, [setState, showMessage, playSound]);

  const addReward = useCallback((coins: number, resources?: Partial<Resources>) => {
    setState(prev => ({
      ...prev,
      money: prev.money + coins,
      totalMoneyEarned: prev.totalMoneyEarned + coins,
      resources: {
        food: prev.resources.food + (resources?.food || 0),
        medicine: prev.resources.medicine + (resources?.medicine || 0),
        toys: prev.resources.toys + (resources?.toys || 0),
        treats: prev.resources.treats + (resources?.treats || 0),
      },
    }));
  }, [setState]);

  return { 
    buyResource, 
    feedCats, 
    feedSingleCat, 
    useToys, 
    useMedicine, 
    addReward 
  };
}
