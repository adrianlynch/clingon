import { randomBytes } from 'node:crypto';

const CODE_PREFIX = 'clg';
const DEFAULT_WIDTH = 11;
const DEFAULT_HEIGHT = 9;
const SMALL_WIDTH = 7;
const SMALL_HEIGHT = 6;
const TINY_WIDTH = 7;
const TINY_HEIGHT = 5;
const DEFAULT_SIZE = 'normal';
const EMPTY = 0;
const BODY = 1;
const ACCENT = 2;
const DARK = 3;
const ACCENT_NARROW = 4;
const DARK_NARROW = 5;
const ACCENT_NARROW_RIGHT = 6;
const DARK_NARROW_RIGHT = 7;

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

const PALETTES = [
  ['#0891b2', '#c026d3', '#155e75'],
  ['#f97316', '#22c55e', '#7c2d12'],
  ['#8b5cf6', '#facc15', '#3730a3'],
  ['#ef4444', '#14b8a6', '#7f1d1d'],
  ['#0ea5e9', '#eab308', '#0f172a'],
  ['#84cc16', '#ec4899', '#365314'],
  ['#f43f5e', '#38bdf8', '#881337'],
  ['#10b981', '#a855f7', '#064e3b']
];

export function generateClingon(options = {}) {
  const requested = options.code ? parseCode(options.code) : randomCode();
  const size = normalizeSize(options.size);
  const shapeSeed = requested.shapeSeed;
  const paletteSeed = options.recolor ? randomPaletteSeed(requested.format) : requested.paletteSeed;
  const code = requested.format === 'classic'
    ? formatClassicCode(shapeSeed, paletteSeed)
    : formatCode(shapeSeed, paletteSeed);
  const shape = createShape(shapeSeed, size);
  const palette = createPalette(paletteSeed);

  return {
    code,
    size,
    shapeSeed,
    paletteSeed,
    palette,
    pixels: shape,
    ansi: renderAnsi(shape, palette, options),
    text: renderText(shape)
  };
}

