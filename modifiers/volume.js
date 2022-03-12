export function njs([ percent ]) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 1;
  return {
    filter: `[{0}]volume=volume=${percent}[{1}]`,
    delay: false
  }
}

export function browser([ percent ], _, __, ___, ctx) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 1;
  const gainNode = ctx.createGain();
  gainNode.gain.value = percent;
  return {
    insert: gainNode
  }
}