import {
  EMPTY, BODY, ACCENT, DARK,
  DARK_NARROW, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT,
  generateClingon, renderAnsi
} from './index.js';
import { hideCursor, showCursor, cursorUp } from './terminal.js';

function isEye(cell) {
  return cell === EYE_DARK_LEFT
    || cell === EYE_DARK_RIGHT
    || cell === EYE_LIGHT_LEFT
    || cell === EYE_LIGHT_RIGHT;
}

function isDarkLike(cell) {
  return cell === DARK || cell === DARK_NARROW || cell === DARK_NARROW_RIGHT;
}

function findEyeRow(pixels) {
  // Composite eye cells are unambiguous markers.
  for (let y = 0; y < pixels.length; y += 1) {
    if (pixels[y].some(isEye)) return { y, kind: 'composite' };
  }
  // Fallback heuristic for simple-block eyes: the topmost row that
  // (a) is at least half BODY cells (filters out decorative antenna rows), and
  // (b) contains exactly two mirror-symmetric DARK or ACCENT cells.
  for (let y = 0; y < pixels.length; y += 1) {
    const row = pixels[y];
    const bodyCount = row.filter((c) => c === BODY).length;
    if (bodyCount * 2 < row.length) continue;
    const darks = [];
    const accents = [];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === DARK) darks.push(x);
      else if (row[x] === ACCENT) accents.push(x);
    }
    const positions = darks.length === 2 ? darks : (accents.length === 2 ? accents : null);
    if (!positions) continue;
    const center = (row.length - 1) / 2;
    if (Math.abs((positions[0] + positions[1]) / 2 - center) < 0.6) {
      return { y, kind: 'simple', cells: positions };
    }
  }
  return null;
}

