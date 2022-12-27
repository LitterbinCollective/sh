import BaseModifier from './basemodifier';

export default class CutoffModifier extends BaseModifier {
  public static defaultArguments = ['100'];
  public static legacyExpression = '--';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, Math.min(100, +this.arguments[0])) / 100;
    this.checkNaNArguments(CutoffModifier);
  }

  public modifyDuration(duration: number): number {
    return duration * this.arguments[0];
  }

  public filterTemplate(duration: number, locals: Map<string, any>) {
    const start = locals.has('atrim-start') ? locals.get('atrim-start') : 0;
    const end = start + duration * this.arguments[0];
    locals.set('atrim-start', start);
    locals.set('atrim-end', end);
    return `[{0}]atrim=start=${start}ms:end=${end}ms[{1}]`;
  }
}
