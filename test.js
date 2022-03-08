const Sh = require('.');

const sh = new Sh(require('./shat.json'));

process.stdin.on('data', async (data) => {
  data = data.toString().trim();

  const script = sh.Parser.parse(data);
  console.log(script);
})