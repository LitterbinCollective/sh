function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

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

  const decayFactor = 1 - args[1];
  let delayFactor = 0;

  const MAXIMUM = 512;
  let iterations = 0;
  for (let i = 1 - decayFactor; i > 0; i -= decayFactor) {
    if (Math.floor(i * 100) / 100 == 0 || iterations >= MAXIMUM) break;

    delayFactor++;
    const delay = args[0] * delayFactor * 1000;
    if (delay > 90000) break;

    delays.push(delay);
    decays.push(i.toFixed(2));
    iterations++;
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

  const offlineCtx = new OfflineAudioContext(2, ctx.sampleRate * delay / 1000, ctx.sampleRate);
  const input_ = offlineCtx.createBufferSource(0, offset / 1000, (delay + offset) / 1000);
  input_.buffer = input.buffer;
  input_.loop = input.loop;
  input_.loopStart = input.loopStart;
  input_.connect(offlineCtx.destination);
  input_.start(0, offset / 1000, delay / 1000);
  offset = 0;

  const buffer = await offlineCtx.startRendering();

  const previousInputPlaybackValue = input.playbackRate.value;
  input = ctx.createBufferSource();
  input.buffer = buffer;
  input.playbackRate.value = previousInputPlaybackValue;

  const samples = Math.ceil(args[0] * ctx.sampleRate);

  let size = 1;
  while ((size <<= 1) < samples);
  const echo_buffer = ctx.createBuffer(2, size, ctx.sampleRate);

  const scriptNode = ctx.createScriptProcessor(4096, 2, 2);

  let pos = 0;
  const MAX = 1;
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
      const echo_index = (pos >> 0) % samples;
      echol[echo_index] = echol[echo_index] * args[1] + bufferLeft[sample];
      echor[echo_index] = echor[echo_index] * args[1] + bufferRight[sample];
      outLeft[sample] += echol[echo_index];
      outRight[sample] += echor[echo_index];

      pos += input.playbackRate.value;

      outLeft[sample] = clamp(outLeft[sample], -MAX, MAX);
      outRight[sample] = clamp(outRight[sample], -MAX, MAX);
      if (!isFinite(outLeft[sample]))
        outLeft[sample] = 0;
      if (!isFinite(outRight[sample]))
        outRight[sample] = 0;
    }
  }

  const decayFactor = 1 - args[1];
  let newDelay = 0;
  let delayFactor = 0;
  for (let i = 1; i > 0; i -= decayFactor) {
    if (Math.floor(i * 100) / 100 == 0) break;

    delayFactor++;
    const delay_ = args[0] * delayFactor * 1000;
    if (delay_ > 90000) break;

    newDelay = delay_;
  }

  return {
    insert: scriptNode,
    delay: newDelay + delay,
    end: newDelay + delay,
    node: input
  };
}