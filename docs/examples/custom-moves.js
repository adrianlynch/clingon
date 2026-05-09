// Standalone example: register a custom move and animate.
// Run with: node docs/examples/custom-moves.js
//
// In your own project, install with `npm i @adrianlynch/clingon` and import
// from '@adrianlynch/clingon'. Here we use a relative path so the example
// runs from a clone of this repo.
import {
  animateClingon, defineMove,
  blink, bob, frame, mapCells
} from '../../src/index.js';

// "Peek": rise up briefly, blink, then settle. Built from the bob and blink
// mutators with frame(pixels, duration) entries.
defineMove('peek', {
  sequence: (basePixels) => [
    frame(bob(basePixels, 1), 6),
    frame(bob(basePixels, 0), 3),
    frame(blink(bob(basePixels, 0)), 1),
    frame(bob(basePixels, 0), 4)
  ]
});

// "Wink": close one eye (left only) using mapCells with stable kind names.
defineMove('wink', {
  sequence: (basePixels) => {
    const winked = mapCells(basePixels, ({ kind }) => (
      kind === 'eye-dark-left' || kind === 'eye-light-left' ? 'body' : null
    ));
    return [
      frame(basePixels, 8),
      frame(winked, 2),
      frame(basePixels, 6)
    ];
  }
});

const handle = animateClingon({
  name: 'orlando-reginald-morris-junior',
  size: 'tiny',
  frames: ['peek', 'wink'],
  mode: 'sequence',
  fps: 8,
  seconds: 6
});

await handle.done;
