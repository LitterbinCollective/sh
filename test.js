const { readFileSync, createWriteStream } = require("fs");
const { default: Chatsounds } = require("./dist/index");
const { BaseModifier } = require("./dist/modifiers");
let Speaker;

class TestModifier extends BaseModifier {
  constructor(args) {
    super(args);
    this.arguments[0] = +this.arguments[0];
  }

  static onLegacyExpressionUsed(value) {
    return (+value / 100).toString();
  }

  get filterTemplate() {
    return `[{0}]asetrate=${48000 * Math.abs(this.arguments[0])}[{1}]`
  }
}

TestModifier.legacyExpression = '%';
TestModifier.defaultArguments = [ '1' ];

const sh = new Chatsounds();
(async function() {
  await sh.useSourcesFromGitHubMsgPack("PAC3-Server/chatsounds-valve-games", "master", "csgo");
  console.log('merging sources...');
  sh.mergeSources();
  console.log('done!');

  sh.useModifiers({ test: TestModifier });
  const context = sh.newStream('(endmatch itemrevealrarityco csgo ui store se:test(0.01)):test(1)');
  console.log('preparing...')
  const a = await context.audio();
  a.pipe(createWriteStream('test.raw'));
})();