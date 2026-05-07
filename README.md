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
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh -s -- --size small
```

Customize the generated `~/.zshrc` command by passing clingon options after `--`:

```sh
curl -fsSL https://raw.githubusercontent.com/adrianlynch/clingon/main/install.sh | sh -s -- --size tiny -- --message "Good morning" --date --git --pad-v=1
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

Options:
      --with-name <name>
                    Regenerate a specific clingon name
  -n, --name          Show the clingon name beside the art
  -r, --recolor       Keep the shape from --with-name but choose new colors
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
      --pad <n>       Add padding around terminal output
      --pad-h <n>     Add spaces before each terminal output line
      --pad-v <n>     Add blank lines before and after terminal output
      --no-color      Render without ANSI color
  -h, --help          Show help
  -v, --version       Show version
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
  palette: {
    body: '#f06a0d',
    accent: '#2bce67',
    dark: '#7c2d12'
  },
  pixels: [[0, 0, 0]],
  ansi: '...',
  text: '...'
}
```

The first and third words control the shape. The second and fourth words control the palette.

Older `clg-...` seed codes are still accepted through `--with-name`:

```sh
clingon --with-name clg-00000rs-00000rt
```

## Development

```sh
npm test
npm start -- --small
npm run docs:assets
npm pack --dry-run
```
