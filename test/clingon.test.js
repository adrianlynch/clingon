import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateClingon, parseCode, renderClingon } from '../src/index.js';

test('generates deterministic clingons from a code', () => {
  const first = generateClingon({ code: 'clg-00000rs-00000rt', color: false });
  const second = generateClingon({ code: first.code, color: false });

  assert.equal(second.code, first.code);
  assert.equal(second.text, first.text);
  assert.equal(second.ansi, first.ansi);
});

test('recolor keeps shape and changes the code palette segment', () => {
  const original = generateClingon({ code: 'clg-00000rs-00000rt', color: false });
  const recolored = generateClingon({ code: original.code, recolor: true, color: false });

  assert.equal(recolored.shapeSeed, original.shapeSeed);
  assert.notEqual(recolored.paletteSeed, original.paletteSeed);
  assert.equal(recolored.text, original.text);
  assert.notEqual(recolored.code, original.code);
});

test('parses prefixed code variants', () => {
  assert.deepEqual(parseCode('clg_00000rs.00000rt'), {
    shapeSeed: 1000,
    paletteSeed: 1001
  });
});

test('renderClingon returns ansi output for import convenience', () => {
  assert.match(renderClingon({ code: 'clg-00000rs-00000rt', color: false }), /\[\]/);
});

test('generates a smaller deterministic clingon', () => {
  const small = generateClingon({ code: 'clg-00000rs-00000rt', size: 'small', color: false });
  const normal = generateClingon({ code: 'clg-00000rs-00000rt', color: false });

  assert.equal(small.size, 'small');
  assert.equal(small.pixels.length, 6);
  assert.equal(small.pixels[0].length, 7);
  assert.notEqual(small.text, normal.text);
  assert.equal(generateClingon({ code: small.code, size: 'small', color: false }).text, small.text);
});

test('small clingons vary shape between seeds', () => {
  const shapes = new Set([
    'clg-00000rs-00000rt',
    'clg-00000ru-00000rt',
    'clg-00000rv-00000rt',
    'clg-00000rw-00000rt'
  ].map((code) => generateClingon({ code, size: 'small', color: false }).text));

  assert.ok(shapes.size > 2);
});
