/**
 * Cat Vector Generator using Paper.js
 *
 * Generates detailed vector cat avatars programmatically using Paper.js.
 * This creates high-quality, customizable cat faces that are consistent
 * across the entire application.
 */

import paper from 'paper';
import { Cat } from '@/types/game';
import { CatAppearance, FurColor, EyeColor, FurPattern } from '@/types/catAppearance';
import { BreedDefinition, getBreedShape } from './breedShapes';
import { getGradeTier } from '@/types/grading';

// Color mappings for fur
const FUR_COLORS: Record<FurColor, string> = {
  orange: '#E88B3C',
  black: '#2D2D2D',
  white: '#F5F5F0',
  gray: '#8A8A8A',
  brown: '#8B5A2B',
  cream: '#F5DEB3',
  ginger: '#D2691E',
  calico: '#E88B3C', // Base color for calico
};

// Color mappings for eyes
const EYE_COLORS: Record<EyeColor, string> = {
  green: '#4CAF50',
  blue: '#2196F3',
  amber: '#FFC107',
  gold: '#FFD700',
  heterochromia: '#4CAF50', // Left eye, right will be different
  copper: '#B87333',
};

// Size dimensions for each avatar size
const SIZE_DIMENSIONS: Record<string, number> = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
  portrait: 192,
};

let paperCanvas: HTMLCanvasElement | null = null;
let paperScope: paper.PaperScope | null = null;

/**
 * Initialize Paper.js with an offscreen canvas
 */
export function initializePaper(): paper.PaperScope {
  if (paperScope) return paperScope;

  paperCanvas = document.createElement('canvas');
  paperCanvas.width = 256;
  paperCanvas.height = 256;
  paperCanvas.style.display = 'none';
  document.body.appendChild(paperCanvas);

  paperScope = new paper.PaperScope();
  paperScope.setup(paperCanvas);

  return paperScope;
}

/**
 * Clean up Paper.js resources
 */
export function cleanupPaper(): void {
  if (paperCanvas && paperCanvas.parentNode) {
    paperCanvas.parentNode.removeChild(paperCanvas);
  }
  paperCanvas = null;
  paperScope = null;
}

/**
 * Generate the head shape path based on breed
 */
function generateHead(
  scope: paper.PaperScope,
  breedShape: BreedDefinition,
  color: string,
  centerX: number,
  centerY: number,
  radius: number
): paper.Path {
  const { head } = breedShape;

  // Create head based on shape characteristics
  let headPath: paper.Path;

  if (head.topCurve > 0.7) {
    // Round head (Persian, British Shorthair)
    headPath = new scope.Path.Circle({
      center: [centerX, centerY],
      radius: radius * head.widthMultiplier,
      fillColor: color,
    });
  } else if (head.chinShape > 0.5) {
    // Wedge-shaped head (Siamese, Bengal)
    const points = [
      [centerX, centerY - radius], // Top
      [centerX + radius * head.widthMultiplier, centerY + radius * 0.3], // Right
      [centerX + radius * 0.7, centerY + radius], // Bottom right
      [centerX - radius * 0.7, centerY + radius], // Bottom left
      [centerX - radius * head.widthMultiplier, centerY + radius * 0.3], // Left
    ];
    headPath = new scope.Path({
      segments: points,
      closed: true,
      fillColor: color,
    });
    headPath.smooth({ type: 'continuous' });
  } else if (head.cheekWidth > 1.1) {
    // Square head (Maine Coon)
    headPath = new scope.Path.Rectangle({
      point: [centerX - radius, centerY - radius * 0.9],
      size: [radius * 2, radius * 1.9],
      radius: radius * 0.3,
      fillColor: color,
    });
  } else {
    // Default oval
    headPath = new scope.Path.Ellipse({
      center: [centerX, centerY],
      size: [radius * 2 * head.widthMultiplier, radius * 2],
      fillColor: color,
    });
  }

  return headPath;
}

/**
 * Generate ear paths based on breed
 */
