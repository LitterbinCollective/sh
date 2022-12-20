export default class BaseModifier {
  public legacyModifier: string | null = null;

  public onLegacyModifierUsed(value: string): string {
    return value;
  }

  public convertValues(values: string[]): any[] {
    return values;
  }

  public process(values: any[]): string | false {
    return false;
  }
};