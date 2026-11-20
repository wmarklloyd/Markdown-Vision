const assert = require('node:assert/strict');
const fs = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');

async function run(port) {
  let target;
  for (let attempt = 0; !target && attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      target = (await response.json()).find((page) => page.url.includes('index.html'));
    } catch { /* WebView2 is still starting. */ }
    if (!target) await delay(150);
  }
  assert.ok(target, 'Native editor must start');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve);
    socket.addEventListener('error', reject);
  });
  let id = 0;
  function send(method, params) {
    return new Promise((resolve, reject) => {
      const current = ++id;
      function receive({ data }) {
        const message = JSON.parse(data);
        if (message.id !== current) return;
        socket.removeEventListener('message', receive);
        const error = message.error || message.result.exceptionDetails;
        if (error) reject(Error(JSON.stringify(error)));
        else resolve(message.result.result?.value);
      }
      socket.addEventListener('message', receive);
      socket.send(JSON.stringify({ id: current, method, params }));
    });
  }
  const evaluate = (expression) => send('Runtime.evaluate', { expression, returnByValue: true });
  const source = () => evaluate('document.querySelector("#markdownSource").value');
  try {
    for (let attempt = 0; attempt < 60 && !await evaluate('!!window.markdownVisionReader'); attempt += 1) await delay(150);
    const file = 'markdown-table-torture-test.md';
    const original = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
    await evaluate(`window.markdownVisionReader.showDocument(${JSON.stringify(original)}, ${JSON.stringify(file)});
      if (document.querySelector('#editorWorkspace').hidden) document.querySelector('#editorToggle').click()`);
    assert.equal(await source(), original);
    const edit = async (selector, value, replacement) => {
      await evaluate(`(${(selector, value) => {
        const field = [...document.querySelectorAll(selector)].find((element) => element.textContent === value);
        if (!field) throw Error('Missing direct field for ' + value);
        field.focus();
        getSelection().selectAllChildren(field);
      }})(${JSON.stringify(selector)}, ${JSON.stringify(value)})`);
      await send('Input.insertText', { text: replacement });
    };
    const field = '#editorPreview table [data-editable-list-link]';
    let expected = original;
    const checks = [
      [field, 'bold | bar', 'new | bold', '**bold \\| bar**', '**new \\| bold**'],
      [field, 'italic | bar', 'new italic', '*italic \\| bar*', '*new italic*'],
      [field, 'A linked label', 'New linked label', '[A linked label](', '[New linked label]('],
      [field, 'Reference label', 'New reference label', '[Reference label][table-reference]', '[New reference label][table-reference]'],
      [field, 'value `inner` | end', 'outer ``ticks`` | tail', '``value `inner` \\| end``', '```outer ``ticks`` \\| tail```'],
      ['#editorPreview [data-direct-table-cell]', 'Plain', 'Longer plain category', '| Plain |', '| Longer plain category |'],
      ['#editorPreview blockquote table [data-editable-list-link]', 'north', 'updated north', '> | north | south |', '> | updated north | south |'],
      ['#editorPreview ul table [data-editable-list-link]', 'Screws', 'New screws', '| Screws | 4 |', '| New screws | 4 |']
    ];
    let previous;
    for (const [selector, value, replacement, oldSource, newSource] of checks) {
      previous = expected;
      await edit(selector, value, replacement);
      expected = expected.replace(oldSource, newSource);
      assert.notEqual(previous, expected);
      assert.equal(await source(), expected, value);
    }
    await evaluate('document.querySelector("[data-command=undo]").click()');
    assert.equal(await source(), previous);
    await evaluate('document.querySelector("[data-command=redo]").click()');
    assert.equal(await source(), expected);
    await evaluate('document.querySelector(".editor-views [data-view=source]").click(); document.querySelector(".editor-views [data-view=visual]").click()');
    assert.equal(await source(), expected);
    assert.equal(await evaluate('Array.from(document.querySelectorAll("#editorPreview td code")).some(node => node.textContent === "outer ``ticks`` | tail")'), true);
    await evaluate(`(() => {
      const row = [...document.querySelectorAll('#editorPreview tr')].find(row => row.cells[0]?.textContent === 'Short');
      row.cells[2].click();
      const dialog = document.querySelector('#visualEditDialog');
      if (!dialog.open) throw Error('A missing cell should open the Visual cell editor');
      dialog.querySelector('textarea').value = 'new | cell';
      dialog.querySelector('form').requestSubmit();
    })()`);
    expected = expected.replace('| Short |', '| Short |   | new \\| cell |');
    assert.equal(await source(), expected, 'Filling a missing cell preserves the original row and neighboring fields');
    console.log('PASS formatted cells, link and reference labels, inline code, interleaved plain edits, nested tables, missing cells, undo, redo, and rerender');
  } finally {
    socket.close();
  }
}

run(process.argv[2]).catch((error) => { console.error(error); process.exitCode = 1; });
