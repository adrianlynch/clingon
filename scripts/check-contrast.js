// WCAG 1.4.11 (Non-text Contrast) audit for clingon palettes.
//
// Threshold: 3:1 between adjacent graphical elements. We check three
// scenarios per palette:
//   1. each cell color against the intended terminal background
//      (dark terminal #1f2328 for default, white #ffffff for --light)
//   2. body vs accent (adjacent in eye rows)
//   3. body vs dark   (adjacent at body↔outline boundary)
//
// A FAIL means a creature rendered with that palette has a part that
// fades into the background or into a neighboring cell.

import { generateClingon } from '../src/index.js';

const DARK_TERMINAL_BG = '#1f2328';
const LIGHT_TERMINAL_BG = '#ffffff';
const WCAG_NON_TEXT_MIN = 3.0;

const sampleNames = [
  'orlando-reginald-morris-junior',
  'mabel-waffles-wigglesworth-tiny',
  'otto-beans-moonbeam-excellent',
  'cosmo-pickle-toebean-cosmic',
  'leonard-pickle-whiskerton-golden',
  'rupert-crumpet-brisket-secret'
];

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(hexA, hexB) {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function fmt(ratio) {
  const passes = ratio >= WCAG_NON_TEXT_MIN;
  const mark = passes ? '✓' : '✗';
  return `${mark} ${ratio.toFixed(2)}:1`;
}

function auditPalette(label, palette, bg) {
  const pairs = [
    [`body   vs bg     `, palette.body, bg],
    [`accent vs bg     `, palette.accent, bg],
    [`dark   vs bg     `, palette.dark, bg],
    [`body   vs accent `, palette.body, palette.accent],
    [`body   vs dark   `, palette.body, palette.dark],
    [`accent vs dark   `, palette.accent, palette.dark]
  ];
  console.log(`\n${label}`);
  console.log(`  body=${palette.body}  accent=${palette.accent}  dark=${palette.dark}  bg=${bg}`);
  let fails = 0;
  for (const [name, a, b] of pairs) {
    const r = contrast(a, b);
    const passes = r >= WCAG_NON_TEXT_MIN;
    if (!passes) fails += 1;
    console.log(`  ${name} ${fmt(r)}`);
  }
  return fails;
}

let totalFails = 0;
let totalChecks = 0;

for (const name of sampleNames) {
  const dark = generateClingon({ name, color: false });
  const light = generateClingon({ name, color: false, lightMode: true });
  const failsDark = auditPalette(`${name}  (default on dark terminal)`, dark.palette, DARK_TERMINAL_BG);
  const failsLight = auditPalette(`${name}  (--light on white terminal)`, light.palette, LIGHT_TERMINAL_BG);
  totalFails += failsDark + failsLight;
  totalChecks += 12;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${totalChecks - totalFails}/${totalChecks} pass WCAG 1.4.11 (3:1 non-text contrast)`);
if (totalFails > 0) {
  console.log(`${totalFails} pair(s) fall below 3:1 — those parts of the creature blend into their background or neighbor.`);
} else {
  console.log('All palette pairs pass WCAG 1.4.11.');
}
