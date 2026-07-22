#!/usr/bin/env node
/*
 * Integrity manifest for the shipped executable scripts (tamper-evidence).
 *
 * These scripts are fetched from GitHub and run locally (npx, plugin install),
 * so a corrupted or altered copy should be detectable. This tool records a
 * SHA-256 for every executable file in the package and verifies them.
 *
 * SHA-256, deliberately NOT MD5: MD5 is collision-broken and unfit for an
 * integrity control. The manifest ships in the repo, so on its own it detects
 * accidental corruption and casual local tampering; for a real supply-chain
 * guarantee, compare the manifest's own hash against one published out of band
 * (release notes) or rely on npm build provenance (see SECURITY.md).
 *
 * Usage:
 *   node scripts/integrity.js --write   # (re)generate scripts/integrity.sha256
 *   node scripts/integrity.js --check   # verify files against the manifest (CI)
 *   node scripts/integrity.js           # same as --check
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'scripts', 'integrity.sha256');
// Directories whose executable code ships and runs on a user's machine.
const COVERED_DIRS = ['bin', 'scripts', '.claude/skills', 'chatgpt'];
const EXTS = new Set(['.js', '.sh', '.py']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

function walk(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const ent of entries) {
    if (ent.name === '.DS_Store') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) walk(full, acc); }
    else if (EXTS.has(path.extname(ent.name))) { acc.push(full); }
  }
  return acc;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// Returns a sorted array of { rel, hash } for every covered executable file.
// `rel` uses forward slashes so the manifest is identical across OSes.
function computeAll(root) {
  root = root || ROOT;
  const files = [];
  for (const d of COVERED_DIRS) walk(path.join(root, d), files);
  return files
    .map(function (f) { return { rel: path.relative(root, f).split(path.sep).join('/'), hash: sha256(f) }; })
    .filter(function (r) { return r.rel !== 'scripts/integrity.sha256'; })
    .sort(function (a, b) { return a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0; });
}

function render(list) {
  return list.map(function (r) { return r.hash + '  ' + r.rel; }).join('\n') + '\n';
}

function parseManifest(text) {
  const map = {};
  text.split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^([0-9a-f]{64})\s+(.+)$/);
    if (m) map[m[2]] = m[1];
  });
  return map;
}

function writeManifest(root) {
  const list = computeAll(root);
  fs.writeFileSync(MANIFEST, render(list));
  return list.length;
}

// Compare current files against the committed manifest.
// Returns { ok, checked, mismatches[], missing[], untracked[] }.
function check(root) {
  root = root || ROOT;
  if (!fs.existsSync(MANIFEST)) return { ok: false, error: 'no manifest at ' + MANIFEST + ' (run --write)' };
  const expected = parseManifest(fs.readFileSync(MANIFEST, 'utf8'));
  const current = computeAll(root);
  const currentMap = {};
  current.forEach(function (r) { currentMap[r.rel] = r.hash; });
  const mismatches = [], missing = [], untracked = [];
  Object.keys(expected).forEach(function (rel) {
    if (currentMap[rel] == null) missing.push(rel);
    else if (currentMap[rel] !== expected[rel]) mismatches.push(rel);
  });
  current.forEach(function (r) { if (expected[r.rel] == null) untracked.push(r.rel); });
  return {
    ok: mismatches.length === 0 && missing.length === 0 && untracked.length === 0,
    checked: current.length, mismatches: mismatches, missing: missing, untracked: untracked
  };
}

module.exports = { computeAll, check, writeManifest, MANIFEST, ROOT };

if (require.main === module) {
  const mode = process.argv.includes('--write') ? 'write' : 'check';
  if (mode === 'write') {
    const n = writeManifest(ROOT);
    console.log('integrity: wrote ' + n + ' SHA-256 entries to ' + path.relative(ROOT, MANIFEST));
  } else {
    const r = check(ROOT);
    if (r.error) { console.error('integrity: ' + r.error); process.exit(1); }
    if (r.ok) { console.log('integrity: OK, all ' + r.checked + ' executable files match the manifest.'); process.exit(0); }
    console.error('integrity: MANIFEST MISMATCH');
    r.mismatches.forEach(function (f) { console.error('  altered:   ' + f); });
    r.missing.forEach(function (f) { console.error('  missing:   ' + f); });
    r.untracked.forEach(function (f) { console.error('  untracked: ' + f + '  (run --write after an intended change)'); });
    console.error('If these changes are intentional, regenerate with: node scripts/integrity.js --write');
    process.exit(1);
  }
}
