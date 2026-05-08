import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateClingon, renderInline, CELL_KINDS, frame, mapCells } from '../src/index.js';
// Cell-ID integers are an internal detail and not part of the public API.
// Tests that need to check pixel data structurally import them directly
// from cells.js; user-facing tests should never need this.
import {
  EMPTY, BODY, ACCENT, DARK,
  ACCENT_NARROW, DARK_NARROW,
  ACCENT_NARROW_RIGHT, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT
} from '../src/cells.js';
import {
  hideCursor, showCursor, cursorUp,
  enterAltBuffer, leaveAltBuffer,
  moveCursor, clearScreen,
  getSize, setRawMode
} from '../src/terminal.js';
import { blink, bob, wiggle, walk, lookLeft, lookRight, defineMove, resolveMove, buildFrames, animateClingon } from '../src/animation.js';
import { runCli } from '../src/cli.js';

function fakeStream() {
  return { writes: [], write(chunk) { this.writes.push(chunk); } };
}

test('CELL_KINDS lists every supported cell kind in stable order', () => {
  assert.deepEqual(CELL_KINDS, [
    'empty',
    'body',
    'accent',
    'dark',
    'accent-narrow-left',
    'dark-narrow-left',
    'accent-narrow-right',
    'dark-narrow-right',
    'eye-dark-left',
    'eye-dark-right',
    'eye-light-left',
    'eye-light-right'
  ]);
  // Frozen so users cannot mutate the public list.
  assert.equal(Object.isFrozen(CELL_KINDS), true);
});

test('frame() builds a sequence entry with the given duration', () => {
  const pixels = [[1, 1], [2, 3]];
  assert.deepEqual(frame(pixels, 6), { pixels, duration: 6 });
  assert.deepEqual(frame(pixels), { pixels, duration: 1 });
});

test('mapCells replaces cells whose mapper returns a kind name', () => {
  const pixels = [
    [BODY, EYE_DARK_LEFT, EYE_DARK_RIGHT, BODY],
    [DARK, BODY, BODY, DARK]
  ];
  const after = mapCells(pixels, ({ kind }) => (kind === 'eye-dark-left' || kind === 'eye-dark-right' ? 'body' : null));
  assert.deepEqual(after, [
    [BODY, BODY, BODY, BODY],
    [DARK, BODY, BODY, DARK]
  ]);
  // Original pixels untouched.
  assert.equal(pixels[0][1], EYE_DARK_LEFT);
});

test('mapCells passes x and y to the mapper', () => {
  const pixels = [[BODY, BODY], [BODY, BODY]];
  const after = mapCells(pixels, ({ x, y }) => ((x + y) % 2 === 0 ? 'dark' : null));
  assert.deepEqual(after, [[DARK, BODY], [BODY, DARK]]);
});

test('mapCells throws on unknown kind names so typos surface immediately', () => {
  const pixels = [[BODY]];
  assert.throws(() => mapCells(pixels, () => 'bod-y'), /Unknown cell kind "bod-y"/);
});

test('hideCursor / showCursor write the right escape sequences', () => {
  const stream = fakeStream();
  hideCursor(stream);
  showCursor(stream);
  assert.deepEqual(stream.writes, ['[?25l', '[?25h']);
});

test('cursorUp moves the cursor up N lines and to column 0', () => {
  const stream = fakeStream();
  cursorUp(stream, 4);
  assert.deepEqual(stream.writes, ['[4A\r']);
});

test('enterAltBuffer / leaveAltBuffer write 1049 sequences', () => {
  const stream = fakeStream();
  enterAltBuffer(stream);
  leaveAltBuffer(stream);
  assert.deepEqual(stream.writes, ['[?1049h', '[?1049l']);
});

test('moveCursor writes a 1-indexed CSI H sequence', () => {
  const stream = fakeStream();
  moveCursor(stream, 5, 12);
  assert.deepEqual(stream.writes, ['[5;12H']);
});

test('clearScreen clears and homes the cursor', () => {
  const stream = fakeStream();
  clearScreen(stream);
  assert.deepEqual(stream.writes, ['[2J[H']);
});

