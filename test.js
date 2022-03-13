const { readFileSync } = require('fs');
const Sh = require('./index.js');

const sh = new Sh(JSON.parse(readFileSync('./shat.json')));

process.stdin.on('data', async (data) => {
  data = data.toString().trim();

  const script = sh.Parser.parse(data);
  console.log(script);
})