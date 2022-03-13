const Audio = require('./Audio.njs.js');
const Parser = require('./Parser.js');

module.exports = class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}
