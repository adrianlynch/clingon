# @adrianlynch/clingon

Generate tiny deterministic terminal characters.

100% created by AI. Use at your own risk. Obviously.

Each clingon is created from a readable name. Save the name and you can render the same character again later, or keep the same shape and generate a new set of colors.

```txt
      ##      
  [][][]    
[][]. []. [][]
[][][][][][][]
  []# [] #[]  
  . .    . .  
```

## Screenshots

<p>
  <img src="./assets/orlando-reginald-morris-junior.svg" width="260" alt="orlando-reginald-morris-junior clingon">
  <img src="./assets/otto-beans-moonbeam-excellent.svg" width="260" alt="otto-beans-moonbeam-excellent clingon">
</p>
<p>
  <img src="./assets/mabel-waffles-wigglesworth-tiny.svg" width="260" alt="mabel-waffles-wigglesworth-tiny clingon">
  <img src="./assets/cosmo-pickle-toebean-cosmic.svg" width="260" alt="cosmo-pickle-toebean-cosmic clingon">
</p>

## Sizes

<p>
  <img src="./assets/orlando-reginald-morris-junior-large.svg" width="260" alt="large orlando-reginald-morris-junior clingon">
  <img src="./assets/orlando-reginald-morris-junior-normal.svg" width="260" alt="normal orlando-reginald-morris-junior clingon">
</p>
<p>
  <img src="./assets/orlando-reginald-morris-junior-small.svg" width="260" alt="small orlando-reginald-morris-junior clingon">
  <img src="./assets/orlando-reginald-morris-junior-tiny.svg" width="260" alt="tiny orlando-reginald-morris-junior clingon">
</p>

Terminal dimensions are `large` 22x8, `normal` 14x6, `small` 10x5, and `tiny` 8x4.

## Option Examples

<p>
  <img src="./assets/example-welcome-context.svg" width="360" alt="clingon with welcome, date, cwd, and git branch">
</p>
<p>
  <img src="./assets/example-message.svg" width="360" alt="clingon with custom message">
  <img src="./assets/example-padded-startup.svg" width="360" alt="clingon with padded startup output">
</p>

## Install

Install with Homebrew and add clingon to `~/.zshrc`:

```sh
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh
```

Install only, without changing `~/.zshrc`:

```sh
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh -s -- --no-zshrc
```

Choose the startup size:

```sh
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh -s -- --small --welcome --date --cwd --git --pad-v=1
```

Customize the generated `~/.zshrc` command by passing clingon options:

```sh
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh -s -- --tiny --message "Good morning" --date --git --pad-v=1
```

Install with npm:

```sh
npm install @adrianlynch/clingon
```

Install with Homebrew:

```sh
brew install adrianlynch/tap/clingon
```

Run it without installing:

```sh
npx @adrianlynch/clingon --small
```

## Use In zsh

Install it globally so shell startup does not need to run `npx`:

```sh
npm install -g @adrianlynch/clingon
```

Add this to `~/.zshrc` to show a random tiny clingon in each terminal:

```sh
clingon --tiny --pad=1
```

Use a saved name for the same startup clingon every time:

```sh
clingon --with-name orlando-reginald-morris-junior --tiny --pad=1
```

Show welcome text and local context beside it:

```sh
clingon --with-name orlando-reginald-morris-junior --tiny --welcome --date --cwd --git --pad=1
```

`--welcome` picks a time-aware greeting from English, Spanish, or romanized Japanese.
Clingon names are hidden by default. Add `--name` where you want the name to appear beside it.
`--pad=1` adds a blank line above and below the character plus one space of left padding.

## Animation

<p>
  <img src="./assets/orlando-reginald-morris-junior-animated.svg" width="260" alt="animated orlando-reginald-morris-junior clingon">
</p>

Animate the creature in place — bob, blink, look, wiggle, walk. Loops until Ctrl-C.

