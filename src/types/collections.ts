import { CatBreed, CatPersonality } from './game';

export type CollectionCategory = 'breeds' | 'personalities' | 'costumes' | 'tricks';

export interface CollectionItem {
  id: string;
  name: string;
  emoji: string;
  collected: boolean;
}

export interface CollectionSet {
  id: CollectionCategory;
  name: string;
  description: string;
  emoji: string;
  items: CollectionItem[];
  reward: {
    coins?: number;
    title?: string;
    bonus?: string;
  };
}

export const BREED_COLLECTION: { id: CatBreed; name: string; emoji: string }[] = [
  { id: 'stray', name: 'Stray', emoji: '🐱' },
  { id: 'tabby', name: 'Tabby', emoji: '🐈' },
  { id: 'persian', name: 'Persian', emoji: '😺' },
  { id: 'siamese', name: 'Siamese', emoji: '😸' },
  { id: 'maine-coon', name: 'Maine Coon', emoji: '🦁' },
  { id: 'british-shorthair', name: 'British Shorthair', emoji: '🐱' },
  { id: 'ragdoll', name: 'Ragdoll', emoji: '😻' },
  { id: 'bengal', name: 'Bengal', emoji: '🐆' },
];

export const PERSONALITY_COLLECTION: { id: CatPersonality; name: string; emoji: string }[] = [
  { id: 'lazy', name: 'Lazy', emoji: '😴' },
  { id: 'playful', name: 'Playful', emoji: '🎾' },
  { id: 'affectionate', name: 'Affectionate', emoji: '💕' },
  { id: 'independent', name: 'Independent', emoji: '😎' },
  { id: 'curious', name: 'Curious', emoji: '🔍' },
  { id: 'shy', name: 'Shy', emoji: '🙈' },
];

export const TRICK_COLLECTION = [
  { id: 'sit', name: 'Sit', emoji: '🪑' },
  { id: 'paw', name: 'Paw', emoji: '🐾' },
  { id: 'rollOver', name: 'Roll Over', emoji: '🔄' },
  { id: 'jump', name: 'Jump', emoji: '⬆️' },
  { id: 'fetch', name: 'Fetch', emoji: '🎾' },
];

export interface CollectionProgress {
  breeds: string[];
  personalities: string[];
  costumes: string[];
  tricks: string[];
  completedSets: CollectionCategory[];
}
