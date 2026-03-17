import { CatBreed } from '@/types/game';

export interface BreedType {
  name: string;
  icon: string;
  primaryColor: string;
  gradient: string;
  energyColor: string;
  imageGradient: string;
  weakness: string;
  weaknessIcon: string;
  resistance: string;
  resistanceIcon: string;
}

export const BREED_TYPES: Record<CatBreed, BreedType> = {
  persian: {
    name: 'Psychic',
    icon: '🔮',
    primaryColor: 'hsl(270 70% 55%)',
    gradient: 'linear-gradient(135deg, hsl(280 60% 85%) 0%, hsl(320 50% 75%) 100%)',
    energyColor: 'hsl(270 70% 55%)',
    imageGradient: 'linear-gradient(135deg, #f8e1f4 0%, #d8a8d8 100%)',
    weakness: 'Dark',
    weaknessIcon: '🌑',
    resistance: 'Fighting',
    resistanceIcon: '🥊',
  },
  bengal: {
    name: 'Fire',
    icon: '🔥',
    primaryColor: 'hsl(20 90% 55%)',
    gradient: 'linear-gradient(135deg, hsl(15 85% 80%) 0%, hsl(0 75% 65%) 100%)',
    energyColor: 'hsl(20 90% 55%)',
    imageGradient: 'linear-gradient(135deg, #ffe4d6 0%, #ff9999 100%)',
    weakness: 'Water',
    weaknessIcon: '💧',
    resistance: 'Grass',
    resistanceIcon: '🌿',
  },
  tabby: {
    name: 'Normal',
    icon: '⭐',
    primaryColor: 'hsl(35 40% 55%)',
    gradient: 'linear-gradient(135deg, hsl(40 35% 85%) 0%, hsl(30 30% 70%) 100%)',
    energyColor: 'hsl(35 40% 55%)',
    imageGradient: 'linear-gradient(135deg, #f5f5dc 0%, #d4c4a8 100%)',
    weakness: 'Fighting',
    weaknessIcon: '🥊',
    resistance: 'Ghost',
    resistanceIcon: '👻',
  },
  ragdoll: {
    name: 'Water',
    icon: '💧',
    primaryColor: 'hsl(215 85% 55%)',
    gradient: 'linear-gradient(135deg, hsl(210 70% 85%) 0%, hsl(200 65% 70%) 100%)',
    energyColor: 'hsl(215 85% 55%)',
    imageGradient: 'linear-gradient(135deg, #e1f4f8 0%, #a8d8e8 100%)',
    weakness: 'Electric',
    weaknessIcon: '⚡',
    resistance: 'Fire',
    resistanceIcon: '🔥',
  },
  siamese: {
    name: 'Ice',
    icon: '❄️',
    primaryColor: 'hsl(180 45% 65%)',
    gradient: 'linear-gradient(135deg, hsl(185 50% 88%) 0%, hsl(190 40% 80%) 100%)',
    energyColor: 'hsl(180 45% 65%)',
    imageGradient: 'linear-gradient(135deg, #e8f4f8 0%, #c8e8ec 100%)',
    weakness: 'Fire',
    weaknessIcon: '🔥',
    resistance: 'Water',
    resistanceIcon: '💧',
  },
  'maine-coon': {
    name: 'Fighting',
    icon: '🥊',
    primaryColor: 'hsl(5 65% 50%)',
    gradient: 'linear-gradient(135deg, hsl(10 55% 78%) 0%, hsl(0 60% 60%) 100%)',
    energyColor: 'hsl(5 65% 50%)',
    imageGradient: 'linear-gradient(135deg, #f0d0c8 0%, #d08888 100%)',
    weakness: 'Psychic',
    weaknessIcon: '🔮',
    resistance: 'Dark',
    resistanceIcon: '🌑',
  },
  'british-shorthair': {
    name: 'Steel',
    icon: '🛡️',
    primaryColor: 'hsl(230 15% 70%)',
    gradient: 'linear-gradient(135deg, hsl(225 15% 88%) 0%, hsl(220 10% 72%) 100%)',
    energyColor: 'hsl(230 15% 70%)',
    imageGradient: 'linear-gradient(135deg, #e8e8f0 0%, #c0c0d0 100%)',
    weakness: 'Fire',
    weaknessIcon: '🔥',
    resistance: 'Normal',
    resistanceIcon: '⭐',
  },
  stray: {
    name: 'Dark',
    icon: '🌑',
    primaryColor: 'hsl(25 30% 40%)',
    gradient: 'linear-gradient(135deg, hsl(30 25% 70%) 0%, hsl(20 20% 45%) 100%)',
    energyColor: 'hsl(25 30% 40%)',
    imageGradient: 'linear-gradient(135deg, #d8c8b0 0%, #a09080 100%)',
    weakness: 'Fighting',
    weaknessIcon: '🥊',
    resistance: 'Psychic',
    resistanceIcon: '🔮',
  },
};

export function getBreedType(breed: CatBreed): BreedType {
  return BREED_TYPES[breed] || BREED_TYPES.stray;
}
