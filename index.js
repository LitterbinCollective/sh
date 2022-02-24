const Audio = require('./Audio');
const Parser = require('./Parser');
const Speaker = require('speaker');

module.exports = class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}

const sh = new module.exports(require('./shat.json'));

(async function() {
  //const stream = await sh.Audio.run(script);
  //stream.pipe(speaker)
})();

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