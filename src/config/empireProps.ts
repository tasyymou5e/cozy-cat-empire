import { EmpireProp } from '@/types/empire';

/**
 * Props configuration for Apartment tier
 * Cozy indoor urban environment
 */
export const APARTMENT_PROPS: EmpireProp[] = [
  { id: 'window', name: 'City Window', emoji: '🪟', position: { x: 50, y: 15 }, scale: 2.5, zIndex: 5 },
  { id: 'cat-tree', name: 'Cat Tree', emoji: '🌲', position: { x: 12, y: 55 }, scale: 1.8, zIndex: 20, interactable: true, onInteract: 'play', attractsCats: true, attractionRadius: 15 },
  { id: 'cat-bed', name: 'Cat Bed', emoji: '🛏️', position: { x: 85, y: 70 }, scale: 1.4, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true, attractionRadius: 12 },
  { id: 'plant', name: 'Potted Plant', emoji: '🪴', position: { x: 8, y: 35 }, scale: 1.2, zIndex: 15 },
  { id: 'bookshelf', name: 'Bookshelf', emoji: '📚', position: { x: 92, y: 30 }, scale: 1.5, zIndex: 10 },
  { id: 'food-bowl', name: 'Food Bowl', emoji: '🥣', position: { x: 75, y: 80 }, scale: 1.0, zIndex: 30, interactable: true, onInteract: 'play' },
  { id: 'radiator', name: 'Radiator', emoji: '🔥', position: { x: 25, y: 75 }, scale: 1.0, zIndex: 20, attractsCats: true, attractionRadius: 10 },
  { id: 'cushion', name: 'Floor Cushion', emoji: '🟤', position: { x: 45, y: 68 }, scale: 1.3, zIndex: 18, attractsCats: true, attractionRadius: 8 },
];

/**
 * Props configuration for House tier
 * Suburban living room with backyard view
 */
export const HOUSE_PROPS: EmpireProp[] = [
  { id: 'bay-window', name: 'Bay Window', emoji: '🪟', position: { x: 50, y: 12 }, scale: 3.0, zIndex: 5 },
  { id: 'couch', name: 'Couch', emoji: '🛋️', position: { x: 30, y: 60 }, scale: 2.0, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true, attractionRadius: 18 },
  { id: 'fireplace', name: 'Fireplace', emoji: '🧱', position: { x: 80, y: 40 }, scale: 2.2, zIndex: 15, attractsCats: true, attractionRadius: 15 },
  { id: 'rug', name: 'Cozy Rug', emoji: '🟫', position: { x: 50, y: 72 }, scale: 2.5, zIndex: 10 },
  { id: 'photos', name: 'Family Photos', emoji: '🖼️', position: { x: 15, y: 25 }, scale: 1.5, zIndex: 8 },
  { id: 'garden-door', name: 'Garden Door', emoji: '🚪', position: { x: 90, y: 55 }, scale: 1.8, zIndex: 12, interactable: true, onInteract: 'perch' },
  { id: 'cat-tower', name: 'Cat Tower', emoji: '🗼', position: { x: 10, y: 58 }, scale: 1.6, zIndex: 22, interactable: true, onInteract: 'play', attractsCats: true, attractionRadius: 12 },
  { id: 'ottoman', name: 'Ottoman', emoji: '🟫', position: { x: 40, y: 65 }, scale: 1.2, zIndex: 20, attractsCats: true, attractionRadius: 8 },
];

/**
 * Props configuration for Mansion tier
 * Luxury parlor with ornate details
 */
