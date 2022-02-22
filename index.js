const Audio = require('./Audio');
const Parser = require('./Parser');

module.exports = class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}

const sh = new module.exports(require('./shat.json'));
const script = sh.Parser.parse('fuck you:lfopitch(2, 5) (shit:cut(10) ass):echo(1) hi:pitch(5)');
console.log(script);
console.log(sh.Audio.scriptToTimeline(script));
