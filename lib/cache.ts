import axios from 'axios';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, promises, readFileSync } from 'fs';
import { join } from 'path';
import internal = require('stream');

import { Chatsound } from '.';
import { OUTPUT_AUDIO_CHANNELS, OUTPUT_SAMPLE_RATE } from './constants';

const SOUNDS_CACHE_DIRECTORY = 'sounds/';
const SOURCES_CACHE_DIRECTORY = 'sources/';

interface CachedSource {
  hash: string;
  sounds: Record<string, Chatsound[]>;
}

export default class CacheManager {
  public directory;
  private _durations: Record<string, number> | undefined;

  constructor(cacheDir: string) {
    this.directory = cacheDir;
  }

  private async createNeededDirectories() {
    try {
      await promises.mkdir(this.directory);
      await promises.mkdir(join(this.directory, SOUNDS_CACHE_DIRECTORY));
      await promises.mkdir(join(this.directory, SOURCES_CACHE_DIRECTORY));
    } catch (err) {}
  }

  private getCachedSourceFilename(identifier: string) {
    const filename = createHash('sha256').update(identifier).digest('hex');
    return join(this.directory, SOURCES_CACHE_DIRECTORY, filename + '.json');
  }

  private getCachedSoundFilename(url: string) {
    const filename = createHash('sha256').update(url).digest('hex');
    return join(this.directory, SOUNDS_CACHE_DIRECTORY, filename + '.ogg');
  }

  private get cachedDurationsFile() {
    return join(this.directory, SOUNDS_CACHE_DIRECTORY, 'durations.dat');
  }

  private get durations() {
    if (this._durations) return this._durations;
    return (this._durations = this.unserializeDurations());
  }

  private unserializeDurations() {
    let contents = Buffer.alloc(0);
    try {
      contents = readFileSync(this.cachedDurationsFile);
    } catch (err) {}

    let durations: Record<string, number> = {};
    for (const line of contents.toString().split('\n')) {
      const [path, duration] = line.split('\0');
      durations[path] = +duration;
    }

    return durations;
  }

  public async getDuration(path: string): Promise<number> {
    if (this.durations[path]) return this.durations[path];

    const duration = await new Promise<number>(res => {
      const child = spawn('ffprobe', [
        '-print_format',
        'json',
        '-show_entries',
        'format=duration',
        path,
      ]);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', data => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () => {
        const json = JSON.parse(buffer.toString());
        res(+json.format.duration);
      });
    });

    // motherfucker
    (this.durations[path] as any) = duration;
    await promises.appendFile(
      this.cachedDurationsFile,
      '\n' + path + '\0' + duration
    );
    return duration;
  }

  private convertToSuitableFormat(stream: internal.Readable) {
    return new Promise<Buffer>(res => {
      const child = spawn('ffmpeg', [
        '-i', '-',
        '-ac', OUTPUT_AUDIO_CHANNELS.toString(),
        '-ar', OUTPUT_SAMPLE_RATE.toString(),
        '-c:a', 'libvorbis',
        '-f', 'ogg',
        '-'
      ]);

      child.stderr.on('data', (x) => console.log(x.toString()));

      stream.pipe(child.stdin);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', data => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () =>
        res(buffer)
      );
    });
  }

  public async getSound(url: string) {
    await this.createNeededDirectories();

    const path = this.getCachedSoundFilename(url);

    if (!existsSync(path)) {
      const { data } = await axios.get(url, { responseType: 'stream' });
      const buffer = await this.convertToSuitableFormat(data);
      await promises.writeFile(path, buffer);
    }

    return path;
  }

  public async compareLocalList(hash: string, identifier: string) {
    await this.createNeededDirectories();

    const path = this.getCachedSourceFilename(identifier);

    if (existsSync(path)) {
      try {
        const data: CachedSource = JSON.parse(
          (await promises.readFile(path)).toString()
        );
        return { sounds: data.sounds, use: data.hash === hash };
      } catch (err) {}
    }

    return { use: false };
  }

  public async writeLocalList(
    hash: string,
    identifier: string,
    sounds: Record<string, Chatsound[]>
  ) {
    await this.createNeededDirectories();

    const path = this.getCachedSourceFilename(identifier);
    await promises.writeFile(
      path,
      JSON.stringify({ sounds, hash } as CachedSource)
    );
  }
}
