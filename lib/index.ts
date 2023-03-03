import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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
  UNDERSCORE_DASH_REGEX,
} from './constants';
import Context from './context';
import { BaseModifier as basemodifier } from './modifiers';
import Parser, { Scope } from './parser';

export const BaseModifier = basemodifier;
export { defaultModifiers } from './modifiers';

export interface Chatsound {
  url: string;
  realm: string;
}

interface ChatsoundsOptions {
  modifiers?: Record<string, typeof basemodifier>,
  gitHubToken?: string
}

export default class Chatsounds {
  public cache: CacheManager = new CacheManager('cache/');
  public list: Record<string, Record<string, Chatsound[]>> = {};
  public lookup: Record<string, Chatsound[]> = {};
  public parser: Parser = new Parser(this);
  public modifiers: Record<string, typeof basemodifier> = {};
  private axios: AxiosInstance;
  private hashes: Record<string, string> = {};

  constructor(options?: ChatsoundsOptions) {
    let axiosOptions: AxiosRequestConfig<any> | undefined;
    
    if (options) {
      if (options.modifiers)
        this.modifiers = options.modifiers;

      if (options.gitHubToken)
        axiosOptions = {
          headers: {
            Authorization: 'Bearer ' + options.gitHubToken
          }
        };
    }

    this.axios = axios.create(axiosOptions);
  }

  public useModifiers(modifiers: Record<string, typeof basemodifier>) {
    for (const modifier in modifiers) {
      if (this.modifiers[modifier]) continue;
      this.modifiers[modifier] = modifiers[modifier];
    }
  }

  private async getGitHubSHA(repository: string, branch: string) {
    const { data } = await this.axios.get(
      `https://api.github.com/repos/${repository}/git/refs`
    );
    const search = 'refs/heads/' + branch;
    for (const { ref, object } of data) if (ref === search) return object.sha;
  }

  private async gitHubCacheSafetyCheck(
    repository: string,
    branch: string,
    base: string
  ) {
    const identifier = repository + '#' + branch + '/' + base;
    const hash = await this.getGitHubSHA(repository, branch);
    const storedInMemory = this.hashes[identifier] === hash;

    let sounds = null,
      use = false;

    if (!storedInMemory) {
      const returned = await this.cache.compareLocalList(hash, identifier);
      sounds = returned.sounds;
      use = returned.use;
    }

    return { identifier, use, sounds, storedInMemory, hash };
  }

  public async useSourcesFromGitHub(
    repository: string,
    branch: string,
    base: string
  ) {
    const response = await this.gitHubCacheSafetyCheck(
      repository,
      branch,
      base
    );
    if (!response.storedInMemory) return false;

    base = base.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const basePathRegex = new RegExp('^' + base, 'g');

    if (response.use && response.sounds) {
      this.list[response.identifier] = response.sounds;
      this.hashes[response.identifier] = response.hash;
      return true;
    } else {
      const { data } = await this.axios.get(
        `https://api.github.com/repos/${repository}/git/trees/${branch}?recursive=1`
      );
      this.list[response.identifier] = {};

      for (const fileData of data.tree)
        if (fileData.path.endsWith('.ogg')) {
          const path = fileData.path.replaceAll(basePathRegex, '');
          const chunks = path.split('/');
          const realm = chunks[1];
          const sound = chunks[2]
            .toLowerCase()
            .replaceAll(OGG_FILE_EXTENSION_REGEX, '')
            .replaceAll(UNDERSCORE_DASH_REGEX, ' ')
            .replaceAll(REPEATED_SPACES_REGEX, ' ')
            .trim();

          if (sound.length > 0) {
            if (this.list[response.identifier][sound] === undefined)
              this.list[response.identifier][sound] = [];

            this.list[response.identifier][sound].push({
              realm,
              url: `https://raw.githubusercontent.com/${repository}/${branch}/${fileData.path}`,
            });
          }
        }

      await this.cache.writeLocalList(
        response.hash,
        response.identifier,
        this.list[response.identifier]
      );
      this.hashes[response.identifier] = response.hash;
      return true;
    }
  }

  public async useSourcesFromGitHubMsgPack(
    repository: string,
    branch: string,
    base: string
  ) {
    const response = await this.gitHubCacheSafetyCheck(
      repository,
      branch,
      base
    );
    if (!response.storedInMemory) return false;

    if (response.use && response.sounds) {
      this.list[response.identifier] = response.sounds;
      this.hashes[response.identifier] = response.hash;
      return true;
    } else {
      const { data } = await axios.get(
        `https://raw.githubusercontent.com/${repository}/${branch}/${base}/list.msgpack`,
        { responseType: 'stream' }
      );
      const generator = decodeArrayStream(data);
      this.list[response.identifier] = {};

      for await (const data of generator) {
        let [realm, sound, path] = data as string[];
        realm = realm.toLowerCase();
        sound = sound
          .toLowerCase()
          .replaceAll(OGG_FILE_EXTENSION_REGEX, '')
          .replaceAll(UNDERSCORE_DASH_REGEX, ' ')
          .replaceAll(REPEATED_SPACES_REGEX, ' ');

        if (sound.length > 0) {
          if (this.list[response.identifier][sound] === undefined)
            this.list[response.identifier][sound] = [];

          this.list[response.identifier][sound].push({
            realm,
            url: `https://raw.githubusercontent.com/${repository}/${branch}/${base}/${path}`,
          });
        }
      }

      await this.cache.writeLocalList(
        response.hash,
        response.identifier,
        this.list[response.identifier]
      );
      this.hashes[response.identifier] = response.hash;
      return true;
    }
  }

  public getRequiredSound(sound: Scope, last?: Chatsound) {
    if (sound.type !== SCOPE_TYPE_SOUND) return;

    let matches = this.lookup[sound.text];
    let index = Math.floor(Math.random() * matches.length);

    let modified = false;
    for (const modifier of sound.modifiers) {
      if (!modifier.modifier) continue;
      const { index: i, matches: m } = modifier.modifier.onSelection(
        index,
        matches
      );

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
        if (sound.realm === last.realm) realmSpecific.push(sound);

      if (realmSpecific.length > 0) {
        matches = realmSpecific;
        index = Math.floor(Math.random() * matches.length);
      }
    }

    if (index > matches.length - 1) index = matches.length - 1;
    if (index < 0) index = 0;

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
      [MUTE_CHATSOUND]: [],
    };

    for (const src in this.list) {
      const source = this.list[src];

      for (const name in source) {
        const data = source[name];
        if (this.lookup[name] === undefined) this.lookup[name] = [];

        const urls: Record<string, true> = {};
        for (const chatsound of data) {
          if (urls[chatsound.url]) continue;

          this.lookup[name].push(chatsound);
          urls[chatsound.url] = true;
        }

        this.lookup[name].sort((a, b) => a.url.localeCompare(b.url));
      }
    }
  }
}