export function renderClingon(codeOrOptions) {
  const options = typeof codeOrOptions === 'string' ? { code: codeOrOptions } : codeOrOptions;
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

  const nameMatch = value.match(/^([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)$/);

  if (!nameMatch) {
    throw new Error(`Invalid clingon code "${code}". Expected a name like orlando-reginald-morris-junior.`);
  }

  const firstIndex = wordIndex(FIRST_NAMES, nameMatch[1], 'first name');
  const middleIndex = wordIndex(MIDDLE_NAMES, nameMatch[2], 'middle name');
  const familyIndex = wordIndex(FAMILY_NAMES, nameMatch[3], 'family name');
  const suffixIndex = wordIndex(SUFFIX_NAMES, nameMatch[4], 'suffix');

  return {
    shapeSeed: firstIndex + familyIndex * FIRST_NAMES.length,
    paletteSeed: middleIndex + suffixIndex * MIDDLE_NAMES.length,
    format: 'name'
  };
}

export function formatCode(shapeSeed, paletteSeed) {
  const shapeIndex = shapeSeed % (FIRST_NAMES.length * FAMILY_NAMES.length);
  const paletteIndex = paletteSeed % (MIDDLE_NAMES.length * SUFFIX_NAMES.length);
  const first = FIRST_NAMES[shapeIndex % FIRST_NAMES.length];
  const family = FAMILY_NAMES[Math.floor(shapeIndex / FIRST_NAMES.length)];
  const middle = MIDDLE_NAMES[paletteIndex % MIDDLE_NAMES.length];
  const suffix = SUFFIX_NAMES[Math.floor(paletteIndex / MIDDLE_NAMES.length)];

  return `${first}-${middle}-${family}-${suffix}`;
}

export function snippetFor(code, options = {}) {
  const size = normalizeSize(options.size);
  const optionEntries = [`code: '${code}'`];

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

  if (size !== DEFAULT_SIZE && size !== 'small' && size !== 'tiny') {
    throw new Error(`Invalid size "${size}". Expected "tiny", "small", or "normal".`);
  }

  return size;
}

function createShape(seed, size) {
  if (size === 'tiny') {
    return createTinyShape(seed);
  }

  if (size === 'small') {
    return createSmallShape(seed);
  }

  return createNormalShape(seed);
}

function createNormalShape(seed) {
  const rng = mulberry32(seed);
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;
  const pixels = Array.from({ length: height }, () => Array(width).fill(EMPTY));
  const center = Math.floor(width / 2);
  const bodyTop = 2 + int(rng, 0, 1);
  const bodyBottom = 6 + int(rng, 0, 1);
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

function createTinyShape(seed) {
  const rng = mulberry32(seed);
  const width = TINY_WIDTH;
  const height = TINY_HEIGHT;
  const pixels = Array.from({ length: height }, () => Array(width).fill(EMPTY));
  const center = Math.floor(width / 2);
  const bodyStyles = [
    [1, 2, 1],
    [2, 2, 1],
    [2, 3, 2],
    [1, 3, 1],
    [2, 3, 1]
  ];
  const halfWidths = bodyStyles[int(rng, 0, bodyStyles.length - 1)];

  addTinyHeadTop(pixels, rng, center);

  for (let index = 0; index < halfWidths.length; index += 1) {
    fillSymmetric(pixels, index + 1, center, halfWidths[index], BODY);
  }

  addTinyFace(pixels, rng, center, halfWidths);
  addTinyFeet(pixels, rng, center, halfWidths);

  return pixels;
}

function addTinyHeadTop(pixels, rng, center) {
  const style = int(rng, 0, 3);
  const value = rng() > 0.45 ? ACCENT_NARROW : ACCENT;

  if (style === 0) {
    pixels[0][center] = value;
  } else if (style === 1) {
    setMirrored(pixels, 0, center - 1, center + 1, value);
  } else if (style === 2) {
    pixels[0][center + int(rng, -1, 1)] = value;
  }
}

function addTinyFace(pixels, rng, center, halfWidths) {
  const eyeSpacing = halfWidths[1] >= 3 && rng() > 0.45 ? 2 : 1;
  pixels[2][center - eyeSpacing] = DARK;
  pixels[2][center + eyeSpacing] = DARK;

  if (rng() > 0.5 && halfWidths[2] >= 2) {
    setMirrored(pixels, 3, center - 1, center + 1, rng() > 0.5 ? ACCENT_NARROW : ACCENT);
  } else {
    pixels[3][center] = rng() > 0.5 ? ACCENT_NARROW : ACCENT;
  }
}

function addTinyFeet(pixels, rng, center, halfWidths) {
  const spread = Math.min(2, Math.max(1, halfWidths[2]));
  const value = rng() > 0.35 ? DARK_NARROW : DARK;
  setMirrored(pixels, 4, center - spread, center + spread, value);

  if (spread === 1 && rng() > 0.6) {
    setMirrored(pixels, 4, center - 2, center + 2, value);
  }
}

function createSmallShape(seed) {
  const rng = mulberry32(seed);
  const width = SMALL_WIDTH;
  const height = SMALL_HEIGHT;
  const pixels = Array.from({ length: height }, () => Array(width).fill(EMPTY));
  const center = Math.floor(width / 2);
  const bodyStyles = [
    [2, 3, 3, 2],
    [1, 3, 3, 2],
    [2, 2, 3, 2],
    [2, 3, 2, 1],
    [1, 2, 3, 1],
    [2, 3, 3, 3]
  ];
  const halfWidths = bodyStyles[int(rng, 0, bodyStyles.length - 1)];

  addSmallHeadTop(pixels, rng, center);

  for (let index = 0; index < halfWidths.length; index += 1) {
    fillSymmetric(pixels, index + 1, center, halfWidths[index], BODY);
  }

  addSmallEyes(pixels, rng, center, halfWidths);
  addSmallMouth(pixels, rng, center, halfWidths);
  addSmallArms(pixels, rng, center, halfWidths);
  addSmallFeet(pixels, rng, center, halfWidths);

  return pixels;
}

function addSmallHeadTop(pixels, rng, center) {
  const style = int(rng, 0, 4);
  const value = rng() > 0.45 ? ACCENT_NARROW : ACCENT;

  if (style === 0) {
    pixels[0][center] = value;
  } else if (style === 1) {
    setMirrored(pixels, 0, center - 1, center + 1, value);
  } else if (style === 2) {
    pixels[0][center + int(rng, -1, 1)] = value;
  } else if (style === 3) {
    setMirrored(pixels, 0, center - 2, center + 2, value);
  }
}

function addSmallEyes(pixels, rng, center, halfWidths) {
  const y = halfWidths[1] >= 2 ? 2 : 3;
  const spacing = halfWidths[y - 1] >= 3 && rng() > 0.35 ? 2 : 1;
  pixels[y][center - spacing] = DARK;
  pixels[y][center + spacing] = DARK;
}

function addSmallMouth(pixels, rng, center, halfWidths) {
  const y = halfWidths[3] >= 2 ? 4 : 3;
  const style = int(rng, 0, 2);

  if (style === 0) {
    pixels[y][center] = rng() > 0.5 ? ACCENT_NARROW : ACCENT;
  } else if (style === 1) {
    setMirrored(pixels, y, center - 1, center + 1, rng() > 0.5 ? ACCENT_NARROW : ACCENT);
  } else {
    pixels[y][center] = rng() > 0.5 ? DARK_NARROW : DARK;
  }
}

function addSmallArms(pixels, rng, center, halfWidths) {
  const y = int(rng, 2, 3);
  const reach = halfWidths[y - 1] + 1;

  if (reach < center + 1 && rng() > 0.2) {
    const value = rng() > 0.5 ? BODY : rng() > 0.45 ? DARK_NARROW : DARK;
    setMirrored(pixels, y, center - reach, center + reach, value);
  }
}

function addSmallFeet(pixels, rng, center, halfWidths) {
  const spread = Math.min(center, Math.max(1, halfWidths[3] - int(rng, 0, 1)));
  const value = rng() > 0.35 ? DARK_NARROW : DARK;
  setMirrored(pixels, 5, center - spread, center + spread, value);

  if (spread < 2 && rng() > 0.5) {
    setMirrored(pixels, 5, center - spread - 1, center + spread + 1, value);
  }
}

function createPalette(seed) {
  const rng = mulberry32(seed);
  const base = PALETTES[int(rng, 0, PALETTES.length - 1)];
  const hueShift = int(rng, -18, 18);

  return {
    body: shiftHex(base[0], hueShift),
    accent: shiftHex(base[1], -hueShift),
    dark: base[2]
  };
}

function addEyes(pixels, rng, center, y, halfWidth) {
  const inset = int(rng, 1, 2);
  const left = Math.max(1, center - halfWidth + inset);
  const right = Math.min(pixels[y].length - 2, center + halfWidth - inset);
  pixels[y][left] = DARK;
  pixels[y][right] = DARK;
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

function renderAnsi(shape, palette, options = {}) {
  const useColor = options.color !== false;
  const rows = shape.map((row) => row.map((cell) => renderCell(cell, palette, useColor)).join(''));
  return rows.join('\n');
}

function renderText(shape) {
  return shape.map((row) => row.map(renderTextCell).join('')).join('\n');
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

  if (cell === ACCENT) {
    return '##';
  }

  if (cell === DARK) {
    return '..';
  }

  return '[]';
}

function isNarrowLeft(cell) {
  return cell === ACCENT_NARROW || cell === DARK_NARROW;
}

function isNarrowRight(cell) {
  return cell === ACCENT_NARROW_RIGHT || cell === DARK_NARROW_RIGHT;
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

function int(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
