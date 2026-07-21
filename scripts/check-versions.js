#!/usr/bin/env node
/*
 * Version-parity guard. The plugin version lives in three hand-maintained files
 * and the CLI stamps package.json's version into the built plugin manifest, so a
 * drift between them ships the wrong version (this happened in v1.8.1). This
 * check keeps them locked together, and on a tag build also asserts the tag
 * matches the version. Zero dependencies.
 *
 *   node scripts/check-versions.js
 *
 * On a GitHub tag build (GITHUB_REF_TYPE=tag) it additionally requires the tag
 * (e.g. v1.8.3) to equal "v" + the manifest version.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

const pkg = readJSON('package.json');
const plugin = readJSON('.claude-plugin/plugin.json');
const marketplace = readJSON('.claude-plugin/marketplace.json');

// the marketplace file has its own metadata.version (the catalog's version);
// the number that must track the plugin is the plugins[] entry for this plugin.
const mpEntry = (marketplace.plugins || []).find((p) => p.name === pkg.name)
  || (marketplace.plugins || [])[0];

const sources = [
  { file: 'package.json', version: pkg.version },
  { file: '.claude-plugin/plugin.json', version: plugin.version },
  { file: '.claude-plugin/marketplace.json (plugins[])', version: mpEntry && mpEntry.version },
];

let failed = 0;
function fail(msg) { console.error('  FAIL: ' + msg); failed++; }

console.log('version parity:');
for (const s of sources) console.log('  ' + s.file + ' = ' + (s.version || '(missing)'));

const distinct = [...new Set(sources.map((s) => s.version))];
if (distinct.length === 1 && distinct[0]) {
  console.log('  ok: all three manifests agree on ' + distinct[0]);
} else {
  fail('manifest versions disagree: ' + sources.map((s) => s.file + '=' + s.version).join(', '));
}

// On a tag build, the tag must match the version so a mis-tag (like the tangled
// v1.8.0 / v1.7.1 history) fails the release instead of shipping.
const refType = process.env.GITHUB_REF_TYPE;
const refName = process.env.GITHUB_REF_NAME || '';
if (refType === 'tag' || /^v\d/.test(refName)) {
  const expected = 'v' + pkg.version;
  if (refName === expected) {
    console.log('  ok: tag ' + refName + ' matches the manifest version');
  } else {
    fail('tag ' + refName + ' does not match manifest version (expected ' + expected + ')');
  }
} else {
  console.log('  (not a tag build; skipping tag/version match)');
}

if (failed) { console.error('\n' + failed + ' version check(s) failed.'); process.exit(1); }
console.log('\nversion checks passed.');
