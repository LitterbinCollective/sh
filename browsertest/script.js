(async function() {
  const i = document.querySelector('#input');
  const output = document.querySelector('.output');

  const shat = await fetch('../shat.json');

  function log () {
    const what = [...arguments].reduce(
      (p, c) => p + ' ' + JSON.stringify(c, null, 2),
      ''
    ).trim();
    const span = document.createElement('span');
    span.innerText = what;
    output.append(span);
    output.scrollTop = output.scrollHeight;
  }

  const _console_log = window.console.log;

  window.console.log = function () {
    log(...arguments);
    _console_log(...arguments);
  }

  i.addEventListener('keyup', async function (event) {
    if (!window.sh) {
      window.sh = new Sh(await shat.json());
      console.log('======== READY ========');
    }

    if (event.key === 'Enter') {
      const input = event.target.value;
      output.innerHTML = '';
      log('running with ' + input);

      const script = window.sh.Parser.parse(input);
      log(script);
      event.target.value = '';
      window.sh.Audio.run(script);
    }
  });
})()