function clamp (n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function njs(args) {
  const defaults = [ 5, 1 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  if (args[1] === 0) return { filter: '', delay: false };
  return {
    filter: `[{0}]vibrato=f=${clamp(args[0], 0.1, 20000)}:d=${clamp(args[1], 0, 1)}[{1}]`,
    delay: false
  };
}