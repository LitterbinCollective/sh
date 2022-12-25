import BaseModifier from './basemodifier';

export default class LFOVolumeModifier extends BaseModifier {
  public static defaultArguments = [ '5', '1' ];

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0.1, Math.min(20000, +this.arguments[0]));
    this.arguments[1] = Math.max(0, Math.min(1, +this.arguments[1]));
    this.checkNaNArguments(LFOVolumeModifier);
  }

  public filterTemplate(_: number) {
    return `[{0}]tremolo=f=${this.arguments[0]}:d=${this.arguments[1]}[{1}]`
  }
};