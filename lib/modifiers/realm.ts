import { Chatsound } from '../utils';
import BaseModifier from './basemodifier';

export default class RealmModifier extends BaseModifier {
  public static defaultArguments = [''];

  public onSelection(index: number, matches: Chatsound[]) {
    const realm = this.arguments[0];

    return {
      index,
      matches: matches.filter(x => x.realm === realm),
    };
  }
}
