export function njs([ factor ]) {
  factor = Number(factor);
  if (isNaN(factor) || !isFinite(factor))
    factor = 1;
  return {
    filter: '[{0}]lowpass=f=' + Math.abs(factor) * 24000 + '[{1}]',
    delay: false
  };
}