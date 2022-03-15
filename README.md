# sh <img align="right" width="100" src="https://litterbin.dev/sh.png">
A chatsound processor written in JS.

## Installation
Run `npm install github:NonagonNetwork/sh` to install.

### Browser Preface
:echo, :lfopitch and :lfovolume modifiers have been copied over from
[Metastruct/notagain](https://github.com/Metastruct/notagain).

notagain audio effects with Web Audio API implementation uses
ScriptProcessorNode, which has multiple issues:
- User might hear clicks and pops;
- [ScriptProcessorNode is deprecated and is planned for the removal in the future.](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode)

That being said, 3-rd party contributions (or pull requests) to this
repository are welcome! To test your changes use `browsertest` folder.

### Node.JS Preface
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
