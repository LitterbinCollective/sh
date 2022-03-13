module.exports = class Parser {
  constructor(shat) {
    this.shat = shat;

    this.tree = {};
    for (let soundName in this.shat) {
      const soundData = this.shat[soundName];
      const words = soundName.split(' ');
      let next = this.tree;
      for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (!next[word])
          next[word] = {};
        next = next[word];

        if (i === words.length - 1) {
          next._SD = soundData;
          break;
        }
      }
    }
  }

  buildWordList(input) {
    const words = [];
    const regex = /[\(\),:]/g;
    let temp = [];
    for (let i = 0; i < input.length + 1; i++) {
      const char = input[i] || ')';
      const last = input[i - 1] || '';

      if (char === ' ') continue;
      if (last === ' ' || char.search(regex) !== -1 || last.search(regex) !== -1) {
        const word = temp.join('');
        if (word.length > 0)
          words.push(word),
          temp = [];
      }

      temp.push(char);
    }

    return words;
  }

  sortWordList(words) {
    const regex = /[\(\),]/g;
    const result = [];
    let pushNew = true;
    let capture = false,
      captured = {
        mod: false,
        args: []
      },
      arg = false;
    let nesting = false,
      depth = 0,
      startAt = -1;

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      const next = words[i + 1] || '';

      if (!capture && word === '(' && !nesting) {
        nesting = true;
        startAt = i;
        continue;
      }

      if (nesting) {
        let bypass = false;
        if (word === '(')
          depth++;
        if (word === ')')
          if (depth === 0) {
            word = this.sortWordList(words.slice(startAt + 1, i));
            nesting = false;
            bypass = true;
            pushNew = true;
          } else depth--;
        if (!bypass) continue;
      }

      if (word === ':') {
        capture = true;
        continue;
      }

      if (capture) {
        if (!captured.mod)
          captured.mod = word;

        if (arg && word.search(regex) === -1) {
          if (isNaN(Number(word))) {
            const collected = captured.args.length;
            capture = false;
            arg = false;
            pushNew = true;
            captured = {
              mod: false,
              args: []
            };

            nesting = true;
            startAt = i - (collected + 1);
            continue;
          }

          captured.args.push(word);
        }


        if (next === '(')
          arg = true
        if (word === ')')
          arg = false;

        if (!arg || i === words.length) {
          result[result.length - 1].mods.push(captured);
          capture = false;
          pushNew = true;
          captured = {
            mod: false,
            args: []
          };
        }

        continue;
      }

      if (pushNew)
        result.push({
          words: Array.isArray(word) ? word : [word],
          mods: []
        }),
        pushNew = false
      else
        Array.isArray(word) ?
          (result[result.length - 1].words = word) :
          result[result.length - 1].words.push(word);
    }

    return result
  }

  findSounds(words) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const newWords = [];
      let next = this.tree;
      let iterations = 0;
      let prev = this.tree;
      for (let k = 0; k < word.words.length; k++) {
        let wordData = word.words[k];
        let realm = -1;
        let restart = false;

        if (typeof wordData === 'object') {
          newWords.push({
            words: this.findSounds([wordData]),
            mods: []
          });
          continue;
        }

        if (wordData.search('#') !== -1) {
          const split = wordData.split('#');
          wordData = split[0];
          realm = isNaN(Number(split[1])) ? realm : Number(split[1]);
          restart = true;
        }

        if (next[wordData] === undefined)
          restart = true,
          iterations = 1;
        else {
          prev = next;
          next = next[wordData];
          if (next[word.words[k + 1]] === undefined) {
            if (!next._SD)
              next = prev;
            else
              iterations = 0;
            restart = true;
          }
        }

        if ((k === word.words.length - 1 || restart) && next._SD) {
          for (let iter = 0; iter <= iterations; iter++) {
            let choose = 1 + Math.floor(Math.random() * (next._SD.length - 1))
            if (iter === iterations - 1 && realm !== -1)
              choose = realm;
            newWords.push(next._SD[choose - 1]);
          }

          next = this.tree;
          prev = this.tree;
          iterations = -1;
        }
        iterations++;
      }

      word.words = newWords;
    }

    for (let i = 0; i < words.length; i++) {
      let areAllStrings = words[i].words.reduce((pV, cV) => pV && typeof cV === 'string', true);

      if (areAllStrings)
        for (let k = 0; k < words[i].words.length - 1; k++) {
          const removed = words[i].words.splice(k, 1);
          words.splice(i + k, 0, {
            words: removed,
            mods: []
          });
        }
    }

    return words;
  }

  parse(input) {
    let words = this.buildWordList(input);
    words = this.sortWordList(words);
    return this.findSounds(words);
  }
}