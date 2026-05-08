import { writeFileSync } from 'node:fs';
import { generateClingon, composeParallel, seedFromClingon } from '../src/index.js';

const CELL = 16;
const CARD_FILL = '#f6f8fa';
const TERMINAL_FILL = '#ffffff';
const BORDER = '#d0d7de';
const TEXT = '#24292f';
const MUTED = '#6e7781';

const characterExamples = [
  {
    file: 'assets/orlando-reginald-morris-junior.svg',
    title: 'orlando-reginald-morris-junior',
    name: 'orlando-reginald-morris-junior'
  },
  {
    file: 'assets/otto-beans-moonbeam-excellent.svg',
    title: 'otto-beans-moonbeam-excellent',
    name: 'otto-beans-moonbeam-excellent'
  },
  {
    file: 'assets/mabel-waffles-wigglesworth-tiny.svg',
    title: 'mabel-waffles-wigglesworth-tiny',
    name: 'mabel-waffles-wigglesworth-tiny',
    size: 'tiny'
  },
  {
    file: 'assets/cosmo-pickle-toebean-cosmic.svg',
    title: 'cosmo-pickle-toebean-cosmic',
    name: 'cosmo-pickle-toebean-cosmic',
    size: 'tiny'
  },
  {
    file: 'assets/orlando-reginald-morris-junior-large.svg',
    title: 'large',
    name: 'orlando-reginald-morris-junior',
    size: 'large'
  },
  {
    file: 'assets/orlando-reginald-morris-junior-normal.svg',
    title: 'normal',
    name: 'orlando-reginald-morris-junior'
  },
  {
    file: 'assets/orlando-reginald-morris-junior-small.svg',
    title: 'small',
    name: 'orlando-reginald-morris-junior',
    size: 'small'
  },
  {
    file: 'assets/orlando-reginald-morris-junior-tiny.svg',
    title: 'tiny',
    name: 'orlando-reginald-morris-junior',
    size: 'tiny'
  }
];

const examples = [
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
    title: '--welcome --cwd --pad=1',
    name: 'otto-beans-moonbeam-excellent',
    size: 'tiny',
    pad: 1,
    details: ({ palette }) => [
      { text: 'Konbanwa', fill: palette.body, weight: '700' },
      { text: '~ clingon', fill: TEXT }
    ]
  }
];

const animatedExamples = [
  {
    file: 'assets/example-animated-welcome-context.svg',
    title: '--animate --welcome --date --cwd --git',
    name: 'orlando-reginald-morris-junior',
    size: 'tiny',
    details: ({ palette }) => [
      { text: 'Good evening', fill: palette.body, weight: '700' },
      { text: 'Wed, May 6, 2026', fill: MUTED },
      { text: '~ clingon', fill: TEXT },
      { text: '* main', fill: TEXT }
    ]
  }
];

for (const example of characterExamples) {
  writeFileSync(example.file, renderCharacterExample(example));
}

for (const example of examples) {
  writeFileSync(example.file, renderExample(example));
}

for (const example of animatedExamples) {
  writeFileSync(example.file, renderAnimatedExample(example));
}

function renderCharacterExample(example) {
  const clingon = generateClingon({
    name: example.name,
    size: example.size,
    color: false
  });
  const width = 300;
  const height = 210;
  const terminalX = 20;
  const terminalY = 18;
  const terminalWidth = width - 40;
  const terminalHeight = 146;
  const artWidth = clingon.pixels[0].length * CELL;
  const artHeight = clingon.pixels.length * CELL;
  const artX = terminalX + Math.floor((terminalWidth - artWidth) / 2);
  const artY = terminalY + Math.floor((terminalHeight - artHeight) / 2);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(example.title)} clingon">`,
    `  <rect width="${width}" height="${height}" rx="8" fill="${CARD_FILL}"/>`,
    `  <rect x="${terminalX}" y="${terminalY}" width="${terminalWidth}" height="${terminalHeight}" rx="6" fill="${TERMINAL_FILL}" stroke="${BORDER}"/>`,
    ...renderPixels(clingon, artX, artY),
    renderText({
      x: width / 2,
      y: 194,
      text: example.title,
      fill: TEXT,
      anchor: 'middle',
      size: 13
    }),
    '</svg>'
  ].join('\n');
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

function renderAnimatedExample(example) {
  const clingon = generateClingon({ name: example.name, size: example.size, color: false });
  const seed = seedFromClingon(clingon);
  const cycleLength = 64;
  const fps = 8;
  const frames = composeParallel(
    clingon.pixels,
    ['idle', 'blink', 'look', 'wiggle', 'walk'],
    cycleLength,
    seed
  );
  const totalDur = (cycleLength / fps).toFixed(2);

  const hasDetails = typeof example.details === 'function';
  const details = hasDetails ? example.details(clingon).slice(0, 5) : [];
  const pad = example.pad ?? 0;

  const artWidth = clingon.pixels[0].length * CELL;
  const artHeight = clingon.pixels.length * CELL;

  const width = hasDetails ? 430 : 300;
  const height = hasDetails ? 190 : 210;
  const terminalX = 20;
  const terminalY = 18;
  const terminalWidth = width - 40;
  const terminalHeight = hasDetails ? 132 : 146;
  const titleY = hasDetails ? 174 : 194;

  const artX = hasDetails
    ? terminalX + 22 + pad * 12 + 8
    : terminalX + Math.floor((terminalWidth - artWidth) / 2);
  const artY = terminalY + Math.floor((terminalHeight - artHeight) / 2);
  const detailX = artX + artWidth + 34;
  const firstDetailY = terminalY + Math.floor((terminalHeight - details.length * 20) / 2) + 14;

  // Deduplicate frames so identical pixel grids share a single SVG group.
  const uniqueFrames = new Map();
  frames.forEach((frame, i) => {
    const key = JSON.stringify(frame.pixels);
    if (!uniqueFrames.has(key)) {
      uniqueFrames.set(key, {
        rects: renderPixels({ pixels: frame.pixels, palette: clingon.palette }, artX, artY),
        indexes: new Set()
      });
    }
    uniqueFrames.get(key).indexes.add(i);
  });

  const frameGroups = [...uniqueFrames.values()].map(({ rects, indexes }) => {
    const values = Array.from({ length: cycleLength + 1 }, (_, j) => (indexes.has(j % cycleLength) ? '1' : '0')).join(';');
    const keyTimes = Array.from({ length: cycleLength + 1 }, (_, j) => (j / cycleLength).toFixed(4)).join(';');
    return [
      '  <g opacity="0">',
      `    <animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${totalDur}s" repeatCount="indefinite" calcMode="discrete"/>`,
      ...rects.map((r) => `  ${r}`),
      '  </g>'
    ].join('\n');
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="animated ${escapeText(example.title)} clingon">`,
    `  <rect width="${width}" height="${height}" rx="8" fill="${CARD_FILL}"/>`,
    `  <rect x="${terminalX}" y="${terminalY}" width="${terminalWidth}" height="${terminalHeight}" rx="6" fill="${TERMINAL_FILL}" stroke="${BORDER}"/>`,
    ...frameGroups,
    ...details.map((detail, index) => renderText({
      x: detailX,
      y: firstDetailY + index * 20,
      text: detail.text,
      fill: detail.fill,
      weight: detail.weight
    })),
    renderText({
      x: width / 2,
      y: titleY,
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
