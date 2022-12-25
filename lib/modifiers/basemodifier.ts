import { Chatsound } from '..';

export default class BaseModifier {
  public arguments: any[] = [];
  public priority = 0;
  public filterStackLimit = 3;
  public static defaultArguments: string[] = [];
  public static legacyExpression: string | null = null;

  constructor(args: string[]) {
    this.arguments = args;
  }

  public checkNaNArguments(self: typeof BaseModifier) {
    this.arguments = this.arguments.map((x, i) =>
      isNaN(x) ? +self.defaultArguments[i] : x
    );
  }

  public static onLegacyExpressionUsed(value: string): string {
    return value;
  }

  public onSelection(index: number, matches: Chatsound[]) {
    return { index, matches };
  }

  public modifyDuration(duration: number) {
    return duration;
  }

  public filterTemplate(duration: number): string | false {
    return false;
  }
}
