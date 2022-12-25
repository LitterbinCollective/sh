import BaseModifier from './basemodifier';

export default class CutoffModifier extends BaseModifier {
  public static defaultArguments = ['100'];
  public static legacyExpression = '--';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, Math.min(100, +this.arguments[0])) / 100;
    this.checkNaNArguments(CutoffModifier);
  }

  public modifyDuration(duration: number): number {
    return duration * this.arguments[0];
  }

  public filterTemplate(duration: number) {
    return `[{0}]atrim=start=0:end=${duration * this.arguments[0]}ms[{1}]`;
  }
}
