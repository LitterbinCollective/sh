module.exports = class Parser {
  constructor(shat) {
    this.shat = shat;
  }

  buildWordList(input) {
    const words = []
    const regex = /[\(\),:]/g;
    let temp = []
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

    return words
  }

  findMods(words) {
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
      end = true,
      startAt = -1;

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      const next = words[i + 1] || ')';
      if (!capture && word === '(') {
        nesting = true;
        startAt = i;
        continue;
      }

      if (nesting) {
        let bypass = false;
        if (word === '(')
          end = false
        if (word === ')')
          if (end) {
            word = this.findMods(words.slice(startAt + 1, i));
            nesting = false;
            bypass = true;
          } else end = true;
        if (!bypass)
          continue;
      }

      if (word === ':') {
        capture = true;
        continue;
      }

      if (capture) {
        if (!captured.mod)
          captured.mod = word;

        if (arg && word.search(regex) === -1)
          captured.args.push(word);

        if (next === '(')
          arg = true
        else if (word === ')')
          arg = false

        if (!arg && next.search(regex) === -1) {
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

  parse(input) {
    const words = this.buildWordList(input);
    return this.findMods(words);
  }
}

// TESTING //

// This needs to work with these:
const testInputs = [
  'shit abcdef hi lol',
  '(shit) abcdef#4 hi lol',
  '(shit abcdef):lfopitch(12, 34) hi lol:echo',
  '(shit:echo abcdef):lfopitch hi lol:echo'
];

const parser = new module.exports({
  shit: ['file:///path/to/shit'],
  abcdef: [
    'file:///path/to/abcdef1',
    'file:///path/to/abcdef2',
    'file:///path/to/abcdef3',
    'file:///path/to/abcdef4'
  ],
  'hi lol': ['file:///path/to/hi_lol']
});

for (let input of testInputs)
  console.log('==== INPUT', input, '====', '\n', parser.parse(input)),
  console.log('result[0] = ', parser.parse(input)[0], '\n\n');