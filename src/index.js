import { randomBytes } from 'node:crypto';
import {
  EMPTY, BODY, ACCENT, DARK,
  ACCENT_NARROW, DARK_NARROW,
  ACCENT_NARROW_RIGHT, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT,
  isCompositeEye, isNarrowLeft, isNarrowRight
} from './cells.js';

export { CELL_KINDS } from './cells.js';

export {
  animateClingon, buildFrames, composeParallel,
  defineMove, resolveMove, clearMoves, seedFromClingon,
  blink, bob, wiggle, walk, lookLeft, lookRight,
  frame, mapCells
} from './animation.js';

const CODE_PREFIX = 'clg';
const LARGE_WIDTH = 11;
const LARGE_HEIGHT = 8;
const DEFAULT_WIDTH = 7;
const DEFAULT_HEIGHT = 6;
const SMALL_WIDTH = 5;
const SMALL_HEIGHT = 5;
const TINY_WIDTH = 4;
const TINY_HEIGHT = 4;
const DEFAULT_SIZE = 'normal';

const FIRST_NAMES = [
  'orlando', 'mabel', 'winston', 'poppy', 'felix', 'juniper', 'otto', 'nora',
  'barnaby', 'luna', 'milo', 'olive', 'rupert', 'daisy', 'archie', 'cleo',
  'gus', 'pearl', 'hugo', 'beatrix', 'alfie', 'flora', 'cosmo', 'tilly',
  'basil', 'hazel', 'leonard', 'mimi', 'oscar', 'birdie', 'walter', 'ziggy'
];

const MIDDLE_NAMES = [
  'reginald', 'pickle', 'waffles', 'button', 'magnus', 'beans', 'nimbus',
  'truffle', 'cedric', 'biscuit', 'quincy', 'noodle', 'pudding', 'toast',
  'snacks', 'waffleton', 'fig', 'sprout', 'banjo', 'crumpet', 'marmalade',
  'taco', 'fizz', 'doodle', 'pepper', 'mittens', 'radish', 'wafer',
  'gumdrop', 'scooter', 'plum', 'boop'
];

const FAMILY_NAMES = [
  'morris', 'wigglesworth', 'pawsley', 'bumble', 'fuzzwick', 'moonbeam',
  'tumbles', 'pickering', 'muffington', 'socksworth', 'teacup', 'noodleston',
  'higgle', 'sprinkles', 'whiskerton', 'flufford', 'danderby', 'puddle',
  'waffleman', 'toebean', 'snuggleton', 'brisket', 'boopington', 'crumb',
  'fidget', 'marshmallow', 'jellybean', 'pipsqueak', 'mopbucket',
  'twinkle', 'pancake', 'wobble'
];

const SUFFIX_NAMES = [
  'junior', 'senior', 'third', 'fourth', 'tiny', 'great', 'small', 'bold',
  'sleepy', 'jolly', 'fancy', 'brave', 'wobbly', 'cosmic', 'royal', 'noisy',
  'shiny', 'spicy', 'mighty', 'little', 'grand', 'wild', 'polite', 'silly',
  'gentle', 'chaotic', 'secret', 'golden', 'curious', 'dramatic', 'excellent',
  'deluxe'
];

const RHYTHM_NAMES = [
  'bouncy', 'dreamy', 'mellow', 'jumpy', 'snoozy', 'zippy', 'serene', 'jittery',
  'breezy', 'wired', 'springy', 'antsy', 'groovy', 'spry', 'placid', 'fidgety',
  'languid', 'spunky', 'tranquil', 'frenetic', 'spirited', 'sluggish', 'twitchy',
  'lively', 'easygoing', 'perky', 'dapper', 'restless', 'peppy', 'lazy',
  'frisky', 'calm'
];