```sh
clingon --animate --tiny
clingon --animate --moves idle,blink --tiny             # only the listed behaviors
clingon --animate --moves walk --in-sequence --tiny     # play behaviors in order, looping
clingon --animate --tiny --once                         # one cycle then exit
clingon --animate --tiny --seconds 5                    # finite duration
clingon --animate --tiny --fps 12                       # speed (1-30, default 8)
clingon --animate --large --welcome --date --git --pad=1
```

Animation behaviors layer on a single timeline by default — bob runs continuously while blinks/looks/wiggles/walks fire as random events. Pass `--in-sequence` to play the listed moves one-at-a-time in a loop instead.

Animation rhythm is **deterministic from the name** — same name always produces the same pattern of bobs and blinks. Add an optional 5th word for explicit rhythm control:

```sh
clingon --animate --with-name orlando-reginald-morris-junior --tiny           # rhythm derived
clingon --animate --with-name orlando-reginald-morris-junior-bouncy --tiny    # explicit rhythm
clingon --animate --with-name orlando-reginald-morris-junior-snoozy --tiny    # different rhythm, same creature
```

Animation requires a TTY. Piping to a file or another command writes a single static frame and exits.

## Inline mode

Render a compact single-line glyph for statuslines, prompts, and tmux status bars.

```sh
clingon --inline --tiny --with-name orlando-reginald-morris-junior
```

Output is one line, width matching the size (4 chars for tiny, up to 11 for large). See [docs/integrations.md](docs/integrations.md) for tmux, starship, oh-my-posh, and Claude Code examples.

## Discovery

Browse a grid of random creatures with their names — useful for picking one to save:

```sh
clingon --gallery               # 8 random clingons (default)
clingon --gallery 12 --tiny     # 12 tiny ones, more per row
clingon --gallery --animate     # animated grid, all moving at once
```

List all the words you can compose names from:

```sh
clingon --list-names
```

Names are 4 hyphen-separated words by default (`<first>-<middle>-<family>-<suffix>`). The 1st and 3rd words drive the shape; the 2nd and 4th drive the palette. An optional 5th word picks an animation rhythm. Use `*` as a wildcard in any slot:

```sh
clingon --with-name orlando-*-morris-*           # fix shape, random palette
clingon --with-name *-reginald-*-junior          # fix palette, random shape
clingon --with-name orlando-*-morris-*-bouncy    # fix shape and rhythm
```

## CLI

Generate a random clingon:

```sh
clingon
```

Generate a compact clingon:

```sh
clingon --small
```

Generate a tiny four-line clingon:

```sh
clingon --tiny
```

Regenerate a specific clingon:

```sh
clingon --with-name orlando-reginald-morris-junior
```

Show the clingon name beside the art:

```sh
clingon --name
clingon --with-name orlando-reginald-morris-junior --name
```

Keep the same shape, but choose a new random palette:

```sh
clingon --with-name orlando-reginald-morris-junior --recolor
```

Print the JavaScript needed to recreate the same clingon:

```sh
clingon --with-name orlando-reginald-morris-junior --small --script
```

Print structured output:

```sh
clingon --small --json
```

Print only the character art, useful in shell startup files:

```sh
clingon --tiny
```

Show up to five lines of text beside the clingon:

```sh
clingon --tiny --name
clingon --tiny --welcome
clingon --tiny --message "Ready"
clingon --tiny --date --cwd --git
clingon --tiny --git --message "Ready" --name
```

`--cwd` is shown as `~ directory-name`, and `--git` is shown as `* branch-name`.
Label flags are shown in the order you pass them.

Add space around terminal output:

```sh
clingon --tiny --pad=1
clingon --tiny --pad-h=2 --pad-v=1
```

## Options

