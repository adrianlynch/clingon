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

export function lookLeft(pixels) {
  return pixels.map((row) => row.map((cell) => {
    if (cell === EYE_DARK_RIGHT) return EYE_DARK_LEFT;
    if (cell === EYE_LIGHT_RIGHT) return EYE_LIGHT_LEFT;
    return cell;
  }));
}

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
    { pixels: bob(p, 0), duration: 12 },
    { pixels: bob(p, 1), duration: 1 },
    { pixels: bob(p, 0), duration: 8 }
  ]
});

defineMove('blink', {
  sequence: (p) => [
    { pixels: p.map((row) => row.slice()), duration: 30 },
    { pixels: blink(p), duration: 1 },
    { pixels: p.map((row) => row.slice()), duration: 8 }
  ]
});

defineMove('wiggle', {
  sequence: (p) => [
    { pixels: wiggle(p, 0), duration: 4 },
    { pixels: wiggle(p, 1), duration: 2 },
    { pixels: wiggle(p, 0), duration: 4 },
    { pixels: wiggle(p, 1), duration: 2 }
  ]
});

defineMove('walk', {
  sequence: (p) => [
    { pixels: walk(p, 0), duration: 2 },
    { pixels: walk(p, 1), duration: 2 }
  ]
});

defineMove('look', {
  sequence: (p) => [
    { pixels: lookLeft(p), duration: 6 },
    { pixels: lookRight(p), duration: 6 },
    { pixels: lookLeft(p), duration: 6 },
    { pixels: p.map((row) => row.slice()), duration: 8 }
  ]
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
    frames: moveList = ['idle', 'blink', 'look', 'wiggle', 'idle'],
    fps = 6,
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

  const frames = buildFrames(clingon.pixels, moveList);
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
