const { readFileSync } = require("fs");
const Sh = require("./index.js");
const { inspect } = require("util");
const Speaker = require("speaker");

const sh = new Sh(JSON.parse(readFileSync("./shat.json")));

process.stdin.on("data", async data => {
  data = data.toString().trim();

  const script = sh.Parser.parse(data);
  console.log(inspect(script, { compact: false, depth: Infinity, colors: true }));

  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 48000, // 44,100 Hz sample rate
  });
  speaker.on("end", () => speaker.close());

  const audio = await sh.Audio.run(script);
  audio.pipe(speaker);
});
