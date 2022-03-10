export function njs([ delay ], prevDelay) {
  delay = Number(delay);
  if (isNaN(delay) || !isFinite(delay))
    delay = prevDelay / 1000;
  return {
    filter: false,
    delay: delay * 1000
  };
}