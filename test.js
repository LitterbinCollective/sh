const { readFileSync, createWriteStream } = require("fs");
const { default: Chatsounds } = require("./dist/index");
const { BaseModifier, defaultModifiers } = require("./dist/modifiers");
let Speaker;

const sh = new Chatsounds();
(async function() {
  await sh.useSourcesFromGitHubMsgPack("PAC3-Server/chatsounds-valve-games", "master", "csgo");
  console.log('merging sources...');
  sh.mergeSources();
  console.log('done!');

  sh.useModifiers(defaultModifiers);
  const context = sh.newStream('endmatch itemrevealraritycommon#1:echo(1, 0.5):repeat(2)');
  console.log('preparing...')
  const a = await context.audio();
  a.pipe(createWriteStream('test.raw'));
})();