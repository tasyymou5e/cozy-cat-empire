import React from 'react';

export interface PhotoBoothBackground {
  id: string;
  name: string;
  style: React.CSSProperties;
  category: 'nature' | 'fantasy' | 'seasonal' | 'solid';
}

export interface CatPose {
  id: string;
  name: string;
  emoji: string;
  transform: string;
  animation?: string;
}

export interface PhotoFrame {
  id: string;
  name: string;
  borderStyle: string;
  emoji: string;
}

export interface PhotoSticker {
  id: string;
  emoji: string;
  name: string;
  category: 'hearts' | 'stars' | 'text' | 'animals' | 'effects';
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Backgrounds
export const PHOTO_BACKGROUNDS: PhotoBoothBackground[] = [
  // Nature
  {
    id: 'meadow',
    name: 'Sunny Meadow',
    category: 'nature',
    style: { background: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)' },
  },
  {
    id: 'starry',
    name: 'Starry Night',
    category: 'nature',
    style: { background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  },
  {
    id: 'sunset',
    name: 'Beach Sunset',
    category: 'nature',
    style: { background: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 50%, #ffdb99 100%)' },
  },
  {
    id: 'forest',
    name: 'Forest',
    category: 'nature',
    style: { background: 'linear-gradient(180deg, #134E5E 0%, #71B280 100%)' },
  },

  // Fantasy
  {
    id: 'rainbow',
    name: 'Rainbow Clouds',
    category: 'fantasy',
    style: {
      background:
        'linear-gradient(135deg, #f093fb 0%, #f5576c 25%, #4facfe 50%, #43e97b 75%, #f9d423 100%)',
    },
  },
  {
    id: 'galaxy',
    name: 'Space Galaxy',
    category: 'fantasy',
    style: {
      background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 30%, #24243e 60%, #1a1a2e 100%)',
    },
  },
  {
    id: 'underwater',
    name: 'Underwater',
    category: 'fantasy',
    style: { background: 'linear-gradient(180deg, #1CB5E0 0%, #000851 100%)' },
  },
  {
    id: 'castle',
    name: 'Castle',
    category: 'fantasy',
    style: { background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' },
  },

  // Seasonal
  {
    id: 'spring',
    name: 'Spring Flowers',
    category: 'seasonal',
    style: { background: 'linear-gradient(180deg, #ffecd2 0%, #fcb69f 50%, #ee9ca7 100%)' },
  },
  {
    id: 'summer',
    name: 'Summer Sun',
    category: 'seasonal',
    style: { background: 'linear-gradient(180deg, #f6d365 0%, #fda085 100%)' },
  },
  {
    id: 'autumn',
    name: 'Autumn Leaves',
    category: 'seasonal',
    style: { background: 'linear-gradient(180deg, #e65c00 0%, #F9D423 100%)' },
  },
  {
    id: 'winter',
    name: 'Winter Snow',
    category: 'seasonal',
    style: { background: 'linear-gradient(180deg, #E0EAFC 0%, #CFDEF3 100%)' },
  },

  // Solid
  { id: 'pink', name: 'Pink', category: 'solid', style: { background: '#FFB6C1' } },
  { id: 'blue', name: 'Blue', category: 'solid', style: { background: '#87CEEB' } },
  { id: 'purple', name: 'Purple', category: 'solid', style: { background: '#DDA0DD' } },
  {
    id: 'gold',
    name: 'Gold',
    category: 'solid',
    style: { background: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)' },
  },
];

// Poses
export const CAT_POSES: CatPose[] = [
  { id: 'sitting', name: 'Sitting', emoji: '🐱', transform: 'none' },
  { id: 'playful', name: 'Playful', emoji: '😸', transform: 'rotate(5deg)' },
  { id: 'sleepy', name: 'Sleepy', emoji: '😴', transform: 'rotate(-3deg)' },
  { id: 'proud', name: 'Proud', emoji: '😼', transform: 'rotate(-5deg) translateY(-5px)' },
  { id: 'silly', name: 'Silly', emoji: '😹', transform: 'rotate(10deg)' },
  { id: 'waving', name: 'Waving', emoji: '🙀', transform: 'none', animation: 'animate-cat-wave' },
  {
    id: 'bouncing',
    name: 'Bouncing',
    emoji: '🐈',
    transform: 'none',
    animation: 'animate-cat-bounce',
  },
];

// Frames
export const PHOTO_FRAMES: PhotoFrame[] = [
  { id: 'none', name: 'None', emoji: '⬜', borderStyle: 'none' },
  { id: 'polaroid', name: 'Polaroid', emoji: '📷', borderStyle: '16px solid white' },
  { id: 'heart', name: 'Heart', emoji: '💕', borderStyle: '8px solid #FFB6C1' },
  { id: 'star', name: 'Star', emoji: '⭐', borderStyle: '8px solid #FFD700' },
  { id: 'vintage', name: 'Vintage', emoji: '🖼️', borderStyle: '12px solid #8B4513' },
  { id: 'gold', name: 'Gold', emoji: '✨', borderStyle: '8px solid #FFD700' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', borderStyle: '8px solid transparent' },
  { id: 'paws', name: 'Paw Prints', emoji: '🐾', borderStyle: '8px dashed #8B4513' },
];

// Stickers
export const PHOTO_STICKERS: PhotoSticker[] = [
  // Hearts
  { id: 'heart-red', emoji: '❤️', name: 'Red Heart', category: 'hearts' },
  { id: 'heart-pink', emoji: '💕', name: 'Pink Hearts', category: 'hearts' },
  { id: 'heart-sparkle', emoji: '💖', name: 'Sparkle Heart', category: 'hearts' },
  { id: 'heart-arrow', emoji: '💘', name: 'Arrow Heart', category: 'hearts' },

  // Stars
  { id: 'star-yellow', emoji: '⭐', name: 'Star', category: 'stars' },
  { id: 'star-glow', emoji: '🌟', name: 'Glowing Star', category: 'stars' },
  { id: 'sparkles', emoji: '✨', name: 'Sparkles', category: 'stars' },
  { id: 'dizzy', emoji: '💫', name: 'Dizzy', category: 'stars' },

  // Text
  { id: 'text-100', emoji: '💯', name: '100', category: 'text' },
  { id: 'text-fire', emoji: '🔥', name: 'Fire', category: 'text' },
  { id: 'text-cool', emoji: '😎', name: 'Cool', category: 'text' },
  { id: 'text-crown', emoji: '👑', name: 'Crown', category: 'text' },

  // Animals
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', category: 'animals' },
  { id: 'fish', emoji: '🐟', name: 'Fish', category: 'animals' },
  { id: 'mouse', emoji: '🐭', name: 'Mouse', category: 'animals' },
  { id: 'bird', emoji: '🐦', name: 'Bird', category: 'animals' },

  // Effects
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', category: 'effects' },
  { id: 'sun', emoji: '☀️', name: 'Sun', category: 'effects' },
  { id: 'moon', emoji: '🌙', name: 'Moon', category: 'effects' },
  { id: 'cloud', emoji: '☁️', name: 'Cloud', category: 'effects' },
  { id: 'confetti', emoji: '🎉', name: 'Confetti', category: 'effects' },
  { id: 'balloon', emoji: '🎈', name: 'Balloon', category: 'effects' },
];
