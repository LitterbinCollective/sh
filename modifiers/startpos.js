function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

module.exports = function([ percent ], delay) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 0;
  percent = clamp(percent, 0, 100) / 100;
  return {
    filter: `[{0}]atrim=start=${delay * percent}ms:end=${delay}ms[{1}]`,
    delay: delay - delay * percent
  };
}