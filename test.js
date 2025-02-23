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

  const last = performance.now();
  const context = sh.worker(data);
  console.log("creating took: ", performance.now() - last);

  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 44100, // 44,100 Hz sample rate
  });
  speaker.on('end', () => speaker.close());

  const audio = await context.buffer({
    sampleRate: 44100,
    audioChannels: 2,
    format: 's16le'
  });
  if (!audio) return console.log('no audio :(');
  speaker.write(audio);
  speaker.end();
}

(async function() {
  await update();
  setInterval(update, 60 * 60 * 1000);
  sh.useModifiers(defaultModifiers);

  process.stdin.on("data", run);
})();

setInterval(() => console.log(Date.now()), 100);