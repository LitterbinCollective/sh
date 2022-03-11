function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function njs([ percent ], delay) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 0;
  percent = 100 - percent;
  percent = clamp(percent, 0, 100) / 100;
  delay = delay - delay * percent;
  return {
    filter: `[{0}]atrim=start=0:end=${delay}ms[{1}]`,
    delay
  };
}

export function browser([ percent ], delay) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 0;
  percent = 100 - percent;
  percent = clamp(percent, 0, 100) / 100;
  delay = delay - delay * percent;

  return {
    end: delay,
    delay: delay
  };
}