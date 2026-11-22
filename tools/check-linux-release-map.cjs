const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'docs/linux-release-targets.json'), 'utf8'));
const tauri = JSON.parse(fs.readFileSync(path.join(root, map.versionSource), 'utf8'));
const args = process.argv.slice(2);
const options = new Map();
for (let i = 0; i < args.length; i += 1) {
  if (args[i].startsWith('--')) options.set(args[i], args[i + 1] ?? true);
}
const manifestArg = args.indexOf('--manifest');
const architecture = options.get('--architecture') ?? 'x86_64';
const distribution = options.get('--distribution') ?? 'ubuntu';
const allowedFormats = new Set(['deb', 'rpm', 'appimage']);

assert.equal(map.schemaVersion, 1, 'Unsupported Linux release map schema');
assert.ok(tauri.version, 'Tauri application version is missing');
assert.ok(map.buildBaselines?.[distribution], `Unknown Linux distribution: ${distribution}`);
assert.ok(map.architectures.includes(architecture), `Unsupported Linux architecture: ${architecture}`);
assert.ok(Array.isArray(map.bundles) && map.bundles.length > 0, 'No Linux bundles are configured');

const selectedBundles = map.bundles.filter((bundle) =>
  bundle.distribution === distribution && bundle.architectures.includes(architecture));
assert.ok(selectedBundles.length > 0, `No ${distribution} bundles are configured for ${architecture}`);

const seenFormats = new Set();
for (const bundle of map.bundles) {
  assert.ok(allowedFormats.has(bundle.format), `Unknown Linux package format: ${bundle.format}`);
  assert.equal(bundle.format, bundle.tauriTarget, `${bundle.format} has a mismatched Tauri build target`);
  assert.ok(!seenFormats.has(`${bundle.distribution}:${bundle.format}`), `Duplicate ${bundle.distribution} ${bundle.format} package`);
  seenFormats.add(`${bundle.distribution}:${bundle.format}`);
  assert.ok(map.buildBaselines[bundle.distribution], `${bundle.format} has no build baseline`);
  assert.ok(bundle.architectures.length, `${bundle.format} has no supported architectures`);
  assert.ok(bundle.architectures.every((arch) => map.architectures.includes(arch)), `${bundle.format} uses an unknown architecture`);
  assert.ok(bundle.outputDirectory && bundle.fileSuffix, `${bundle.format} output metadata is incomplete`);
  assert.ok(bundle.githubAssetName.includes('{version}') && bundle.githubAssetName.includes('{architecture}'), `${bundle.format} asset name must contain version and architecture`);
  const resolved = path.resolve(root, bundle.outputDirectory);
  assert.ok(resolved.startsWith(`${root}${path.sep}`), `${bundle.format} output path escapes the repository`);
}

const channelNames = map.channels.map((channel) => channel.name);
assert.equal(new Set(channelNames).size, channelNames.length, 'Duplicate distribution channel');
if (options.has('--bundles')) {
  process.stdout.write(`${selectedBundles.map((bundle) => bundle.tauriTarget).join(',')}\n`);
  process.exit(0);
}

console.log(`Linux release map passed for ${tauri.version} on ${map.buildBaselines[distribution]} ${architecture}: ${selectedBundles.map((bundle) => bundle.format).join(', ')}.`);

if (options.has('--verify-outputs')) {
  const artifacts = [];
  for (const bundle of selectedBundles) {
    const directory = path.join(root, bundle.outputDirectory);
    assert.ok(fs.existsSync(directory), `Missing ${bundle.format} output directory: ${bundle.outputDirectory}`);
    const suffix = bundle.fileSuffix.toLowerCase();
    const files = fs.readdirSync(directory)
      .filter((name) => name.toLowerCase().endsWith(suffix))
      .map((name) => path.join(directory, name))
      .filter((file) => fs.statSync(file).isFile());
    assert.equal(files.length, 1, `Expected exactly one ${bundle.format} package; found ${files.length}`);
    const file = files[0];
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 0, `${bundle.format} package is empty`);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const assetName = bundle.githubAssetName
      .replace('{version}', tauri.version)
      .replace('{architecture}', architecture);
    artifacts.push({
      distribution,
      format: bundle.format,
      architecture,
      state: bundle.state,
      file: path.relative(root, file).replaceAll(path.sep, '/'),
      name: assetName,
      bytes: bytes.length,
      sha256,
    });
    console.log(`${distribution}\t${bundle.format}\t${architecture}\t${path.relative(root, file)}\t${bytes.length}\t${sha256}\t${assetName}`);
  }
  if (manifestArg >= 0) {
    const output = args[manifestArg + 1];
    assert.ok(output, '--manifest requires an output path');
    const manifest = {
      version: tauri.version,
      sourceRevision: process.env.GITHUB_SHA || null,
      distribution,
      buildBaseline: map.buildBaselines[distribution],
      architecture,
      artifacts,
    };
    fs.writeFileSync(path.resolve(root, output), `${JSON.stringify(manifest, null, 2)}\n`);
  }
} else {
  assert.ok(manifestArg < 0, '--manifest requires --verify-outputs');
}
