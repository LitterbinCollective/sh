import AudioBrowser from './Audio.browser.js';
import Parser from './Parser.js';

/*!
 Copyright Litterbin Development
  SPDX-License-Identifier: Apache-2.0
*/

window.Sh = class Sh {
  constructor (list) {
    this.Audio = new AudioBrowser();
    this.Parser = new Parser(list);

    console.log(
      '%csh',
      'background:#BD2626;color:white;padding:2px 4px;border-radius:2px;',
      'hoi!!'
    );
  }
}

export default window.Sh;
