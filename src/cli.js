import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { generateClingon, snippetFor } from './index.js';

const MAX_INFO_LINES = 5;

const HELP = `clingon

Usage:
  clingon [options]

Options:
      --with-name <name>
                    Regenerate a specific clingon name
      --name        Show the clingon name beside the art
  -r, --recolor     Keep the shape from --with-name but choose new colors
      --large         Render the largest clingon
      --small         Render a smaller clingon
      --tiny          Render the tiniest clingon
      --size <size>   Render size: tiny, small, normal, or large
  -s, --script        Print the JavaScript needed to recreate the clingon
  -j, --json          Print JSON data instead of terminal art
      --welcome       Show a time-aware greeting beside the clingon
      --message <msg> Show a custom message beside the clingon
      --date          Show today's date beside the clingon
      --cwd           Show the current directory beside the clingon
      --git           Show the current git branch beside the clingon
      --inline        Render a compact single-line glyph (one character per cell).
                      Suitable for statuslines, prompts, and tmux status bars.
      --animate [list]  Animate the creature in place. Loops until Ctrl-C.
                        Optional comma-separated list of behaviors:
                        idle, blink, look, wiggle, walk.
                        Default: idle,blink,look,wiggle.
      --in-sequence     Play the listed behaviors in order, looping.
                        Without this flag, behaviors layer on one timeline
                        as random events.
      --fps <n>         Animation frames per second (1-30). Default 8.
      --seconds <n>     Run animation for N seconds then exit.
      --pad <n>       Add padding around terminal output
      --pad-h <n>     Add spaces before each terminal output line
      --pad-v <n>     Add blank lines before and after terminal output
      --no-color      Render without ANSI color
  -h, --help          Show help
  -v, --version       Show version

Examples:
  Add clingon to your terminal startup:
    clingon --size small --welcome --name --date --cwd --git --pad=2
`;

export async function runCli(args, io) {
  try {
    const options = parseArgs(args);

    if (options.help) {
      io.stdout.write(HELP);
      return;
    }

    if (options.version) {
      io.stdout.write('0.2.0\n');
      return;
    }

    if (options.animate) validateAnimateConflicts(options);
    if (options.inline) validateInlineConflicts(options);

    const useColor = options.color && shouldUseColor(io);
    options.useColor = useColor;

    if (options.animate) {
      const moveList = options.animateMoves ?? ['idle', 'blink', 'look', 'wiggle'];
      const mode = options.animateInSequence ? 'sequence' : 'parallel';

      const { animateClingon } = await import('./animation.js');
      const controller = new AbortController();
      const onSigint = () => controller.abort();
      process.on('SIGINT', onSigint);
      try {
        const handle = animateClingon({
          name: options.inputName,
          size: options.size,
          color: useColor,
          frames: moveList,
          mode,
          fps: options.fps,
          seconds: options.seconds,
          stream: io.stdout,
          signal: controller.signal
        });
        await handle.done;
      } finally {
        process.off('SIGINT', onSigint);
      }
      return;
    }

    const clingon = generateClingon({
      name: options.inputName,
      recolor: options.recolor,
      size: options.size,
      color: useColor
    });

    if (options.json) {
      io.stdout.write(`${JSON.stringify(toJson(clingon), null, 2)}\n`);
      return;
    }

    if (options.inline) {
      writeInline(io.stdout, clingon, options);
      return;
    }

    writeTerminalOutput(io.stdout, formatTerminalOutput(clingon, options));
  } catch (error) {
    io.stderr.write(`clingon: ${error.message}\n`);
    io.stderr.write('Run `clingon --help` for usage.\n');
    process.exitCode = 1;
  }
}

function formatTerminalOutput(clingon, options) {
  const lines = formatInfoBlock(clingon.ansi.split('\n'), infoLines(options, clingon));

  if (options.script) {
    lines.push('', ...snippetFor(clingon.name, { size: clingon.size }).split('\n'));
  }

  const paddedLines = options.padH > 0
    ? lines.map((line) => `${' '.repeat(options.padH)}${line}`)
    : lines;
  const verticalPadding = Array(options.padV).fill('');

  return [
    ...verticalPadding,
    ...paddedLines,
    ...verticalPadding
  ].join('\n');
}

function writeTerminalOutput(stdout, output) {
  stdout.write(`${output}\n`);
}

function validateInlineConflicts(options) {
  if (options.animate) throw new Error('--inline cannot be combined with --animate.');
  if (options.json) throw new Error('--inline cannot be combined with --json.');
  if (options.script) throw new Error('--inline cannot be combined with --script.');
  if (options.infoItems.length > 0) {
    throw new Error('--inline cannot be combined with --welcome, --message, --date, --cwd, --git, or --name.');
  }
}

