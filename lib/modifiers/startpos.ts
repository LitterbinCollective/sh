import BaseModifier from './basemodifier';

export default class StartposModifier extends BaseModifier {
  public static defaultArguments = ['0'];
  public static legacyExpression = '++';

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = Math.max(0, Math.min(100, +this.arguments[0])) / 100;
    this.checkNaNArguments(StartposModifier);
  }

  public modifyDuration(duration: number) {
    return duration - duration * this.arguments[0];
  }

  public filterTemplate(duration: number, locals: Map<string, any>) {
    const start = locals.has('atrim-start') ? locals.get('atrim-start') : 0 + duration * this.arguments[0];
    const end = locals.has('atrim-end') ? locals.get('atrim-end') : duration;
    locals.set('atrim-start', start);
    locals.set('atrim-end', end);
    return `[{0}]atrim=start=${start}ms:end=${end}ms[{1}]`;
  }
}
