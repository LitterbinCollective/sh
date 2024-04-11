import { CACHE_SAMPLE_RATE } from '../utils';
import BaseModifier from './basemodifier';

/*
  repeat on the garry's mod versions seem to repeat not the same chatsound,
  but the chatsound with the same name.

  here it plays the same chatsound.
*/
export default class RepeatModifier extends BaseModifier {
  public priority = -1;
  public static defaultArguments = ['1'];
  public static legacyExpression = '*';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(1, +this.arguments[0]) - 1;
    this.checkNaNArguments(RepeatModifier);
  }

  public modifyDuration(duration: number) {
    return duration * (this.arguments[0] + 1);
  }

  public filterTemplate(duration: number) {
    const size = (CACHE_SAMPLE_RATE / 1000) * duration;
    return `[{0}]aloop=loop=${this.arguments[0]}:size=${size}[{1}]`;
  }
}
