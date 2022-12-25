# sh <img align="right" width="100" src="https://litterbin.dev/media/sh.png">
A Chatsounds processor written in TypeScript. It can not be accurate.

## Prerequisites
Download FFmpeg and place the folder with it in the PATH environment variable.

## Installation
Run `npm install github:NonagonNetwork/sh` to install.

## Limitations
*(also laziness)*

### FFmpeg
Since the package is using FFmpeg, some features that are included in the Garry's
Mod versions of Chatsounds do not exist or are limited.

### Output
sh is hard-coded to export signed 16-bit little-endian PCM stereo audio with
the sample rate of 48000 Hz, meaning it is impossible to change the output format.

## Examples

### JavaScript
```js
const { default: Chatsounds, defaultModifiers } = require("sh");

const sh = new Chatsounds();
(async function() {
  // set it up first
  sh.useModifiers(defaultModifiers);
  await sh.useSourcesFromGitHubMsgPack("PAC3-Server/chatsounds-valve-games", "master", "csgo");
  sh.mergeSources();

  // go wacky

  // stream format
  const context = sh.newStream('endmatch itemrevealraritycommon:echo');
  const stream = await context.audio();
  // [...]

  // buffer format
  const context2 = sh.newBuffer('endmatch itemrevealraritycommon:echo');
  const buffer = await context2.audio();
  // [...]
})();


const script = sh.Parser.parse("more chat sound here more more");
const stream = sh.Audio.run(script);
```