import { createHash } from 'crypto';
import { existsSync, promises } from 'fs';
import { join } from 'path';

import { Chatsound } from '.';

const SOUNDS_CACHE_DIRECTORY = 'sounds/';
const SOURCES_CACHE_DIRECTORY = 'sources/';

interface CachedSource {
  hash: string,
  sounds: Record<string, Chatsound[]>;
}

export default class CacheManager {
  public directory;

  constructor(cacheDir: string) {
    this.directory = cacheDir;
  }

  private async createNeededDirectories() {
    try {
      await promises.mkdir(this.directory);
      await promises.mkdir(join(this.directory, SOUNDS_CACHE_DIRECTORY));
      await promises.mkdir(join(this.directory, SOURCES_CACHE_DIRECTORY));
    } catch(err) {}
  }

  private getCachedSourceFilename(repository: string, branch: string) {
    const filename = createHash('sha256')
      .update(repository + '#' + branch)
      .digest('hex');
    return join(this.directory, SOURCES_CACHE_DIRECTORY, filename + '.json')
  }

  private getCachedSoundFilename(url: string) {
    const filename = createHash('sha256')
      .update(url)
      .digest('hex');
    return join(this.directory, SOUNDS_CACHE_DIRECTORY, filename + '.ogg')
  }

  public async compareLocalList(hash: string, repository: string, branch: string) {
    await this.createNeededDirectories();

    const path = this.getCachedSourceFilename(repository, branch);

    if (existsSync(path)) {
      try {
        const data: CachedSource = JSON.parse((await promises.readFile(path)).toString());
        return { sounds: data.sounds, use: data.hash === hash };
      } catch (err) {}
    }

    return { use: false };
  }

  public async writeLocalList(hash: string, repository: string, branch: string, sounds: Record<string, Chatsound[]>) {
    await this.createNeededDirectories();

    const path = this.getCachedSourceFilename(repository, branch);
    await promises.writeFile(path, JSON.stringify(
      { sounds, hash } as CachedSource
    ));
  }
}