```txt
clingon [options]

Identity:
  -w, --with-name <name>  Regenerate a specific clingon. 4 or 5 words separated
                          by hyphens. '*' wildcards any slot.
  -r, --recolor           Keep shape, reroll palette (with --with-name).

Size:
      --tiny              4x4 grid
      --small             5x5 grid
      --normal            7x6 grid (default)
      --large             11x8 grid

Output mode (mutually exclusive):
      (default)           Multi-line ANSI art
  -i, --inline            Single-line glyph (for statuslines, prompts)
  -j, --json              JSON output
  -s, --script            Print the JS code that recreates this clingon
  -g, --gallery [n]       Show n random clingons in a grid (default 8)
      --list-names        Print the available word lists for composing names

Animation (require --animate):
  -a, --animate           Animate in place, loops until Ctrl-C
      --moves <list>      Behaviors: idle,blink,look,wiggle,walk (default: all)
      --in-sequence       Play moves in order vs. layered (default: layered)
      --once              Play one cycle and exit
      --fps <n>           Frames per second (1-30, default 8)
      --seconds <n>       Run for n seconds and exit

Info panel:
  -n, --name              Show the clingon's name
      --welcome           Time-aware greeting
      --message <msg>     Custom message (repeatable)
      --date              Today's date
      --cwd               Current directory name
      --git               Current git branch

Padding:
  -p, --pad <n>           Padding around output
      --pad-h <n>         Left padding only
      --pad-v <n>         Vertical padding only

Style:
      --no-color          Plain text glyphs, no ANSI escapes
  -l, --light             Darker palette for light terminal backgrounds

Other:
  -h, --help              Show help
  -v, --version           Show version
```

## JavaScript API

```js
import { generateClingon } from '@adrianlynch/clingon';

const clingon = generateClingon({
  name: 'orlando-reginald-morris-junior',
  size: 'tiny'
});

console.log(clingon.ansi);
console.log(clingon.name);
```

Random clingon:

```js
import { generateClingon } from '@adrianlynch/clingon';

const clingon = generateClingon();
console.log(clingon.ansi);
```

Render-only helper:

```js
import { renderClingon } from '@adrianlynch/clingon';

console.log(renderClingon({
  name: 'orlando-reginald-morris-junior',
  size: 'tiny'
}));
```

## Returned Data

`generateClingon()` returns:

```js
{
  name: 'orlando-reginald-morris-junior',
  code: 'orlando-reginald-morris-junior',
  size: 'tiny',
  shapeSeed: 0,
  paletteSeed: 0,
  rhythmSeed: null,            // set when name has a 5th rhythm word
  palette: {
    body: '#f06a0d',
    accent: '#2bce67',
    dark: '#7c2d12'
  },
  pixels: [[0, 0, 0]],
  ansi: '...',
  text: '...',
  inline: '[oo['               // single-line render for statuslines
}
```

Names are 4 or 5 hyphen-separated words:

- 1st (first) and 3rd (family) → shape
- 2nd (middle) and 4th (suffix) → palette
- 5th (rhythm, optional) → animation timing

Older `clg-...` seed codes are still accepted via the JavaScript API:

```js
generateClingon({ code: 'clg-00000rs-00000rt' });
```

## Custom moves

Built-in moves cover most uses. For custom animations, use the JavaScript API:

```js
import { animateClingon, defineMove, blink, bob } from '@adrianlynch/clingon';

defineMove('peek', {
  sequence: (basePixels) => [
    { pixels: bob(basePixels, 1), duration: 6 },
    { pixels: bob(basePixels, 0), duration: 3 },
    { pixels: blink(bob(basePixels, 0)), duration: 1 },
    { pixels: bob(basePixels, 0), duration: 4 }
  ]
});

await animateClingon({
  name: 'orlando-reginald-morris-junior',
  size: 'tiny',
  frames: ['peek'],
  mode: 'sequence',
  seconds: 5
}).done;
```

Built-in mutators (`blink`, `bob`, `wiggle`, `walk`, `lookLeft`, `lookRight`) and cell-ID constants (`BODY`, `ACCENT`, `DARK`, `EMPTY`, `EYE_*`, etc.) are exported for use inside custom moves. See [docs/examples/custom-moves.js](docs/examples/custom-moves.js) for a runnable example.

## Development

```sh
npm test
npm start -- --small
npm run docs:assets
npm pack --dry-run
```
