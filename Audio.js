const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

module.exports = class Audio {
  constructor () {
    this.AUDIO_CHANNELS = 2;
    this.SAMPLE_RATE = 48000;

    this.modifiers = {};
    for (const file of fs.readdirSync('modifiers')) {
      const mod = require('./modifiers/' + file);
      this.modifiers[file.replace(/\.[^/.]+$/, '')] = mod;
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

  get(url) {
    url = new URL(url);

    switch (url.protocol.slice(0,4)) {
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
            responseType: 'stream'
          });

          const stream = spawn('ffmpeg', [
            '-i', '-',
            '-ac', this.AUDIO_CHANNELS,
            '-ar', this.SAMPLE_RATE,
            '-f', 's16le',
            '-'
          ]);
          data.pipe(stream.stdin);

          const buffers = [];
          stream.stdout.on('data', (data) =>
            buffers.push(data)
          );

          stream.stdout.on('end', () => {
            if (!fs.existsSync('cache/')) fs.mkdirSync('cache/');
            fs.writeFileSync('cache/' + fileName + '.raw', Buffer.concat(buffers));
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

    let inputs = await Promise.all(
      timeline.map(async ({ link }) => {
        const path = await this.get(link);
        return [
          '-f', 's16le',
          '-ar', this.SAMPLE_RATE,
          '-ac', this.AUDIO_CHANNELS,
          '-i', path
        ];
      })
    );
    inputs = inputs.reduce((pV, cV) => pV.concat(cV), []);

    for (const time of timeline) {
      named.push(named.length + ':a');
      for (const { mod, args } of time.mods) {
        const modifier = this.modifiers[mod];
        if (!modifier) continue;
        const names = [named[named.length - 1]];
        filter.push(modifier(args).replace(/{(\d+)}/g, (_match, number) => {
          let name = names[number];
          if (!name)
            name = Math.random().toString(16).substring(2, NAME_LENGTH),
            names.push(name);
          return name;
        }))
        named[named.length - 1] = names[names.length - 1];
      }
    }

    filter.push(
      named.reduce((pV, cV) => pV += `[${cV}]`, '') +
      `concat=n=${inputs.length / 8}:v=0:a=1[outa]`
    )

    let args = [
      '-map', '"[outa]"',
      '-f', 's16le',
      '-ar', this.SAMPLE_RATE,
      '-ac', this.AUDIO_CHANNELS,
      '-'
    ];
    args = inputs.concat('-filter_complex', '"' + filter.join(';') + '"', args);
    console.log(args.join(' '));
  }
}