export function blink(pixels) {
  const eye = findEyeRow(pixels);
  if (!eye) return pixels.map((row) => row.slice());
  return pixels.map((row, y) => {
    if (y !== eye.y) return row.slice();
    if (eye.kind === 'composite') {
      return row.map((cell) => (
        isEye(cell) || cell === ACCENT || cell === DARK ? BODY : cell
      ));
    }
    const next = row.slice();
    for (const idx of eye.cells) next[idx] = BODY;
    return next;
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

// Both eyes look LEFT: every composite eye becomes EYE_*_LEFT
// (pupil on the left half of its cell, regardless of original orientation).
export function lookLeft(pixels) {
  return pixels.map((row) => row.map((cell) => {
    if (cell === EYE_DARK_RIGHT) return EYE_DARK_LEFT;
    if (cell === EYE_LIGHT_RIGHT) return EYE_LIGHT_LEFT;
    return cell;
  }));
}

// Both eyes look RIGHT: every composite eye becomes EYE_*_RIGHT
// (pupil on the right half of its cell).
export function lookRight(pixels) {
  return pixels.map((row) => row.map((cell) => {
    if (cell === EYE_DARK_LEFT) return EYE_DARK_RIGHT;
    if (cell === EYE_LIGHT_LEFT) return EYE_LIGHT_RIGHT;
    return cell;
  }));
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
    { pixels: bob(p, 0), duration: 2 },
    { pixels: bob(p, 1), duration: 1 },
    { pixels: bob(p, 0), duration: 1 },
    { pixels: bob(p, 1), duration: 1 },
    { pixels: bob(p, 0), duration: 4 }
  ]
});

defineMove('blink', {
  sequence: (p) => [
    { pixels: p.map((row) => row.slice()), duration: 6 },
    { pixels: blink(p), duration: 1 },
    { pixels: p.map((row) => row.slice()), duration: 3 },
    { pixels: blink(p), duration: 1 },
    { pixels: p.map((row) => row.slice()), duration: 3 }
  ]
});

defineMove('wiggle', {
  sequence: (p) => [
    { pixels: wiggle(p, 0), duration: 2 },
    { pixels: wiggle(p, 1), duration: 1 },
    { pixels: wiggle(p, 0), duration: 1 },
    { pixels: wiggle(p, 1), duration: 1 },
    { pixels: wiggle(p, 0), duration: 2 }
  ]
});

defineMove('walk', {
  sequence: (p) => [
    { pixels: walk(p, 0), duration: 2 },
    { pixels: walk(p, 1), duration: 2 },
    { pixels: walk(p, 0), duration: 2 },
    { pixels: walk(p, 1), duration: 2 }
  ]
});

function mulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomEventTicks(totalLength, minSpacing, maxSpacing, rng = Math.random) {
  const ticks = [];
  let t = Math.floor(rng() * minSpacing);
  while (t < totalLength) {
    ticks.push(t);
    t += minSpacing + Math.floor(rng() * (maxSpacing - minSpacing + 1));
  }
  return ticks;
}

function buildTrack(name, cycleLength, rng) {
  if (name === 'idle') {
    const bobStartAt = randomEventTicks(cycleLength, 12, 20, rng);
    const bobSet = new Set();
    for (const start of bobStartAt) {
      bobSet.add(start);
      if (rng() < 0.3) bobSet.add(start + 1);
    }
    return (frame, t) => bob(frame, bobSet.has(t) ? 1 : 0);
  }
  if (name === 'blink') {
    const blinkAt = randomEventTicks(cycleLength, 24, 44, rng);
    const blinkDuration = 2;
    return (frame, t) => {
      const active = blinkAt.some((start) => t >= start && t < start + blinkDuration);
      return active ? blink(frame) : frame;
    };
  }
  if (name === 'look') {
    const lookAt = randomEventTicks(cycleLength, 40, 70, rng);
    const directions = [];
    let goLeft = rng() < 0.5;
    for (let i = 0; i < lookAt.length; i += 1) {
      directions.push(goLeft ? 'left' : 'right');
      goLeft = !goLeft;
    }
    const eventLength = 10;
    return (frame, t) => {
      const idx = lookAt.findIndex((start) => t >= start && t < start + eventLength);
      if (idx < 0) return frame;
      const offset = t - lookAt[idx];
      if (offset === 0 || offset === eventLength - 1) return blink(frame);
      return directions[idx] === 'left' ? lookLeft(frame) : lookRight(frame);
    };
  }
  if (name === 'wiggle') {
    const wiggleAt = randomEventTicks(cycleLength, 40, 60, rng);
    const wiggleDuration = 6;
    return (frame, t) => {
      const start = wiggleAt.find((s) => t >= s && t < s + wiggleDuration);
      if (start === undefined) return frame;
      return wiggle(frame, (t - start) % 2);
    };
  }
  if (name === 'walk') {
    const walkAt = randomEventTicks(cycleLength, 35, 55, rng);
    const walkDuration = 4;
    return (frame, t) => {
      const start = walkAt.find((s) => t >= s && t < s + walkDuration);
      if (start === undefined) return frame;
      return walk(frame, (t - start) % 2);
    };
  }
  throw new Error(`Move "${name}" cannot run in parallel mode. Built-in parallel-mode moves: idle, blink, look, wiggle, walk.`);
}

export function composeParallel(basePixels, moveNames, cycleLength = 160, seed = null) {
  const rng = seed != null ? mulberry32(seed) : Math.random;
  const tracks = moveNames.map((name) => buildTrack(name, cycleLength, rng));
  const frames = [];
  for (let t = 0; t < cycleLength; t += 1) {
    let frame = basePixels;
    for (const track of tracks) {
      frame = track(frame, t);
    }
    frames.push({ pixels: frame, duration: 1 });
  }
  return frames;
}

defineMove('look', {
  sequence: (p) => {
    const forward = () => ({ pixels: p.map((row) => row.slice()), duration: 6 + Math.floor(Math.random() * 4) });
    const numGlances = 1 + Math.floor(Math.random() * 3);
    let goLeft = Math.random() < 0.5;
    const frames = [forward()];
    for (let i = 0; i < numGlances; i += 1) {
      // Brief blink masks the asymmetric forward → look transition.
      frames.push({ pixels: blink(p), duration: 1 });
      frames.push({
        pixels: goLeft ? lookLeft(p) : lookRight(p),
        duration: 6 + Math.floor(Math.random() * 3)
      });
      frames.push({ pixels: blink(p), duration: 1 });
      frames.push(forward());
      goLeft = !goLeft;
    }
    return frames;
  }
});

function defaultScheduler() {
  return {
    setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
    clearInterval: (id) => globalThis.clearInterval(id)
  };
}

export function animateClingon(options = {}) {
  const {
    name, size, color = true,
    frames: moveList = ['idle', 'blink', 'look', 'wiggle', 'walk'],
    mode = 'parallel',
    fps = 8,
    loops = Infinity,
    seconds,
    stream = process.stdout,
    signal,
    decorate,
    scheduler = defaultScheduler()
  } = options;

  const clingon = generateClingon({ name, size, color });
  // Animation rhythm derives from the same identity that drives shape and palette,
  // so the same name always produces the same pattern of bobs/blinks/looks.
  const animationSeed = (clingon.shapeSeed ^ (clingon.paletteSeed * 1024)) >>> 0;
  const frames = mode === 'parallel'
    ? composeParallel(clingon.pixels, moveList, 160, animationSeed)
    : buildFrames(clingon.pixels, moveList);

  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  const wrap = (ansi) => (decorate ? decorate(ansi) : ansi);

  if (!stream.isTTY) {
    stream.write(`${wrap(clingon.ansi)}\n`);
    resolveDone();
    return { stop() {}, done };
  }
  const renderedFrames = frames.map((frame) => ({
    ansi: wrap(renderAnsi(frame.pixels, clingon.palette, { color })),
    duration: frame.duration
  }));
  const height = renderedFrames[0].ansi.split('\n').length;

  let frameIndex = 0;
  let durationLeft = renderedFrames[0].duration;
  let loopsRemaining = loops;
  let stopped = false;
  let intervalHandle;
  let timeoutHandle;

  function teardown() {
    if (stopped) return;
    stopped = true;
    if (intervalHandle != null) scheduler.clearInterval(intervalHandle);
    if (timeoutHandle != null) clearTimeout(timeoutHandle);
    showCursor(stream);
    stream.write('\n');
    if (signal && typeof signal.removeEventListener === 'function') {
      signal.removeEventListener('abort', teardown);
    }
    resolveDone();
  }

  hideCursor(stream);
  stream.write(renderedFrames[0].ansi);

  intervalHandle = scheduler.setInterval(() => {
    if (stopped) return;
    durationLeft -= 1;
    if (durationLeft > 0) return;
    frameIndex += 1;
    if (frameIndex >= renderedFrames.length) {
      loopsRemaining -= 1;
      if (loopsRemaining <= 0) { teardown(); return; }
      frameIndex = 0;
    }
    durationLeft = renderedFrames[frameIndex].duration;
    cursorUp(stream, height - 1);
    stream.write(renderedFrames[frameIndex].ansi);
  }, 1000 / fps);

  if (seconds && Number.isFinite(seconds)) {
    timeoutHandle = setTimeout(teardown, seconds * 1000);
  }

  if (signal) {
    if (signal.aborted) {
      teardown();
    } else {
      signal.addEventListener('abort', teardown, { once: true });
    }
  }

  return {
    stop() { teardown(); },
    done
  };
}
