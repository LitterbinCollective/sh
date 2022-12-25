import BaseModifier from './basemodifier';

export default class StartposModifier extends BaseModifier {
  public static defaultArguments = [ '0' ];
  public static legacyExpression = '++';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, Math.min(100, +this.arguments[0])) / 100;
    this.checkNaNArguments(StartposModifier);
  }

  public modifyDuration(duration: number) {
    return duration - duration * this.arguments[0];
  }

  public filterTemplate(duration: number) {
    return `[{0}]atrim=start=${duration * this.arguments[0]}ms:end=${duration}ms[{1}]`
  }
};