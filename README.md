# @adrianlynch/clingon

Generate tiny deterministic terminal characters.

Each clingon is created from a short code. Save the code and you can render the same character again later, or keep the same shape and generate a new set of colors.

```txt
              
    [][][]    
  []..[]..[]  
[][][]..[][][]
    [][][]    
    ..  ..    

code: clg-00000rs-00000rt
```

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
clingon --code clg-00000rs-00000rt
```

Keep the same shape, but choose a new random palette:

```sh
clingon --code clg-00000rs-00000rt --recolor
```

Print the JavaScript needed to recreate the same clingon:

```sh
clingon --code clg-00000rs-00000rt --small --script
```

Print structured output:

```sh
clingon --small --json
```

## Options

```txt
clingon [options]

Options:
  -c, --code <code>   Regenerate a specific clingon code
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
  code: 'clg-00000rs-00000rt',
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
  code: 'clg-00000rs-00000rt',
  size: 'small'
}));
```

## Returned Data

`generateClingon()` returns:

```js
{
  code: 'clg-00000rs-00000rt',
  size: 'small',
  shapeSeed: 1000,
  paletteSeed: 1001,
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

The first seed in the code controls the shape. The second seed controls the palette.

## Development

```sh
npm test
npm start -- --small
npm pack --dry-run
```
