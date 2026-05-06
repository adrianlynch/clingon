import { generateClingon, snippetFor } from './index.js';

const HELP = `clingon

Usage:
  clingon [options]

Options:
  -n, --name <name>   Regenerate a specific clingon name
  -r, --recolor       Keep the shape from --name but choose new colors
      --small         Render a smaller clingon
      --tiny          Render the tiniest clingon
      --size <size>   Render size: tiny, small, or normal
  -s, --script        Print the JavaScript needed to recreate the clingon
  -j, --json          Print JSON data instead of terminal art
  -q, --quiet         Print only the clingon art
      --pad <n>       Add padding around terminal output
      --pad-h <n>     Add spaces before each terminal output line
      --pad-v <n>     Add blank lines before and after terminal output
      --no-name       Alias for --quiet
      --no-color      Render without ANSI color
  -h, --help          Show help
  -v, --version       Show version
`;

export function runCli(args, io) {
  try {
    const options = parseArgs(args);

    if (options.help) {
      io.stdout.write(HELP);
      return;
    }

    if (options.version) {
      io.stdout.write('0.1.0\n');
      return;
    }

    const clingon = generateClingon({
      name: options.name,
      recolor: options.recolor,
      size: options.size,
      color: options.color && shouldUseColor(io)
    });

    if (options.json) {
      io.stdout.write(`${JSON.stringify(toJson(clingon), null, 2)}\n`);
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
  const lines = clingon.ansi.split('\n');

  if (!options.quiet) {
    lines.push('', `name: ${clingon.name}`);
  }

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

function parseCount(value, option) {
  const count = Number.parseInt(requireValue(value, option), 10);

  if (!Number.isSafeInteger(count) || count < 0 || String(count) !== String(value)) {
    throw new Error(`${option} requires a non-negative integer.`);
  }

  return count;
}

function parseArgs(args) {
  const options = {
    color: true,
    name: undefined,
    help: false,
    json: false,
    padH: 0,
    padV: 0,
    quiet: false,
    recolor: false,
    script: false,
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
    } else if (arg === '-q' || arg === '--quiet' || arg === '--no-name' || arg === '--no-code') {
      options.quiet = true;
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
    } else if (arg === '-n' || arg === '--name' || arg === '-c' || arg === '--code') {
      index += 1;
      options.name = requireValue(args[index], arg);
    } else if (arg.startsWith('--name=')) {
      options.name = requireValue(arg.slice('--name='.length), '--name');
    } else if (arg.startsWith('--code=')) {
      options.name = requireValue(arg.slice('--code='.length), '--code');
    } else {
      throw new Error(`Unknown option "${arg}".`);
    }
  }

  if (options.recolor && !options.name) {
    throw new Error('--recolor requires --name so the shape can be preserved.');
  }

  return options;
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
