(async function() {
  const i = document.querySelector('#input');
  let sh;

  const shat = await fetch('../shat.json');

  i.addEventListener('keyup', async function (event) {
    if (!sh)
      sh = new Sh(await shat.json());

    if (event.key === 'Enter') {
      const input = event.target.value;
      console.log('running with', input);

      const script = sh.Parser.parse(input);
      console.log(script);
      event.target.value = '';
      sh.Audio.run(script);
    }
  });
})()