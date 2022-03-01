function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

module.exports = function([ percent ], delay) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 0;
  percent = clamp(percent, 0, 100) / 100;
  delay = delay - delay * percent;
  return {
    filter: `[{0}]atrim=start=0:end=${delay / 1000}[{1}]`,
    delay
  };
}