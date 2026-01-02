import { useState, useCallback, useEffect } from 'react';
import { 
  Cat, GameState, CAT_NAMES, BREEDS, PERSONALITIES, 
  CAT_COSTS, HOUSE_UPGRADES, CatBreed, MarketListing, Achievement, ACHIEVEMENT_DEFS 
} from '@/types/game';
import { useRelationships } from './useRelationships';
import { generateRandomGrade, TrickId, TRICKS } from '@/types/grading';

const SAVE_KEY = 'cat-farm-save';
const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultTrickProgress = (): Record<TrickId, number> => ({
  sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0
});

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
        grade: generateRandomGrade(),
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 70 + Math.floor(Math.random() * 30),
        feedingScore: 0,
        lastTrainingDay: 0,
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

  const relationshipSystem = useRelationships();

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
        grade: generateRandomGrade(),
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 100,
        feedingScore: 0,
        lastTrainingDay: 0,
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
        // Food scarcity can cause fights between rivals
        if (prev.cats.length >= 2) {
          const rivals = relationshipSystem.relationships.filter(r => r.score <= -20);
          if (rivals.length > 0 && Math.random() < 0.3) {
            const rival = rivals[Math.floor(Math.random() * rivals.length)];
            const cat1 = prev.cats.find(c => c.id === rival.catId1);
            const cat2 = prev.cats.find(c => c.id === rival.catId2);
            if (cat1 && cat2) {
              relationshipSystem.addEvent(cat1, cat2, 'negative', `${cat1.name} and ${cat2.name} fought over the last food`, -10, prev.day);
            }
          }
        }
        showMessage(`Need ${needed} food! Buy more supplies. 🍖`, 'warning');
        return prev;
      }
      
      // Feeding together can boost relationships slightly
      if (prev.cats.length >= 2 && Math.random() < 0.2) {
        const shuffled = [...prev.cats].sort(() => Math.random() - 0.5);
        relationshipSystem.addEvent(shuffled[0], shuffled[1], 'positive', `${shuffled[0].name} and ${shuffled[1].name} ate together peacefully`, 2, prev.day);
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
  }, [relationshipSystem]);

  const useToys = useCallback(() => {
    setState(prev => {
      const needed = Math.ceil(prev.cats.length / 3);
      if (prev.resources.toys < needed) {
        showMessage(`Need ${needed} toys for playtime! 🎾`, 'warning');
        return prev;
      }
      
      // Playing together boosts relationships
      if (prev.cats.length >= 2) {
        const shuffled = [...prev.cats].sort(() => Math.random() - 0.5);
        const cat1 = shuffled[0];
        const cat2 = shuffled[1];
        relationshipSystem.addEvent(cat1, cat2, 'positive', `${cat1.name} and ${cat2.name} played with toys together`, 5, prev.day);
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
  }, [relationshipSystem]);

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
      const winners: string[] = [];
      const losers: string[] = [];
      
      const updatedCats = prev.cats.map(cat => {
        if (!participants.find(p => p.id === cat.id)) return cat;
        
        // Check for friend bonus in show
        const friendsInShow = participants.filter(p => {
          if (p.id === cat.id) return false;
          const rel = relationshipSystem.getRelationship(cat.id, p.id);
          return rel && rel.score >= 20;
        });
        const friendBonus = friendsInShow.length * 5;
        
        const score = cat.health + cat.happiness + (BREEDS[cat.breed].rarity * 10) + (cat.showWins * 5) + friendBonus;
        const won = Math.random() * 200 < score;
        
        if (won) {
          wins++;
          winners.push(cat.id);
          totalReward += 50 + BREEDS[cat.breed].baseValue / 2;
          return { ...cat, showWins: cat.showWins + 1, value: cat.value + 20 };
        }
        losers.push(cat.id);
        return cat;
      });
      
      // Show competition can create rivalries between competitors
      if (winners.length > 0 && losers.length > 0 && Math.random() < 0.2) {
        const winnerId = winners[Math.floor(Math.random() * winners.length)];
        const loserId = losers[Math.floor(Math.random() * losers.length)];
        const winner = prev.cats.find(c => c.id === winnerId);
        const loser = prev.cats.find(c => c.id === loserId);
        if (winner && loser) {
          relationshipSystem.addEvent(loser, winner, 'negative', `${loser.name} is jealous of ${winner.name}'s show win`, -5, prev.day);
        }
      }
      
      // Winners who are friends celebrate together
      if (winners.length >= 2 && Math.random() < 0.3) {
        const cat1 = prev.cats.find(c => c.id === winners[0]);
        const cat2 = prev.cats.find(c => c.id === winners[1]);
        if (cat1 && cat2) {
          relationshipSystem.addEvent(cat1, cat2, 'positive', `${cat1.name} and ${cat2.name} celebrated their show wins together`, 5, prev.day);
        }
      }
      
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
  }, [relationshipSystem]);

  const sellCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
      showMessage(`Goodbye ${cat.name}! Sold for $${sellPrice}. 👋`, 'info');
      relationshipSystem.removeCatRelationships(catId);
      return {
        ...prev,
        money: prev.money + sellPrice,
        cats: prev.cats.filter(c => c.id !== catId),
      };
    });
  }, [relationshipSystem]);

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
          
          // Apply relationship happiness modifiers
          const relationshipMod = relationshipSystem.getHappinessModifier(cat.id);
          happiness = Math.max(0, Math.min(100, happiness + relationshipMod));
          
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
            relationshipSystem.removeCatRelationships(cat.id);
            return false;
          }
          return true;
        });

      // Process daily relationship changes
      relationshipSystem.processDailyRelationships(updatedCats, prev.day + 1);
      relationshipSystem.detectGroups(updatedCats);

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
  }, [checkAchievements, relationshipSystem]);

  // Socialize two cats
  const socializeCats = useCallback((cat1Id: string, cat2Id: string) => {
    setState(prev => {
      if (prev.resources.treats < 2) {
        showMessage("Need 2 treats to socialize! 🍬", 'warning');
        return prev;
      }

      const cat1 = prev.cats.find(c => c.id === cat1Id);
      const cat2 = prev.cats.find(c => c.id === cat2Id);
      if (!cat1 || !cat2) return prev;

      const result = relationshipSystem.socializeCats(cat1, cat2, prev.day);
      showMessage(`🤝 ${result.message}`, 'success');

      return {
        ...prev,
        resources: { ...prev.resources, treats: prev.resources.treats - 2 },
        cats: prev.cats.map(c => {
          if (c.id === cat1Id || c.id === cat2Id) {
            return { ...c, happiness: Math.min(100, c.happiness + 5) };
          }
          return c;
        }),
      };
    });
  }, [relationshipSystem]);

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

      // Check relationship compatibility
      const compatibility = relationshipSystem.getBreedingCompatibility(cat1Id, cat2Id);
      if (!compatibility.canBreed) {
        showMessage(`💔 ${compatibility.message}`, 'error');
        return prev;
      }

      // Rivals have 50% failure chance
      if (compatibility.bonus < 0 && Math.random() < 0.5) {
        showMessage(`${parent1.name} and ${parent2.name} refused to breed... 😾`, 'warning');
        return { ...prev, breedingCooldown: 2 };
      }

      // Kitten inherits breed from one parent
      const breeds = [parent1.breed, parent2.breed];
      const breed = breeds[Math.floor(Math.random() * 2)];
      
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Kitten ${prev.cats.length + 1}`;

      // Apply relationship bonuses to kitten stats
      const healthBonus = Math.floor(compatibility.bonus / 2);
      const happinessBonus = Math.floor(compatibility.bonus / 2);

      // Kitten grade based on parent average with variance
      const parentAvgGrade = Math.floor((parent1.grade + parent2.grade) / 2);
      const gradeVariance = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const kittenGrade = Math.max(1, Math.min(20, parentAvgGrade + gradeVariance + Math.floor(compatibility.bonus / 10)));

      const kitten: Cat = {
        id: generateId(),
        type: 'pure',
        breed,
        name,
        health: Math.min(100, 100 + healthBonus),
        happiness: Math.min(100, 100 + happinessBonus),
        hunger: 70,
        value: Math.floor((BREEDS[parent1.breed].baseValue + BREEDS[parent2.breed].baseValue) / 2 + Math.random() * 50 + compatibility.bonus),
        age: 0,
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0,
        isForSale: false,
        grade: kittenGrade,
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 100,
        feedingScore: 0,
        lastTrainingDay: 0,
      };

      // Breeding improves parent relationship
      relationshipSystem.addEvent(parent1, parent2, 'positive', `${parent1.name} and ${parent2.name} had a kitten together`, 15, prev.day);

      setKittensBreed(k => k + 1);
      const bonusMsg = compatibility.bonus > 0 ? ` (${compatibility.message})` : '';
      showMessage(`🎉 ${parent1.name} and ${parent2.name} had a kitten: ${name}!${bonusMsg}`, 'success');

      const newState = {
        ...prev,
        cats: [...prev.cats, kitten],
        breedingCooldown: 5,
      };
      return checkAchievements(newState, 1);
    });
  }, [checkAchievements, relationshipSystem]);

  // Save game
  const saveGame = useCallback(() => {
    const saveData = {
      state,
      kittensBreed,
      relationships: relationshipSystem.getRelationshipSaveData(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    showMessage('Game saved! 💾', 'success');
  }, [state, kittensBreed, relationshipSystem]);

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
      if (saveData.relationships) {
        relationshipSystem.loadRelationships(saveData.relationships);
      }
      showMessage(`Game loaded! Day ${saveData.state.day} 📂`, 'success');
    } catch {
      showMessage('Failed to load save!', 'error');
    }
  }, [relationshipSystem]);

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

  // Group activity
  const doGroupActivity = useCallback((groupId: string, activityType: 'play' | 'treat' | 'nap') => {
    const group = relationshipSystem.groups.find(g => g.id === groupId);
    if (!group) return;

    const costs = {
      play: { toys: 1, treats: 0 },
      treat: { toys: 0, treats: 2 },
      nap: { toys: 0, treats: 0 },
    };

    const bonuses = {
      play: { happiness: 10, relationship: 5 },
      treat: { happiness: 8, relationship: 8 },
      nap: { happiness: 5, relationship: 3 },
    };

    setState(prev => {
      const cost = costs[activityType];
      if (prev.resources.toys < cost.toys || prev.resources.treats < cost.treats) {
        showMessage("Not enough resources for group activity!", 'warning');
        return prev;
      }

      const bonus = bonuses[activityType];
      const memberCats = prev.cats.filter(c => group.memberIds.includes(c.id));

      // Boost relationships between all group members
      for (let i = 0; i < memberCats.length; i++) {
        for (let j = i + 1; j < memberCats.length; j++) {
          relationshipSystem.addEvent(
            memberCats[i], 
            memberCats[j], 
            'positive', 
            `${memberCats[i].name} and ${memberCats[j].name} did a group ${activityType} activity`,
            bonus.relationship,
            prev.day
          );
        }
      }

      const activityNames = { play: 'playtime', treat: 'treat party', nap: 'nap session' };
      showMessage(`${group.name} had a group ${activityNames[activityType]}! 🎉`, 'success');

      return {
        ...prev,
        resources: {
          ...prev.resources,
          toys: prev.resources.toys - cost.toys,
          treats: prev.resources.treats - cost.treats,
        },
        cats: prev.cats.map(cat => {
          if (group.memberIds.includes(cat.id)) {
            return { ...cat, happiness: Math.min(100, cat.happiness + bonus.happiness) };
          }
          return cat;
        }),
      };
    });
  }, [relationshipSystem]);

  // Train a cat on a trick
  const trainCat = useCallback((catId: string, trickId: TrickId) => {
    setState(prev => {
      if (prev.resources.treats < 1 || prev.resources.toys < 1) {
        showMessage("Need 1 treat and 1 toy to train! 🎾", 'warning');
        return prev;
      }

      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;

      if (cat.lastTrainingDay >= prev.day) {
        showMessage(`${cat.name} already trained today! Try tomorrow.`, 'warning');
        return prev;
      }

      const trick = TRICKS.find(t => t.id === trickId);
      if (!trick) return prev;

      // Calculate progress gain (20-40 based on rest level)
      const restBonus = cat.restLevel >= 80 ? 10 : 0;
      const progressGain = 20 + Math.floor(Math.random() * 20) + restBonus;
      const newProgress = Math.min(100, (cat.trickProgress[trickId] || 0) + progressGain);
      const learned = newProgress >= 100;

      const newTrickProgress = { ...cat.trickProgress, [trickId]: newProgress };
      const newTricksLearned = learned && !cat.tricksLearned.includes(trickId)
        ? [...cat.tricksLearned, trickId]
        : cat.tricksLearned;

      // Calculate grade bonus from tricks
      let gradeBonus = 0;
      if (learned && !cat.tricksLearned.includes(trickId)) {
        gradeBonus = trick.gradeBonus;
        showMessage(`🎉 ${cat.name} learned ${trick.name}! (+${gradeBonus} grade)`, 'success');
      } else {
        showMessage(`${cat.name} practiced ${trick.name}! (${newProgress}% progress)`, 'info');
      }

      return {
        ...prev,
        resources: {
          ...prev.resources,
          treats: prev.resources.treats - 1,
          toys: prev.resources.toys - 1,
        },
        cats: prev.cats.map(c => {
          if (c.id !== catId) return c;
          return {
            ...c,
            trickProgress: newTrickProgress,
            tricksLearned: newTricksLearned,
            grade: Math.min(20, c.grade + gradeBonus),
            restLevel: Math.max(0, c.restLevel - 10),
            lastTrainingDay: prev.day,
          };
        }),
      };
    });
  }, []);

  // Rest a cat
  const restCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;

      const restGain = 20;
      const newRest = Math.min(100, cat.restLevel + restGain);
      const gradeBonus = newRest >= 80 && cat.restLevel < 80 ? 0.25 : 0;

      showMessage(`${cat.name} is resting... 😴`, 'info');

      return {
        ...prev,
        cats: prev.cats.map(c => {
          if (c.id !== catId) return c;
          return {
            ...c,
            restLevel: newRest,
            grade: Math.min(20, c.grade + gradeBonus),
            happiness: Math.min(100, c.happiness + 5),
          };
        }),
      };
    });
  }, []);

  return {
    state,
    message,
    messageType,
    kittensBreed,
    relationshipSystem,
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
      socializeCats,
      doGroupActivity,
      trainCat,
      restCat,
      saveGame,
      loadGame,
      hasSaveGame,
      getSaveDay,
    },
  };
}
