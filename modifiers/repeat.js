module.exports = function([ num ], delay) {
  num = Number(num);
  if (isNaN(num) || !isFinite(num) || num <= 0)
    num = 1;
  return {
    filter: `[{0}]aloop=loop=${num - 1}:size=${(num - 1) * (48 * delay)}[{1}]`,
    delay: num * delay
  };
}