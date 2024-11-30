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

  const context = sh.new(data);
  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 44100, // 44,100 Hz sample rate
  });
  speaker.on("end", () => speaker.close());

  const audio = await context.stream({
    sampleRate: 44100,
    audioChannels: 2,
    format: 's16le'
  });
  if (!audio) return console.log('no audio :(');
  audio.pipe(speaker);
}

(async function() {
  await update();
  setInterval(update, 60 * 60 * 1000);
  sh.useModifiers(defaultModifiers);

  process.stdin.on("data", run);
})();