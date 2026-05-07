import {
  EMPTY, BODY, ACCENT, DARK,
  DARK_NARROW, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT
} from './index.js';

function isEye(cell) {
  return cell === EYE_DARK_LEFT
    || cell === EYE_DARK_RIGHT
    || cell === EYE_LIGHT_LEFT
    || cell === EYE_LIGHT_RIGHT;
}

function isDarkLike(cell) {
  return cell === DARK || cell === DARK_NARROW || cell === DARK_NARROW_RIGHT;
}

export function blink(pixels) {
  return pixels.map((row) => {
    const hasEye = row.some(isEye);
    if (!hasEye) {
      return row.slice();
    }
    return row.map((cell) => (
      isEye(cell) || cell === ACCENT || cell === DARK ? BODY : cell
    ));
  });
}

export function bob(pixels, phase) {
  if (phase === 0) {
    return pixels.map((row) => row.slice());
  }
  const width = pixels[0].length;
  const emptyRow = new Array(width).fill(EMPTY);
  return [emptyRow, ...pixels.slice(0, -1).map((row) => row.slice())];
}

export function wiggle(pixels, phase) {
  const armRow = pixels.findIndex((row) => (
    row.includes(DARK_NARROW) && row.includes(DARK_NARROW_RIGHT)
  ));
  if (phase === 0 || armRow === -1) {
    return pixels.map((row) => row.slice());
  }
  return pixels.map((row, y) => {
    if (y !== armRow) return row.slice();
    return row.map((cell) => {
      if (cell === DARK_NARROW) return DARK_NARROW_RIGHT;
      if (cell === DARK_NARROW_RIGHT) return DARK_NARROW;
      return cell;
    });
  });
}

export function walk(pixels, phase) {
  let footRow = -1;
  for (let y = pixels.length - 1; y >= 0; y -= 1) {
    if (pixels[y].some(isDarkLike)) { footRow = y; break; }
  }
  if (phase === 0 || footRow === -1) {
    return pixels.map((row) => row.slice());
  }
  return pixels.map((row, y) => {
    if (y !== footRow) return row.slice();
    const next = new Array(row.length).fill(EMPTY);
    for (let x = 0; x < row.length; x += 1) {
      if (!isDarkLike(row[x])) continue;
      const target = x === 0 ? 0 : x - 1;
      next[target] = row[x];
    }
    return next;
  });
}

const moveRegistry = new Map();

export function defineMove(name, move) {
  moveRegistry.set(name, { name, sequence: move.sequence });
}

export function resolveMove(input, basePixels) {
  const move = typeof input === 'string' ? moveRegistry.get(input) : input;
  if (!move) {
    const known = Array.from(moveRegistry.keys()).join(', ') || '(none)';
    throw new Error(`Unknown move "${input}". Registered moves: ${known}.`);
  }
  const raw = typeof move.sequence === 'function' ? move.sequence(basePixels) : move.sequence;
  return raw.map((frame) => ({ pixels: frame.pixels, duration: frame.duration ?? 1 }));
}

export function buildFrames(basePixels, moves) {
  const frames = [];
  for (const move of moves) {
    frames.push(...resolveMove(move, basePixels));
  }
  return frames;
}

defineMove('idle', {
  sequence: (p) => [
    { pixels: bob(p, 0), duration: 1 },
    { pixels: bob(p, 1), duration: 1 }
  ]
});

defineMove('blink', {
  sequence: (p) => [
    { pixels: p.map((row) => row.slice()), duration: 3 },
    { pixels: blink(p), duration: 1 },
    { pixels: p.map((row) => row.slice()), duration: 1 }
  ]
});

defineMove('wiggle', {
  sequence: (p) => [
    { pixels: wiggle(p, 0), duration: 1 },
    { pixels: wiggle(p, 1), duration: 1 }
  ]
});

defineMove('walk', {
  sequence: (p) => [
    { pixels: walk(p, 0), duration: 1 },
    { pixels: walk(p, 1), duration: 1 }
  ]
});
