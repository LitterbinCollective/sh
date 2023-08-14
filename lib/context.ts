import { spawn } from 'child_process';

import Chatsounds, { Chatsound } from '.';
import {
  AUDIO_BUFFER_TIMEOUT_MS,
  FILTER_NAME_LENGTH,
  MUTE_CHATSOUND,
  OUTPUT_AUDIO_CHANNELS,
  OUTPUT_SAMPLE_RATE,
  TEMPLATE_REGEX,
  TYPE_BUFFER,
  TYPE_STREAM,
} from './constants';
import { BaseModifier } from './modifiers';
import { Scope } from './parser';

export default class Context<T = Buffer | ReadableStream> {
  private scope: Scope;
  private _flattened?: Scope[];
  private _mute?: boolean;
  private readonly chatsounds;
  private readonly type;

  constructor(chatsounds: Chatsounds, input: string, type: string) {
    this.chatsounds = chatsounds;
    this.scope = this.chatsounds.parser.parse(input);
    this.type = type;
  }

  private get flattened() {
    if (this._flattened) return this._flattened;
    return (this._flattened = this.scope.flatten());
  }

  public get mute(): boolean {
    if (this._mute !== undefined) return this._mute;

    if (this.flattened && this.flattened.length !== 0)
      for (const sound of this.flattened)
        if (sound.text === MUTE_CHATSOUND) return (this._mute = true);

    return (this._mute = false);
  }

  private async prepare() {
    if (!this.flattened || this.flattened.length === 0) return;
    let last: Chatsound | undefined;

    let paths = await Promise.all(
      this.flattened.map(scope => {
        const sound = this.chatsounds.getRequiredSound(scope, last);
        last = sound;

        if (!sound) return;

        // if parser found it, this should be able to too
        return this.chatsounds.cache.getSound((sound as Chatsound).url);
      })
    );

    const named: string[] = [];
    const filterComplex: string[] = [];
    const delayFilters = [];
    let time = 0;
    let soundCount = 0;
    for (let i = 0; i < this.flattened.length; i++) {
      const path = paths[i];
      if (!path) continue;
      const scope = this.flattened[i];
      const modifiers = scope.modifiers.sort(
        (a, b) => (b.modifier?.priority || 0) - (a.modifier?.priority || 0)
      );

      let output = (named[i] = soundCount + ':a');
      let duration = (await this.chatsounds.cache.getDuration(path)) * 1000;
      const stack: Record<string, number> = {};
      const locals = new Map<string, any>();
      for (const modifierWrapper of modifiers) {
        const modifier = modifierWrapper.modifier as BaseModifier;
        const { name: className } = modifier.constructor;

        if (stack[className] && stack[className] >= modifier.filterStackLimit)
          continue;

        if (!stack[className]) stack[className] = 0;
        stack[className]++;

        const names = [named[i]];
        const template = modifier.filterTemplate(duration, locals);
        if (template)
          filterComplex.push(
            template.replace(TEMPLATE_REGEX, (_match, number) => {
              let name = names[number];
              if (!name) {
                name = Math.random()
                  .toString(16)
                  .substring(2, FILTER_NAME_LENGTH);
                names.push(name);
              }
              return name;
            })
          );

        duration = modifier.modifyDuration(duration);
        output = named[named.length - 1] = names[names.length - 1];
      }

      const delayedOutput = output + '-d';
      delayFilters.push(`[${output}]adelay=${time}|${time}[${delayedOutput}]`);
      named[i] = delayedOutput;

      time += duration;
      soundCount++;
    }

    const filteredPaths = paths.filter((x): x is string => x !== undefined);

    const filterComplexArgument = [
      delayFilters.join(';'),
      named.reduce((p, c) => (p += '[' + c + ']'), '') +
        `amix=inputs=${filteredPaths.length}:dropout_transition=0:normalize=0[outa]`,
    ];

    if (filterComplex.length !== 0)
      filterComplexArgument.unshift(filterComplex.join(';'));

    const args = [
      ...filteredPaths.map(path => ['-i', path]).flat(),
      '-filter_complex',
      filterComplexArgument.join(';'),
      '-map',
      '[outa]',
      '-f',
      's16le',
      '-ar',
      OUTPUT_SAMPLE_RATE.toString(),
      '-ac',
      OUTPUT_AUDIO_CHANNELS.toString(),
      '-',
    ];

    return spawn('ffmpeg', args);
  }

  public async audio(): Promise<T | null> {
    switch (this.type) {
      case TYPE_BUFFER: {
        const child = await this.prepare();
        if (!child) return null;
        return await new Promise<T>((res, rej) => {
          const timeout = setTimeout(
            () => {
              if (!child.killed)
                child.kill();
              rej('timeout');
            },
            AUDIO_BUFFER_TIMEOUT_MS
          );
          let buffer = Buffer.alloc(0);

          child.stdout.on(
            'data',
            data => (buffer = Buffer.concat([buffer, data]))
          );

          child.stdout.on('end', () => {
            res(buffer as T);
            clearTimeout(timeout);
          });
        });
      }
      case TYPE_STREAM: {
        const child = await this.prepare();
        if (!child) return null;
        return child.stdout as T;
      }
      default:
        return null;
    }
  }
}
