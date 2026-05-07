// Standalone example: register a custom move and animate.
// Run with: node examples/custom-moves.js
//
// In your own project, install with `npm i @adrianlynch/clingon` and import
// from '@adrianlynch/clingon'. Here we use a relative path so the example
// runs from a clone of this repo.
import {
  animateClingon, defineMove,
  blink, bob
} from '../src/index.js';

defineMove('peek', {
  sequence: (basePixels) => [
    { pixels: bob(basePixels, 1), duration: 6 },
    { pixels: bob(basePixels, 0), duration: 3 },
    { pixels: blink(bob(basePixels, 0)), duration: 1 },
    { pixels: bob(basePixels, 0), duration: 4 }
  ]
});

const handle = animateClingon({
  name: 'orlando-reginald-morris-junior',
  size: 'tiny',
  frames: ['peek'],
  mode: 'sequence',
  fps: 8,
  seconds: 5
});

await handle.done;
