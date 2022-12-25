import axios from 'axios';
import { Readable } from 'stream';
import { decodeArrayStream } from '@msgpack/msgpack';

import CacheManager from './cache';
import {
  MUTE_CHATSOUND,
  OGG_FILE_EXTENSION_REGEX,
  REPEATED_SPACES_REGEX,
  SCOPE_TYPE_SOUND,
  TYPE_BUFFER,
  TYPE_STREAM,
  UNDERSCORE_DASH_REGEX
} from './constants';
import Context from './context';
import { BaseModifier as basemodifier } from './modifiers';
import Parser, { Scope } from './parser';

export const BaseModifier = basemodifier;
export { defaultModifiers } from './modifiers';

export interface Chatsound {
  url: string,
  realm: string
};

export default class Chatsounds {
  public cache: CacheManager = new CacheManager('cache/');
  public list: Record<string, Record<string, Chatsound[]>> = {};
  public lookup: Record<string, Chatsound[]> = {};
  public parser: Parser = new Parser(this);
  public modifiers: Record<string, typeof basemodifier> = {};
  private hashes: Record<string, string> = {};

  public useModifiers(modifiers: Record<string, typeof basemodifier>) {
    for (const modifier in modifiers) {
      if (this.modifiers[modifier])
        continue;
      this.modifiers[modifier] = modifiers[modifier];
    }
  }

  private async getGitHubSHA(repository: string, branch: string) {
    const { data } = await axios.get(`https://api.github.com/repos/${repository}/git/refs`);
    const search = 'refs/heads/' + branch;
    for (const { ref, object } of data)
      if (ref === search)
        return object.sha;
  }

  public async useSourcesFromGitHubMsgPack(repository: string, branch: string, base: string) {
    const identifier = repository + '#' + branch;
    const hash = await this.getGitHubSHA(repository, branch);
    const storedLocally = this.hashes[identifier] !== undefined;
    if (storedLocally && this.hashes[identifier] === hash)
      return false;

    let sounds = null,
      use = false;

    if (!storedLocally) {
      const returned = await this.cache.compareLocalList(hash, repository, branch);
      sounds = returned.sounds;
      use = returned.use;
    }

    if (use && sounds) {
      this.list[identifier] = sounds;
      return !storedLocally;
    } else {
      const { data } = await axios.get(`https://raw.githubusercontent.com/${repository}/${branch}/${base}/list.msgpack`, { responseType: 'stream', });
      const generator = decodeArrayStream(data);
      this.list[identifier] = {};

      for await (const data of generator) {
        let [ realm, sound, path ] = data as string[];
        realm = realm.toLowerCase();
        sound = sound
          .toLowerCase()
          .replaceAll(OGG_FILE_EXTENSION_REGEX, '')
          .replaceAll(UNDERSCORE_DASH_REGEX, ' ')
          .replaceAll(REPEATED_SPACES_REGEX, ' ');

        if (sound.length > 0) {
          if (this.list[identifier][sound] === undefined)
            this.list[identifier][sound] = [];

          this.list[identifier][sound].push({
            realm,
            url: `https://raw.githubusercontent.com/${repository}/${branch}/${base}/${path}`
          });
        }
      }

      await this.cache.writeLocalList(hash, repository, branch, this.list[identifier]);
      return true;
    }
  }

  public getRequiredSound(sound: Scope, last?: Chatsound) {
    if (sound.type !== SCOPE_TYPE_SOUND)
      return;

    let matches = this.lookup[sound.text];
    let index = Math.floor(Math.random() * matches.length);

    let modified = false;
    for (const modifier of sound.modifiers) {
      if (!modifier.modifier)
        continue;
      const { index: i, matches: m } = modifier.modifier.onSelection(index, matches);

      if (index !== i) {
        index = i;
        modified = true;
      }

      if (matches !== m) {
        matches = m;
        modified = true;
      }
    }

    if (!modified && last !== undefined) {
      let realmSpecific = [];

      for (const sound of matches)
        if (sound.realm === last.realm)
          realmSpecific.push(sound);

      if (realmSpecific.length > 0) {
        matches = realmSpecific
        index = Math.floor(Math.random() * matches.length);
      }
    }

    if (index > matches.length - 1)
      index = matches.length - 1;
    if (index < 0)
      index = 0;

    return matches[index];
  }

  public newBuffer(input: string): Context<Buffer> {
    return new Context<Buffer>(this, input, TYPE_BUFFER);
  }

  public newStream(input: string): Context<Readable> {
    return new Context<Readable>(this, input, TYPE_STREAM);
  }

  public mergeSources() {
    this.lookup = {
      [MUTE_CHATSOUND]: []
    };

    for (const src in this.list) {
      const source = this.list[src];

      for (const name in source) {
        const data = source[name];
        if (this.lookup[name] === undefined)
          this.lookup[name] = [];

        const urls: Record<string, true> = {};
        for (const chatsound of data) {
          if (urls[chatsound.url])
            continue;

          this.lookup[name].push(chatsound);
          urls[chatsound.url] = true;
        }

        this.lookup[name].sort((a, b) => a.url.length - b.url.length);
      }
    }
  }
};