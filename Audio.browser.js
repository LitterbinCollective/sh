export default class AudioBrowser {
  constructor () {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext();
  }

  scriptToTimeline(script) {
    const timeline = [];
    const parseWord = function(word, mods) {
      for (const wordOrLink of word.words) {
        switch (typeof wordOrLink) {
          case 'string':
            timeline.push({
              link: wordOrLink,
              mods: word.mods.concat(mods || [])
            });
            break;
          case 'object':
            parseWord(wordOrLink, word.mods.concat(mods || []));
            break;
        }
      }
    };

    for (let i = 0; i < script.length; i++)
      parseWord(script[i]);
    return timeline;
  }

  async get(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioCtx.decodeAudioData(arrayBuffer);
  }

  async run(script) {
    const timeline = this.scriptToTimeline(script);
    let inputs = await Promise.all(
      timeline.map(({ link }) => this.get(link))
    );
    console.log(inputs);
  }
}