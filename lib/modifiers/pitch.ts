import { CACHE_SAMPLE_RATE } from '../utils';
import BaseModifier from './basemodifier';

export default class PitchModifier extends BaseModifier {
  // asetrate is applied to the last one
  public filterStackLimit = 1;
  public static defaultArguments = ['1'];
  public static legacyExpression = '%';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = +this.arguments[0];
    this.checkNaNArguments(PitchModifier);
  }

  static onLegacyExpressionUsed(value: string) {
    return (+value / 100).toFixed(2);
  }

  public modifyDuration(duration: number) {
    if (this.arguments[0] === 0) return duration;
    return duration / Math.abs(this.arguments[0]);
  }

  public filterTemplate(_: number) {
    const [pitch] = this.arguments;
    if (pitch === 0) return false;

    const suffix = pitch < 0 ? ',areverse' : '';
    return (
      `[{0}]asetrate=${CACHE_SAMPLE_RATE * Math.abs(pitch)}` + suffix + '[{1}]'
    );
  }
}
