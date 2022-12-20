# sh <img align="right" width="100" src="https://litterbin.dev/media/sh.png">
A chatsound processor written in JS.

## Installation
Run `npm install github:NonagonNetwork/sh` to install.

## Examples

```js
const Sh = require('sh');

// If you have a long list, this can take a second to load,
// as it creates a tree from it.
const sh = new Sh({
  "chat sound here": [
    "http://url.to/chatsound/1.ogg",
    "http://url.to/chatsound/2.ogg",
    "http://url.to/chatsound/3.ogg",
  ],
  "more": [
    "http://url.to/more/1.ogg",
    "http://url.to/more/2.ogg",
    "http://url.to/more/3.ogg",
  ]
});

const script = sh.Parser.parse('more chat sound here more more');
const stream = sh.Audio.run(script);
```