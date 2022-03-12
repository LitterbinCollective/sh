export default class AudioBrowser {
  constructor () {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext();

    this.loadModifiers();
  }

  async loadModifiers() {
    this.modifiers = {
      cutoff: (await import('./modifiers/cutoff.js')).browser,
      duration: (await import('./modifiers/duration.js')).browser,
      pitch: (await import('./modifiers/pitch.js')).browser,
      startpos: (await import('./modifiers/startpos.js')).browser,
      volume: (await import('./modifiers/volume.js')).browser
    }
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
    if (this.audioCtx.state === 'suspended')
      this.audioCtx.resume();
    const timeline = this.scriptToTimeline(script);

    const inputs = await Promise.all(
      timeline.map(async ({ link }) => {
        const trackSrc = this.audioCtx.createBufferSource();
        trackSrc.buffer = await this.get(link);
        return trackSrc;
      })
    );
    let duration = inputs.map(({ buffer }) => buffer.duration * 1000);
    let ends = duration;
    let offsets = inputs.map(() => 0);
    let nodes = [];

    for (let i = 0; i < inputs.length; i++) {
      const time = timeline[i];
      let finalInput = inputs[i];
      for (const { mod, args } of time.mods) {
        const modifier = this.modifiers[mod];
        if (!modifier) continue;

        const { delay, end, offset, node, insert } = await modifier(args, duration[i], offsets[i], finalInput, this.audioCtx);
        console.log('mod:', mod, args, delay, end, offset, node);
        if (node) finalInput = node;
        if (offset) offsets[i] = offset;
        if (end) ends[i] = end;
        if (delay) duration[i] = delay;
        if (insert) {
          if (!nodes[i])
            nodes[i] = [];
          console.log('inserting node');
          nodes[i].push(insert);
        }
      }
      inputs[i] = finalInput;
    }

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const time = duration[i];

      let lastNode = input;
      if (nodes[i])
        for (const node of nodes[i]) {
          console.log(lastNode, '=>', node);
          lastNode.connect(node);
          lastNode = node;
        }
      lastNode.connect(this.audioCtx.destination);

      input.start(0, offsets[i] / 1000, ends[i] / 1000);
      await this.wait(time);
    }
  }
}