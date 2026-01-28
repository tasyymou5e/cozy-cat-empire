export type RealSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export function getCurrentRealSeason(): RealSeason {
  const month = new Date().getMonth(); // 0-11
  
  // Northern hemisphere seasons
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
  return 'winter'; // Dec-Feb
}

export const SEASONAL_PROMPTS: Record<RealSeason, string> = {
  spring: `Create a bright, cheerful, kawaii-style cartoon cat farm landscape in SPRING.
Features: cherry blossoms, colorful flowers blooming, soft pink and green colors,
butterflies, baby chicks among the flowers.
Pastel colors, gentle rolling hills, cute red barn, white picket fences.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  summer: `Create a bright, cheerful, kawaii-style cartoon cat farm landscape in SUMMER.
Features: bright sunny day, sunflowers, blue sky with fluffy clouds,
ice cream stand, colorful bunting, garden sprinklers watering flowers.
Warm golden and green colors, vibrant and joyful.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  autumn: `Create a cozy, warm, kawaii-style cartoon cat farm landscape in AUTUMN.
Features: orange and golden leaves, pumpkins, harvest decorations,
leaf piles, apple trees, warm sunset colors.
Cozy barn with haystacks, falling leaves animation feel.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  winter: `Create a magical, cozy, kawaii-style cartoon cat farm landscape in WINTER.
Features: gentle snow falling, snowman, warm lights from barn windows,
snowflakes, pine trees with snow, tiny scarves hanging on fence.
Soft blue and white colors with warm orange glows from windows.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`
};
