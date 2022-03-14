module.exports.njs = function (args, delay) {
  const defaults = [ 0.25, 0.5 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  const delays = [];
  const decays = [];

  const decayFactor = 1 - args[1]
  let delayFactor = 0
  for (let i = 1 - decayFactor; i > 0; i -= decayFactor) {
    if (Math.floor(i * 100) / 100 == 0) break;

    delayFactor++;
    const delay = args[0] * delayFactor * 1000;
    if (delay > 90000) break;

    delays.push(delay);
    decays.push(i.toFixed(2));
  }

  return {
    filter: `[{0}]aecho=1:1:${delays.join('|')}:${decays.join('|')}[{1}]`,
    delay: delays[delays.length - 1] + delay
  };
}

module.exports.browser = async function (args, delay, offset, input, ctx) {
  const defaults = [ 0.25, 0.5 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  args[0] = Math.ceil(args[0] * ctx.sampleRate);

  let size = 1;
  while ((size <<= 1) < args[0]);
  const echo_buffer = ctx.createBuffer(2, size, ctx.sampleRate);

  const scriptNode = ctx.createScriptProcessor(4096, 2, 2);

  let pos = 0;
  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;

    const echol = echo_buffer.getChannelData(0);
    const echor = echo_buffer.getChannelData(1);

    const bufferLeft = inputBuffer.getChannelData(0);
    const bufferRight = inputBuffer.getChannelData(1);
    const outLeft = outputBuffer.getChannelData(0);
    const outRight = outputBuffer.getChannelData(1);

    for (let sample = 0; sample < inputBuffer.length; sample++) {
      const echo_index = (pos >> 0) % args[0];
      echol[echo_index] = echol[echo_index] * args[1] + bufferLeft[sample];
      echor[echo_index] = echor[echo_index] * args[1] + bufferRight[sample];
      outLeft[sample] += echol[echo_index];
      outRight[sample] += echor[echo_index];
      pos++;
    }
  }

  return { insert: scriptNode };
}