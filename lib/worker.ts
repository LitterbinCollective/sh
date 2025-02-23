import { isMainThread, workerData, parentPort } from 'worker_threads';
import Chatsounds from '.';

if (isMainThread)
  throw new Error('cannot import worker in main thread');

const sh = new Chatsounds;
sh.lookup = workerData.lookup;

const context = sh.new(workerData.input);
(async function() {
  const result = await context.buffer(workerData.options);
  parentPort?.postMessage(result);
})();