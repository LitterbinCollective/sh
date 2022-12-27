import { Chatsound } from '..';
import BaseModifier from './basemodifier';

export default class SelectModifier extends BaseModifier {
  public static defaultArguments = ['1'];
  public static legacyExpression = '#';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = +this.arguments[0] - 1;
    this.checkNaNArguments(SelectModifier);
  }

  public onSelection(_: number, matches: Chatsound[]) {
    const newIndex = this.arguments[0];
    return { index: newIndex, matches };
  }
}
