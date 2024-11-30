# sh
A Chatsounds processor written in TypeScript. It can not be accurate.

## Prerequisites
Download FFmpeg and place the folder with it in the PATH environment variable.

## Installation
Run `npm install github:NonagonNetwork/sh` to install.

## Limitations
Since the package is using FFmpeg, some features that are included in the Garry's
Mod versions of Chatsounds do not exist or are limited.

## Examples

### JavaScript
```js
const { default: Chatsounds, defaultModifiers } = require('sh');

const sh = new Chatsounds();
(async function() {
  // set it up first
  sh.useModifiers(defaultModifiers);

  /*
    if this function or useSourcesFromGitHub returns false, this means that
    the listing for it was stored in the memory and did not need to be refreshed
  */
  await sh.useSourcesFromGitHubMsgPack('PAC3-Server/chatsounds-valve-games', 'master', 'csgo');
  sh.mergeSources();

  // go wacky

  // stream format
  const context = sh.new('endmatch itemrevealraritycommon:echo');
  const audio = await context.stream({
    sampleRate: 48000,
    audioChannels: 2,
    format: 's16le'
  });
  // [...]

  // buffer format
  const context2 = sh.new('endmatch itemrevealraritycommon:echo');
  const audio = await context.buffer({
    sampleRate: 48000,
    audioChannels: 2,
    format: 's16le'
  });
  // [...]
})();
```
