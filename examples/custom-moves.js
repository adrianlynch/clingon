// Example: custom move file.
// Load with: clingon --animate --load ./examples/custom-moves.js --moves peek --in-sequence
//
// In an installed package, you'd import from '@adrianlynch/clingon'. Here we
// use a relative path so the example runs from a local clone.
import { defineMove, blink, bob } from '../src/index.js';

defineMove('peek', {
  sequence: (basePixels) => [
    { pixels: bob(basePixels, 1), duration: 6 },
    { pixels: bob(basePixels, 0), duration: 3 },
    { pixels: blink(bob(basePixels, 0)), duration: 1 },
    { pixels: bob(basePixels, 0), duration: 4 }
  ]
});
