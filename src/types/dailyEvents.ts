export interface DailyEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: 'positive' | 'negative' | 'neutral';
  moneyChange?: number;
  resourceChange?: {
    food?: number;
    medicine?: number;
    toys?: number;
    treats?: number;
  };
  catEffect?: {
    healthChange?: number;
    happinessChange?: number;
    hungerChange?: number;
  };
  reputationChange?: number;
  rarity: number; // 1-10, higher = rarer
}

export const DAILY_EVENTS: DailyEvent[] = [
  // Positive Events
  {
    id: 'sunny_day',
    name: 'Perfect Sunny Day',
    emoji: '☀️',
    description: 'The cats are enjoying the sunshine! All cats get a happiness boost.',
    effect: 'positive',
    catEffect: { happinessChange: 10 },
    rarity: 3,
  },
  {
    id: 'generous_donor',
    name: 'Generous Donor',
    emoji: '💰',
    description: 'A cat lover donated to your farm!',
    effect: 'positive',
    moneyChange: 100,
    rarity: 4,
  },
  {
    id: 'food_delivery',
    name: 'Free Food Delivery',
    emoji: '📦',
    description: 'A pet store sent free samples!',
    effect: 'positive',
    resourceChange: { food: 5, treats: 3 },
    rarity: 5,
  },
  {
    id: 'viral_video',
    name: 'Viral Cat Video',
    emoji: '📱',
    description: 'One of your cats went viral! Reputation increased.',
    effect: 'positive',
    reputationChange: 5,
    moneyChange: 50,
    rarity: 6,
  },
  {
    id: 'medicine_grant',
    name: 'Vet Clinic Grant',
    emoji: '🏥',
    description: 'Local vet clinic provided free medicine!',
    effect: 'positive',
    resourceChange: { medicine: 3 },
    rarity: 5,
  },
  {
    id: 'toy_factory',
    name: 'Toy Factory Surplus',
    emoji: '🧸',
    description: 'A toy factory gave away surplus stock!',
    effect: 'positive',
    resourceChange: { toys: 5 },
    rarity: 5,
  },
  {
    id: 'healing_nap',
    name: 'Peaceful Rest',
    emoji: '💤',
    description: 'All cats had an amazing nap and feel refreshed!',
    effect: 'positive',
    catEffect: { healthChange: 5, happinessChange: 5 },
    rarity: 4,
  },
  
  // Negative Events
  {
    id: 'rainy_day',
    name: 'Rainy Day Blues',
    emoji: '🌧️',
    description: 'The rain is making the cats gloomy...',
    effect: 'negative',
    catEffect: { happinessChange: -5 },
    rarity: 3,
  },
  {
    id: 'pest_infestation',
    name: 'Pest Problem',
    emoji: '🪲',
    description: 'Pests got into the food storage!',
    effect: 'negative',
    resourceChange: { food: -3 },
    rarity: 4,
  },
  {
    id: 'toy_breakage',
    name: 'Broken Toys',
    emoji: '💔',
    description: 'Some toys broke during an intense play session.',
    effect: 'negative',
    resourceChange: { toys: -2 },
    rarity: 4,
  },
  {
    id: 'minor_illness',
    name: 'Seasonal Sniffles',
    emoji: '🤧',
    description: 'A mild cold is going around...',
    effect: 'negative',
    catEffect: { healthChange: -5 },
    rarity: 5,
  },
  {
    id: 'escaped_treat',
    name: 'Treat Thief',
    emoji: '🦝',
    description: 'A raccoon stole some treats!',
    effect: 'negative',
    resourceChange: { treats: -2 },
    rarity: 5,
  },
  
  // Neutral Events
  {
    id: 'visitor',
    name: 'Curious Visitor',
    emoji: '👀',
    description: 'A potential adopter stopped by to look around.',
    effect: 'neutral',
    rarity: 2,
  },
  {
    id: 'lazy_day',
    name: 'Lazy Day',
    emoji: '😸',
    description: 'Nothing special happened today. Just a peaceful day.',
    effect: 'neutral',
    rarity: 1,
  },
  {
    id: 'full_moon',
    name: 'Full Moon',
    emoji: '🌕',
    description: 'The cats are acting a bit strange tonight...',
    effect: 'neutral',
    catEffect: { happinessChange: 3, hungerChange: -5 },
    rarity: 6,
  },
];

export function getRandomDailyEvent(day: number): DailyEvent | null {
  // 60% chance of an event happening
  if (Math.random() > 0.6) return null;
  
  // Weight events by rarity (lower rarity = more common)
  const weightedEvents: DailyEvent[] = [];
  DAILY_EVENTS.forEach(event => {
    const weight = 11 - event.rarity; // Inverse rarity for weight
    for (let i = 0; i < weight; i++) {
      weightedEvents.push(event);
    }
  });
  
  // Use day as seed modifier for variety
  const index = Math.floor(Math.random() * weightedEvents.length);
  return weightedEvents[index];
}
