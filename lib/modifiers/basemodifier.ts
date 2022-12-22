import { Chatsound } from '..';

export default class BaseModifier {
  public static defaultArguments = [];
  public static legacyExpression: string | null = null;
  private arguments: any[] = [];

  constructor(args: string[]) {
    this.arguments = args;
  }

  public static onLegacyExpressionUsed(value: string): string {
    return value;
  }

  public onSelection(index: number, matches: Chatsound[]) {
    return { index, matches };
  }

  public get filterTemplate(): string | false {
    return false;
  }
};