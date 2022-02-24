module.exports = function(args, delay) {
  let num = Number(args[0]);
  if (isNaN(num) || !isFinite(num))
    num = 1;
  return {
    filter: '[{0}]asetrate=' + (48000 * num) + '[{1}]',
    delay: delay / num
  };
}