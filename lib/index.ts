import { decodeArrayStream } from '@msgpack/msgpack';

import CacheManager from './cache';
import {
  Chatsound,
  ChatsoundsOptions,
  MUTE_CHATSOUND,
  OGG_FILE_EXTENSION_REGEX,
  REPEATED_SPACES_REGEX,
  SCOPE_TYPE_SOUND,
  UNDERSCORE_DASH_REGEX,
} from './utils';
import Context from './context';
import { BaseModifier } from './modifiers';
import Parser, { Scope } from './parser';

export * from './modifiers';

export default class Chatsounds {
  public cache: CacheManager = new CacheManager('cache/');
  public list: Record<string, Record<string, Chatsound[]>> = {};
  public lookup: Record<string, Chatsound[]> = {};
  public parser: Parser = new Parser(this);
  public modifiers: Record<string, typeof BaseModifier> = {};
  private headers = {};
  private hashes: Record<string, string> = {};

  constructor(options?: ChatsoundsOptions) {
    if (options) {
      if (options.modifiers)
        this.modifiers = options.modifiers;

      if (options.gitHubToken)
        this.headers = {
          Authorization: 'Bearer ' + options.gitHubToken
        };
    }
  }

  public useModifiers(modifiers: Record<string, typeof BaseModifier>) {
    for (const modifier in modifiers) {
      if (this.modifiers[modifier]) continue;
      this.modifiers[modifier] = modifiers[modifier];
    }
  }

  private async fetchGitHub(path: string) {
    const res = await fetch('https://api.github.com' + path, { headers: this.headers });
    if (!res.ok)
      throw new Error('github api not ok, path used: ' + path);
    return await res.json();
  }

  private async getGitHubSHA(repository: string, branch: string) {
    const data = await this.fetchGitHub(`/repos/${repository}/git/refs`);
    const search = 'refs/heads/' + branch;
    for (const { ref, object } of data) if (ref === search) return object.sha;
  }

  private async checkGitHubCache(
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
    const response = await this.checkGitHubCache(
      repository,
      branch,
      base
    );
    if (response.storedInMemory) return false;

    base = base.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const basePathRegex = new RegExp('^' + base, 'g');

    if (response.use && response.sounds) {
      this.list[response.identifier] = response.sounds;
      this.hashes[response.identifier] = response.hash;
      return true;
    } else {
      const data = await this.fetchGitHub(`/repos/${repository}/git/trees/${branch}?recursive=1`);
      this.list[response.identifier] = {};

      for (const fileData of data.tree)
        // valorant/sage/!cant use this yet.ogg
        // ssbb_sonic/sonicfx/....ogg
        if (fileData.path.endsWith('.ogg')) {
          const path = fileData.path.replaceAll(basePathRegex, '');
          const chunks = path.split('/');
          const realm = chunks[1];
          let sound = chunks[2];

          // this signals to use the file name instead of the folder's name, which is located in the realm
          if (chunks[chunks.length - 1].startsWith('!'))
            sound = chunks[chunks.length - 1].slice(1);

          sound = sound
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
    const response = await this.checkGitHubCache(
      repository,
      branch,
      base
    );
    if (response.storedInMemory) return false;

    if (response.use && response.sounds) {
      this.list[response.identifier] = response.sounds;
      this.hashes[response.identifier] = response.hash;
      return true;
    } else {
      const res = await fetch(
        `https://raw.githubusercontent.com/${repository}/${branch}/${base}/list.msgpack`,
      );
      if (!res.ok || !res.body)
        throw new Error('githubusercontent not ok');

      const generator = decodeArrayStream(res.body);
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

  public new(script: string) {
    return new Context(this, script);
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