function generateEars(
  scope: paper.PaperScope,
  breedShape: BreedDefinition,
  color: string,
  centerX: number,
  centerY: number,
  radius: number
): paper.Group {
  const { ears } = breedShape;
  const earGroup = new scope.Group();

  const earRadius = radius * ears.width;
  const earOffset = radius * 0.7;

  // Left ear
  const leftEarPoints = [
    [centerX - earOffset - earRadius * 0.5, centerY - radius * 0.3],
    [centerX - earOffset, centerY - radius - earRadius * (ears.height / 1.5)],
    [centerX - earOffset + earRadius * 0.5, centerY - radius * 0.3],
  ];

  const leftEar = new scope.Path({
    segments: leftEarPoints,
    closed: true,
    fillColor: color,
  });
  if (ears.pointiness > 0.5) {
    leftEar.smooth({ type: 'continuous', from: 0, to: 1 });
  } else {
    leftEar.smooth({ type: 'continuous' });
  }

  // Left inner ear (pink)
  const leftInner = leftEar.clone();
  leftInner.scale(0.6);
  leftInner.fillColor = new scope.Color('#FFB6C1');

  // Right ear
  const rightEarPoints = [
    [centerX + earOffset - earRadius * 0.5, centerY - radius * 0.3],
    [centerX + earOffset, centerY - radius - earRadius * (ears.height / 1.5)],
    [centerX + earOffset + earRadius * 0.5, centerY - radius * 0.3],
  ];

  const rightEar = new scope.Path({
    segments: rightEarPoints,
    closed: true,
    fillColor: color,
  });
  if (ears.pointiness > 0.5) {
    rightEar.smooth({ type: 'continuous', from: 0, to: 1 });
  } else {
    rightEar.smooth({ type: 'continuous' });
  }

  // Right inner ear (pink)
  const rightInner = rightEar.clone();
  rightInner.scale(0.6);
  rightInner.fillColor = new scope.Color('#FFB6C1');

  // Apply rotation
  if (ears.angle !== 0) {
    leftEar.rotate(ears.angle, leftEar.bounds.bottomCenter);
    leftInner.rotate(ears.angle, leftInner.bounds.bottomCenter);
    rightEar.rotate(-ears.angle, rightEar.bounds.bottomCenter);
    rightInner.rotate(-ears.angle, rightInner.bounds.bottomCenter);
  }

  earGroup.addChildren([leftEar, leftInner, rightEar, rightInner]);
  return earGroup;
}

/**
 * Generate eye shapes based on appearance and breed
 */
function generateEyes(
  scope: paper.PaperScope,
  appearance: CatAppearance,
  breedShape: BreedDefinition,
  centerX: number,
  centerY: number,
  radius: number
): paper.Group {
  const eyeGroup = new scope.Group();
  const { eyes } = breedShape;

  const eyeRadius = radius * 0.18 * eyes.size;
  const eyeOffset = radius * 0.35;
  const eyeY = centerY - radius * 0.1;

  const eyeColor = EYE_COLORS[appearance.eyeColor] || EYE_COLORS.green;
  const rightEyeColor = appearance.eyeColor === 'heterochromia' ? '#2196F3' : eyeColor;

  // Eye white (sclera)
  const leftSclera =
    eyes.shape === 'almond'
      ? new scope.Path.Ellipse({
          center: [centerX - eyeOffset, eyeY],
          size: [eyeRadius * 2.2, eyeRadius * 1.6],
          fillColor: 'white',
        })
      : new scope.Path.Circle({
          center: [centerX - eyeOffset, eyeY],
          radius: eyeRadius,
          fillColor: 'white',
        });

  const rightSclera =
    eyes.shape === 'almond'
      ? new scope.Path.Ellipse({
          center: [centerX + eyeOffset, eyeY],
          size: [eyeRadius * 2.2, eyeRadius * 1.6],
          fillColor: 'white',
        })
      : new scope.Path.Circle({
          center: [centerX + eyeOffset, eyeY],
          radius: eyeRadius,
          fillColor: 'white',
        });

  // Iris
  const leftIris = new scope.Path.Circle({
    center: [centerX - eyeOffset, eyeY],
    radius: eyeRadius * 0.75,
    fillColor: eyeColor,
  });

  const rightIris = new scope.Path.Circle({
    center: [centerX + eyeOffset, eyeY],
    radius: eyeRadius * 0.75,
    fillColor: rightEyeColor,
  });

  // Pupils
  const leftPupil = new scope.Path.Ellipse({
    center: [centerX - eyeOffset, eyeY],
    size: [eyeRadius * 0.25, eyeRadius * 0.6],
    fillColor: 'black',
  });

  const rightPupil = new scope.Path.Ellipse({
    center: [centerX + eyeOffset, eyeY],
    size: [eyeRadius * 0.25, eyeRadius * 0.6],
    fillColor: 'black',
  });

  // Reflections
  const leftReflection = new scope.Path.Circle({
    center: [centerX - eyeOffset - eyeRadius * 0.2, eyeY - eyeRadius * 0.2],
    radius: eyeRadius * 0.15,
    fillColor: 'white',
  });

  const rightReflection = new scope.Path.Circle({
    center: [centerX + eyeOffset - eyeRadius * 0.2, eyeY - eyeRadius * 0.2],
    radius: eyeRadius * 0.15,
    fillColor: 'white',
  });

  eyeGroup.addChildren([
    leftSclera,
    rightSclera,
    leftIris,
    rightIris,
    leftPupil,
    rightPupil,
    leftReflection,
    rightReflection,
  ]);

  return eyeGroup;
}

