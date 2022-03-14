module.exports.njs = function ([ pitch ], delay) {
  pitch = Number(pitch);
  if (isNaN(pitch) || !isFinite(pitch))
    pitch = 1;
  if (pitch === 0) return { filter: '', delay: false };
  return {
    filter: '[{0}]asetrate=' + (48000 * Math.abs(pitch)) + '[{1}]' +
      (pitch < 0 ? ';[{1}]areverse[{2}]' : ''),
    delay: delay / pitch
  };
}

module.exports.browser = function ([ pitch ], delay, _, input, ctx) {
  pitch = Number(pitch);
  if (isNaN(pitch) || !isFinite(pitch))
    pitch = 1;
  if (pitch === 0) return {};
  if (pitch < 0) {
    const reverse = ctx.createBuffer(
      input.buffer.numberOfChannels,
      input.buffer.length,
      input.buffer.sampleRate
    );

    for (let c = 0; c < input.buffer.numberOfChannels; c++) {
      const dest = reverse.getChannelData(c);
      const src = input.buffer.getChannelData(c);

      for (let samples = 0; samples < input.buffer.length; samples++)
        dest[samples] = src[input.buffer.length - samples];
    }

    const lS = input.loopStart;
    input = ctx.createBufferSource();
    input.buffer = reverse;
    input.loop = true;
    input.loopEnd = lS;
  }

  input.playbackRate.value *= Math.abs(pitch);

  return {
    delay: delay / Math.abs(pitch),
    node: input
  };
}