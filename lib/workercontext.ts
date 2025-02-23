import { Worker } from 'worker_threads';

import { AudioSettings } from './utils';
import Chatsounds from '.';

export default class WorkerContext {
  public input: string;
  private chatsounds: Chatsounds;

  constructor(chatsounds: Chatsounds, input: string) {
    this.chatsounds = chatsounds;
    this.input = input;
  }

  private runWorker(options: AudioSettings) {
    const worker = new Worker(__filename.replace(/workercontext\.js$/, 'worker.js'), {
      workerData: {
        input: this.input,
        lookup: this.chatsounds.lookup,
        options
      }
    });

    return new Promise<Uint8Array | null>((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }

  public async buffer(options: AudioSettings) {
    const result = await this.runWorker(options);
    if (!result) return null;

    return Buffer.from(result);
  }
}