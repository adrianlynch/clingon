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

// Shifts composite eye cells by `delta` character columns (each grid cell renders
// as 2 character columns, so delta=1 moves the eye dark-spot by half a grid cell).
function shiftEyes(pixels, delta) {
  return pixels.map((row) => {
    const eyes = [];
    for (let i = 0; i < row.length; i += 1) {
      const cell = row[i];
      if (cell === EYE_DARK_LEFT) eyes.push({ cell: i, char: i * 2, kind: 'dark' });
      else if (cell === EYE_DARK_RIGHT) eyes.push({ cell: i, char: i * 2 + 1, kind: 'dark' });
      else if (cell === EYE_LIGHT_LEFT) eyes.push({ cell: i, char: i * 2, kind: 'light' });
      else if (cell === EYE_LIGHT_RIGHT) eyes.push({ cell: i, char: i * 2 + 1, kind: 'light' });
    }
    if (eyes.length === 0) return row.slice();

    const maxChar = row.length * 2;
    const newChars = eyes.map((e) => e.char + delta);
    if (newChars.some((c) => c < 0 || c >= maxChar)) return row.slice();

    const placements = newChars.map((c, idx) => {
      const cellIdx = Math.floor(c / 2);
      const isRight = (c % 2) === 1;
      const kind = eyes[idx].kind;
      const cellType = kind === 'dark'
        ? (isRight ? EYE_DARK_RIGHT : EYE_DARK_LEFT)
        : (isRight ? EYE_LIGHT_RIGHT : EYE_LIGHT_LEFT);
      return { cellIdx, cellType };
    });

    const newCellSet = new Set(placements.map((p) => p.cellIdx));
    if (newCellSet.size !== placements.length) return row.slice();

    const oldCellSet = new Set(eyes.map((e) => e.cell));
    for (const p of placements) {
      if (oldCellSet.has(p.cellIdx)) continue;
      if (row[p.cellIdx] !== BODY) return row.slice();
    }

    const newRow = row.slice();
    for (const e of eyes) newRow[e.cell] = BODY;
    for (const p of placements) newRow[p.cellIdx] = p.cellType;
    return newRow;
  });
}

export function lookLeft(pixels) {
  return shiftEyes(pixels, -1);
}

export function lookRight(pixels) {
  return shiftEyes(pixels, 1);
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

function randomEventTicks(totalLength, minSpacing, maxSpacing) {
  const ticks = [];
  let t = Math.floor(Math.random() * minSpacing);
  while (t < totalLength) {
    ticks.push(t);
    t += minSpacing + Math.floor(Math.random() * (maxSpacing - minSpacing + 1));
  }
  return ticks;
}

function buildTrack(name, cycleLength) {
  if (name === 'idle') {
    const bobStartAt = randomEventTicks(cycleLength, 12, 20);
    const bobSet = new Set();
    for (const start of bobStartAt) {
      bobSet.add(start);
      if (Math.random() < 0.3) bobSet.add(start + 1);
    }
    return (frame, t) => bob(frame, bobSet.has(t) ? 1 : 0);
  }
  if (name === 'blink') {
    const blinkAt = new Set(randomEventTicks(cycleLength, 50, 80));
    return (frame, t) => blinkAt.has(t) ? blink(frame) : frame;
  }
  if (name === 'look') {
    const lookAt = randomEventTicks(cycleLength, 60, 90);
    const directions = [];
    let goLeft = Math.random() < 0.5;
    for (let i = 0; i < lookAt.length; i += 1) {
      directions.push(goLeft ? 'left' : 'right');
      goLeft = !goLeft;
    }
    const lookDuration = 8;
    return (frame, t) => {
      const idx = lookAt.findIndex((start) => t >= start && t < start + lookDuration);
      if (idx < 0) return frame;
      return directions[idx] === 'left' ? lookLeft(frame) : lookRight(frame);
    };
  }
  if (name === 'wiggle') {
    const wiggleAt = randomEventTicks(cycleLength, 40, 60);
    const wiggleDuration = 6;
    return (frame, t) => {
      const start = wiggleAt.find((s) => t >= s && t < s + wiggleDuration);
      if (start === undefined) return frame;
      return wiggle(frame, (t - start) % 2);
    };
  }
  if (name === 'walk') {
    const walkAt = randomEventTicks(cycleLength, 35, 55);
    const walkDuration = 4;
    return (frame, t) => {
      const start = walkAt.find((s) => t >= s && t < s + walkDuration);
      if (start === undefined) return frame;
      return walk(frame, (t - start) % 2);
    };
  }
  throw new Error(`Move "${name}" cannot run in parallel mode. Built-in parallel-mode moves: idle, blink, look, wiggle, walk.`);
}

export function composeParallel(basePixels, moveNames, cycleLength = 160) {
  const tracks = moveNames.map((name) => buildTrack(name, cycleLength));
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
    const numGlances = 1 + Math.floor(Math.random() * 3); // 1-3 glances per cycle
    let goLeft = Math.random() < 0.5;
    const frames = [forward()];
    for (let i = 0; i < numGlances; i += 1) {
      frames.push({
        pixels: goLeft ? lookLeft(p) : lookRight(p),
        duration: 6 + Math.floor(Math.random() * 3)
      });
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
    frames: moveList = ['idle', 'blink', 'look', 'wiggle'],
    mode = 'parallel',
    fps = 8,
    loops = Infinity,
    seconds,
    stream = process.stdout,
    signal,
    scheduler = defaultScheduler()
  } = options;

  const clingon = generateClingon({ name, size, color });
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });

  if (!stream.isTTY) {
    stream.write(`${clingon.ansi}\n`);
    resolveDone();
    return { stop() {}, done };
  }

  const frames = mode === 'parallel'
    ? composeParallel(clingon.pixels, moveList)
    : buildFrames(clingon.pixels, moveList);
  const renderedFrames = frames.map((frame) => ({
    ansi: renderAnsi(frame.pixels, clingon.palette, { color }),
    duration: frame.duration
  }));
  const height = clingon.pixels.length;

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
