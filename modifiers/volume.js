export function njs([ percent ]) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 1;
  return {
    filter: `[{0}]volume=volume=${percent}[{1}]`,
    delay: false
  }
}