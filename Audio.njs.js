const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

module.exports = class Audio {
  constructor() {
    this.AUDIO_CHANNELS = 2;
    this.SAMPLE_RATE = 48000;

    this.loadModifiers();
  }

  async loadModifiers() {
    this.modifiers = {
      cutoff: (await import('./modifiers/cutoff.js')).njs,
      duration: (await import('./modifiers/duration.js')).njs,
      echo: (await import('./modifiers/echo.js')).njs,
      highpass: (await import('./modifiers/highpass.js')).njs,
      lfopitch: (await import('./modifiers/lfopitch.js')).njs,
      lfovolume: (await import('./modifiers/lfovolume.js')).njs,
      lowpass: (await import('./modifiers/lowpass.js')).njs,
      pitch: (await import('./modifiers/pitch.js')).njs,
      repeat: (await import('./modifiers/repeat.js')).njs,
      startpos: (await import('./modifiers/startpos.js')).njs,
      volume: (await import('./modifiers/volume.js')).njs,
    };
  }

  modifierOrder = ['duration', 'repeat'];

  scriptToTimeline(script) {
    const timeline = [];
    const parseWord = (word, mods = []) => {
      const STACK_MAX = 3;
      let stackAmount = {};

      mods = [...word.mods, ...mods].sort((a, b) => {
        return this.modifierOrder.indexOf(a.mod) - this.modifierOrder.indexOf(b.mod);
      }).filter(x => {
        if (!stackAmount[x.mod])
          stackAmount[x.mod] = 0;
        stackAmount[x.mod]++;

        return !(stackAmount[x.mod] && stackAmount[x.mod] >= STACK_MAX);
      });

      for (const wordOrLink of word.words) {
        switch (typeof wordOrLink) {
          case 'string':
            timeline.push({
              link: wordOrLink,
              mods,
            });
            break;
          case 'object':
            parseWord(wordOrLink, mods);
            break;
        }
      }
    };

    for (let i = 0; i < script.length; i++) parseWord(script[i]);
    return timeline;
  }

  get(url) {
    url = new URL(url);

    switch (url.protocol.slice(0, 4)) {
      case 'file':
        return url.pathname;
      case 'http':
        return new Promise(async (res) => {
          const fileName = url.toString().replaceAll(/[\/:]/g, '_');
          if (fs.existsSync('cache/' + fileName + '.raw'))
            return res('cache/' + fileName + '.raw');

          const { data } = await axios({
            method: 'get',
            url: url.toString(),
            responseType: 'stream',
          });

          const child = spawn('ffmpeg', [
            '-i', '-',
            '-ac', this.AUDIO_CHANNELS,
            '-ar', this.SAMPLE_RATE,
            '-f', 's16le',
            '-'
          ]);
          data.pipe(child.stdin);

          const buffers = [];
          child.stdout.on('data', (data) => buffers.push(data));

          child.stdout.on('end', () => {
            if (!fs.existsSync('cache/')) fs.mkdirSync('cache/');
            fs.writeFileSync(
              'cache/' + fileName + '.raw',
              Buffer.concat(buffers)
            );
            res('cache/' + fileName + '.raw');
          });
        });
    }
  }

  calculateTimeLength(file) {
    const stat = fs.statSync(file);
    return stat.size / this.SAMPLE_RATE / this.AUDIO_CHANNELS / 2;
  }

  async run(script) {
    const timeline = this.scriptToTimeline(script);
    const NAME_LENGTH = 8;
    const filter = [];
    const named = [];
    const delays = [];

    let inputs = await Promise.all(
      timeline.map(async ({ link }) => {
        const path = await this.get(link);
        delays.push(this.calculateTimeLength(path) * 1000);
        return [
          '-f', 's16le',
          '-ar', this.SAMPLE_RATE,
          '-ac', this.AUDIO_CHANNELS,
          '-i', path
        ];
      })
    );
    inputs = inputs.flat();

    for (const time of timeline) {
      named.push(named.length + ':a');
      for (const { mod, args } of time.mods) {
        const modifier = this.modifiers[mod];
        if (!modifier) continue;
        const names = [named[named.length - 1]];
        const returned = modifier(args, delays[named.length - 1]);

        if (returned.filter)
          filter.push(
            returned.filter.replace(/{(\d+)}/g, (_match, number) => {
              let name = names[number];
              if (!name) {
                name = Math.random().toString(16).substring(2, NAME_LENGTH);
                names.push(name);
              }
              return name;
            })
          );

        if (returned.delay) delays[named.length - 1] = returned.delay;
        named[named.length - 1] = names[names.length - 1];
      }
    }

    let del = 0;
    for (let i = 0; i < delays.length; i++) {
      const newName = Math.random().toString(16).substring(2, NAME_LENGTH);
      filter.push(`[${named[i]}]adelay=${del}|${del}[${newName}]`);
      del += delays[i];
      named[i] = newName;
    }

    filter.push(
      named.reduce((pV, cV) => (pV += `[${cV}]`), '') +
        `amix=inputs=${inputs.length / 8}:dropout_transition=0,volume=volume=${
          inputs.length === 8 ? 1 : 1 - 1 / (inputs.length / 8)
        }[outa]`
    );

    let args = [
      '-map', '[outa]',
      '-f', 's16le',
      '-ar', this.SAMPLE_RATE,
      '-ac', this.AUDIO_CHANNELS,
      '-'
    ];
    args = inputs.concat('-filter_complex', filter.join(';'), args);
    console.log(args);

    const child = spawn('ffmpeg', args);
    child.stderr.on('data', (buf) => console.log(buf.toString()));
    return child.stdout;
  }
};
