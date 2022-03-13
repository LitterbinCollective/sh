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

  const delays = [];
  const decays = [];

  const decayFactor = 1 - args[1]
  let delayFactor = 0
  for (let i = 1 - decayFactor; i > 0; i -= decayFactor) {
    if (Math.floor(i * 100) / 100 == 0) break;

    delayFactor++;
    const delay_ = args[0] * delayFactor * 1000;
    if (delay_ > 90000) break;

    delays.push(delay_);
    decays.push(i);
  }

  const offlineCtx = new OfflineAudioContext(
    2,
    ctx.sampleRate * (delays[delays.length - 1] + delay) / 1000,
    ctx.sampleRate
  );

  const firstInput = offlineCtx.createBufferSource(0, offset / 1000, (delay + offset) / 1000);
  firstInput.buffer = input.buffer;
  firstInput.loop = input.loop;
  firstInput.loopStart = input.loopStart;
  firstInput.connect(offlineCtx.destination);
  firstInput.start(0, offset / 1000, delay / 1000);

  for (let v = 0; v < delays.length; v++) {
    const i = decays[v];
    const delay_ = delays[v];
    const input_ = offlineCtx.createBufferSource(0, offset / 1000, (delay + offset) / 1000);
    input_.buffer = input.buffer;
    input_.loop = input.loop;
    input_.loopStart = input.loopStart;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = i;
    console.log(delay_, i);
    input_.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    input_.start(delay_ / 1000, offset / 1000, delay / 1000);
  }

  const buffer = await offlineCtx.startRendering();
  input = ctx.createBufferSource();
  input.buffer = buffer;
  offset = 0;

  return {
    node: input,
    delay: delays[delays.length - 1] + delay,
    end: delays[delays.length - 1] + delay,
    offset
  };
}