test('getSize returns columns/rows from the stream with sane defaults', () => {
  assert.deepEqual(getSize({ columns: 100, rows: 30 }), { columns: 100, rows: 30 });
  assert.deepEqual(getSize({}), { columns: 80, rows: 24 });
});

test('setRawMode is a no-op when input.setRawMode is missing', () => {
  setRawMode({}, true);
  setRawMode(undefined, true);
});

test('setRawMode toggles when supported', () => {
  let last = null;
  const input = { setRawMode(on) { last = on; } };
  setRawMode(input, true);
  assert.equal(last, true);
  setRawMode(input, false);
  assert.equal(last, false);
});

test('blink replaces eye cells in eye rows with BODY', () => {
  const clingon = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const before = clingon.pixels;
  const after = blink(before);

  assert.equal(after.length, before.length);
  assert.equal(after[0].length, before[0].length);
  assert.notEqual(after, before);
  assert.deepEqual(before, generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false }).pixels);

  for (let y = 0; y < before.length; y += 1) {
    for (let x = 0; x < before[y].length; x += 1) {
      const cell = before[y][x];
      if (cell >= 8 && cell <= 11) {
        assert.equal(after[y][x], 1, `expected BODY at (${y}, ${x}), got ${after[y][x]}`);
      }
    }
  }
});

test('blink leaves rows without eye cells untouched', () => {
  const pixels = [
    [1, 1, 1, 1],
    [3, 3, 3, 3],
    [1, 1, 1, 1]
  ];
  const after = blink(pixels);
  assert.deepEqual(after[0], [1, 1, 1, 1]);
  assert.deepEqual(after[1], [3, 3, 3, 3]);
  assert.deepEqual(after[2], [1, 1, 1, 1]);
});

test('blink replaces ACCENT/DARK in the same row as eyes with BODY', () => {
  const pixels = [
    [1, 8, 9, 1],
    [3, 2, 2, 3],
    [1, 1, 1, 1]
  ];
  const after = blink(pixels);
  assert.deepEqual(after[0], [1, 1, 1, 1]);
  assert.deepEqual(after[1], [3, 2, 2, 3]);
});

test('bob phase 0 returns input pixels unchanged in value', () => {
  const pixels = [[1, 1], [2, 3]];
  const after = bob(pixels, 0);
  assert.deepEqual(after, pixels);
  assert.notEqual(after, pixels);
});

test('bob phase 1 prepends an empty row and drops the last row', () => {
  const pixels = [[1, 1, 1], [2, 2, 2], [3, 3, 3]];
  const after = bob(pixels, 1);
  assert.deepEqual(after, [[0, 0, 0], [1, 1, 1], [2, 2, 2]]);
  assert.equal(after.length, pixels.length);
  assert.equal(after[0].length, pixels[0].length);
});

test('wiggle phase 0 returns input unchanged in value', () => {
  const pixels = [[1, 1, 1], [5, 1, 7], [1, 1, 1]];
  const after = wiggle(pixels, 0);
  assert.deepEqual(after, pixels);
  assert.notEqual(after, pixels);
});

test('wiggle phase 1 swaps DARK_NARROW with DARK_NARROW_RIGHT on arm row', () => {
  const pixels = [[1, 1, 1], [5, 1, 7], [1, 1, 1]];
  const after = wiggle(pixels, 1);
  assert.deepEqual(after[1], [7, 1, 5]);
  assert.deepEqual(after[0], [1, 1, 1]);
  assert.deepEqual(after[2], [1, 1, 1]);
});

test('wiggle returns input unchanged when no arm row exists', () => {
  const pixels = [[1, 1], [1, 1], [3, 3]];
  const after = wiggle(pixels, 1);
  assert.deepEqual(after, pixels);
});

test('walk phase 0 returns input unchanged in value', () => {
  const pixels = [[1, 1, 1], [1, 1, 1], [3, 0, 3]];
  const after = walk(pixels, 0);
  assert.deepEqual(after, pixels);
  assert.notEqual(after, pixels);
});