export const MANSION_PROPS: EmpireProp[] = [
  { id: 'chandelier', name: 'Chandelier', emoji: '✨', position: { x: 50, y: 8 }, scale: 2.5, zIndex: 5 },
  { id: 'piano', name: 'Grand Piano', emoji: '🎹', position: { x: 20, y: 55 }, scale: 2.0, zIndex: 20, interactable: true, onInteract: 'perch' },
  { id: 'chaise', name: 'Velvet Chaise', emoji: '🛋️', position: { x: 70, y: 65 }, scale: 2.2, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true, attractionRadius: 18 },
  { id: 'columns-left', name: 'Marble Column', emoji: '🏛️', position: { x: 8, y: 45 }, scale: 2.8, zIndex: 8 },
  { id: 'columns-right', name: 'Marble Column', emoji: '🏛️', position: { x: 92, y: 45 }, scale: 2.8, zIndex: 8 },
  { id: 'fountain', name: 'Fountain', emoji: '⛲', position: { x: 50, y: 75 }, scale: 1.8, zIndex: 22, attractsCats: true, attractionRadius: 12 },
  { id: 'artwork', name: 'Fine Art', emoji: '🖼️', position: { x: 35, y: 20 }, scale: 1.8, zIndex: 6 },
  { id: 'artwork-2', name: 'Fine Art', emoji: '🎨', position: { x: 65, y: 22 }, scale: 1.6, zIndex: 6 },
  { id: 'cat-throne', name: 'Cat Throne', emoji: '👑', position: { x: 85, y: 58 }, scale: 1.5, zIndex: 24, interactable: true, onInteract: 'sleep', attractsCats: true, attractionRadius: 10 },
  { id: 'statue', name: 'Cat Statue', emoji: '🗿', position: { x: 15, y: 72 }, scale: 1.4, zIndex: 18 },
];

/**
 * Props configuration for Farm tier
 * Outdoor pastoral scene with barn
 */
export const FARM_PROPS: EmpireProp[] = [
  { id: 'barn', name: 'Red Barn', emoji: '🏠', position: { x: 85, y: 25 }, scale: 3.5, zIndex: 5, interactable: true, onInteract: 'hide' },
  { id: 'hay-bale-1', name: 'Hay Bale', emoji: '🟨', position: { x: 20, y: 65 }, scale: 1.5, zIndex: 20, interactable: true, onInteract: 'play', attractsCats: true, attractionRadius: 12 },
  { id: 'hay-bale-2', name: 'Hay Bale', emoji: '🟨', position: { x: 30, y: 70 }, scale: 1.3, zIndex: 22, attractsCats: true, attractionRadius: 10 },
  { id: 'hay-bale-3', name: 'Hay Bale', emoji: '🟨', position: { x: 25, y: 75 }, scale: 1.1, zIndex: 24, attractsCats: true, attractionRadius: 8 },
  { id: 'fence', name: 'Wooden Fence', emoji: '🪵', position: { x: 50, y: 50 }, scale: 2.0, zIndex: 10, interactable: true, onInteract: 'perch' },
  { id: 'water-trough', name: 'Water Trough', emoji: '🪣', position: { x: 70, y: 75 }, scale: 1.4, zIndex: 25, attractsCats: true, attractionRadius: 8 },
  { id: 'windmill', name: 'Windmill', emoji: '🌀', position: { x: 12, y: 20 }, scale: 2.5, zIndex: 3 },
  { id: 'tractor', name: 'Tractor', emoji: '🚜', position: { x: 60, y: 40 }, scale: 2.0, zIndex: 15 },
  { id: 'tree-1', name: 'Apple Tree', emoji: '🌳', position: { x: 5, y: 50 }, scale: 2.2, zIndex: 12 },
  { id: 'tree-2', name: 'Oak Tree', emoji: '🌲', position: { x: 95, y: 55 }, scale: 2.0, zIndex: 12 },
  { id: 'sunspot', name: 'Sunny Spot', emoji: '☀️', position: { x: 45, y: 68 }, scale: 1.2, zIndex: 8, attractsCats: true, attractionRadius: 15 },
];

/**
 * Props lookup by house size
 */
export const PROPS_BY_HOUSE = {
  apartment: APARTMENT_PROPS,
  house: HOUSE_PROPS,
  mansion: MANSION_PROPS,
  farm: FARM_PROPS,
} as const;
