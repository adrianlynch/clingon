import { writeFileSync } from 'node:fs';
import { generateClingon } from '../src/index.js';

const CELL = 16;
const CARD_FILL = '#f6f8fa';
const TERMINAL_FILL = '#ffffff';
const BORDER = '#d0d7de';
const TEXT = '#24292f';
const MUTED = '#6e7781';

const examples = [
  {
    file: 'assets/example-welcome-context.svg',
    title: 'welcome + date + cwd + git',
    name: 'orlando-reginald-morris-junior',
    size: 'tiny',
    details: ({ palette }) => [
      { text: 'Good evening', fill: palette.body, weight: '700' },
      { text: 'Wed, May 6, 2026', fill: MUTED },
      { text: '~ clingon', fill: TEXT },
      { text: '* main', fill: TEXT }
    ]
  },
  {
    file: 'assets/example-message.svg',
    title: '--message "Ready"',
    name: 'mabel-waffles-wigglesworth-tiny',
    size: 'tiny',
    details: () => [
      { text: 'Ready', fill: TEXT }
    ]
  },
  {
    file: 'assets/example-padded-startup.svg',
    title: '--pad=1',
    name: 'otto-beans-moonbeam-excellent',
    size: 'tiny',
    pad: 1,
    details: ({ palette }) => [
      { text: 'Konbanwa', fill: palette.body, weight: '700' },
      { text: '~ clingon', fill: TEXT }
    ]
  }
];

for (const example of examples) {
  writeFileSync(example.file, renderExample(example));
}

function renderExample(example) {
  const clingon = generateClingon({
    name: example.name,
    size: example.size,
    color: false
  });
  const details = example.details(clingon).slice(0, 5);
  const pad = example.pad ?? 0;
  const contentPad = 22 + pad * 12;
  const artWidth = clingon.pixels[0].length * CELL;
  const artHeight = clingon.pixels.length * CELL;
  const width = 430;
  const height = 190;
  const terminalX = 20;
  const terminalY = 18;
  const terminalWidth = width - 40;
  const terminalHeight = 132;
  const artX = terminalX + contentPad + 8;
  const artY = terminalY + Math.floor((terminalHeight - artHeight) / 2);
  const detailX = artX + artWidth + 34;
  const firstDetailY = terminalY + Math.floor((terminalHeight - details.length * 20) / 2) + 14;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(example.title)} clingon option example">`,
    `  <rect width="${width}" height="${height}" rx="8" fill="${CARD_FILL}"/>`,
    `  <rect x="${terminalX}" y="${terminalY}" width="${terminalWidth}" height="${terminalHeight}" rx="6" fill="${TERMINAL_FILL}" stroke="${BORDER}"/>`,
    ...renderPixels(clingon, artX, artY),
    ...details.map((detail, index) => renderText({
      x: detailX,
      y: firstDetailY + index * 20,
      text: detail.text,
      fill: detail.fill,
      weight: detail.weight
    })),
    renderText({
      x: width / 2,
      y: 174,
      text: example.title,
      fill: TEXT,
      anchor: 'middle',
      size: 13
    }),
    '</svg>'
  ].join('\n');
}

function renderPixels(clingon, startX, startY) {
  const rows = [];

  clingon.pixels.forEach((row, y) => {
    row.forEach((cell, x) => {
      rows.push(...renderCell(cell, clingon.palette, startX + x * CELL, startY + y * CELL));
    });
  });

  return rows;
}

function renderCell(cell, palette, x, y) {
  if (cell === 0) {
    return [];
  }

  if (cell === 4 || cell === 5) {
    return [rect(x, y, CELL / 2, CELL, fillFor(cell, palette))];
  }

  if (cell === 6 || cell === 7) {
    return [rect(x + CELL / 2, y, CELL / 2, CELL, fillFor(cell, palette))];
  }

  if (cell === 8 || cell === 10) {
    return [
      rect(x, y, CELL / 2, CELL, detailFill(cell, palette)),
      rect(x + CELL / 2, y, CELL / 2, CELL, palette.body)
    ];
  }

  if (cell === 9 || cell === 11) {
    return [
      rect(x, y, CELL / 2, CELL, palette.body),
      rect(x + CELL / 2, y, CELL / 2, CELL, detailFill(cell, palette))
    ];
  }

  return [rect(x, y, CELL, CELL, fillFor(cell, palette))];
}

function fillFor(cell, palette) {
  if (cell === 1) {
    return palette.body;
  }

  if (cell === 2 || cell === 4 || cell === 6) {
    return palette.accent;
  }

  return palette.dark;
}

function detailFill(cell, palette) {
  return cell === 10 || cell === 11 ? palette.accent : palette.dark;
}

function rect(x, y, width, height, fill) {
  return `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
}

function renderText({ x, y, text, fill, weight = '400', anchor = 'start', size = 14 }) {
  return `  <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeText(text)}</text>`;
}

function escapeText(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
