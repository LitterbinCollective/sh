module.exports.njs = function ([ percent ]) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 1;
  return {
    filter: `[{0}]volume=volume=${percent}[{1}]`,
    delay: false
  }
}

module.exports.browser = function ([ percent ], _, __, ___, ctx) {
  percent = Number(percent);
  if (isNaN(percent) || !isFinite(percent))
    percent = 1;
  const gainNode = ctx.createGain();
  gainNode.gain.value = percent;
  return {
    insert: gainNode
  }
}