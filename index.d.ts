// Too lazy to implement more stricter types.

declare class Parser {
  public parse(string: string): any;
}

declare class Audio {
  public run(script: any): any;
}

declare class Sh {
  public Audio: Audio;
  public Parser: Parser;
}

export = Sh;