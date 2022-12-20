const { readFileSync } = require("fs");
const { default: Chatsounds } = require("./dist/index");
const { inspect } = require("util");
let Speaker;

const sh = new Chatsounds();
(async function() {
  await sh.useSourcesFromGitHubMsgPack("PAC3-Server/chatsounds-valve-games", "master", "csgo");
  console.log('merging sources...');
  sh.mergeSources();
  console.log('done!');
})();