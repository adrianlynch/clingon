#!/usr/bin/env node

import { runCli } from '../src/cli.js';

process.on('SIGINT', () => {
  process.stdout.write('[?25h\n');
  process.exit(0);
});

runCli(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env
});