test('walk phase 1 shifts DARK cells in foot row left by one column', () => {
  const pixels = [[1, 1, 1], [1, 1, 1], [0, 3, 3]];
  const after = walk(pixels, 1);
  assert.deepEqual(after[2], [3, 3, 0]);
});

test('walk leaves cells at the left edge unshifted', () => {
  const pixels = [[1, 1, 1], [3, 0, 3]];
  const after = walk(pixels, 1);
  assert.deepEqual(after[1], [3, 3, 0]);
});

test('walk returns input unchanged when no foot row exists', () => {
  const pixels = [[1, 1], [1, 1], [1, 1]];
  const after = walk(pixels, 1);
  assert.deepEqual(after, pixels);
});

test('animation rhythm is deterministic from the clingon name', async () => {
  const { composeParallel, seedFromClingon } = await import('../src/animation.js');
  const a = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const b = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const framesA = composeParallel(a.pixels, ['idle', 'blink', 'look', 'wiggle', 'walk'], 64, seedFromClingon(a));
  const framesB = composeParallel(b.pixels, ['idle', 'blink', 'look', 'wiggle', 'walk'], 64, seedFromClingon(b));
  assert.deepEqual(framesA, framesB);
});

test('different rhythm words produce different animation patterns', async () => {
  const { composeParallel, seedFromClingon } = await import('../src/animation.js');
  const bouncy = generateClingon({ name: 'orlando-reginald-morris-junior-bouncy', size: 'tiny', color: false });
  const snoozy = generateClingon({ name: 'orlando-reginald-morris-junior-snoozy', size: 'tiny', color: false });
  const framesBouncy = composeParallel(bouncy.pixels, ['idle', 'blink', 'look', 'wiggle', 'walk'], 64, seedFromClingon(bouncy));
  const framesSnoozy = composeParallel(snoozy.pixels, ['idle', 'blink', 'look', 'wiggle', 'walk'], 64, seedFromClingon(snoozy));
  // Same shape (4 of 4 words match) but different rhythm should yield a different timeline.
  assert.deepEqual(bouncy.pixels, snoozy.pixels);
  assert.notDeepEqual(framesBouncy, framesSnoozy);
});

test('renderInline (text mode) produces a single line with creature width', () => {
  const tiny = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const inline = renderInline(tiny.pixels, tiny.palette, { color: false });
  assert.equal(inline.split('\n').length, 1);
  assert.equal(inline.length, tiny.pixels[0].length);
});

test('renderInline color mode emits ANSI escape sequences', () => {
  const tiny = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const inline = renderInline(tiny.pixels, tiny.palette, { color: true });
  assert.match(inline, /\[38;2;\d+;\d+;\d+m/);
  assert.match(inline, /\[0m$/);
});

test('renderInline color-mode visible length matches creature width', () => {
  const tiny = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  const inline = renderInline(tiny.pixels, tiny.palette, { color: true });
  const visible = inline.replace(/\[[0-9;]*m/g, '');
  assert.equal(visible.length, tiny.pixels[0].length);
});

test('renderInline width matches creature size', () => {
  for (const [size, expected] of [['tiny', 4], ['small', 5], ['normal', 7], ['large', 11]]) {
    const c = generateClingon({ name: 'orlando-reginald-morris-junior', size, color: false });
    const inline = renderInline(c.pixels, c.palette, { color: false });
    assert.equal(inline.length, expected, `size ${size} expected width ${expected} got ${inline.length}`);
  }
});

test('generateClingon returns inline alongside ansi and text', () => {
  const c = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false });
  assert.equal(typeof c.inline, 'string');
  assert.equal(c.inline.split('\n').length, 1);
  assert.equal(c.inline, renderInline(c.pixels, c.palette, { color: false }));
});

function createWritable() {
  return { output: '', write(chunk) { this.output += chunk; } };
}

test('cli --inline produces a single line', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color', '--inline'], {
    stdout, stderr, env: {}
  });
  const newlines = (stdout.output.match(/\n/g) || []).length;
  assert.equal(newlines, 1);
  assert.match(stdout.output, /^[\[oO\.# ]{4}\n$/);
  assert.equal(stderr.output, '');
});

test('cli --inline rejects info-panel flags', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  runCli(['--inline', '--message', 'hi'], { stdout, stderr, env: {} });
  assert.match(stderr.output, /inline/i);
  process.exitCode = 0;
});

