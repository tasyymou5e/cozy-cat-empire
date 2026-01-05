export interface ChangelogHighlight {
  emoji: string;
  title: string;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  emoji: string;
  highlights: ChangelogHighlight[];
  category: 'major' | 'feature' | 'improvement';
}

export const CURRENT_VERSION = "2.0.0";

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "January 2026",
    title: "Gamification Mega Update",
    emoji: "🎮",
    category: 'major',
    highlights: [
      { emoji: "🎯", title: "Daily Objectives", description: "Complete 3 rotating daily goals for bonus rewards" },
      { emoji: "🎰", title: "Lucky Wheel", description: "Spin daily for coins, resources, and rare prizes" },
      { emoji: "👑", title: "Hall of Fame", description: "Retire legendary cats for permanent bonuses" },
      { emoji: "✨", title: "Cat Specializations", description: "Choose Show Star, Social Butterfly, or Dynasty Builder path at Grade 12" },
      { emoji: "📜", title: "Seasonal Battle Pass", description: "Free & premium reward tracks with XP progression" },
      { emoji: "🤝", title: "Coop Challenges", description: "Team up with friends for shared goals and bonus rewards" },
    ]
  },
  {
    version: "1.9.0",
    date: "January 2026",
    title: "Milestones & Collections",
    emoji: "🏆",
    category: 'feature',
    highlights: [
      { emoji: "🎉", title: "Milestone Celebrations", description: "Unlock titles and rewards for major achievements" },
      { emoji: "📚", title: "Collection Progress", description: "Track completion across breeds, personalities, costumes, and tricks" },
      { emoji: "🎁", title: "Set Rewards", description: "Complete collection sets for exclusive bonuses" },
    ]
  },
  {
    version: "1.8.0",
    date: "January 2026",
    title: "VIP & Daily Rewards",
    emoji: "⭐",
    category: 'feature',
    highlights: [
      { emoji: "🔥", title: "Login Streaks", description: "Daily login rewards with VIP tier progression" },
      { emoji: "💎", title: "VIP Perks", description: "Bronze, Silver, and Gold tiers with exclusive costumes" },
      { emoji: "🎡", title: "Extra Wheel Spins", description: "VIP players get 2 free spins daily" },
    ]
  },
  {
    version: "1.7.0",
    date: "January 2026",
    title: "AI Portraits & Glow Effects",
    emoji: "🎨",
    category: 'feature',
    highlights: [
      { emoji: "🖼️", title: "AI Cat Portraits", description: "Generate unique portraits that show your cat's appearance and costume" },
      { emoji: "✨", title: "Tier-Based Glow Effects", description: "Rare cats now glow! Ultra rare gets rainbow, very rare gets golden" },
      { emoji: "📚", title: "Expanded Tutorial", description: "16-step tutorial covering all game features with category badges" },
    ]
  },
  {
    version: "1.6.0",
    date: "December 2025",
    title: "Social Features Update",
    emoji: "🤝",
    category: 'major',
    highlights: [
      { emoji: "🎁", title: "Cat Gifting", description: "Send cats as gifts to your friends" },
      { emoji: "🔄", title: "Player Trading", description: "Trade cats and coins with other players" },
      { emoji: "👥", title: "Friends System", description: "Add friends and see their stats" },
    ]
  },
  {
    version: "1.5.0",
    date: "November 2025",
    title: "Weekly Challenges",
    emoji: "🎯",
    category: 'feature',
    highlights: [
      { emoji: "🎯", title: "Weekly Challenges", description: "Complete challenges for bonus rewards" },
      { emoji: "🔥", title: "Streak System", description: "Keep your streak going for extra perks" },
      { emoji: "⚡", title: "Bulk Actions", description: "Heal all, rest all, and train all cats at once" },
    ]
  },
  {
    version: "1.4.0",
    date: "October 2025",
    title: "Photo Booth & Gallery",
    emoji: "📸",
    category: 'feature',
    highlights: [
      { emoji: "📸", title: "Photo Booth", description: "Take custom photos with backgrounds, frames, and stickers" },
      { emoji: "🖼️", title: "Cloud Gallery", description: "Your photos sync across all devices" },
      { emoji: "🃏", title: "Trading Cards", description: "View your cats as collectible trading cards" },
    ]
  },
  {
    version: "1.3.0",
    date: "September 2025",
    title: "Costumes & Shows",
    emoji: "👗",
    category: 'feature',
    highlights: [
      { emoji: "👗", title: "Costume Shop", description: "Dress up your cats with hats, outfits, and accessories" },
      { emoji: "🏆", title: "Cat Shows", description: "Enter competitions to win prizes and fame" },
      { emoji: "⭐", title: "Training System", description: "Train tricks to boost your cat's grade" },
    ]
  },
];
