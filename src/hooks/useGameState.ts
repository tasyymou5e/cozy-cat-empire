import { useState, useCallback } from 'react';
import { Cat, GameState, CAT_NAMES, CAT_COSTS, HOUSE_UPGRADES } from '@/types/game';

const generateId = () => Math.random().toString(36).substr(2, 9);
const randomValue = () => Math.floor(Math.random() * 151) + 50;
const randomEarnings = () => Math.floor(Math.random() * 41) + 10;

const initialState: GameState = {
  cats: [],
  money: 100,
  space: 5,
  houseSize: 'apartment',
  acres: 0,
  day: 1,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [message, setMessage] = useState<string>('Welcome to Cat Farm! 🐱');

  const showMessage = (msg: string) => setMessage(msg);

  const addCat = useCallback((type: Cat['type']) => {
    setState(prev => {
      if (prev.cats.length >= prev.space) {
        showMessage("No space! Upgrade your home first. 🏠");
        return prev;
      }
      const cost = CAT_COSTS[type];
      if (prev.money < cost) {
        showMessage("Not enough cat money! 💸");
        return prev;
      }
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Cat ${prev.cats.length + 1}`;
      
      const newCat: Cat = {
        id: generateId(),
        type,
        name,
        health: 100,
        happiness: 100,
        value: randomValue(),
      };
      showMessage(`Welcome ${name} the ${type} cat! 🎉`);
      return { ...prev, money: prev.money - cost, cats: [...prev.cats, newCat] };
    });
  }, []);

  const doChores = useCallback(() => {
    const earnings = randomEarnings();
    setState(prev => ({ ...prev, money: prev.money + earnings }));
    showMessage(`Chores done! Earned ${earnings} cat money. 🧹`);
  }, []);

  const feedCats = useCallback(() => {
    setState(prev => {
      const cost = prev.cats.length * 5;
      if (prev.money < cost) {
        showMessage("Not enough money to feed cats! They're getting hungry... 😿");
        return {
          ...prev,
          cats: prev.cats.map(cat => ({
            ...cat,
            health: Math.max(0, cat.health - 10),
            happiness: Math.max(0, cat.happiness - 10),
          })),
        };
      }
      showMessage("All cats fed! They're happy! 😸");
      return {
        ...prev,
        money: prev.money - cost,
        cats: prev.cats.map(cat => ({
          ...cat,
          health: Math.min(100, cat.health + 10),
        })),
      };
    });
  }, []);

  const catShow = useCallback(() => {
    setState(prev => {
      if (prev.cats.length === 0) {
        showMessage("You need cats for the show! 🎪");
        return prev;
      }
      const rewards = Math.floor(prev.cats.reduce((sum, cat) => sum + cat.value, 0) / 10);
      showMessage(`Cat show success! Won ${rewards} cat money! 🏆`);
      return { ...prev, money: prev.money + rewards };
    });
  }, []);

  const sellCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      showMessage(`Goodbye ${cat.name}! Sold for ${cat.value} cat money. 👋`);
      return {
        ...prev,
        money: prev.money + cat.value,
        cats: prev.cats.filter(c => c.id !== catId),
      };
    });
  }, []);

  const upgradeHouse = useCallback(() => {
    setState(prev => {
      if (prev.houseSize === 'farm') {
        if (prev.acres >= 100) {
          showMessage("Your farm is at maximum size! 🌾");
          return prev;
        }
        const cost = 500 * (prev.acres + 1);
        if (prev.money < cost) {
          showMessage(`Need ${cost} cat money to expand! 💰`);
          return prev;
        }
        showMessage(`Farm expanded to ${prev.acres + 1} acres! 🚜`);
        return {
          ...prev,
          money: prev.money - cost,
          acres: prev.acres + 1,
          space: prev.space + 10,
        };
      }

      const upgrade = HOUSE_UPGRADES[prev.houseSize];
      if (!upgrade.next) return prev;
      
      if (prev.money < upgrade.cost) {
        showMessage(`Need ${upgrade.cost} cat money to upgrade! 💰`);
        return prev;
      }

      const newHouse = upgrade.next;
      showMessage(`Upgraded to ${newHouse}! 🎊`);
      return {
        ...prev,
        money: prev.money - upgrade.cost,
        houseSize: newHouse,
        space: upgrade.space,
        acres: newHouse === 'farm' ? 1 : 0,
      };
    });
  }, []);

  const nextDay = useCallback(() => {
    setState(prev => {
      let deadCats: string[] = [];
      const updatedCats = prev.cats
        .map(cat => ({
          ...cat,
          happiness: Math.max(0, cat.happiness - 5),
          health: cat.happiness < 50 ? Math.max(0, cat.health - 5) : cat.health,
        }))
        .filter(cat => {
          if (cat.health <= 0) {
            deadCats.push(cat.name);
            return false;
          }
          return true;
        });

      if (deadCats.length > 0) {
        showMessage(`Day ${prev.day + 1}. Sadly, ${deadCats.join(', ')} passed away... 😢`);
      } else {
        showMessage(`Day ${prev.day + 1} begins! ☀️`);
      }

      return { ...prev, day: prev.day + 1, cats: updatedCats };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
    showMessage('New game started! 🐱');
  }, []);

  return {
    state,
    message,
    actions: {
      addCat,
      doChores,
      feedCats,
      catShow,
      sellCat,
      upgradeHouse,
      nextDay,
      resetGame,
    },
  };
}