// Curated to pass WCAG 1.4.11 (3:1 non-text contrast) on the criteria
// that matter for pixel-art pop: body↔accent (eyes vs body), body↔dark
// (silhouette boundary), body↔bg-dark and accent↔bg-dark (visibility on
// terminal). Pattern: 500/600 bodies (mid luminance), 300 accents (high
// luminance), ultra-dark tinted darks (each palette's hue family pushed
// below typical dark-terminal luminance so feet read as silhouette
// against the bg rather than blending with it). 950-class Tailwind shades
// sat in the dead zone L≈0.02-0.03, which matches typical dark-terminal
// bg luminance — the legs literally vanished. These ultra-dark variants
// (L≈0.002-0.005) appear nearly black to the eye but retain a subtle
// hue, contrasting both with the body (huge luminance gap) and the
// terminal bg (darker than bg, so visible as silhouette).
// scripts/check-contrast.js audits this in detail.
const PALETTES = [
  ['#8b5cf6', '#fde047', '#0a0816'], // violet  / yellow / ultra-dark indigo
  ['#dc2626', '#67e8f9', '#160203'], // red     / cyan   / ultra-dark red
  ['#db2777', '#bef264', '#170410'], // pink    / lime   / ultra-dark pink
  ['#2563eb', '#fcd34d', '#020617'], // blue    / amber  / near-black
  ['#c026d3', '#67e8f9', '#160218'], // fuchsia / cyan   / ultra-dark fuchsia
  ['#c2410c', '#7dd3fc', '#170703'], // orange  / sky    / ultra-dark orange
  ['#a855f7', '#bbf7d0', '#0e0218'], // purple  / mint   / ultra-dark purple
  ['#e11d48', '#a3e635', '#170307'], // rose    / lime   / ultra-dark rose
  ['#059669', '#fef08a', '#021711']  // emerald / pale yellow / ultra-dark emerald
];

export function nameLists() {
  return {
    first: [...FIRST_NAMES],
    middle: [...MIDDLE_NAMES],
    family: [...FAMILY_NAMES],
    suffix: [...SUFFIX_NAMES],
    rhythm: [...RHYTHM_NAMES]
  };
}

export function generateClingon(options = {}) {
  const requestedName = options.name ?? options.code;
  const requested = requestedName ? parseCode(requestedName) : randomCode();
  const size = normalizeSize(options.size);
  const shapeSeed = requested.shapeSeed;
  const paletteSeed = options.recolor ? randomPaletteSeed(requested.format) : requested.paletteSeed;
  const rhythmSeed = requested.rhythmSeed ?? null;
  const code = requested.format === 'classic'
    ? formatClassicCode(shapeSeed, paletteSeed)
    : formatCode(shapeSeed, paletteSeed, rhythmSeed);
  const shape = createShape(shapeSeed, size);
  const palette = createPalette(paletteSeed, { lightMode: options.lightMode === true });

  return {
    name: code,
    code,
    size,
    shapeSeed,
    paletteSeed,
    rhythmSeed,
    palette,
    pixels: shape,
    ansi: renderAnsi(shape, palette, options),
    text: renderText(shape),
    inline: renderInline(shape, palette, options)
  };
}

export function renderClingon(codeOrOptions) {
  const options = typeof codeOrOptions === 'string' ? { name: codeOrOptions } : codeOrOptions;
  return generateClingon(options).ansi;
}

