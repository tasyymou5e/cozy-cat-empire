import { useState, useCallback, useEffect } from 'react';
import { 
  Cat, GameState, CAT_NAMES, BREEDS, PERSONALITIES, 
  CAT_COSTS, HOUSE_UPGRADES, CatBreed, MarketListing, Achievement, ACHIEVEMENT_DEFS 
} from '@/types/game';

const SAVE_KEY = 'cat-farm-save';
const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomBreed = (type: Cat['type']): CatBreed => {
  if (type === 'stray') return 'stray';
  if (type === 'adopted') {
    const breeds: CatBreed[] = ['stray', 'tabby', 'persian'];
    return breeds[Math.floor(Math.random() * breeds.length)];
  }
  const pureBreeds: CatBreed[] = ['persian', 'siamese', 'maine-coon', 'british-shorthair', 'ragdoll', 'bengal'];
  return pureBreeds[Math.floor(Math.random() * pureBreeds.length)];
};

const createInitialAchievements = (): Achievement[] => 
  ACHIEVEMENT_DEFS.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    target: a.target,
    unlocked: false,
  }));

function generateMarketListings(): MarketListing[] {
  const sellers = ['Happy Paws Shelter', 'Elite Breeders', 'Cat Haven', 'Whisker World'];
  const listings: MarketListing[] = [];
  
  for (let i = 0; i < 4; i++) {
    const breed = (['tabby', 'persian', 'siamese', 'maine-coon', 'british-shorthair'] as CatBreed[])[Math.floor(Math.random() * 5)];
    const baseValue = BREEDS[breed].baseValue;
    const usedNames = listings.map(l => l.cat.name);
    const availableNames = CAT_NAMES.filter(n => !usedNames.includes(n));
    
    listings.push({
      id: generateId(),
      cat: {
        id: generateId(),
        type: Math.random() > 0.5 ? 'adopted' : 'pure',
        breed,
        name: availableNames[Math.floor(Math.random() * availableNames.length)],
        health: 80 + Math.floor(Math.random() * 20),
        happiness: 70 + Math.floor(Math.random() * 30),
        hunger: 50 + Math.floor(Math.random() * 30),
        value: baseValue + Math.floor(Math.random() * 100),
        age: 1 + Math.floor(Math.random() * 5),
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0,
        isForSale: false,
      },
      price: baseValue + 50 + Math.floor(Math.random() * 150),
      seller: sellers[Math.floor(Math.random() * sellers.length)],
    });
  }
  return listings;
}

const createInitialState = (): GameState => ({
  cats: [],
  money: 150,
  space: 5,
  houseSize: 'apartment',
  acres: 0,
  day: 1,
  resources: { food: 10, medicine: 2, toys: 3, treats: 5 },
  reputation: 0,
  totalShowWins: 0,
  catsAdopted: 0,
  totalMoneyEarned: 150,
  marketListings: generateMarketListings(),
  achievements: createInitialAchievements(),
  breedingCooldown: 0,
});