/**
 * Generate nose based on breed
 */
function generateNose(
  scope: paper.PaperScope,
  breedShape: BreedDefinition,
  centerX: number,
  centerY: number,
  radius: number
): paper.Path {
  const { nose } = breedShape;
  const noseY = centerY + radius * 0.15;
  const noseSize = radius * 0.12 * nose.size;

  if (nose.shape === 'flat') {
    // Flat nose (Persian)
    return new scope.Path.Circle({
      center: [centerX, noseY - noseSize * 0.3],
      radius: noseSize * 0.8,
      fillColor: '#FFB6C1',
    });
  }

  // Triangle nose
  const nosePath = new scope.Path({
    segments: [
      [centerX, noseY - noseSize],
      [centerX + noseSize * 0.8, noseY + noseSize * 0.5],
      [centerX - noseSize * 0.8, noseY + noseSize * 0.5],
    ],
    closed: true,
    fillColor: '#FFB6C1',
  });
  nosePath.smooth({ type: 'continuous' });

  return nosePath;
}

/**
 * Generate mouth curves
 */
function generateMouth(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  radius: number
): paper.Group {
  const mouthGroup = new scope.Group();
  const mouthY = centerY + radius * 0.35;
  const mouthWidth = radius * 0.2;

  // Left curve
  const leftCurve = new scope.Path({
    segments: [
      [centerX, mouthY],
      [centerX - mouthWidth, mouthY + radius * 0.1],
    ],
    strokeColor: '#333',
    strokeWidth: 1.5,
    strokeCap: 'round',
  });
  leftCurve.smooth();

  // Right curve
  const rightCurve = new scope.Path({
    segments: [
      [centerX, mouthY],
      [centerX + mouthWidth, mouthY + radius * 0.1],
    ],
    strokeColor: '#333',
    strokeWidth: 1.5,
    strokeCap: 'round',
  });
  rightCurve.smooth();

  mouthGroup.addChildren([leftCurve, rightCurve]);
  return mouthGroup;
}

/**
 * Generate whiskers
 */
function generateWhiskers(
  scope: paper.PaperScope,
  centerX: number,
  centerY: number,
  radius: number,
  longWhiskers: boolean = false
): paper.Group {
  const whiskerGroup = new scope.Group();
  const whiskerY = centerY + radius * 0.2;
  const whiskerLength = radius * (longWhiskers ? 0.7 : 0.5);

  const whiskerPositions = [
    { y: whiskerY - radius * 0.05, angle: -10 },
    { y: whiskerY, angle: 0 },
    { y: whiskerY + radius * 0.05, angle: 10 },
  ];

  whiskerPositions.forEach(({ y, angle }) => {
    // Left whiskers
    const leftWhisker = new scope.Path.Line({
      from: [centerX - radius * 0.25, y],
      to: [centerX - radius * 0.25 - whiskerLength, y],
      strokeColor: '#666',
      strokeWidth: 1,
      strokeCap: 'round',
    });
    leftWhisker.rotate(angle, leftWhisker.firstSegment!.point);

    // Right whiskers
    const rightWhisker = new scope.Path.Line({
      from: [centerX + radius * 0.25, y],
      to: [centerX + radius * 0.25 + whiskerLength, y],
      strokeColor: '#666',
      strokeWidth: 1,
      strokeCap: 'round',
    });
    rightWhisker.rotate(-angle, rightWhisker.firstSegment!.point);

    whiskerGroup.addChildren([leftWhisker, rightWhisker]);
  });

  return whiskerGroup;
}

