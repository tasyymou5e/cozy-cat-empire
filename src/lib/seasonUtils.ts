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
  spring: `Create a bright, cheerful, kawaii-style cartoon cat farm in SPRING.
Features: cherry blossoms, colorful flowers blooming, soft pink and green colors,
butterflies, baby chicks, cute cats playing among the flowers.
Pastel colors, gentle rolling hills, cute red barn, white picket fences.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
Ultra high resolution.`,

  summer: `Create a bright, cheerful, kawaii-style cartoon cat farm in SUMMER.
Features: bright sunny day, sunflowers, blue sky with fluffy clouds,
cats playing in sprinklers, ice cream stand, colorful bunting.
Warm golden and green colors, vibrant and joyful.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
Ultra high resolution.`,

  autumn: `Create a cozy, warm, kawaii-style cartoon cat farm in AUTUMN.
Features: orange and golden leaves, pumpkins, harvest decorations,
cats playing in leaf piles, apple trees, warm sunset colors.
Cozy barn with haystacks, falling leaves animation feel.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
Ultra high resolution.`,

  winter: `Create a magical, cozy, kawaii-style cartoon cat farm in WINTER.
Features: gentle snow falling, snowcats, warm lights from barn windows,
cats wearing tiny scarves, snowflakes, pine trees with snow.
Soft blue and white colors with warm orange glows from windows.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
Ultra high resolution.`
};
