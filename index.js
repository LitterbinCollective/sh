const Audio = require('./Audio');
const Parser = require('./Parser');

module.exports = class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}

const sh = new module.exports(require('./shat.json'));
const script = sh.Parser.parse('hi:pitch(0.1)');

(async function() {
  await sh.Audio.run(script);
})();