/**
 * Generate pattern overlay (tabby stripes, spots, etc.)
 */
function generatePattern(
  scope: paper.PaperScope,
  pattern: FurPattern,
  patternColor: string | undefined,
  headBounds: paper.Rectangle,
  baseColor: string
): paper.Group | null {
  if (pattern === 'solid') return null;

  const patternGroup = new scope.Group();
  const { center, width, height } = headBounds;
  const pColor = patternColor || darkenColor(baseColor, 30);

  if (pattern === 'tabby') {
    // Tabby stripes on forehead
    for (let i = 0; i < 3; i++) {
      const stripe = new scope.Path({
        segments: [
          [center.x - width * 0.15 + i * width * 0.12, center.y - height * 0.35],
          [center.x - width * 0.12 + i * width * 0.12, center.y - height * 0.15],
        ],
        strokeColor: pColor,
        strokeWidth: 2,
        strokeCap: 'round',
      });
      patternGroup.addChild(stripe);
    }
  } else if (pattern === 'spotted') {
    // Random spots
    const spots = [
      { x: -0.2, y: -0.1, r: 0.04 },
      { x: 0.15, y: -0.15, r: 0.035 },
      { x: -0.15, y: 0.1, r: 0.03 },
      { x: 0.2, y: 0.05, r: 0.04 },
    ];
    spots.forEach(({ x, y, r }) => {
      const spot = new scope.Path.Circle({
        center: [center.x + width * x, center.y + height * y],
        radius: width * r,
        fillColor: pColor,
      });
      patternGroup.addChild(spot);
    });
  } else if (pattern === 'tuxedo') {
    // White chest/face marking
    const chest = new scope.Path.Ellipse({
      center: [center.x, center.y + height * 0.35],
      size: [width * 0.5, height * 0.3],
      fillColor: 'white',
    });
    patternGroup.addChild(chest);
  } else if (pattern === 'bicolor') {
    // Half and half
    const half = new scope.Path.Rectangle({
      point: [center.x, center.y - height * 0.5],
      size: [width * 0.5, height],
      fillColor: 'white',
    });
    // Clip to head shape would be ideal but simplified here
    patternGroup.addChild(half);
  } else if (pattern === 'calico') {
    // Orange and black patches on white
    const patches = [
      { x: -0.2, y: -0.2, r: 0.15, color: '#E88B3C' },
      { x: 0.15, y: 0.1, r: 0.12, color: '#2D2D2D' },
      { x: -0.1, y: 0.2, r: 0.1, color: '#E88B3C' },
    ];
    patches.forEach(({ x, y, r, color }) => {
      const patch = new scope.Path.Circle({
        center: [center.x + width * x, center.y + height * y],
        radius: width * r,
        fillColor: color,
      });
      patternGroup.addChild(patch);
    });
  }

  return patternGroup;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Main function: Generate complete cat avatar
 */
export function generateCatAvatar(
  cat: Cat,
  costumeId: string | undefined,
  size: string = 'md',
  portraitStyle: 'kawaii' | 'realistic' = 'kawaii'
): { svg: string; dataUrl: string } | null {
  try {
    const scope = initializePaper();
    scope.project.clear();

    const dim = SIZE_DIMENSIONS[size] || 64;
    scope.view.viewSize = new scope.Size(dim, dim);

    const centerX = dim / 2;
    const centerY = dim / 2;
    const radius = dim * 0.38;

    // Get breed shape or default
    const breedShape = getBreedShape(cat.breed);

    // Get appearance with defaults
    const appearance: CatAppearance = cat.appearance || {
      furColor: 'orange',
      pattern: 'solid',
      patternColor: '#1C1917',
      eyeColor: 'green',
      hairLength: 'short',
      facialFeature: 'normal',
    };

    const furColor = FUR_COLORS[appearance.furColor] || FUR_COLORS.orange;

    // Style-specific adjustments
    const isKawaii = portraitStyle === 'kawaii';
    const eyeScale = isKawaii ? 1.3 : 1.0;
    const headRadiusMultiplier = isKawaii ? 1.05 : 1.0; // Rounder face for kawaii

    const effectiveRadius = radius * headRadiusMultiplier;

    // Generate all parts (back to front order)
    const ears = generateEars(scope, breedShape, furColor, centerX, centerY, effectiveRadius);
    const head = generateHead(scope, breedShape, furColor, centerX, centerY, effectiveRadius);
    const pattern = generatePattern(
      scope,
      appearance.pattern,
      appearance.patternColor,
      head.bounds,
      furColor
    );
    const eyes = generateEyes(scope, appearance, breedShape, centerX, centerY, effectiveRadius);
    const nose = generateNose(scope, breedShape, centerX, centerY, effectiveRadius);
    const mouth = generateMouth(scope, centerX, centerY, effectiveRadius);
    const whiskers = generateWhiskers(
      scope,
      centerX,
      centerY,
      effectiveRadius,
      appearance.facialFeature === 'whiskers_long'
    );

    // Scale eyes for kawaii style
    if (isKawaii && eyeScale !== 1.0) {
      eyes.scale(eyeScale);
    }

    // Add blush marks for kawaii style
    if (isKawaii) {
      const blushLeft = new scope.Path.Circle({
        center: [centerX - effectiveRadius * 0.5, centerY + effectiveRadius * 0.25],
        radius: effectiveRadius * 0.12,
        fillColor: new scope.Color(1, 0.7, 0.75, 0.4),
      });
      const blushRight = new scope.Path.Circle({
        center: [centerX + effectiveRadius * 0.5, centerY + effectiveRadius * 0.25],
        radius: effectiveRadius * 0.12,
        fillColor: new scope.Color(1, 0.7, 0.75, 0.4),
      });
    }

    // Add subtle shading for realistic style
    if (!isKawaii) {
      // Shadow under head
      const shadow = new scope.Path.Ellipse({
        center: [centerX, centerY + effectiveRadius * 0.9],
        size: [effectiveRadius * 1.4, effectiveRadius * 0.3],
        fillColor: new scope.Color(0, 0, 0, 0.08),
      });
      shadow.sendToBack();

      // Light highlight on forehead
      const highlight = new scope.Path.Circle({
        center: [centerX - effectiveRadius * 0.15, centerY - effectiveRadius * 0.35],
        radius: effectiveRadius * 0.18,
        fillColor: new scope.Color(1, 1, 1, 0.1),
      });
    }

    // Add tier-specific glow for rare cats
    const tier = getGradeTier(cat.grade);
    if (tier === 'ultraRare' || tier === 'veryRare') {
      const glow = new scope.Path.Circle({
        center: [centerX, centerY],
        radius: effectiveRadius * 1.1,
        strokeColor: tier === 'ultraRare' ? '#EC4899' : '#FBBF24',
        strokeWidth: 2,
      });
      glow.sendToBack();
    }

    // Export
    const svg = scope.project.exportSVG({ asString: true }) as string;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    return { svg, dataUrl };
  } catch (error) {
    console.error('Paper.js generation failed:', error);
    return null;
  }
}

/**
 * Generate and export as data URL only
 */
export function generateCatAvatarUrl(
  cat: Cat,
  costumeId?: string,
  size: string = 'md',
  portraitStyle: 'kawaii' | 'realistic' = 'kawaii'
): string | null {
  const result = generateCatAvatar(cat, costumeId, size, portraitStyle);
  return result?.dataUrl || null;
}

export default { initializePaper, cleanupPaper, generateCatAvatar, generateCatAvatarUrl };
