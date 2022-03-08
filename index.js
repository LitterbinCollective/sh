const Audio = require('./Audio');
const Parser = require('./Parser');

module.exports = class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}
