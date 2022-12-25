import BaseModifier from './basemodifier';

const MAXIMUM_ECHOES = 512;

export default class EchoModifier extends BaseModifier {
  public static defaultArguments = [ '0.25', '0.5' ];
  private decays: string[] = [];
  private delays: number[] = [];

  constructor(args: string[]) {
    super(args);
    this.arguments[0] = +this.arguments[0];
    this.arguments[1] = +this.arguments[1];
    this.checkNaNArguments(EchoModifier);
  }

  private processEchoes() {
    const decayFactor = 1 - this.arguments[1];

    let iterations = 0;
    for (let i = 1 - decayFactor; i > 0; i *= decayFactor) {
      const fixedDecay = i.toFixed(2);
      if (iterations > MAXIMUM_ECHOES || +fixedDecay === 0)
        break;
      iterations++;

      const delay: number = this.arguments[0] * (this.delays.length + 1) * 1000;
      // ffmpeg does not allow a 90-second echo
      if (delay > 90000) break;

      this.delays.push(delay);
      this.decays.push(fixedDecay);
    }
  }

  public modifyDuration(duration: number) {
    if (this.decays.length === 0 || this.delays.length === 0)
      this.processEchoes();

    return duration * 2 + this.delays[this.delays.length - 1];
  }

  public filterTemplate(_: number) {
    if (this.decays.length === 0 || this.delays.length === 0)
      this.processEchoes();

    return `[{0}]aecho=1:1:${this.delays.join('|')}:${this.decays.join('|')}[{1}]`
  }
};