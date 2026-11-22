const assert = require('node:assert/strict');
const { createDesktopBridgeFixture } = require('./desktop-bridge-fixture.cjs');

async function main() {
  const initial = createDesktopBridgeFixture('initial-open');
  assert.deepEqual(await initial.getInitialDocument(), {
    content: '# Fixture document\n', name: 'fixture.md', documentId: 'fixture-1',
    imageBase: 'mvimage://localhost/fixture-1/',
  });
  assert.equal(await createDesktopBridgeFixture('initial-empty').getInitialDocument(), null);
  assert.equal(await createDesktopBridgeFixture('open-cancel').openMarkdownFile(), null);

  const save = createDesktopBridgeFixture();
  assert.deepEqual(await save.saveMarkdownFile(null, '# New\n', false), {
    status: 'saved', documentId: 'fixture-new', name: 'saved.md', imageBase: 'mvimage://localhost/fixture-save/',
  });
  assert.equal((await createDesktopBridgeFixture('save-as').saveMarkdownFile('fixture-1', '# Copy\n', true)).name, 'saved-as.md');
  assert.deepEqual(await createDesktopBridgeFixture('save-cancel').saveMarkdownFile('fixture-1', 'draft', false), { status: 'canceled' });
  assert.deepEqual(await createDesktopBridgeFixture('save-error-result').saveMarkdownFile('fixture-1', 'draft', false), {
    status: 'error', message: 'Fixture save failure',
  });
  await assert.rejects(createDesktopBridgeFixture('save-error').saveMarkdownFile('fixture-1', 'draft', false), /Fixture save failure/);
  await assert.rejects(createDesktopBridgeFixture('open-error').openMarkdownFile(), /Fixture open failure/);

  const optional = createDesktopBridgeFixture('optional-capabilities');
  for (const capability of ['listSystemFonts', 'printMarkdown', 'savePreferences', 'installUpdate', 'updateArchitecture']) {
    assert.equal(Object.hasOwn(optional, capability), false, `${capability} should be absent when unsupported`);
  }
  const subscription = createDesktopBridgeFixture();
  let opened;
  subscription.onOpenDocument((value) => { opened = value; });
  subscription.emitOpen();
  assert.equal(opened.documentId, 'fixture-1');
  assert.ok(subscription.calls.some(([name]) => name === 'onOpenDocument'));
  console.log('Desktop bridge fixtures passed: initial open/empty, canceled open/save, Save As, rejected/error results, and optional capabilities.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
