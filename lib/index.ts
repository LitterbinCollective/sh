import axios from 'axios';
import { decodeArrayStream } from '@msgpack/msgpack';

import CacheManager from './cache';
import { BaseModifier as basemodifier } from './modifiers';
export const BaseModifier = basemodifier;

export interface Chatsound {
  url: string,
  realm: string
};

const UNDERSCORE_DASH_REGEX = /[_-]/g;
const REPEATED_SPACES_REGEX = /\s+/g;

export default class Chatsounds {
  public cache: CacheManager = new CacheManager('cache/');
  public list: Record<string, Record<string, Chatsound[]>> = {};
  public lookup: Record<string, Chatsound[]> = {};
  public modifiers: Record<string, basemodifier> = {};
  private hashes: Record<string, string> = {};

  public useModifiers(modifiers: Record<string, basemodifier>) {
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
          .substring(0, sound.length - '.ogg'.length)
          .replaceAll(UNDERSCORE_DASH_REGEX, ' ')
          .replaceAll(REPEATED_SPACES_REGEX, ' ');

        if (this.list[identifier][sound] === undefined)
          this.list[identifier][sound] = [];

        this.list[identifier][sound].push({
          realm,
          url: `https://raw.githubusercontent.com/${repository}/${branch}/${base}/${path}`
        });
      }

      await this.cache.writeLocalList(hash, repository, branch, this.list[identifier]);
      return true;
    }
  }

  public mergeSources() {
    this.lookup = {
      sh: []
    };

    for (const _ in this.list) {
      const source = this.list[_];

      for (const name in source) {
        const data = source[name];
        if (this.lookup[name] === undefined)
          this.lookup[name] = [];

        const urls: Record<string, true> = {};
        for (const _ in data) {
          const chatsound = data[_];
          if (urls[chatsound.url])
            continue;

          this.lookup[name].push(chatsound);
          urls[chatsound.url] = true;
        }

        this.lookup[name].sort((a, b) => a.url.length - b.url.length);
      }
    }
  }
}