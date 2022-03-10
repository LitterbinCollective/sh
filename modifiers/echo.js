export function njs(args, delay) {
  const defaults = [ 0.25, 0.5 ];
  for (let a = 0; a < 2; a++) {
    const x = args[a];
    const num = Number(x);

    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
      args[a] = defaults[a];
      continue;
    }

    args[a] = num;
  }

  const delays = [];
  const decays = [];

  const decayFactor = 1 - args[1]
  let delayFactor = 0
  for (let i = 1; i > 0; i -= decayFactor) {
    if (Math.floor(i * 100) / 100 == 0) break;

    delayFactor++;
    const delay = args[0] * delayFactor * 1000;
    if (delay > 90000) break;

    delays.push(delay);
    decays.push(i.toFixed(2));
  }

  return {
    filter: `[{0}]aecho=1:1:${delays.join('|')}:${decays.join('|')}[{1}]`,
    delay: delays[delays.length - 1] + delay
  };
}