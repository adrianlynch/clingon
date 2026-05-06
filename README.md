# @adrianlynch/clingon

Generate tiny deterministic terminal characters.

Each clingon is created from a readable name. Save the name and you can render the same character again later, or keep the same shape and generate a new set of colors.

```txt
      ##      
    [][][]    
[][]..[]..[][]
[][][][][][][]
  [][]##[][]  
  ....  ....  

code: orlando-reginald-morris-junior
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

## Install

```sh
npm install @adrianlynch/clingon
```

Run it without installing:

```sh
npx @adrianlynch/clingon --small
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

Regenerate a specific clingon:

```sh
clingon --code orlando-reginald-morris-junior
```

Keep the same shape, but choose a new random palette:

```sh
clingon --code orlando-reginald-morris-junior --recolor
```

Print the JavaScript needed to recreate the same clingon:

```sh
clingon --code orlando-reginald-morris-junior --small --script
```

Print structured output:

```sh
clingon --small --json
```

## Options

```txt
clingon [options]

Options:
  -c, --code <code>   Regenerate a specific clingon name/code
  -r, --recolor       Keep the shape from --code but choose new colors
      --small         Render a smaller clingon
      --size <size>   Render size: small or normal
  -s, --script        Print the JavaScript needed to recreate the clingon
  -j, --json          Print JSON data instead of terminal art
      --no-color      Render without ANSI color
  -h, --help          Show help
  -v, --version       Show version
```

## JavaScript API

```js
import { generateClingon } from '@adrianlynch/clingon';

const clingon = generateClingon({
  code: 'orlando-reginald-morris-junior',
  size: 'small'
});

console.log(clingon.ansi);
console.log(clingon.code);
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
  code: 'orlando-reginald-morris-junior',
  size: 'small'
}));
```

## Returned Data

`generateClingon()` returns:

```js
{
  code: 'orlando-reginald-morris-junior',
  size: 'small',
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

Older `clg-...` seed codes are still accepted:

```sh
clingon --code clg-00000rs-00000rt
```

## Development

```sh
npm test
npm start -- --small
npm pack --dry-run
```