test('cli --inline rejects --json', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  runCli(['--inline', '--json'], { stdout, stderr, env: {} });
  assert.match(stderr.output, /inline.*json|json.*inline/i);
  process.exitCode = 0;
});

test('cli --inline honors --pad-h', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color', '--inline', '--pad-h=2'], {
    stdout, stderr, env: {}
  });
  assert.match(stdout.output, /^  [\[oO\.# ]{4}\n$/);
});

test('defineMove + resolveMove round-trip a custom move', () => {
  const sequence = [{ pixels: [[1]], duration: 2 }, { pixels: [[2]] }];
  defineMove('test-move-1', { sequence });
  const frames = resolveMove('test-move-1', [[0]]);
  assert.equal(frames.length, 2);
  assert.deepEqual(frames[0], { pixels: [[1]], duration: 2 });
  assert.deepEqual(frames[1], { pixels: [[2]], duration: 1 });
});

test('resolveMove accepts inline Move objects', () => {
  const move = { name: 'inline', sequence: [{ pixels: [[5]] }] };
  const frames = resolveMove(move, [[0]]);
  assert.deepEqual(frames, [{ pixels: [[5]], duration: 1 }]);
});

test('resolveMove invokes function-form sequence with basePixels', () => {
  const move = { name: 'fn', sequence: (p) => [{ pixels: p, duration: 3 }] };
  const frames = resolveMove(move, [[7, 7]]);
  assert.deepEqual(frames, [{ pixels: [[7, 7]], duration: 3 }]);
});

test('resolveMove throws a descriptive error for an unknown move name', () => {
  assert.throws(
    () => resolveMove('not-a-real-move', [[0]]),
    /Unknown move "not-a-real-move".*Registered moves:/
  );
});

test('defineMove replaces an existing move', () => {
  defineMove('test-move-2', { sequence: [{ pixels: [[1]] }] });
  defineMove('test-move-2', { sequence: [{ pixels: [[2]] }] });
  const frames = resolveMove('test-move-2', [[0]]);
  assert.deepEqual(frames, [{ pixels: [[2]], duration: 1 }]);
});

test('built-in idle move has multiple bobs for visible motion', () => {
  const frames = resolveMove('idle', generateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false
  }).pixels);
  assert.equal(frames.length, 5);
});

test('built-in blink move blinks twice per cycle', () => {
  const frames = resolveMove('blink', generateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false
  }).pixels);
  assert.equal(frames.length, 5);
  // brief blinks at frames 1 and 3
  assert.equal(frames[1].duration, 1);
  assert.equal(frames[3].duration, 1);
});

test('built-in look move starts and ends at forward and contains at least one glance', () => {
  const c = generateClingon({ name: 'rupert-wafer-mopbucket-deluxe', size: 'tiny', color: false });
  const frames = resolveMove('look', c.pixels);
  const forwardEyeRow = JSON.stringify(c.pixels[1]);
  assert.ok(frames.length >= 3, 'expected at least forward + glance + forward');
  assert.equal(JSON.stringify(frames[0].pixels[1]), forwardEyeRow);
  assert.equal(JSON.stringify(frames[frames.length - 1].pixels[1]), forwardEyeRow);
  const hasShift = frames.some((f) => JSON.stringify(f.pixels[1]) !== forwardEyeRow);
  assert.ok(hasShift, 'expected at least one shifted glance');
});

test('lookLeft puts both pupils on the LEFT half of their cells', () => {
  // EYE_DARK_LEFT = 8, EYE_DARK_RIGHT = 9, BODY = 1
  // Forward eye row (pinched): left eye DARK_LEFT, right eye DARK_RIGHT.
  const pixels = [[1, 8, 9, 1]];
  const after = lookLeft(pixels);
  // Both eyes converted to DARK_LEFT — pupils on left half of each cell.
  assert.deepEqual(after, [[1, 8, 8, 1]]);
});

