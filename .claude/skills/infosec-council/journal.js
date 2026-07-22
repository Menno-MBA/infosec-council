#!/usr/bin/env node
/*
 * infosec-council decision journal (zero-dependency Node port of journal.sh).
 *
 * Works on Windows and inside the Desktop/Cowork sandbox, where jq is usually
 * absent. Logs council runs to JSONL, records real-world outcomes, computes
 * calibration (hit-rate AND Brier score), and supports a lookback so a new run
 * can learn from comparable past decisions. No network, no dependencies.
 *
 * Usage:
 *   node journal.js log                 # read one run as JSON on stdin, append it
 *   node journal.js outcome <sha> <correct|partial|wrong> [note]
 *   node journal.js meta                # calibration report (hit-rate + Brier + ECE)
 *   node journal.js journal [n]         # show last n runs (default 10)
 *   node journal.js lookback <text...>  # comparable past runs (for pre-flight)
 *   node journal.js path                # print the journal file path
 *
 * Environment:
 *   COUNCIL_HOME   journal directory        (default: ~/.infosec-council)
 *   COUNCIL_ORG    per-org subfolder        (keeps client A's journal out of B's)
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function die(msg) { console.error('council-journal: ' + msg); process.exit(1); }

const COUNCIL_HOME = process.env.COUNCIL_HOME || path.join(os.homedir(), '.infosec-council');
const ORG = (process.env.COUNCIL_ORG || '').trim();
const HOME_DIR = ORG ? path.join(COUNCIL_HOME, ORG) : COUNCIL_HOME;
const JOURNAL = path.join(HOME_DIR, 'journal.jsonl');

function ensure() {
  fs.mkdirSync(HOME_DIR, { recursive: true });
  if (!fs.existsSync(JOURNAL)) fs.writeFileSync(JOURNAL, '');
}
function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }
function sha1hex(s) { return crypto.createHash('sha1').update(String(s), 'utf8').digest('hex'); }
function readLines() {
  if (!fs.existsSync(JOURNAL)) return [];
  return fs.readFileSync(JOURNAL, 'utf8').split(/\r?\n/).filter(Boolean);
}
function readRecords() {
  const out = [];
  for (const line of readLines()) { try { out.push(JSON.parse(line)); } catch (_) {} }
  return out;
}

// crude but dependency-free text similarity for lookback
const STOP = new Set(('a,an,the,and,or,but,if,then,to,of,for,in,on,at,by,we,our,us,you,your,it,is,are,be,do,should,could,would,can,may,a,with,without,this,that,these,those,as,from,into,about,new,use,using,let,their,they,i').split(','));
function tokens(s) {
  return (String(s || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(t => t.length > 2 && !STOP.has(t));
}
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

const cmd = process.argv[2] || 'help';
const rest = process.argv.slice(3);

function cmdLog() {
  ensure();
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch (_) { raw = ''; }
  let input;
  try { input = JSON.parse(raw); } catch (_) { die('log: stdin is not valid JSON'); }
  const q = String(input.question || '');
  if (!q) die('log: .question is required in the JSON');
  const family = sha1hex(q).slice(0, 8);                 // stable per-question id (links reruns)
  const ts = nowIso();
  let sha = String(input.sha || '');
  if (!sha) sha = sha1hex(q + '|' + ts).slice(0, 8);     // salted: reruns get distinct shas
  const record = Object.assign({}, input, {
    sha, family, ts,
    mode: input.mode || 'standard',
    members: Array.isArray(input.members) ? input.members : [],
    outcome: input.outcome || { recorded: false }
  });
  fs.appendFileSync(JOURNAL, JSON.stringify(record) + '\n');
  console.log('logged run ' + sha + ' (family ' + family + ')');
}

function cmdOutcome() {
  ensure();
  const sha = rest[0];
  const result = rest[1];
  const note = rest.slice(2).join(' ');
  if (!sha) die('usage: journal.js outcome <sha> <correct|partial|wrong> [note]');
  if (!['correct', 'partial', 'wrong'].includes(result)) die('result must be: correct | partial | wrong');
  const lines = readLines();
  let found = false;
  const out = lines.map(line => {
    let o; try { o = JSON.parse(line); } catch (_) { return line; }
    if (o.sha === sha) {
      found = true;
      o.outcome = { recorded: true, ts: nowIso(), result, note: note || '' };
      return JSON.stringify(o);
    }
    return line;
  });
  if (!found) die('no run found with sha ' + sha);
  fs.writeFileSync(JOURNAL, out.join('\n') + '\n');
  console.log('recorded outcome for ' + sha + ': ' + result);
}

const ACTUAL = { correct: 1, partial: 0.5, wrong: 0 };

function cmdMeta() {
  ensure();
  const recs = readRecords();
  if (!recs.length) die('journal is empty - nothing to analyze yet');
  const withOutcome = recs.filter(r => r.outcome && r.outcome.recorded);

  // Brier score over runs that have both a numeric probability and an outcome.
  function brierOf(list) {
    const scored = list.filter(r => typeof r.probability === 'number' && r.outcome && ACTUAL[r.outcome.result] != null);
    if (!scored.length) return null;
    const s = scored.reduce((acc, r) => {
      const p = Math.max(0, Math.min(1, r.probability / 100));
      const a = ACTUAL[r.outcome.result];
      return acc + (p - a) * (p - a);
    }, 0);
    return { n: scored.length, brier: +(s / scored.length).toFixed(3) };
  }

  // Expected Calibration Error (ECE) + reliability curve over runs with a
  // numeric probability and a recorded outcome. Bins predictions into 5 buckets
  // of width 0.2 and measures the size-weighted average gap between the
  // predicted probability and the observed outcome frequency. Brier scores
  // accuracy and calibration together; ECE isolates calibration, i.e. whether
  // the panel's 70%-confidence calls actually come right about 70% of the time.
  function eceOf(list) {
    const scored = list.filter(r => typeof r.probability === 'number' && r.outcome && ACTUAL[r.outcome.result] != null);
    if (!scored.length) return null;
    const bins = [];
    for (let i = 0; i < 5; i++) bins.push({ lo: i * 0.2, hi: (i + 1) * 0.2, ps: [], as: [] });
    for (const r of scored) {
      const p = Math.max(0, Math.min(1, r.probability / 100));
      const b = bins[Math.min(4, Math.floor(p / 0.2))];
      b.ps.push(p); b.as.push(ACTUAL[r.outcome.result]);
    }
    let ece = 0;
    const curve = bins.filter(b => b.ps.length).map(b => {
      const n = b.ps.length;
      const avgP = b.ps.reduce((a, x) => a + x, 0) / n;
      const avgA = b.as.reduce((a, x) => a + x, 0) / n;
      ece += (n / scored.length) * Math.abs(avgP - avgA);
      return { band: Math.round(b.lo * 100) + '-' + Math.round(b.hi * 100) + '%', n: n, predicted: +(avgP * 100).toFixed(1), observed: +(avgA * 100).toFixed(1) };
    });
    return { n: scored.length, ece: +ece.toFixed(3), reliability_curve: curve };
  }

  const byConf = {};
  for (const r of recs) {
    const c = r.confidence || 'unknown';
    (byConf[c] = byConf[c] || []).push(r);
  }
  const calibration = Object.keys(byConf).sort().map(c => {
    const g = byConf[c];
    const o = g.filter(r => r.outcome && r.outcome.recorded);
    return {
      confidence: c,
      runs: g.length,
      outcomes_recorded: o.length,
      correct: o.filter(r => r.outcome.result === 'correct').length,
      partial: o.filter(r => r.outcome.result === 'partial').length,
      wrong: o.filter(r => r.outcome.result === 'wrong').length,
      brier: brierOf(g)
    };
  });

  const highMisses = recs
    .filter(r => r.confidence === 'high' && r.outcome && (r.outcome.result === 'wrong' || r.outcome.result === 'partial'))
    .map(r => ({ sha: r.sha, question: r.question, result: r.outcome.result, note: r.outcome.note || '', probability: r.probability }));

  const appearances = {};
  for (const r of recs) for (const m of (r.members || [])) {
    const name = (m && typeof m === 'object') ? (m.name || 'unknown') : String(m);
    appearances[name] = (appearances[name] || 0) + 1;
  }
  const member_appearances = Object.keys(appearances)
    .map(k => ({ member: k, count: appearances[k] })).sort((a, b) => b.count - a.count);

  const report = {
    total_runs: recs.length,
    with_outcome: withOutcome.length,
    brier_overall: brierOf(recs),
    ece_overall: eceOf(recs),
    calibration_by_confidence: calibration,
    high_confidence_misses: highMisses,
    member_appearances
  };
  console.log(JSON.stringify(report, null, 2));
}

function cmdJournal() {
  ensure();
  const n = parseInt(rest[0], 10) || 10;
  const recs = readRecords();
  if (!recs.length) { console.log('(journal empty)'); return; }
  for (const r of recs.slice(-n)) {
    console.log(JSON.stringify({
      sha: r.sha, family: r.family, ts: r.ts, mode: r.mode,
      confidence: r.confidence || 'n/a',
      probability: (typeof r.probability === 'number') ? r.probability : null,
      converged: r.converged || null,
      question: String(r.question || '').slice(0, 80),
      outcome: (r.outcome && r.outcome.result) || 'pending'
    }));
  }
}

function cmdLookback() {
  ensure();
  const q = rest.join(' ').trim();
  if (!q) die('usage: journal.js lookback <question text>');
  const family = sha1hex(q).slice(0, 8);
  const qt = tokens(q);
  const recs = readRecords();
  const scored = recs
    .map(r => ({
      sha: r.sha, family: r.family, question: r.question,
      confidence: r.confidence, probability: r.probability,
      outcome: (r.outcome && r.outcome.result) || 'pending',
      note: (r.outcome && r.outcome.note) || '',
      sim: r.family === family ? 1 : jaccard(qt, tokens(r.question))
    }))
    .filter(r => r.sim >= 0.3)
    .sort((a, b) => (b.outcome !== 'pending') - (a.outcome !== 'pending') || b.sim - a.sim)
    .slice(0, 5);
  console.log(JSON.stringify({ query_family: family, matches: scored }, null, 2));
}

switch (cmd) {
  case 'log': cmdLog(); break;
  case 'outcome': cmdOutcome(); break;
  case 'meta': cmdMeta(); break;
  case 'journal': cmdJournal(); break;
  case 'lookback': cmdLookback(); break;
  case 'path': console.log(JOURNAL); break;
  default:
    console.log([
      'infosec-council decision journal (Node, zero-dependency)',
      '',
      '  node journal.js log                 read one run as JSON on stdin, append it',
      '  node journal.js outcome <sha> <correct|partial|wrong> [note]',
      '  node journal.js meta                calibration (hit-rate + Brier + ECE)',
      '  node journal.js journal [n]         show last n runs (default 10)',
      '  node journal.js lookback <text>     comparable past runs (pre-flight)',
      '  node journal.js path                print the journal file path',
      '',
      'Environment: COUNCIL_HOME (default ~/.infosec-council), COUNCIL_ORG (per-org subfolder)'
    ].join('\n'));
}
