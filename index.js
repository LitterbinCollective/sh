const Parser = require('./Parser');

module.exports = class Sh {
  constructor (list) {
    this.Parser = new Parser(list);
  }
}