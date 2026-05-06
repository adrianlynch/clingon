import { generateClingon, snippetFor } from './index.js';

const HELP = `clingon

Usage:
  clingon [options]

Options:
  -c, --code <code>   Regenerate a specific clingon name/code
  -r, --recolor       Keep the shape from --code but choose new colors
      --small         Render a smaller clingon
      --tiny          Render the tiniest clingon
      --size <size>   Render size: tiny, small, or normal
  -s, --script        Print the JavaScript needed to recreate the clingon
  -j, --json          Print JSON data instead of terminal art
  -q, --quiet         Print only the clingon art
      --no-code       Alias for --quiet
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
      code: options.code,
      recolor: options.recolor,
      size: options.size,
      color: options.color && shouldUseColor(io)
    });

    if (options.json) {
      io.stdout.write(`${JSON.stringify(toJson(clingon), null, 2)}\n`);
      return;
    }

    io.stdout.write(`${clingon.ansi}\n\n`);
    if (!options.quiet) {
      io.stdout.write(`code: ${clingon.code}\n`);
    }

    if (options.script) {
      io.stdout.write('\n');
      io.stdout.write(`${snippetFor(clingon.code, { size: clingon.size })}\n`);
    }
  } catch (error) {
    io.stderr.write(`clingon: ${error.message}\n`);
    io.stderr.write('Run `clingon --help` for usage.\n');
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  const options = {
    color: true,
    code: undefined,
    help: false,
    json: false,
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
    } else if (arg === '-q' || arg === '--quiet' || arg === '--no-code') {
      options.quiet = true;
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
    } else if (arg === '-c' || arg === '--code') {
      index += 1;
      options.code = requireValue(args[index], arg);
    } else if (arg.startsWith('--code=')) {
      options.code = requireValue(arg.slice('--code='.length), '--code');
    } else {
      throw new Error(`Unknown option "${arg}".`);
    }
  }

  if (options.recolor && !options.code) {
    throw new Error('--recolor requires --code so the shape can be preserved.');
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
    code: clingon.code,
    size: clingon.size,
    palette: clingon.palette,
    pixels: clingon.pixels,
    text: clingon.text
  };
}