export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [message, setMessage] = useState<string>('Welcome to Cat Farm! Start your feline empire! 🐱');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [kittensBreed, setKittensBreed] = useState(0);

  const showMessage = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  // Check achievements
  const checkAchievements = useCallback((newState: GameState, extraKittens = 0): GameState => {
    const stats = {
      cats: newState.cats.length,
      showWins: newState.totalShowWins,
      money: newState.totalMoneyEarned,
      house: newState.houseSize === 'house' || newState.houseSize === 'mansion' || newState.houseSize === 'farm',
      farm: newState.houseSize === 'farm',
      acres: newState.acres,
    };

    let newUnlocks: string[] = [];
    const updatedAchievements = newState.achievements.map(a => {
      if (a.unlocked) return a;
      
      let achieved = false;
      switch (a.id) {
        case 'first_cat':
          achieved = stats.cats >= a.target;
          break;
        case 'cat_collector':
        case 'cat_empire':
          achieved = stats.cats >= a.target;
          break;
        case 'show_winner':
        case 'champion':
          achieved = stats.showWins >= a.target;
          break;
        case 'millionaire':
          achieved = stats.money >= a.target;
          break;
        case 'breeder':
        case 'master_breeder':
          achieved = (kittensBreed + extraKittens) >= a.target;
          break;
        case 'homeowner':
          achieved = stats.house;
          break;
        case 'farmer':
          achieved = stats.farm;
          break;
        case 'land_baron':
          achieved = stats.acres >= a.target;
          break;
      }

      if (achieved) {
        newUnlocks.push(a.name);
        return { ...a, unlocked: true, unlockedAt: newState.day };
      }
      return a;
    });

    if (newUnlocks.length > 0) {
      setTimeout(() => showMessage(`🏆 Achievement unlocked: ${newUnlocks.join(', ')}!`, 'success'), 100);
    }

    return { ...newState, achievements: updatedAchievements };
  }, [kittensBreed]);

  const addCat = useCallback((type: Cat['type']) => {
    setState(prev => {
      if (prev.cats.length >= prev.space) {
        showMessage("No space! Upgrade your home first. 🏠", 'warning');
        return prev;
      }
      const cost = CAT_COSTS[type];
      if (prev.money < cost) {
        showMessage("Not enough cat money! 💸", 'error');
        return prev;
      }
      
      const breed = getRandomBreed(type);
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Cat ${prev.cats.length + 1}`;
      
      const newCat: Cat = {
        id: generateId(),
        type,
        breed,
        name,
        health: 100,
        happiness: 100,
        hunger: 50,
        value: BREEDS[breed].baseValue + Math.floor(Math.random() * 50),
        age: type === 'stray' ? Math.floor(Math.random() * 3) + 1 : 1,
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0,
        isForSale: false,
      };
      
      showMessage(`Welcome ${name} the ${BREEDS[breed].name}! 🎉`, 'success');
      return { 
        ...prev, 
        money: prev.money - cost, 
        cats: [...prev.cats, newCat],
        catsAdopted: prev.catsAdopted + 1,
      };
    });
  }, []);

  const buyFromMarket = useCallback((listingId: string) => {
    setState(prev => {
      const listing = prev.marketListings.find(l => l.id === listingId);
      if (!listing) return prev;
      
      if (prev.cats.length >= prev.space) {
        showMessage("No space! Upgrade your home first. 🏠", 'warning');
        return prev;
      }
      if (prev.money < listing.price) {
        showMessage("Not enough cat money! 💸", 'error');
        return prev;
      }
      
      const newCat = { ...listing.cat, id: generateId(), isForSale: false };
      showMessage(`Bought ${newCat.name} from ${listing.seller}! 🛒`, 'success');
      
      return {
        ...prev,
        money: prev.money - listing.price,
        cats: [...prev.cats, newCat],
        marketListings: prev.marketListings.filter(l => l.id !== listingId),
        catsAdopted: prev.catsAdopted + 1,
      };
    });
  }, []);

  const doChore = useCallback((choreId: string, baseReward: number) => {
    const bonus = Math.floor(Math.random() * 20);
    const earnings = baseReward + bonus;
    setState(prev => {
      const happinessBoost = choreId === 'play' || choreId === 'socialize';
      return {
        ...prev,
        money: prev.money + earnings,
        cats: happinessBoost ? prev.cats.map(cat => ({
          ...cat,
          happiness: Math.min(100, cat.happiness + 5),
        })) : prev.cats,
      };
    });
    showMessage(`Chore done! Earned $${earnings}. 🧹`, 'success');
  }, []);

  const buyResource = useCallback((resource: keyof GameState['resources'], cost: number) => {
    setState(prev => {
      if (prev.money < cost) {
        showMessage("Not enough money!", 'error');
        return prev;
      }
      return {
        ...prev,
        money: prev.money - cost,
        resources: { ...prev.resources, [resource]: prev.resources[resource] + 5 },
      };
    });
    showMessage(`Bought 5 ${resource}! 📦`, 'success');
  }, []);

  const feedCats = useCallback(() => {
    setState(prev => {
      const needed = prev.cats.length;
      if (prev.resources.food < needed) {
        showMessage(`Need ${needed} food! Buy more supplies. 🍖`, 'warning');
        return prev;
      }
      showMessage("All cats fed! They're happy! 😸", 'success');
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
  }, []);

  const useToys = useCallback(() => {
    setState(prev => {
      const needed = Math.ceil(prev.cats.length / 3);
      if (prev.resources.toys < needed) {
        showMessage(`Need ${needed} toys for playtime! 🎾`, 'warning');
        return prev;
      }
      showMessage("Playtime! Cats are having fun! 🎉", 'success');
      return {
        ...prev,
        resources: { ...prev.resources, toys: prev.resources.toys - needed },
        cats: prev.cats.map(cat => ({
          ...cat,
          happiness: Math.min(100, cat.happiness + 15),
        })),
      };
    });
  }, []);

  const useMedicine = useCallback((catId: string) => {
    setState(prev => {
      if (prev.resources.medicine < 1) {
        showMessage("No medicine available! Buy from shop. 💊", 'warning');
        return prev;
      }
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      showMessage(`${cat.name} is feeling better! 💚`, 'success');
      return {
        ...prev,
        resources: { ...prev.resources, medicine: prev.resources.medicine - 1 },
        cats: prev.cats.map(c => c.id === catId ? { ...c, health: 100 } : c),
      };
    });
  }, []);

  const catShow = useCallback(() => {
    setState(prev => {
      const eligibleCats = prev.cats.filter(c => c.health >= 70 && c.happiness >= 60);
      if (eligibleCats.length === 0) {
        showMessage("No cats healthy/happy enough for the show! 🎪", 'warning');
        return prev;
      }
      
      const participants = eligibleCats.slice(0, 5);
      let totalReward = 0;
      let wins = 0;
      
      const updatedCats = prev.cats.map(cat => {
        if (!participants.find(p => p.id === cat.id)) return cat;
        
        const score = cat.health + cat.happiness + (BREEDS[cat.breed].rarity * 10) + (cat.showWins * 5);
        const won = Math.random() * 200 < score;
        
        if (won) {
          wins++;
          totalReward += 50 + BREEDS[cat.breed].baseValue / 2;
          return { ...cat, showWins: cat.showWins + 1, value: cat.value + 20 };
        }
        return cat;
      });
      
      totalReward = Math.floor(totalReward);
      showMessage(`Cat show results: ${wins} wins! Earned $${totalReward}! 🏆`, wins > 0 ? 'success' : 'info');
      
      return {
        ...prev,
        money: prev.money + totalReward,
        cats: updatedCats,
        totalShowWins: prev.totalShowWins + wins,
        reputation: prev.reputation + wins * 2,
      };
    });
  }, []);

  const sellCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
      showMessage(`Goodbye ${cat.name}! Sold for $${sellPrice}. 👋`, 'info');
      return {
        ...prev,
        money: prev.money + sellPrice,
        cats: prev.cats.filter(c => c.id !== catId),
      };
    });
  }, []);

  const upgradeHouse = useCallback(() => {
    setState(prev => {
      if (prev.houseSize === 'farm') {
        if (prev.acres >= 100) {
          showMessage("Your farm is at maximum size! 🌾", 'info');
          return prev;
        }
        const cost = 5000 * (prev.acres + 1);
        if (prev.money < cost) {
          showMessage(`Need $${cost} to expand farm! 💰`, 'warning');
          return prev;
        }
        showMessage(`Farm expanded to ${prev.acres + 1} acres! 🚜`, 'success');
        return {
          ...prev,
          money: prev.money - cost,
          acres: prev.acres + 1,
          space: prev.space + 20,
        };
      }

      const upgrade = HOUSE_UPGRADES[prev.houseSize];
      if (!upgrade.next) return prev;
      
      if (prev.money < upgrade.cost) {
        showMessage(`Need $${upgrade.cost} to upgrade! 💰`, 'warning');
        return prev;
      }

      const newHouse = upgrade.next;
      showMessage(`Upgraded to ${newHouse}! 🎊`, 'success');
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
        .map(cat => {
          let health = cat.health;
          let happiness = Math.max(0, cat.happiness - 3);
          let hunger = Math.max(0, cat.hunger - 10);
          
          if (hunger < 30) {
            health -= 5;
            happiness -= 5;
          }
          if (happiness < 40) health -= 3;
          
          health = Math.max(0, health);
          happiness = Math.max(0, happiness);
          
          return { ...cat, health, happiness, hunger, age: cat.age + 0.01 };
        })
        .filter(cat => {
          if (cat.health <= 0) {
            deadCats.push(cat.name);
            return false;
          }
          return true;
        });

      // Refresh market every 3 days
      const newMarket = prev.day % 3 === 0 ? generateMarketListings() : prev.marketListings;
      const newCooldown = Math.max(0, prev.breedingCooldown - 1);

      if (deadCats.length > 0) {
        showMessage(`Day ${prev.day + 1}. Sadly, ${deadCats.join(', ')} passed away... 😢`, 'error');
      } else {
        showMessage(`Day ${prev.day + 1} begins! ☀️`, 'info');
      }

      const newState = { 
        ...prev, 
        day: prev.day + 1, 
        cats: updatedCats, 
        marketListings: newMarket,
        breedingCooldown: newCooldown,
      };
      return checkAchievements(newState);
    });
  }, [checkAchievements]);

  // Breeding
  const breedCats = useCallback((cat1Id: string, cat2Id: string) => {
    setState(prev => {
      if (prev.breedingCooldown > 0) {
        showMessage(`Breeding on cooldown! ${prev.breedingCooldown} days left.`, 'warning');
        return prev;
      }
      if (prev.cats.length >= prev.space) {
        showMessage("No space for kittens! Upgrade home first. 🏠", 'warning');
        return prev;
      }

      const parent1 = prev.cats.find(c => c.id === cat1Id);
      const parent2 = prev.cats.find(c => c.id === cat2Id);
      if (!parent1 || !parent2) return prev;

      // Kitten inherits breed from one parent
      const breeds = [parent1.breed, parent2.breed];
      const breed = breeds[Math.floor(Math.random() * 2)];
      
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Kitten ${prev.cats.length + 1}`;

      const kitten: Cat = {
        id: generateId(),
        type: 'pure',
        breed,
        name,
        health: 100,
        happiness: 100,
        hunger: 70,
        value: Math.floor((BREEDS[parent1.breed].baseValue + BREEDS[parent2.breed].baseValue) / 2 + Math.random() * 50),
        age: 0,
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0,
        isForSale: false,
      };

      setKittensBreed(k => k + 1);
      showMessage(`🎉 ${parent1.name} and ${parent2.name} had a kitten: ${name}!`, 'success');

      const newState = {
        ...prev,
        cats: [...prev.cats, kitten],
        breedingCooldown: 5,
      };
      return checkAchievements(newState, 1);
    });
  }, [checkAchievements]);

  // Save game
  const saveGame = useCallback(() => {
    const saveData = {
      state,
      kittensBreed,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    showMessage('Game saved! 💾', 'success');
  }, [state, kittensBreed]);

  // Load game
  const loadGame = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      showMessage('No saved game found!', 'warning');
      return;
    }
    try {
      const saveData = JSON.parse(saved);
      setState(saveData.state);
      setKittensBreed(saveData.kittensBreed || 0);
      showMessage(`Game loaded! Day ${saveData.state.day} 📂`, 'success');
    } catch {
      showMessage('Failed to load save!', 'error');
    }
  }, []);

  // Check if save exists
  const hasSaveGame = useCallback(() => {
    return localStorage.getItem(SAVE_KEY) !== null;
  }, []);

  const getSaveDay = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return undefined;
    try {
      return JSON.parse(saved).state.day;
    } catch {
      return undefined;
    }
  }, []);

  const resetGame = useCallback(() => {
    setState(createInitialState());
    setKittensBreed(0);
    showMessage('New game started! 🐱', 'info');
  }, []);

  return {
    state,
    message,
    messageType,
    kittensBreed,
    actions: {
      addCat,
      buyFromMarket,
      doChore,
      buyResource,
      feedCats,
      useToys,
      useMedicine,
      catShow,
      sellCat,
      upgradeHouse,
      nextDay,
      resetGame,
      breedCats,
      saveGame,
      loadGame,
      hasSaveGame,
      getSaveDay,
    },
  };
}