export function parseCode(code) {
  const value = String(code).trim().toLowerCase();
  const classicMatch = value.match(/^clg[-_]?([0-9a-z]+)[-.]([0-9a-z]+)$/);

  if (classicMatch) {
    return {
      shapeSeed: parseSeed(classicMatch[1]),
      paletteSeed: parseSeed(classicMatch[2]),
      format: 'classic'
    };
  }

  const nameMatch = value.match(/^([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)(?:-([a-z]+))?$/);

  if (!nameMatch) {
    throw new Error(`Invalid clingon code "${code}". Expected a name like orlando-reginald-morris-junior-bouncy.`);
  }

  const firstIndex = wordIndex(FIRST_NAMES, nameMatch[1], 'first name');
  const middleIndex = wordIndex(MIDDLE_NAMES, nameMatch[2], 'middle name');
  const familyIndex = wordIndex(FAMILY_NAMES, nameMatch[3], 'family name');
  const suffixIndex = wordIndex(SUFFIX_NAMES, nameMatch[4], 'suffix');
  const rhythmWord = nameMatch[5];
  const rhythmSeed = rhythmWord != null
    ? wordIndex(RHYTHM_NAMES, rhythmWord, 'rhythm')
    : null;

  return {
    shapeSeed: firstIndex + familyIndex * FIRST_NAMES.length,
    paletteSeed: middleIndex + suffixIndex * MIDDLE_NAMES.length,
    rhythmSeed,
    format: 'name'
  };
}

export function formatCode(shapeSeed, paletteSeed, rhythmSeed = null) {
  const shapeIndex = shapeSeed % (FIRST_NAMES.length * FAMILY_NAMES.length);
  const paletteIndex = paletteSeed % (MIDDLE_NAMES.length * SUFFIX_NAMES.length);
  const first = FIRST_NAMES[shapeIndex % FIRST_NAMES.length];
  const family = FAMILY_NAMES[Math.floor(shapeIndex / FIRST_NAMES.length)];
  const middle = MIDDLE_NAMES[paletteIndex % MIDDLE_NAMES.length];
  const suffix = SUFFIX_NAMES[Math.floor(paletteIndex / MIDDLE_NAMES.length)];
  const base = `${first}-${middle}-${family}-${suffix}`;
  if (rhythmSeed == null) return base;
  const rhythm = RHYTHM_NAMES[rhythmSeed % RHYTHM_NAMES.length];
  return `${base}-${rhythm}`;
}

export function snippetFor(code, options = {}) {
  const size = normalizeSize(options.size);
  const optionEntries = [`name: '${code}'`];

  if (size !== DEFAULT_SIZE) {
    optionEntries.push(`size: '${size}'`);
  }

  return [
    "import { generateClingon } from '@adrianlynch/clingon';",
    '',
    `const clingon = generateClingon({ ${optionEntries.join(', ')} });`,
    'console.log(clingon.ansi);'
  ].join('\n');
}

function randomCode() {
  return {
    shapeSeed: randomShapeSeed(),
    paletteSeed: randomPaletteSeed('name'),
    rhythmSeed: null,
    format: 'name'
  };
}

function randomSeed() {
  return randomBytes(4).readUInt32BE(0);
}

function randomShapeSeed() {
  return randomSeed() % (FIRST_NAMES.length * FAMILY_NAMES.length);
}

function randomPaletteSeed(format) {
  if (format === 'classic') {
    return randomSeed();
  }

  return randomSeed() % (MIDDLE_NAMES.length * SUFFIX_NAMES.length);
}

function parseSeed(value) {
  const seed = Number.parseInt(value, 36);

  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error(`Invalid seed segment "${value}".`);
  }

  return seed >>> 0;
}

function wordIndex(words, word, label) {
  const index = words.indexOf(word);

  if (index === -1) {
    throw new Error(`Unknown ${label} "${word}" in clingon name.`);
  }

  return index;
}

function formatClassicCode(shapeSeed, paletteSeed) {
  return `${CODE_PREFIX}-${encodeSeed(shapeSeed)}-${encodeSeed(paletteSeed)}`;
}

function encodeSeed(seed) {
  return (seed >>> 0).toString(36).padStart(7, '0');
}

function normalizeSize(size = DEFAULT_SIZE) {
  if (size === 'medium') {
    return DEFAULT_SIZE;
  }

  if (size !== 'large' && size !== DEFAULT_SIZE && size !== 'small' && size !== 'tiny') {
    throw new Error(`Invalid size "${size}". Expected "tiny", "small", "normal", or "large".`);
  }

  return size;
}

function createShape(seed, size) {
  if (size === 'large') {
    return createLargeShape(seed);
  }

  if (size === 'tiny') {
    return createTinyShape(seed);
  }

  if (size === 'small') {
    return createSmallShape(seed);
  }

  return createNormalShape(seed);
}

