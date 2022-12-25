const Speaker = require("speaker");
const { default: Chatsounds, defaultModifiers } = require("./dist/index");

const sh = new Chatsounds();

async function update() {
  const response1 = await sh.useSourcesFromGitHubMsgPack("PAC3-Server/chatsounds-valve-games", "master", "csgo");
  const response2 = await sh.useSourcesFromGitHub("Metastruct/garrysmod-chatsounds", "master", "sound/chatsounds/autoadd");

  if (response1 || response2) {
    console.log("new chatsounds data!");
    sh.mergeSources();
  }
}

async function run(data) {
  data = data.toString().trim();

  const context = sh.newStream(data);
  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 48000, // 48,000 Hz sample rate
  });
  speaker.on("end", () => speaker.close());
  console.log(context.scope.children[0].children)

  const audio = await context.audio();
  audio.pipe(speaker);
}

(async function() {
  await update();
  setInterval(update, 60 * 60 * 1000);
  sh.useModifiers(defaultModifiers);

  process.stdin.on("data", run);
})();