function validateAnimateConflicts(options) {
  if (options.inline) throw new Error('--animate cannot be combined with --inline.');
  if (options.json) throw new Error('--animate cannot be combined with --json.');
  if (options.script) throw new Error('--animate cannot be combined with --script.');
}

function writeInline(stdout, clingon, options) {
  const padded = options.padH > 0 ? ' '.repeat(options.padH) + clingon.inline : clingon.inline;
  if (options.padV > 0) {
    const blanks = Array(options.padV).fill('').join('\n');
    stdout.write(`${blanks}\n${padded}\n${blanks}\n`);
  } else {
    stdout.write(`${padded}\n`);
  }
}

function parseCount(value, option) {
  const count = Number.parseInt(requireValue(value, option), 10);

  if (!Number.isSafeInteger(count) || count < 0 || String(count) !== String(value)) {
    throw new Error(`${option} requires a non-negative integer.`);
  }

  return count;
}

const BUILT_IN_MOVES = ['idle', 'blink', 'look', 'wiggle', 'walk'];

function parseFps(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 30) {
    throw new Error('--fps must be an integer between 1 and 30.');
  }
  return n;
}

function parseFramesList(value) {
  if (!value) throw new Error('move list requires a comma-separated value.');
  const moves = value.split(',').map((s) => s.trim()).filter(Boolean);
  for (const m of moves) {
    if (!BUILT_IN_MOVES.includes(m)) {
      throw new Error(`Unknown move "${m}". Built-in moves: ${BUILT_IN_MOVES.join(', ')}.`);
    }
  }
  return moves;
}

function parseArgs(args) {
  const options = {
    animate: false,
    animateMoves: undefined,
    animateInSequence: false,
    color: true,
    fps: 8,
    help: false,
    inline: false,
    inputName: undefined,
    infoItems: [],
    json: false,
    padH: 0,
    padV: 0,
    recolor: false,
    script: false,
    seconds: undefined,
    size: 'normal',
    version: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--version') {
      options.version = true;
    } else if (arg === '-r' || arg === '--recolor') {
      options.recolor = true;
    } else if (arg === '-s' || arg === '--script') {
      options.script = true;
    } else if (arg === '-j' || arg === '--json') {
      options.json = true;
    } else if (arg === '-q' || arg === '--quiet' || arg === '--no-code' || arg === '--no-name') {
      // Legacy flags are accepted as no-ops so existing shell startup snippets do not fail.
    } else if (arg === '--welcome') {
      options.infoItems.push({ type: 'welcome' });
    } else if (arg === '--message') {
      index += 1;
      options.infoItems.push({ type: 'message', value: requireValue(args[index], arg) });
    } else if (arg.startsWith('--message=')) {
      options.infoItems.push({ type: 'message', value: requireValue(arg.slice('--message='.length), '--message') });
    } else if (arg === '--date') {
      options.infoItems.push({ type: 'date' });
    } else if (arg === '--cwd') {
      options.infoItems.push({ type: 'cwd' });
    } else if (arg === '--git') {
      options.infoItems.push({ type: 'git' });
    } else if (arg === '--pad') {
      index += 1;
      const padding = parseCount(args[index], arg);
      options.padH = padding;
      options.padV = padding;
    } else if (arg.startsWith('--pad=')) {
      const padding = parseCount(arg.slice('--pad='.length), '--pad');
      options.padH = padding;
      options.padV = padding;
    } else if (arg === '--pad-h') {
      index += 1;
      options.padH = parseCount(args[index], arg);
    } else if (arg.startsWith('--pad-h=')) {
      options.padH = parseCount(arg.slice('--pad-h='.length), '--pad-h');
    } else if (arg === '--pad-v') {
      index += 1;
      options.padV = parseCount(args[index], arg);
    } else if (arg.startsWith('--pad-v=')) {
      options.padV = parseCount(arg.slice('--pad-v='.length), '--pad-v');
    } else if (arg === '--large') {
      options.size = 'large';
    } else if (arg === '--small') {
      options.size = 'small';
    } else if (arg === '--tiny') {
      options.size = 'tiny';
    } else if (arg === '--size') {
      index += 1;
      options.size = requireValue(args[index], arg);
    } else if (arg.startsWith('--size=')) {
      options.size = requireValue(arg.slice('--size='.length), '--size');
    } else if (arg === '--no-color') {
      options.color = false;
    } else if (arg === '--inline') {
      options.inline = true;
    } else if (arg === '--animate') {
      options.animate = true;
      if (hasOptionalValue(args[index + 1])) {
        index += 1;
        options.animateMoves = parseFramesList(args[index]);
      }
    } else if (arg.startsWith('--animate=')) {
      options.animate = true;
      options.animateMoves = parseFramesList(arg.slice('--animate='.length));
    } else if (arg === '--in-sequence') {
      options.animateInSequence = true;
    } else if (arg === '--fps') {
      index += 1;
      options.fps = parseFps(args[index]);
    } else if (arg.startsWith('--fps=')) {
      options.fps = parseFps(arg.slice('--fps='.length));
    } else if (arg === '--seconds') {
      index += 1;
      options.seconds = parseCount(args[index], arg);
    } else if (arg.startsWith('--seconds=')) {
      options.seconds = parseCount(arg.slice('--seconds='.length), '--seconds');
    } else if (arg === '-n' || arg === '--name') {
      options.infoItems.push({ type: 'name' });
    } else if (arg === '--with-name') {
      index += 1;
      options.inputName = requireValue(args[index], arg);
    } else if (arg.startsWith('--with-name=')) {
      options.inputName = requireValue(arg.slice('--with-name='.length), '--with-name');
    } else if (arg === '-c' || arg === '--code') {
      if (hasOptionalValue(args[index + 1])) {
        index += 1;
      }
    } else if (arg.startsWith('--name=')) {
      // Legacy value form is accepted as a no-op. Use --with-name to regenerate.
    } else if (arg.startsWith('--code=')) {
      // Legacy option is accepted as a no-op.
    } else if (!arg.startsWith('-')) {
      // Legacy positional values are accepted as no-ops.
    } else {
      throw new Error(`Unknown option "${arg}".`);
    }
  }

  if (options.recolor && !options.inputName) {
    throw new Error('--recolor requires --with-name so the shape can be preserved.');
  }

  return options;
}