test('lookRight puts both pupils on the RIGHT half of their cells', () => {
  const pixels = [[1, 8, 9, 1]];
  const after = lookRight(pixels);
  assert.deepEqual(after, [[1, 9, 9, 1]]);
});

test('lookLeft preserves the eye color (LIGHT vs DARK)', () => {
  // EYE_LIGHT_LEFT = 10, EYE_LIGHT_RIGHT = 11
  const pixels = [[1, 10, 11, 1]];
  const after = lookLeft(pixels);
  assert.deepEqual(after, [[1, 10, 10, 1]]);
});

test('lookLeft / lookRight do not mutate cells that are not eyes', () => {
  const pixels = [[3, 8, 9, 3]];
  assert.deepEqual(lookLeft(pixels), [[3, 8, 8, 3]]);
  assert.deepEqual(lookRight(pixels), [[3, 9, 9, 3]]);
});

test('lookLeft / lookRight do not mutate input', () => {
  const pixels = [[1, 9, 8, 1]];
  const original = JSON.parse(JSON.stringify(pixels));
  lookLeft(pixels);
  lookRight(pixels);
  assert.deepEqual(pixels, original);
});

test('buildFrames concatenates frames from named moves', () => {
  const base = generateClingon({ name: 'orlando-reginald-morris-junior', size: 'tiny', color: false }).pixels;
  const frames = buildFrames(base, ['idle', 'blink']);
  // idle (5) + blink (5) = 10
  assert.equal(frames.length, 10);
});

test('buildFrames accepts mixed strings and inline Move objects', () => {
  const base = [[1]];
  const inline = { name: 'inline', sequence: [{ pixels: [[9]] }] };
  defineMove('one-frame', { sequence: [{ pixels: [[3]] }] });
  const frames = buildFrames(base, ['one-frame', inline]);
  assert.equal(frames.length, 2);
  assert.deepEqual(frames[0].pixels, [[3]]);
  assert.deepEqual(frames[1].pixels, [[9]]);
});

test('buildFrames throws for unknown move name', () => {
  assert.throws(() => buildFrames([[1]], ['idle', 'nonsense']), /Unknown move/);
});

function fakeTtyStream() {
  return {
    isTTY: true,
    columns: 80,
    rows: 24,
    writes: [],
    write(chunk) { this.writes.push(chunk); }
  };
}

function fakeScheduler() {
  const callbacks = [];
  return {
    setInterval(fn) { callbacks.push(fn); return callbacks.length - 1; },
    clearInterval(id) { callbacks[id] = null; },
    tick(times = 1) {
      for (let i = 0; i < times; i += 1) {
        for (const cb of callbacks) if (cb) cb();
      }
    }
  };
}

test('animateClingon hides cursor and writes first frame on start', () => {
  const stream = fakeTtyStream();
  const scheduler = fakeScheduler();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    fps: 6, stream, scheduler
  });
  assert.match(stream.writes[0], /\[\?25l/);
  assert.ok(stream.writes.length >= 2);
  handle.stop();
});

test('animateClingon advances frames on tick with cursor-up between frames', () => {
  const stream = fakeTtyStream();
  const scheduler = fakeScheduler();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    frames: ['idle'], fps: 6, stream, scheduler
  });
  const before = stream.writes.length;
  // idle's first frame holds for 2 ticks; tick enough to roll to the next
  scheduler.tick(3);
  const after = stream.writes.slice(before);
  assert.ok(after.some((w) => /\[\d+A\r/.test(w)), 'expected cursor-up sequence after tick');
  handle.stop();
});

test('animateClingon restores cursor on stop', async () => {
  const stream = fakeTtyStream();
  const scheduler = fakeScheduler();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    stream, scheduler
  });
  handle.stop();
  await handle.done;
  const last = stream.writes.at(-1);
  assert.match(last, /^\n$|\[\?25h/);
});

test('animateClingon writes static frame and resolves immediately on non-TTY stream', async () => {
  const stream = { isTTY: false, writes: [], write(c) { this.writes.push(c); } };
  const scheduler = fakeScheduler();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    stream, scheduler
  });
  await handle.done;
  assert.equal(stream.writes.length, 1);
});

