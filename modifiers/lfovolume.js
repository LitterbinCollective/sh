function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

module.exports.njs = function (args) {
  const defaults = [ 5, 1 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  if (args[1] === 0) return { filter: '', delay: false };
  return {
    filter: `[{0}]tremolo=f=${clamp(args[0], 0.1, 20000)}:d=${clamp(args[1], 0, 1)}[{1}]`,
    delay: false
  };
}

module.exports.browser = async function (args, delay, offset, input, ctx) {
  const defaults = [ 5, 0.1 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  const scriptNode = ctx.createScriptProcessor(4096, 2, 2);

  let pos = 0;
  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;

    const bufferLeft = inputBuffer.getChannelData(0);
    const bufferRight = inputBuffer.getChannelData(1);
    const outLeft = outputBuffer.getChannelData(0);
    const outRight = outputBuffer.getChannelData(1);

    for (let sample = 0; sample < inputBuffer.length; sample++) {
      const index = (pos >> 0) % inputBuffer.length;
      const vol = Math.sin(
        pos / ctx.sampleRate * 10 * args[0]
      ) * args[1];
      outLeft[sample] += bufferLeft[index] * vol;
      outRight[sample] += bufferRight[index] * vol;
      pos++;
    }
  }

  return { insert: scriptNode };
}