function createLargeShape(seed) {
  const rng = mulberry32(seed);
  const width = LARGE_WIDTH;
  const height = LARGE_HEIGHT;
  const pixels = Array.from({ length: height }, () => Array(width).fill(EMPTY));
  const center = Math.floor(width / 2);
  const bodyTop = 1 + int(rng, 0, 1);
  const bodyBottom = 5 + int(rng, 0, 1);
  const halfWidths = [];

  for (let y = bodyTop; y <= bodyBottom; y += 1) {
    const progress = (y - bodyTop) / Math.max(1, bodyBottom - bodyTop);
    const taper = Math.abs(progress - 0.55);
    halfWidths[y] = 3 + (taper < 0.35 ? 1 : 0) + int(rng, 0, 1);
    fillSymmetric(pixels, y, center, halfWidths[y], BODY);
  }

  if (bodyTop > 1) {
    fillSymmetric(pixels, bodyTop - 1, center, 2 + int(rng, 0, 1), BODY);
  }

  addEyes(pixels, rng, center, bodyTop + 2, halfWidths[bodyTop + 2] ?? 4);
  addMouth(pixels, rng, center, bodyBottom - 1);
  addHeadTop(pixels, rng, center, bodyTop);
  addArms(pixels, rng, center, bodyTop + 2);
  addFeet(pixels, rng, center, bodyBottom + 1);

  return pixels;
}

function createNormalShape(seed) {
  return createCompactShape(seed, DEFAULT_WIDTH, DEFAULT_HEIGHT);
}

function createTinyShape(seed) {
  return createTinyShapeWithoutHeadTop(seed);
}

function createTinyShapeWithoutHeadTop(seed) {
  const rng = mulberry32(seed);
  const pixels = Array.from({ length: TINY_HEIGHT }, () => Array(TINY_WIDTH).fill(EMPTY));
  const mouth = rng() > 0.5 ? ACCENT : DARK;

  pixels[0] = [BODY, BODY, BODY, BODY];
  pixels[1] = [BODY, EYE_DARK_LEFT, EYE_DARK_RIGHT, BODY];
  pixels[2] = rng() > 0.5
    ? [BODY, mouth, mouth, BODY]
    : [BODY, BODY, rng() > 0.5 ? ACCENT : DARK, BODY];
  pixels[3] = rng() > 0.45
    ? [DARK_NARROW, EMPTY, EMPTY, DARK_NARROW_RIGHT]
    : [DARK, EMPTY, EMPTY, DARK];

  return pixels;
}

function createSmallShape(seed) {
  return createCompactShape(seed, SMALL_WIDTH, SMALL_HEIGHT);
}

function createCompactShape(seed, width, height) {
  const rng = mulberry32(seed);
  const pixels = Array.from({ length: height }, () => Array(width).fill(EMPTY));
  const center = Math.floor(width / 2);
  const bodyRows = height - 2;
  const maxHalfWidth = Math.min(center, width - center - 1);
  const halfWidths = Array.from({ length: bodyRows }, (_, index) => {
    const middle = Math.abs(index - (bodyRows - 1) / 2) < bodyRows / 3;
    const base = middle ? maxHalfWidth : Math.max(1, maxHalfWidth - 1);
    return Math.max(1, Math.min(maxHalfWidth, base + int(rng, 0, 1)));
  });

  addCompactHeadTop(pixels, rng, center, maxHalfWidth);

  for (let index = 0; index < halfWidths.length; index += 1) {
    fillSymmetric(pixels, index + 1, center, halfWidths[index], BODY);
  }

  addCompactEyes(pixels, rng, center, halfWidths);
  addCompactMouth(pixels, rng, center, halfWidths);
  addCompactArms(pixels, rng, center, halfWidths);
  addCompactFeet(pixels, rng, center, halfWidths);

  return pixels;
}

function addCompactHeadTop(pixels, rng, center, maxHalfWidth) {
  const style = int(rng, 0, 4);
  const value = rng() > 0.45 ? ACCENT_NARROW : ACCENT;

  if (style === 0) {
    pixels[0][center] = value;
  } else if (style === 1) {
    setMirrored(pixels, 0, center - 1, center + 1, value);
  } else if (style === 2) {
    pixels[0][clampIndex(center + int(rng, -1, 1), pixels[0].length)] = value;
  } else if (style === 3 && maxHalfWidth >= 2) {
    setMirrored(pixels, 0, center - 2, center + 2, value);
  }
}

function addCompactEyes(pixels, rng, center, halfWidths) {
  const y = Math.min(pixels.length - 2, halfWidths.length > 2 ? 2 : 1);
  const spacing = halfWidths[y - 1] >= 2 && rng() > 0.35 ? 2 : 1;
  setEyes(pixels, rng, y, center - spacing, center + spacing);
}

