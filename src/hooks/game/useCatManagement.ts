import { useCallback } from 'react';
import { Cat, CAT_NAMES, BREEDS, PERSONALITIES, CAT_COSTS } from '@/types/game';
import { CatAppearance } from '@/types/catAppearance';
import { generateRandomGrade } from '@/types/grading';
import { GameHookDependencies, generateId, createDefaultTrickProgress, getRandomBreed } from './types';

export interface CatManagementActions {
  addCat: (type: Cat['type']) => void;
  buyFromMarket: (listingId: string) => void;
  sellCat: (catId: string) => void;
  renameCat: (catId: string, newName: string) => boolean;
  comfortCat: (catId: string) => void;
  addReceivedCat: (cat: Cat) => void;
  updateCatAppearance: (catId: string, appearance: CatAppearance) => void;
  updateCatPortrait: (catId: string, portraitUrl: string, hash?: string) => void;
}

export function useCatManagement(deps: GameHookDependencies): CatManagementActions {
  const { 
    setState, 
    showMessage, 
    playSound, 
    relationshipSystem, 
    onChallengeProgress 
  } = deps;

  const addCat = useCallback((type: Cat['type']) => {
    setState(prev => {
      if (prev.cats.length >= prev.space) {
        showMessage("No space! Upgrade your home first. 🏠", 'warning');
        playSound?.('error');
        return prev;
      }
      const cost = CAT_COSTS[type];
      if (prev.money < cost) {
        showMessage("Not enough cat money! 💸", 'error');
        playSound?.('error');
        return prev;
      }
      
      const breed = getRandomBreed(type);
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Cat ${prev.cats.length + 1}`;
      
      const newCat: Cat = {
        id: generateId(),
        type, breed, name,
        health: 100, happiness: 100, hunger: 50,
        value: BREEDS[breed].baseValue + Math.floor(Math.random() * 50),
        age: type === 'stray' ? Math.floor(Math.random() * 3) + 1 : 1,
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0, isForSale: false,
        grade: generateRandomGrade(),
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
      };
      
      showMessage(`Welcome ${name} the ${BREEDS[breed].name}! 🎉`, 'success');
      playSound?.('meow');
      onChallengeProgress?.('collect_cats', 1);
      return { 
        ...prev, 
        money: prev.money - cost, 
        cats: [...prev.cats, newCat],
        catsAdopted: prev.catsAdopted + 1,
      };
    });
  }, [setState, showMessage, playSound, onChallengeProgress]);

  const buyFromMarket = useCallback((listingId: string) => {
    setState(prev => {
      const listing = prev.marketListings.find(l => l.id === listingId);
      if (!listing) return prev;
      
      if (prev.cats.length >= prev.space) {
        showMessage("No space! Upgrade your home first. 🏠", 'warning');
        playSound?.('error');
        return prev;
      }
      if (prev.money < listing.price) {
        showMessage("Not enough cat money! 💸", 'error');
        playSound?.('error');
        return prev;
      }
      
      const newCat = { ...listing.cat, id: generateId(), isForSale: false };
      showMessage(`Bought ${newCat.name} from ${listing.seller}! 🛒`, 'success');
      playSound?.('coin');
      playSound?.('meow');
      onChallengeProgress?.('collect_cats', 1);
      
      return {
        ...prev,
        money: prev.money - listing.price,
        cats: [...prev.cats, newCat],
        marketListings: prev.marketListings.filter(l => l.id !== listingId),
        catsAdopted: prev.catsAdopted + 1,
      };
    });
  }, [setState, showMessage, playSound, onChallengeProgress]);

  const sellCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
      showMessage(`Goodbye ${cat.name}! Sold for $${sellPrice}. 👋`, 'info');
      playSound?.('coin');
      relationshipSystem.removeCatRelationships(catId);
      return {
        ...prev,
        money: prev.money + sellPrice,
        cats: prev.cats.filter(c => c.id !== catId),
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem]);

  const renameCat = useCallback((catId: string, newName: string): boolean => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length > 20) {
      showMessage('Name must be 1-20 characters!', 'warning');
      playSound?.('error');
      return false;
    }
    
    let success = false;
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      // Check for duplicate names
      const isDuplicate = prev.cats.some(c => c.id !== catId && c.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        showMessage('Another cat already has this name!', 'warning');
        playSound?.('error');
        return prev;
      }
      
      showMessage(`${cat.name} is now called ${trimmedName}! ✏️`, 'success');
      playSound?.('success');
      success = true;
      return {
        ...prev,
        cats: prev.cats.map(c => c.id === catId ? { ...c, name: trimmedName } : c),
      };
    });
    return success;
  }, [setState, showMessage, playSound]);

  const comfortCat = useCallback((catId: string) => {
    setState(prev => {
      const cat = prev.cats.find(c => c.id === catId);
      if (!cat) return prev;
      
      showMessage(`You comforted ${cat.name}! 💕`, 'success');
      playSound?.('purr');
      return {
        ...prev,
        cats: prev.cats.map(c => c.id === catId 
          ? { ...c, happiness: Math.min(100, c.happiness + 30), health: Math.min(100, c.health + 5) }
          : c
        ),
      };
    });
  }, [setState, showMessage, playSound]);

  const addReceivedCat = useCallback((cat: Cat) => {
    setState(prev => {
      if (prev.cats.length >= prev.space) {
        showMessage("No space for this cat!", 'error');
        return prev;
      }
      
      // Give cat a new ID to avoid conflicts
      const newCat = { ...cat, id: Date.now().toString() + Math.random().toString(36).slice(2) };
      showMessage(`${cat.name} has joined your family! 🎁`, 'success');
      playSound?.('success');
      
      return {
        ...prev,
        cats: [...prev.cats, newCat],
      };
    });
  }, [setState, showMessage, playSound]);

  const updateCatAppearance = useCallback((catId: string, appearance: CatAppearance) => {
    setState(prev => ({
      ...prev,
      cats: prev.cats.map(cat => cat.id === catId ? { ...cat, appearance } : cat),
    }));
  }, [setState]);

  const updateCatPortrait = useCallback((catId: string, portraitUrl: string, hash?: string) => {
    setState(prev => ({
      ...prev,
      cats: prev.cats.map(cat => 
        cat.id === catId 
          ? { ...cat, portraitUrl, portraitGeneratedAt: Date.now(), appearanceHash: hash }
          : cat
      ),
    }));
  }, [setState]);

  return { 
    addCat, 
    buyFromMarket, 
    sellCat, 
    renameCat, 
    comfortCat, 
    addReceivedCat, 
    updateCatAppearance, 
    updateCatPortrait 
  };
}
