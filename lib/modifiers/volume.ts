import BaseModifier from './basemodifier';

export default class VolumeModifier extends BaseModifier {
  public static defaultArguments = [ '1' ];
  public static legacyExpression = '^';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, +this.arguments[0]);
    this.checkNaNArguments(VolumeModifier);
  }

  public filterTemplate(_: number) {
    return `[{0}]volume=volume=${this.arguments[0]}[{1}]`
  }
};