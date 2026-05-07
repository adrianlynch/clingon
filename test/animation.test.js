import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY, BODY, ACCENT, DARK,
  ACCENT_NARROW, DARK_NARROW,
  ACCENT_NARROW_RIGHT, DARK_NARROW_RIGHT,
  EYE_DARK_LEFT, EYE_DARK_RIGHT,
  EYE_LIGHT_LEFT, EYE_LIGHT_RIGHT
} from '../src/index.js';

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
