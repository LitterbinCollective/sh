module.exports = function([ factor ]) {
  factor = Number(factor);
  if (isNaN(factor) || !isFinite(factor))
    factor = 1;
  return {
    filter: '[{0}]highpass=f=' + (1 - Math.abs(factor)) * 24000 + '[{1}]',
    delay: false
  };
}