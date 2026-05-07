import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY, BODY, ACCENT, DARK,
  ACCENT_NARROW, DARK_NARROW,
  ACCENT_NARROW_RIGHT, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT
} from '../src/index.js';
import {
  hideCursor, showCursor, cursorUp,
  enterAltBuffer, leaveAltBuffer,
  moveCursor, clearScreen,
  getSize, setRawMode
} from '../src/terminal.js';

function fakeStream() {
  return { writes: [], write(chunk) { this.writes.push(chunk); } };
}

test('cell-ID constants are exported with expected values', () => {
  assert.equal(EMPTY, 0);
  assert.equal(BODY, 1);
  assert.equal(ACCENT, 2);
  assert.equal(DARK, 3);
  assert.equal(ACCENT_NARROW, 4);
  assert.equal(DARK_NARROW, 5);
  assert.equal(ACCENT_NARROW_RIGHT, 6);
  assert.equal(DARK_NARROW_RIGHT, 7);
  assert.equal(EYE_DARK_LEFT, 8);
  assert.equal(EYE_DARK_RIGHT, 9);
  assert.equal(EYE_LIGHT_LEFT, 10);
  assert.equal(EYE_LIGHT_RIGHT, 11);
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

import { blink, bob, wiggle, walk } from '../src/animation.js';
import { generateClingon } from '../src/index.js';

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
