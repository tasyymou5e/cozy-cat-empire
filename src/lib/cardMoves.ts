import { Cat, CatPersonality, CatBreed } from '@/types/game';
import { TrickId } from '@/types/grading';

export interface CardMove {
  name: string;
  description: string;
  damage: number;
  energyCost: number;
  isAbility?: boolean;
}

const PERSONALITY_MOVES: Record<CatPersonality, { name: string; desc: string; baseDmg: number }> = {
  playful: { name: 'Playful Swipe', desc: 'A quick, mischievous paw strike that catches opponents off guard.', baseDmg: 20 },
  affectionate: { name: 'Warm Embrace', desc: 'Heals 20 HP. If at full HP, this attack does 20 more damage.', baseDmg: 30 },
  independent: { name: 'Lone Strike', desc: 'This cat\'s fierce independence prevents confusion. May leave the target singed.', baseDmg: 40 },
  curious: { name: 'Investigate', desc: 'Draw 1 card. If opponent has an Ability, this attack does 20 more damage.', baseDmg: 20 },
  lazy: { name: 'Nap Attack', desc: 'This cat falls asleep mid-battle. Heal 30 HP and gain +10 resistance next turn.', baseDmg: 10 },
  shy: { name: 'Shadow Fade', desc: 'Prevent all damage done to this cat during your opponent\'s next turn.', baseDmg: 20 },
};

const TRICK_MOVES: Record<TrickId, { name: string; desc: string; baseDmg: number }> = {
  sit: { name: 'Disciplined Stance', desc: 'Reduces damage from the next attack by 20.', baseDmg: 20 },
  paw: { name: 'Power Paw', desc: 'Swipes twice with razor-sharp claws. Deals 30 damage per successful hit.', baseDmg: 30 },
  rollOver: { name: 'Rolling Fury', desc: 'This attack does 20 damage to each of your opponent\'s benched cats.', baseDmg: 50 },
  jump: { name: 'Aerial Leap', desc: 'If this cat has no damage, this attack does 40 more damage.', baseDmg: 60 },
  fetch: { name: 'Supreme Fetch', desc: 'Search your deck for any card and put it into your hand.', baseDmg: 80 },
};

const BREED_SPECIALS: Record<CatBreed, { name: string; desc: string; baseDmg: number }> = {
  persian: { name: 'Psychic Purr', desc: 'Your opponent reveals their hand. Discard 1 card.', baseDmg: 50 },
  bengal: { name: 'Royal Roar', desc: 'Discard 2 Energy. The defending cat is now Stunned.', baseDmg: 80 },
  tabby: { name: 'Street Smarts', desc: 'If you have fewer Prize cards, this attack does 30 more damage.', baseDmg: 40 },
  ragdoll: { name: 'Starlight Cuddle', desc: 'Heal 20 HP from this cat. If at full HP, this does 50 more damage.', baseDmg: 100 },
  siamese: { name: 'Frost Whisper', desc: 'The defending cat is now Frozen. On a miss, discard an Energy.', baseDmg: 60 },
  'maine-coon': { name: 'Titan Tackle', desc: 'This attack also does 20 damage to itself.', baseDmg: 90 },
  'british-shorthair': { name: 'Iron Guard', desc: 'This cat takes 30 less damage during your opponent\'s next turn.', baseDmg: 50 },
  stray: { name: 'Alley Rush', desc: 'Launches a flurry of swipes. Each hit does 20 more damage.', baseDmg: 30 },
};

export function generateMoves(cat: Cat): [CardMove, CardMove] {
  const gradeMultiplier = 1 + (cat.grade - 1) * 0.08;

  // Move 1: Personality-based
  const pMove = PERSONALITY_MOVES[cat.personality];
  const move1: CardMove = {
    name: pMove.name,
    description: pMove.desc,
    damage: Math.round(pMove.baseDmg * gradeMultiplier),
    energyCost: 1,
  };

  // Move 2: Best trick or breed special
  const bestTrick = [...cat.tricksLearned].reverse()[0];
  if (bestTrick && TRICK_MOVES[bestTrick]) {
    const tMove = TRICK_MOVES[bestTrick];
    return [move1, {
      name: tMove.name,
      description: tMove.desc,
      damage: Math.round(tMove.baseDmg * gradeMultiplier),
      energyCost: bestTrick === 'fetch' ? 3 : bestTrick === 'jump' || bestTrick === 'rollOver' ? 2 : 1,
    }];
  }

  const bMove = BREED_SPECIALS[cat.breed];
  return [move1, {
    name: bMove.name,
    description: bMove.desc,
    damage: Math.round(bMove.baseDmg * gradeMultiplier),
    energyCost: Math.min(3, Math.ceil(bMove.baseDmg / 35)),
  }];
}

export function getEvolutionStage(cat: Cat): string {
  if (cat.type === 'stray') return 'Basic';
  if (cat.type === 'adopted') return 'Stage 1';
  return 'Stage 2';
}

export function getRetreatCost(cat: Cat): number {
  const hungerFactor = Math.ceil((100 - cat.hunger) / 40);
  return Math.max(1, Math.min(3, hungerFactor));
}

export function getCardNumber(cat: Cat): string {
  const hash = cat.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `#${String(hash % 100).padStart(3, '0')}/100`;
}