function addCompactMouth(pixels, rng, center, halfWidths) {
  const y = Math.min(pixels.length - 2, Math.max(2, halfWidths.length));
  const style = int(rng, 0, 2);

  if (style === 0) {
    pixels[y][center] = rng() > 0.5 ? ACCENT_NARROW : ACCENT;
  } else if (style === 1) {
    setMirrored(pixels, y, center - 1, center + 1, rng() > 0.5 ? ACCENT_NARROW : ACCENT);
  } else {
    pixels[y][center] = rng() > 0.5 ? DARK_NARROW : DARK;
  }
}

function addCompactArms(pixels, rng, center, halfWidths) {
  const y = int(rng, 1, Math.max(1, pixels.length - 2));
  const reach = halfWidths[y - 1] + 1;

  if (center - reach >= 0 && center + reach < pixels[y].length && rng() > 0.2) {
    const value = rng() > 0.5 ? BODY : rng() > 0.45 ? DARK_NARROW : DARK;
    setMirrored(pixels, y, center - reach, center + reach, value);
  }
}

function addCompactFeet(pixels, rng, center, halfWidths) {
  const lastBodyHalfWidth = halfWidths.at(-1);
  const spread = Math.min(center, pixels[0].length - center - 1, Math.max(1, lastBodyHalfWidth - int(rng, 0, 1)));
  const value = rng() > 0.35 ? DARK_NARROW : DARK;
  setMirrored(pixels, pixels.length - 1, center - spread, center + spread, value);

  if (spread < 2 && center - spread - 1 >= 0 && center + spread + 1 < pixels[0].length && rng() > 0.5) {
    setMirrored(pixels, pixels.length - 1, center - spread - 1, center + spread + 1, value);
  }
}

function createPalette(seed, options = {}) {
  const rng = mulberry32(seed);
  const base = PALETTES[int(rng, 0, PALETTES.length - 1)];
  const hueShift = int(rng, -18, 18);

  const palette = {
    body: shiftHex(base[0], hueShift),
    accent: shiftHex(base[1], -hueShift),
    dark: base[2]
  };
  return options.lightMode ? toLightModePalette(palette) : palette;
}

// On light terminal backgrounds, the bright body/accent colors look washed-out
// or invisible. Cap lightness in HSL space (preserving hue and saturation)
// so colors stay vibrant — just darker. Channel-scaling in RGB would lose
// saturation for unequal-channel colors (a bright yellow becomes mustard
// because the blue channel is already low and gets crushed further).
// --light is for light terminal backgrounds. The default palette mostly
// reads fine on white already — purple bodies, blue/teal/red darks, etc.
// have decent contrast against white. The cells that genuinely struggle
// are the very brightest ones (yellow especially: high lightness AND a
// hue close to white). So --light is a permissive cap, not a uniform
// darkening: a body at L=55% or an accent at L=50% passes through
// unchanged, but a yellow at L=58% gets brought down to L=50% where it
// reads as gold instead of washed-out neon. Dark cells aren't touched
// (cap=0.50 is above every dark we have), preserving outline definition.
function toLightModePalette(palette) {
  return {
    body: capLightness(palette.body, 0.55),
    accent: capLightness(palette.accent, 0.50),
    dark: capLightness(palette.dark, 0.50)
  };
}

function capLightness(hex, targetL) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l <= targetL) return hex;
  const [nr, ng, nb] = hslToRgb(h, s, targetL);
  return rgbToHex(Math.round(nr), Math.round(ng), Math.round(nb));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hueToRgb(p, q, h + 1 / 3) * 255,
    hueToRgb(p, q, h) * 255,
    hueToRgb(p, q, h - 1 / 3) * 255
  ];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function addEyes(pixels, rng, center, y, halfWidth) {
  const inset = int(rng, 1, 2);
  const left = Math.max(1, center - halfWidth + inset);
  const right = Math.min(pixels[y].length - 2, center + halfWidth - inset);
  setEyes(pixels, rng, y, left, right);
}

