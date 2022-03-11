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

  wait(delay) {
    return new Promise(res =>
      setTimeout(() => res(), delay)
    );
  }

  async run(script) {
    const timeline = this.scriptToTimeline(script);
    const inputs = await Promise.all(
      timeline.map(({ link }) => this.get(link))
    );
    let duration = inputs.map(({ duration }) => duration);

    for (const input of inputs) {
      if (this.audioCtx.state === 'suspended')
        this.audioCtx.resume();
      const trackSrc = this.audioCtx.createBufferSource();
      trackSrc.buffer = input;
      trackSrc.connect(this.audioCtx.destination);

      trackSrc.start();
      await this.wait(input.duration * 1000);
    }
  }
}