function infoLines(options, clingon) {
  const lines = [];

  for (const item of options.infoItems) {
    if (item.type === 'name') {
      lines.push(clingon.name);
    } else if (item.type === 'welcome') {
      lines.push(styleWelcome(randomGreeting(new Date()), clingon, options));
    } else if (item.type === 'message') {
      lines.push(...item.value.split(/\r?\n/u));
    } else if (item.type === 'date') {
      lines.push(styleDate(formatDate(new Date()), options));
    } else if (item.type === 'cwd') {
      lines.push(`~ ${basename(process.cwd()) || process.cwd()}`);
    } else if (item.type === 'git') {
      const branch = gitBranch();

      if (branch) {
        lines.push(`* ${branch}`);
      }
    }
  }

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_INFO_LINES);
}

function formatInfoBlock(artLines, details) {
  if (details.length === 0) {
    return artLines;
  }

  const artWidth = Math.max(...artLines.map((line) => visibleLength(line)));
  const height = Math.max(artLines.length, details.length);
  const firstArtRow = Math.max(0, Math.floor((height - artLines.length) / 2));
  const firstDetailRow = Math.max(0, Math.floor((height - details.length) / 2));

  return Array.from({ length: height }, (_, index) => {
    const line = artLines[index - firstArtRow] ?? '';
    const detail = details[index - firstDetailRow];

    if (!detail) {
      return line;
    }

    return `${padVisibleEnd(line, artWidth)}  ${detail}`;
  });
}

function padVisibleEnd(value, width) {
  return `${value}${' '.repeat(Math.max(0, width - visibleLength(value)))}`;
}

function visibleLength(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '').length;
}

function randomGreeting(date) {
  const greetings = greetingSet(date.getHours());
  const index = Math.floor(Math.random() * greetings.length);

  return greetings[index];
}

function greetingSet(hour) {
  if (hour < 12) {
    return ['Good morning', 'Buenos dias', 'Ohayo'];
  }

  if (hour < 18) {
    return ['Good afternoon', 'Buenas tardes', 'Konnichiwa'];
  }

  return ['Good evening', 'Buenas noches', 'Konbanwa'];
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function styleWelcome(value, clingon, options) {
  if (!options.useColor) {
    return value;
  }

  return `\u001b[1m${ansiColor(clingon.palette.body)}${value}\u001b[0m`;
}

function styleDate(value, options) {
  if (!options.useColor) {
    return value;
  }

  return `\u001b[90m${value}\u001b[0m`;
}

function ansiColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\u001b[38;2;${r};${g};${b}m`;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

function gitBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function hasOptionalValue(value) {
  return Boolean(value && !value.startsWith('-'));
}

function requireValue(value, option) {
  if (!value || value.startsWith('-')) {
    throw new Error(`${option} requires a value.`);
  }

  return value;
}

function shouldUseColor(io) {
  return io.env.NO_COLOR === undefined;
}

function toJson(clingon) {
  return {
    name: clingon.name,
    code: clingon.code,
    size: clingon.size,
    palette: clingon.palette,
    pixels: clingon.pixels,
    text: clingon.text
  };
}
