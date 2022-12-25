import BaseModifier from './basemodifier';

export default class HighpassModifier extends BaseModifier {
  public static defaultArguments = ['1'];

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = 1 - Math.max(0, Math.min(1, +this.arguments[0]));
    this.checkNaNArguments(HighpassModifier);
  }

  public filterTemplate(_: number) {
    return `[{0}]highpass=f=${this.arguments[0] * 24000}[{1}]`;
  }
}
