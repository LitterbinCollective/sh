import BaseModifier from './basemodifier';

export default class LowpassModifier extends BaseModifier {
  public static defaultArguments = ['1'];

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, Math.min(1, +this.arguments[0]));
    this.checkNaNArguments(LowpassModifier);
  }

  public filterTemplate(_: number) {
    return `[{0}]lowpass=f=${this.arguments[0] * 24000}[{1}]`;
  }
}
