export function njs([ factor ]) {
  factor = Number(factor);
  if (isNaN(factor) || !isFinite(factor))
    factor = 1;
  return {
    filter: '[{0}]highpass=f=' + (1 - Math.abs(factor)) * 24000 + '[{1}]',
    delay: false
  };
}

export function browser([ factor ], _, __, ___, ctx) {
  factor = Number(factor);
  if (isNaN(factor) || !isFinite(factor))
    factor = 1;
  const biquadNode = ctx.createBiquadFilter();
  biquadNode.type = 'highpass';
  biquadNode.frequency.value = (1 - Math.abs(factor)) * 24000;
  return {
    insert: biquadNode
  }
}