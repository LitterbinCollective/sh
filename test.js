const Sh = require('.');
const Speaker = require('speaker');

const sh = new Sh(require('./shat.json'));

process.stdin.on('data', async (data) => {
  data = data.toString().trim();

  const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000
  });
  const script = sh.Parser.parse(data);
  const stream = await sh.Audio.run(script);
  stream.pipe(speaker);
})