import Chatsounds from '.';
import {
  REPEATED_SPACES_REGEX,
  SCOPE_TYPE_GROUP,
  SCOPE_TYPE_MISC,
  SCOPE_TYPE_MODIFIER_EXPRESSION,
  SCOPE_TYPE_SOUND,
} from './constants';
import { BaseModifier } from './modifiers';

interface ScopeOptions {
  currentIndex?: number;
  endIndex?: number;
  modifier?: BaseModifier;
  parser: Parser;
  parent?: Scope;
  root?: boolean;
  text?: string;
  type: 'group' | 'sound' | 'modifier_expression' | 'misc';
}

export class Scope {
  public children: Scope[] = [];
  public currentIndex = 0;
  public endIndex = 0;
  public modifier?: BaseModifier;
  public modifiers: Scope[] = [];
  public parent?: Scope;
  public root;
  public sounds: Scope[] = [];
  public text;
  public type;
  private readonly parser;

  constructor({
    parser,
    parent,
    text,
    root,
    type,
    endIndex,
    currentIndex,
    modifier,
  }: ScopeOptions) {
    this.parser = parser;
    this.text = text || '';
    this.root = root || false;
    this.type = type;
    this.endIndex = endIndex || 0;
    this.currentIndex = currentIndex || 0;

    if (parent !== undefined) this.parent = parent;
    if (modifier !== undefined) this.modifier = modifier;
  }

  public flatten(): Scope[] | undefined {
    if (this.type !== SCOPE_TYPE_GROUP) return;

    const flattened = [];

    for (const child of this.children) {
      switch (child.type) {
        case SCOPE_TYPE_GROUP:
          const array = child.flatten();
          if (array) flattened.push(...array);
          break;
        case SCOPE_TYPE_SOUND:
          child.modifiers = child.modifiers.concat(this.modifiers);
          flattened.push(child);
          break;
      }
    }

    return flattened;
  }

  public processChildren() {
    if (this.type !== SCOPE_TYPE_GROUP) return;

    if (this.sounds.length > 0) {
      const newArray = this.children.concat(this.sounds);
      newArray.sort((a, b) => a.endIndex - b.endIndex);
      this.children = newArray;
      this.sounds = [];
    }
  }

  public parseSounds(input: string, collectedModifiers: Scope[]) {
    if (this.type !== SCOPE_TYPE_GROUP) return collectedModifiers;

    if (this.parser.chatsounds.lookup[this.text]) {
      const scope = new Scope({
        parent: this,
        type: SCOPE_TYPE_SOUND,
        text: this.text,
        parser: this.parser,
        endIndex: this.currentIndex + this.text.length,
      });
      this.sounds.push(scope);
    } else {
      let relativeStart = 0;
      while (relativeStart <= this.text.length - 1) {
        let lastSpace = -1;
        let match = false;

        const start = this.text.length - 1;
        for (let i = start; i > relativeStart; i--) {
          const current = this.text[i];

          if (current.match(REPEATED_SPACES_REGEX) || i === start) {
            lastSpace = i;

            const chunk = this.text.substring(relativeStart, i + 1).trim();
            if (chunk.length >= 0 && this.parser.chatsounds.lookup[chunk]) {
              const pos = input.indexOf(
                chunk,
                this.currentIndex + relativeStart
              );
              const scope = new Scope({
                endIndex: pos + chunk.length,
                parent: this,
                parser: this.parser,
                text: chunk,
                type: SCOPE_TYPE_SOUND,
              });
              this.sounds.push(scope);

              relativeStart = i;
              match = true;
              break;
            }
          }
        }

        if (!match)
          if (lastSpace === -1) break;
          else relativeStart = lastSpace + 1;
      }
    }

    if (this.sounds.length > 0) {
      const last = this.sounds[this.sounds.length - 1];
      for (let i = collectedModifiers.length - 1; i >= 0; i--) {
        const modifier = collectedModifiers[i];
        if (modifier.endIndex < last.endIndex) break;
        last.modifiers.unshift(modifier);
        collectedModifiers.splice(i, 1);
      }
    }

    this.text = '';
    return collectedModifiers;
  }

  public unshift(scope: Scope) {
    this.children.unshift(scope);
  }

  public get length() {
    return this.children.length;
  }
}

export default class Parser {
  public readonly chatsounds;

  constructor(chatsounds: Chatsounds) {
    this.chatsounds = chatsounds;
  }

  private regexSafe(string: string) {
    return string.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public parse(input: string) {
    input = input.toLowerCase();

    for (const name in this.chatsounds.modifiers) {
      const modifier = this.chatsounds.modifiers[name];
      if (!modifier.legacyExpression) continue;
      const regex = new RegExp(
        this.regexSafe(modifier.legacyExpression) + '([0-9.]+)',
        'g'
      );
      input = input.replace(regex, (_, argument) => {
        argument = modifier.onLegacyExpressionUsed(argument);
        return ':' + name + '(' + argument + ')';
      });
    }

    const global = new Scope({
      parser: this,
      root: true,
      type: SCOPE_TYPE_GROUP,
    });
    let current = global;
    let collectedModifiers: Scope[] = [];

    for (let i = input.length - 1; i >= 0; i--) {
      const character = input[i];
      current.currentIndex = i;

      switch (character) {
        case ')':
          collectedModifiers = current.parseSounds(input, collectedModifiers);

          const scope = new Scope({
            currentIndex: i,
            endIndex: i,
            parser: this,
            parent: current,
            type: SCOPE_TYPE_GROUP,
          });
          current.unshift(scope);

          if (collectedModifiers.length > 0) {
            scope.modifiers = collectedModifiers;
            collectedModifiers = [];
          }

          current = scope;
          break;
        case '(':
          if (current.root) break;

          collectedModifiers = current.parseSounds(input, collectedModifiers);
          current.processChildren();
          if (current.parent) current = current.parent;
          break;
        case ':':
          const modifier = current.text.split(REPEATED_SPACES_REGEX, 1)[0];

          const selected = this.chatsounds.modifiers[modifier];
          if (selected) {
            let endIndex;
            let args: any[] = selected.defaultArguments;

            if (current.length > 0) {
              const lastScope = current.children[0];
              const assigned =
                lastScope.type === SCOPE_TYPE_MODIFIER_EXPRESSION;

              if (!assigned) {
                lastScope.type = SCOPE_TYPE_MODIFIER_EXPRESSION;

                if (lastScope.modifiers.length > 0) {
                  collectedModifiers = collectedModifiers.concat(
                    lastScope.modifiers
                  );
                  lastScope.modifiers = [];
                }

                lastScope.sounds = [];
                endIndex = lastScope.endIndex;
                const specified = input
                  .substring(lastScope.currentIndex + 1, lastScope.endIndex)
                  .split(',');
                args = args.map((x, i) => specified[i] || x);
              } else endIndex = i + modifier.length;
            } else endIndex = i + modifier.length;

            const modifierInstance = new Scope({
              endIndex,
              modifier: new selected(args),
              parser: this,
              text: '',
              type: SCOPE_TYPE_MISC,
            });

            collectedModifiers.unshift(modifierInstance);
            const space = current.text.search(REPEATED_SPACES_REGEX);
            if (space !== -1)
              current.text = current.text.substring(space).trim();
            else current.text = '';

            current.currentIndex = endIndex;
            collectedModifiers = current.parseSounds(input, collectedModifiers);
          }
          break;
        default:
          current.text = character + current.text;
      }
    }

    global.parseSounds(input, collectedModifiers);
    global.processChildren();

    return global;
  }
}
