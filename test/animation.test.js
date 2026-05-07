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
