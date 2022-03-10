import Audio from './Audio.njs.js';
import Parser from './Parser.js';

export default class Sh {
  constructor (list) {
    this.Audio = new Audio();
    this.Parser = new Parser(list);
  }
}
