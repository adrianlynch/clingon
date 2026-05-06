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
    paletteSeed: 1001,
    format: 'classic'
  });
});

test('generates deterministic named clingons by default', () => {
  const clingon = generateClingon({ color: false });
  const regenerated = generateClingon({ code: clingon.code, color: false });

  assert.match(clingon.code, /^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/);
  assert.equal(regenerated.text, clingon.text);
  assert.equal(regenerated.code, clingon.code);
});

test('parses readable names as clingon codes', () => {
  const first = generateClingon({ code: 'orlando-reginald-morris-junior', color: false });
  const second = generateClingon({ code: first.code, color: false });

  assert.equal(first.code, 'orlando-reginald-morris-junior');
  assert.equal(second.text, first.text);
});

test('recoloring a named clingon preserves shape words', () => {
  const original = generateClingon({ code: 'orlando-reginald-morris-junior', color: false });
  const recolored = generateClingon({ code: original.code, recolor: true, color: false });
  const originalWords = original.code.split('-');
  const recoloredWords = recolored.code.split('-');

  assert.equal(recoloredWords[0], originalWords[0]);
  assert.equal(recoloredWords[2], originalWords[2]);
  assert.equal(recolored.text, original.text);
  assert.notEqual(recolored.code, original.code);
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

test('generates a tiny five-line clingon', () => {
  const tiny = generateClingon({
    code: 'orlando-reginald-morris-junior',
    size: 'tiny',
    color: false
  });

  assert.equal(tiny.size, 'tiny');
  assert.equal(tiny.pixels.length, 5);
  assert.equal(tiny.pixels[0].length, 7);
  assert.equal(tiny.text.split('\n').length, 5);
  assert.equal(generateClingon({ code: tiny.code, size: 'tiny', color: false }).text, tiny.text);
});

test('tiny clingons vary shape between seeds', () => {
  const shapes = new Set([
    'orlando-reginald-morris-junior',
    'mabel-waffles-wigglesworth-tiny',
    'otto-beans-moonbeam-excellent',
    'cosmo-pickle-toebean-cosmic'
  ].map((code) => generateClingon({ code, size: 'tiny', color: false }).text));

  assert.ok(shapes.size > 2);
});

test('compact clingons can render one-character details in text mode', () => {
  const details = [
    generateClingon({ code: 'orlando-reginald-morris-junior', color: false }).text,
    generateClingon({ code: 'orlando-reginald-morris-junior', size: 'small', color: false }).text,
    generateClingon({ code: 'mabel-waffles-wigglesworth-tiny', size: 'tiny', color: false }).text,
    generateClingon({ code: 'cosmo-pickle-toebean-cosmic', size: 'tiny', color: false }).text
  ].join('\n');

  assert.match(details, /[#.] /);
});

test('narrow details render as one visible block in ansi mode', () => {
  const tiny = generateClingon({
    code: 'mabel-waffles-wigglesworth-tiny',
    size: 'tiny'
  });

  assert.match(tiny.ansi, /█ \u001b\[0m/);
});