function addMouth(pixels, rng, center, y) {
  const style = int(rng, 0, 2);

  if (style === 0) {
    pixels[y][center] = rng() > 0.5 ? DARK_NARROW : DARK;
  } else if (style === 1) {
    setMirrored(pixels, y, center - 1, center + 1, rng() > 0.5 ? DARK_NARROW : DARK);
  } else {
    const value = rng() > 0.5 ? ACCENT_NARROW : ACCENT;
    setMirrored(pixels, y, center - 1, center + 1, value);
    pixels[y][center] = rng() > 0.5 ? ACCENT_NARROW : ACCENT;
  }
}

function addHeadTop(pixels, rng, center, bodyTop) {
  const antenna = int(rng, 0, 3);
  const value = rng() > 0.45 ? ACCENT_NARROW : ACCENT;

  if (antenna === 0) {
    pixels[0][center] = value;
    pixels[1][center] = value;
  } else if (antenna === 1) {
    setMirrored(pixels, 1, center - 2, center + 2, value);
  } else if (antenna === 2) {
    setMirrored(pixels, 0, center - 1, center + 1, value);
    pixels[1][center] = value;
  }

  if (bodyTop > 2 && antenna === 3) {
    fillSymmetric(pixels, 1, center, 1, value);
  }
}

function addArms(pixels, rng, center, y) {
  const reach = int(rng, 4, 5);
  pixels[y][center - reach] = BODY;
  pixels[y][center + reach] = BODY;

  if (rng() > 0.45) {
    const value = rng() > 0.45 ? DARK_NARROW : DARK;
    setMirrored(pixels, y + 1, center - reach, center + reach, value);
  }
}

function addFeet(pixels, rng, center, y) {
  if (y >= pixels.length) {
    return;
  }

  const spread = int(rng, 2, 3);
  const value = rng() > 0.35 ? DARK_NARROW : DARK;
  setMirrored(pixels, y, center - spread, center + spread, value);

  if (rng() > 0.55) {
    setMirrored(pixels, y, center - spread - 1, center + spread + 1, value);
  }
}

function setMirrored(pixels, y, left, right, value) {
  pixels[y][left] = value;
  pixels[y][right] = mirrorNarrow(value);
}

function setEyes(pixels, rng, y, left, right) {
  const style = int(rng, 0, 3);

  if (style === 0) {
    pixels[y][left] = DARK;
    pixels[y][right] = DARK;
  } else if (style === 1) {
    pixels[y][left] = ACCENT;
    pixels[y][right] = ACCENT;
  } else if (style === 2) {
    pixels[y][left] = EYE_DARK_RIGHT;
    pixels[y][right] = EYE_DARK_LEFT;
  } else {
    pixels[y][left] = EYE_LIGHT_RIGHT;
    pixels[y][right] = EYE_LIGHT_LEFT;
  }
}

function mirrorNarrow(value) {
  if (value === ACCENT_NARROW) {
    return ACCENT_NARROW_RIGHT;
  }

  if (value === DARK_NARROW) {
    return DARK_NARROW_RIGHT;
  }

  return value;
}

function fillSymmetric(pixels, y, center, halfWidth, value) {
  for (let x = center - halfWidth; x <= center + halfWidth; x += 1) {
    if (x >= 0 && y >= 0 && y < pixels.length && x < pixels[y].length) {
      pixels[y][x] = value;
    }
  }
}

export function renderAnsi(shape, palette, options = {}) {
  const useColor = options.color !== false;
  const rows = shape.map((row) => row.map((cell) => renderCell(cell, palette, useColor)).join(''));
  return rows.join('\n');
}

function renderText(shape) {
  return shape.map((row) => row.map(renderTextCell).join('')).join('\n');
}

export function renderInline(shape, palette, options = {}) {
  const useColor = options.color !== false;
  const row = pickInlineRow(shape);
  return row.map((cell) => renderInlineCell(cell, palette, useColor)).join('');
}

function pickInlineRow(shape) {
  for (let y = 0; y < shape.length; y += 1) {
    if (shape[y].some((cell) => (
      cell === EYE_DARK_LEFT || cell === EYE_DARK_RIGHT
        || cell === EYE_LIGHT_LEFT || cell === EYE_LIGHT_RIGHT
    ))) {
      return shape[y];
    }
  }
  return shape[Math.min(1, shape.length - 1)];
}

