# sh <img align="right" width="100" src="https://litterbin.dev/sh.png">
A chatsound processor written in JS.

## Installation
Run `npm install github:NonagonNetwork/sh` to install.

*If you're planning to use this in Node.JS, please make sure you have
`ffmpeg` installed and put in PATH environment variable.*

## Examples

### Node.JS
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

### Browser
(Assuming you have imported it with the `<script>` tag.)
```js
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
// This plays the sounds in this version, hence does not
// return anything.
sh.Audio.run(script);
```
