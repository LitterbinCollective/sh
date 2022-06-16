module.exports.njs = function ([num], delay) {
  num = Number(num);
  if (isNaN(num) || !isFinite(num) || num <= 0) num = 1;
  return {
    filter: `[{0}]aloop=loop=${num - 1}:size=${48 * delay}[{1}]`,
    delay: num * delay,
  };
};

module.exports.browser = async function ([num], delay, offset, input, ctx) {
  num = Number(num);
  if (isNaN(num) || !isFinite(num) || num <= 0) num = 1;

  const offlineCtx = new OfflineAudioContext(2, (ctx.sampleRate * delay) / 1000, ctx.sampleRate);
  const input_ = offlineCtx.createBufferSource(0, offset / 1000, (delay + offset) / 1000);
  input_.buffer = input.buffer;
  input_.loop = input.loop;
  input_.loopStart = input.loopStart;
  input_.connect(offlineCtx.destination);
  input_.start(0, offset / 1000, delay / 1000);
  offset = 0;

  const buffer = await offlineCtx.startRendering();
  input = ctx.createBufferSource();
  input.buffer = buffer;
  delay *= num;
  input.loop = true;
  input.loopEnd = delay;

  return {
    node: input,
    delay,
    end: delay,
    offset,
  };
};
