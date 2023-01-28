import BaseModifier from './basemodifier';

export default class DurationModifier extends BaseModifier {
  public priority = -1;
  public static defaultArguments = ['1'];
  public static legacyExpression = '=';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, +this.arguments[0]);
    this.checkNaNArguments(DurationModifier);
  }

  public modifyDuration(_: number): number {
    return this.arguments[0] * 1000;
  }
}
