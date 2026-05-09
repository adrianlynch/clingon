import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { runCli } from '../src/cli.js';
import { generateClingon, parseCode, renderClingon } from '../src/index.js';

// Resolve the values --cwd and --git would print, regardless of where tests run.
const CWD_NAME = basename(process.cwd());
const GIT_BRANCH = (() => {
  try {
    return execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
})();

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
  const regenerated = generateClingon({ name: clingon.name, color: false });

  assert.match(clingon.code, /^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/);
  assert.equal(clingon.name, clingon.code);
  assert.equal(regenerated.text, clingon.text);
  assert.equal(regenerated.code, clingon.code);
});

test('parses readable names as clingon names', () => {
  const first = generateClingon({ name: 'orlando-reginald-morris-junior', color: false });
  const second = generateClingon({ name: first.name, color: false });

  assert.equal(first.code, 'orlando-reginald-morris-junior');
  assert.equal(first.name, 'orlando-reginald-morris-junior');
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
  assert.match(renderClingon({ name: 'clg-00000rs-00000rt', color: false }), /\[\]/);
});

test('generates deterministic clingons at the configured sizes', () => {
  const large = generateClingon({ code: 'clg-00000rs-00000rt', size: 'large', color: false });
  const normal = generateClingon({ code: 'clg-00000rs-00000rt', color: false });
  const small = generateClingon({ code: 'clg-00000rs-00000rt', size: 'small', color: false });
  const tiny = generateClingon({ code: 'clg-00000rs-00000rt', size: 'tiny', color: false });

  assert.equal(large.size, 'large');
  assert.equal(large.pixels.length, 8);
  assert.equal(large.pixels[0].length, 11);
  assert.equal(normal.size, 'normal');
  assert.equal(normal.pixels.length, 6);
  assert.equal(normal.pixels[0].length, 7);
  assert.equal(small.size, 'small');
  assert.equal(small.pixels.length, 5);
  assert.equal(small.pixels[0].length, 5);
  assert.equal(tiny.size, 'tiny');
  assert.equal(tiny.pixels.length, 4);
  assert.equal(tiny.pixels[0].length, 4);
  assert.notEqual(large.text, normal.text);
  assert.notEqual(normal.text, small.text);
  assert.notEqual(small.text, tiny.text);
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

test('generates a tiny four-line clingon', () => {
  const tiny = generateClingon({
    code: 'orlando-reginald-morris-junior',
    size: 'tiny',
    color: false
  });

  assert.equal(tiny.size, 'tiny');
  assert.equal(tiny.pixels.length, 4);
  assert.equal(tiny.pixels[0].length, 4);
  assert.equal(tiny.text.split('\n').length, 4);
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

test('compact clingons can render one-character non-eye details in text mode', () => {
  const details = [
    generateClingon({ code: 'orlando-reginald-morris-junior', color: false }).text,
    generateClingon({ code: 'orlando-reginald-morris-junior', size: 'small', color: false }).text,
    generateClingon({ code: 'mabel-waffles-wigglesworth-tiny', size: 'tiny', color: false }).text,
    generateClingon({ code: 'cosmo-pickle-toebean-cosmic', size: 'tiny', color: false }).text
  ].join('\n');

  assert.match(details, /[#.] /);
});

test('eyes can render as mirrored composite paired cells', () => {
  const normal = generateClingon({ code: 'orlando-reginald-morris-junior', color: false });
  const small = generateClingon({ code: 'orlando-reginald-morris-junior', size: 'small', color: false });
  const tiny = generateClingon({ code: 'mabel-waffles-wigglesworth-tiny', size: 'tiny', color: false });
  const text = [normal.text, small.text, tiny.text].join('\n');

  assert.ok([normal, small, tiny].some((clingon) => clingon.pixels.some((row) => (
    (row.includes(8) && row.includes(9)) || (row.includes(10) && row.includes(11))
  ))));
  assert.match(text, /(\[\.|\.]|\[#|#])/);
});

test('narrow details render as one visible block in ansi mode', () => {
  const tiny = generateClingon({ code: 'cosmo-pickle-toebean-cosmic', size: 'small' });

  assert.match(tiny.ansi, /█ \u001b\[0m/);
});

test('narrow feet mirror left and right alignment', () => {
  const tiny = generateClingon({
    code: 'barnaby-fig-danderby-little',
    size: 'tiny',
    color: false
  });
  const footRow = tiny.text.split('\n').at(-1);

  assert.match(footRow, /^\s*\.+\s+\.+\s*$/);
});

test('cli default output hides the generated name', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout,
    stderr,
    env: {}
  });

  assert.match(stdout.output, /\[\]/);
  assert.doesNotMatch(stdout.output, /name:/);
  assert.equal(stderr.output, '');
});

test('cli name option displays the clingon name beside the art', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli(['--with-name', 'orlando-reginald-morris-junior', '--name', '--tiny', '--no-color'], {
    stdout,
    stderr,
    env: {}
  });

  assert.match(stdout.output, /  orlando-reginald-morris-junior/);
  assert.doesNotMatch(stdout.output, /\nname:/);
  assert.equal(stderr.output, '');
});

test('cli name option without a value displays a generated name', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli(['--name', '--tiny', '--no-color'], {
    stdout,
    stderr,
    env: {}
  });

  assert.match(stdout.output, /  [a-z]+-[a-z]+-[a-z]+-[a-z]+/);
  assert.equal(stderr.output, '');
});

test('cli padding adds horizontal and vertical spacing', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  const baseline = createWritable();

  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout: baseline,
    stderr: createWritable(),
    env: {}
  });

  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color', '--pad=1'], {
    stdout,
    stderr,
    env: {}
  });

  const lines = stdout.output.split('\n');

  assert.equal(lines[0], '');
  assert.equal(lines[1], ` ${baseline.output.split('\n')[0]}`);
  assert.equal(lines.at(-2), '');
  assert.equal(stderr.output, '');
});