test('animateClingon stops cleanly on AbortSignal', async () => {
  const stream = fakeTtyStream();
  const scheduler = fakeScheduler();
  const controller = new AbortController();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    stream, scheduler, signal: controller.signal
  });
  controller.abort();
  await handle.done;
  const writes = stream.writes.join('');
  assert.match(writes, /\[\?25h/);
});

test('cli --animate --json errors', async () => {
  const stdout = createWritable();
  const stderr = createWritable();
  await runCli(['--animate', '--json'], { stdout, stderr, env: {} });
  assert.match(stderr.output, /animate.*json|json.*animate/i);
  process.exitCode = 0;
});

test('cli --animate --moves accepts a comma-separated move list', async () => {
  const stdout = { isTTY: false, output: '', write(c) { this.output += c; } };
  const stderr = createWritable();
  await runCli(['--animate', '--moves', 'idle,blink', '--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout, stderr, env: {}
  });
  assert.match(stdout.output, /\[\]/);
  assert.equal(stderr.output, '');
});

test('cli --animate --moves bogus errors', async () => {
  const stdout = { isTTY: false, output: '', write(c) { this.output += c; } };
  const stderr = createWritable();
  await runCli(['--animate', '--moves', 'bogus', '--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout, stderr, env: {}
  });
  assert.match(stderr.output, /bogus|move/i);
  process.exitCode = 0;
});

test('cli --animate accepts --in-sequence with --moves', async () => {
  const stdout = { isTTY: false, output: '', write(c) { this.output += c; } };
  const stderr = createWritable();
  await runCli(['--animate', '--moves', 'idle,blink', '--in-sequence', '--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout, stderr, env: {}
  });
  assert.match(stdout.output, /\[\]/);
  assert.equal(stderr.output, '');
});

test('cli --normal sets size to normal', async () => {
  const stdout = createWritable();
  const stderr = createWritable();
  runCli(['--with-name', 'orlando-reginald-morris-junior', '--normal', '--no-color'], {
    stdout, stderr, env: {}
  });
  // Normal-size creature is 6 lines tall.
  const lines = stdout.output.trimEnd().split('\n');
  assert.equal(lines.length, 6);
  assert.equal(stderr.output, '');
});

test('cli --animate composes info panel and padding into each frame (non-TTY)', async () => {
  const stdout = { isTTY: false, output: '', write(c) { this.output += c; } };
  const stderr = createWritable();
  await runCli(['--animate', '--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color', '--message', 'Hi', '--pad-h=2'], {
    stdout, stderr, env: {}
  });
  // Expect each art line to start with 2 spaces of padding and end with the message
  // beside the centered art row.
  assert.match(stdout.output, /^  /m, 'expected --pad-h to add leading spaces');
  assert.match(stdout.output, /  Hi/, 'expected --message to appear beside art');
  assert.equal(stderr.output, '');
});

test('animateClingon with loops=1 stops after one full cycle', async () => {
  const stream = fakeTtyStream();
  const scheduler = fakeScheduler();
  const handle = animateClingon({
    name: 'orlando-reginald-morris-junior', size: 'tiny', color: false,
    frames: ['idle'], mode: 'sequence', fps: 8,
    loops: 1, stream, scheduler
  });
  // idle (sequence) has 5 frames totaling 9 ticks; tick well past one cycle
  scheduler.tick(20);
  await handle.done;
  // Cursor should be restored after the single cycle completes
  assert.match(stream.writes.join(''), /\[\?25h/);
});

test('cli --animate --inline errors', async () => {
  const stdout = createWritable();
  const stderr = createWritable();
  await runCli(['--animate', '--inline'], { stdout, stderr, env: {} });
  assert.match(stderr.output, /animate.*inline|inline.*animate/i);
  process.exitCode = 0;
});

test('cli --animate with non-TTY stdout writes static frame and exits', async () => {
  const stdout = { isTTY: false, output: '', write(c) { this.output += c; } };
  const stderr = createWritable();
  await runCli(['--animate', '--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout, stderr, env: {}
  });
  assert.match(stdout.output, /\[\]/);
  assert.equal(stderr.output, '');
});