function renderInlineCell(cell, palette, useColor) {
  if (cell === EMPTY) return ' ';
  if (!useColor) return inlineTextGlyph(cell);
  const color = inlineCellColor(cell, palette);
  const glyph = inlineColorGlyph(cell);
  return `${ansiColor(color)}${glyph}[0m`;
}

function inlineTextGlyph(cell) {
  if (cell === BODY) return '[';
  if (cell === ACCENT || cell === ACCENT_NARROW || cell === ACCENT_NARROW_RIGHT) return '#';
  if (cell === DARK || cell === DARK_NARROW || cell === DARK_NARROW_RIGHT) return '.';
  if (cell === EYE_DARK_LEFT || cell === EYE_DARK_RIGHT) return 'o';
  if (cell === EYE_LIGHT_LEFT || cell === EYE_LIGHT_RIGHT) return 'O';
  return ' ';
}

function inlineColorGlyph(cell) {
  if (cell === EYE_DARK_LEFT || cell === EYE_DARK_RIGHT
      || cell === EYE_LIGHT_LEFT || cell === EYE_LIGHT_RIGHT) return '◉';
  return '█';
}

function inlineCellColor(cell, palette) {
  if (cell === BODY) return palette.body;
  if (cell === ACCENT || cell === ACCENT_NARROW || cell === ACCENT_NARROW_RIGHT) return palette.accent;
  if (cell === DARK || cell === DARK_NARROW || cell === DARK_NARROW_RIGHT) return palette.dark;
  if (cell === EYE_DARK_LEFT || cell === EYE_DARK_RIGHT) return palette.dark;
  if (cell === EYE_LIGHT_LEFT || cell === EYE_LIGHT_RIGHT) return palette.accent;
  return palette.body;
}

function renderCell(cell, palette, useColor) {
  if (cell === EMPTY) {
    return '  ';
  }

  if (!useColor) {
    return renderTextCell(cell);
  }

  const color = cell === BODY
    ? palette.body
    : cell === ACCENT || cell === ACCENT_NARROW || cell === ACCENT_NARROW_RIGHT
      ? palette.accent
      : palette.dark;
  if (isCompositeEye(cell)) {
    return renderCompositeEye(cell, palette);
  }

  const glyph = isNarrowRight(cell) ? ' █' : isNarrowLeft(cell) ? '█ ' : '██';
  return `${ansiColor(color)}${glyph}\u001b[0m`;
}

function renderTextCell(cell) {
  if (cell === EMPTY) {
    return '  ';
  }

  if (cell === ACCENT_NARROW) {
    return '# ';
  }

  if (cell === ACCENT_NARROW_RIGHT) {
    return ' #';
  }

  if (cell === DARK_NARROW) {
    return '. ';
  }

  if (cell === DARK_NARROW_RIGHT) {
    return ' .';
  }

  if (cell === EYE_DARK_RIGHT) {
    return '[.';
  }

  if (cell === EYE_DARK_LEFT) {
    return '.]';
  }

  if (cell === EYE_LIGHT_RIGHT) {
    return '[#';
  }

  if (cell === EYE_LIGHT_LEFT) {
    return '#]';
  }

  if (cell === ACCENT) {
    return '##';
  }

  if (cell === DARK) {
    return '..';
  }

  return '[]';
}


function renderCompositeEye(cell, palette) {
  const detail = cell === EYE_LIGHT_LEFT || cell === EYE_LIGHT_RIGHT
    ? palette.accent
    : palette.dark;

  if (cell === EYE_DARK_LEFT || cell === EYE_LIGHT_LEFT) {
    return `${ansiColor(detail)}█${ansiColor(palette.body)}█\u001b[0m`;
  }

  return `${ansiColor(palette.body)}█${ansiColor(detail)}█\u001b[0m`;
}

function ansiColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\u001b[38;2;${r};${g};${b}m`;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

function shiftHex(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(clamp(r + amount), clamp(g + amount), clamp(b + amount));
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function clampIndex(value, length) {
  return Math.max(0, Math.min(length - 1, value));
}

function int(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
