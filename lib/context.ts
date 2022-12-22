import { spawn } from 'child_process';

import Chatsounds, { Chatsound } from '.';
import {
  FILTER_NAME_LENGTH,
  OUTPUT_AUDIO_CHANNELS,
  OUTPUT_SAMPLE_RATE,
  TEMPLATE_REGEX,
  TYPE_BUFFER,
  TYPE_STREAM
} from './constants';
import { BaseModifier } from './modifiers';
import { Scope } from './parser';

export default class Context<T = Buffer | ReadableStream> {
  private scope: Scope;
  private _flattened?: Scope[];
  private readonly chatsounds;
  private readonly type;

  constructor(chatsounds: Chatsounds, input: string, type: string) {
    this.chatsounds = chatsounds;
    this.scope = this.chatsounds.parser.parse(input);
    console.log(this.scope);
    console.log(this.flattened);
    this.type = type;
  }

  private get flattened() {
    if (this._flattened)
      return this._flattened;
    return this._flattened = this.scope.flatten();
  }

  // check sh
  public get mute(): boolean {
    return false;
  }

  private async prepare() {
    if (!this.flattened) return;
    let last: Chatsound | undefined;

    let paths = await Promise.all(
      this.flattened.map(scope => {
        const sound = this.chatsounds.getRequiredSound(scope, last);
        last = sound;

        // if parser found it, this should be able to too
        return this.chatsounds.cache.getSound((sound as Chatsound).url);
      })
    );

    paths = paths.map(path => [ '-i', path ]).flat();

    const named: string[] = [];
    const filterComplex: string[] = [];
    for (let i = 0; i < this.flattened.length; i++) {
      const scope = this.flattened[i];

      named.push(i + ':a');
      for (const modifierWrapper of scope.modifiers) {
        const modifier = modifierWrapper.modifier as BaseModifier;

        const names = [ named[named.length - 1] ];
        const processed = modifier.filterTemplate;
        if (processed)
          filterComplex.push(
            processed.replace(TEMPLATE_REGEX, (_match, number) => {
              let name = names[number];
              if (!name) {
                name = Math.random().toString(16).substring(2, FILTER_NAME_LENGTH);
                names.push(name);
              }
              return name;
            })
          );
        named[named.length - 1] = names[names.length - 1];
      }
    }

    filterComplex.push(
      named.reduce((p, c) => p += `[${c}]`, '') +
      `concat=n=${paths.length / 2}:v=0:a=1[outa]`
    );

    const args = [
      ...paths,
      '-filter_complex', filterComplex.join(';'),
      '-map', '[outa]',
      '-f', 's16le',
      '-ar', OUTPUT_SAMPLE_RATE.toString(),
      '-ac', OUTPUT_AUDIO_CHANNELS.toString(),
      '-'
    ];

    console.log(args);
    return spawn('ffmpeg', args);
  }

  public async audio(): Promise<T | null> {
    switch (this.type) {
      case TYPE_BUFFER:
        return null;
      case TYPE_STREAM:
        const child = await this.prepare();
        if (!child)
          return null;
        return child.stdout as T;
      default:
        return null;
    }
  }
}