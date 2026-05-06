#!/usr/bin/env node

import { runCli } from '../src/cli.js';

runCli(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env
});