test('cli directional padding can differ', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  const baseline = createWritable();

  runCli(['--with-name', 'orlando-reginald-morris-junior', '--tiny', '--no-color'], {
    stdout: baseline,
    stderr: createWritable(),
    env: {}
  });

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--pad-h=2',
    '--pad-v=1'
  ], {
    stdout,
    stderr,
    env: {}
  });

  const lines = stdout.output.split('\n');

  assert.equal(lines[0], '');
  assert.equal(lines[1], `  ${baseline.output.split('\n')[0]}`);
  assert.equal(lines.at(-2), '');
  assert.equal(stderr.output, '');
});

test('cli message renders beside the art and is vertically centered', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--message',
    'Hello there'
  ], {
    stdout,
    stderr,
    env: {}
  });

  const lines = stdout.output.trimEnd().split('\n');

  assert.equal(lines.length, 4);
  assert.doesNotMatch(lines[0], /Hello there/);
  assert.match(lines[1], /  Hello there$/);
  assert.doesNotMatch(lines[3], /Hello there/);
  assert.equal(stderr.output, '');
});

test('cli info lines are capped at five', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--message',
    'one',
    '--message',
    'two',
    '--message',
    'three',
    '--message',
    'four',
    '--message',
    'five',
    '--message',
    'six'
  ], {
    stdout,
    stderr,
    env: {}
  });

  const lines = stdout.output.trimEnd().split('\n');
  const info = lines.map((line) => line.match(/  (\w+)$/)?.[1]).filter(Boolean);

  assert.deepEqual(info, ['one', 'two', 'three', 'four', 'five']);
  assert.doesNotMatch(stdout.output, /six/);
  assert.equal(stderr.output, '');
});

test('cli label flags render in the provided order', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--git',
    '--message',
    'Ready',
    '--name',
    '--cwd'
  ], {
    stdout,
    stderr,
    env: {}
  });

  const output = stdout.output;

  assert.ok(output.indexOf(`* ${GIT_BRANCH}`) < output.indexOf('Ready'));
  assert.ok(output.indexOf('Ready') < output.indexOf('orlando-reginald-morris-junior'));
  assert.ok(output.indexOf('orlando-reginald-morris-junior') < output.indexOf(`~ ${CWD_NAME}`));
  assert.equal(stderr.output, '');
});

test('cli info lines respect output padding', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--message',
    'Hello',
    '--pad-h=2',
    '--pad-v=1'
  ], {
    stdout,
    stderr,
    env: {}
  });

  const lines = stdout.output.split('\n');

  assert.equal(lines[0], '');
  assert.match(lines[2], /^  .*  Hello$/);
  assert.equal(lines.at(-2), '');
  assert.equal(stderr.output, '');
});

test('cli optional info sources render beside the art', () => {
  const stdout = createWritable();
  const stderr = createWritable();

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--no-color',
    '--message',
    'Hi',
    '--date',
    '--cwd',
    '--git'
  ], {
    stdout,
    stderr,
    env: {}
  });

  assert.match(stdout.output, /  Hi/);
  assert.match(stdout.output, /\d{4}|,\s\d{1,2}/);
  assert.match(stdout.output, new RegExp(`  ~ ${CWD_NAME}`));
  assert.match(stdout.output, new RegExp(`  \\* ${GIT_BRANCH}`));
  assert.equal(stderr.output, '');
});

test('cli welcome and date info are styled when color is enabled', () => {
  const stdout = createWritable();
  const stderr = createWritable();
  const clingon = generateClingon({
    name: 'orlando-reginald-morris-junior',
    size: 'tiny',
    color: false
  });
  const [r, g, b] = hexToRgb(clingon.palette.body);

  runCli([
    '--with-name',
    'orlando-reginald-morris-junior',
    '--tiny',
    '--welcome',
    '--date'
  ], {
    stdout,
    stderr,
    env: {}
  });

  assert.match(stdout.output, new RegExp(`\\u001b\\[1m\\u001b\\[38;2;${r};${g};${b}m(?:Good|Buen|Ohayo|Konnichiwa|Konbanwa)`));
  assert.match(stdout.output, /\u001b\[90m.*\u001b\[0m/);
  assert.equal(stderr.output, '');
});

function createWritable() {
  return {
    output: '',
    write(chunk) {
      this.output += chunk;
    }
  };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');

  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}
