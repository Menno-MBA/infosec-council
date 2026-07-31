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
 *   node journal.js outcome <sha> <correct|partial|wrong|not-tested> [note]
 *   node journal.js meta                # calibration report (hit-rate + Brier + ECE)
 *   node journal.js journal [n]         # show last n runs (default 10)
 *   node journal.js pending [days]      # ungraded runs, ripe after N days (default 30)
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
  // Exact-question fingerprint: hashes the verbatim string, so it only matches a
  // rerun asked with identical wording. It does NOT reliably link reruns; two runs
  // of the same decision phrased slightly differently get different families.
  // `lookback` is what actually finds prior runs, via token similarity (see cmdLookback).
  // Do not build a "have we decided this before" check on family alone.
  const family = sha1hex(q).slice(0, 8);
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
  if (!sha) die('usage: journal.js outcome <sha> <correct|partial|wrong|not-tested> [note]');
  // `not-tested` exists because the other three do not fit the most common real
  // outcome: the recommendation was never executed, so it was never put to the
  // test. Forcing that case into correct/partial/wrong is what makes people
  // record nothing at all, which is how a journal ends up with 8 runs and 0
  // outcomes. It is deliberately kept out of ACTUAL below, so it never enters
  // the Brier or ECE maths: it says nothing about whether the advice was right,
  // only about whether the organisation delivered it.
  if (!['correct', 'partial', 'wrong', 'not-tested'].includes(result)) {
    die('result must be: correct | partial | wrong | not-tested');
  }
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

  // Round-2 value. The anonymized cross-exam is the protocol's most expensive round
  // -- seven briefs, seven cross-exams, forty-two peer scores -- and nothing recorded
  // whether it moved anyone, so "does Round 2 earn its cost" could not be answered
  // from the journal at all. A run carries the data when at least one seat logged its
  // pre-cross-exam position (`stance_r1` / `probability_r1`).
  //
  // The aggregate is computed here, never stored on the record. Freezing one
  // definition of "moved" into every record would make the metric unrevisable.
  const ROUND2_MIN_RUNS = 5;
  function round2ValueOf(list) {
    // Quick runs have no Round 2 to measure. Excluded explicitly as well as by the
    // r1-data test below: counted as runs where nothing moved, they would drag the
    // mean toward "the cross-exam changes nothing" with no cross-exam ever run.
    const scored = list.filter(r => r.mode !== 'quick' && (r.members || []).some(
      m => m && (typeof m.stance_r1 === 'string' || typeof m.probability_r1 === 'number')));

    const out = { runs_with_data: scored.length, threshold: ROUND2_MIN_RUNS };
    if (scored.length < ROUND2_MIN_RUNS) {
      out.note = 'too few runs carry pre-cross-exam positions to say anything yet ('
        + scored.length + ' of ' + ROUND2_MIN_RUNS + '); reporting a mean over this many '
        + 'would read as a finding it is not';
      return out;
    }

    let flipRuns = 0, flipSeats = 0, deltaSum = 0;
    for (const r of scored) {
      const members = r.members || [];
      const flips = members.filter(m => m && typeof m.stance_r1 === 'string' && m.stance_r1 !== m.stance).length;
      if (flips > 0) flipRuns++;
      flipSeats += flips;
      // Absolute, so a seat losing confidence does not cancel a seat gaining it --
      // two seats moving 30 points in opposite directions is movement, not stillness.
      const withBoth = members.filter(m => m && typeof m.probability_r1 === 'number' && typeof m.probability === 'number');
      if (members.length) {
        deltaSum += withBoth.reduce((a, m) => a + Math.abs(m.probability - m.probability_r1), 0) / members.length;
      }
    }
    out.runs_with_a_stance_flip = flipRuns;
    out.share_of_runs_with_a_stance_flip = +(flipRuns / scored.length).toFixed(3);
    out.mean_seats_with_stance_flip = +(flipSeats / scored.length).toFixed(3);
    out.mean_abs_probability_delta = +(deltaSum / scored.length).toFixed(3);

    // Kept in its own block, deliberately. The two figures above are arithmetic on
    // what the seats actually returned. This one is the chairman's own attribution of
    // which blind spots first surfaced in Round 2 -- a judgement by the same model
    // that ran both rounds, and one it has an interest in. Blending it into the
    // movement statistics would launder a self-report as a measurement.
    const attributed = scored.filter(r => typeof r.blind_spots_from_r2 === 'number');
    out.blind_spots_attributed_to_round2 = {
      runs_with_data: attributed.length,
      mean: attributed.length
        ? +(attributed.reduce((a, r) => a + r.blind_spots_from_r2, 0) / attributed.length).toFixed(3)
        : null,
      note: 'self-reported by the chairman, who ran both rounds; weigh it below the movement figures'
    };
    return out;
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
      not_tested: o.filter(r => r.outcome.result === 'not-tested').length,
      brier: brierOf(g)
    };
  });

  // Delivery rate is a governance metric, not a calibration one. A run graded
  // `not-tested` means the analysis was never put to the test because nobody
  // executed it. A high not-tested count is an execution problem in the
  // organisation, not an accuracy problem in the panel, and the two must not be
  // read off the same number.
  const graded = withOutcome.filter(r => ACTUAL[r.outcome.result] != null).length;
  const notTested = withOutcome.filter(r => r.outcome.result === 'not-tested').length;
  const delivery = {
    outcomes_recorded: withOutcome.length,
    tested: graded,
    not_tested: notTested,
    delivery_rate: withOutcome.length ? +(graded / withOutcome.length).toFixed(2) : null,
    note: 'delivery_rate is how often a recommendation was actually executed, not how often it was right'
  };

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
    pending: recs.length - withOutcome.length,
    delivery,
    brier_overall: brierOf(recs),
    ece_overall: eceOf(recs),
    round2_value: round2ValueOf(recs),
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

// Ripe-but-ungraded runs: decisions old enough that the result should be known,
// with no outcome recorded. The council's pre-flight calls this on every run, so
// the ledger is visible rather than quietly accumulating. Default 30 days,
// because most security decisions show their result inside a month.
function cmdPending() {
  ensure();
  const days = parseInt(rest[0], 10) || 30;
  const cutoff = Date.now() - days * 86400000;
  const recs = readRecords();
  const ripe = recs
    .filter(r => !(r.outcome && r.outcome.recorded))
    .map(r => {
      const t = Date.parse(r.ts || '');
      return {
        sha: r.sha,
        ts: r.ts,
        age_days: isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000),
        mode: r.mode,
        confidence: r.confidence || 'n/a',
        probability: (typeof r.probability === 'number') ? r.probability : null,
        question: String(r.question || '').slice(0, 100),
        ripe: isNaN(t) ? true : t < cutoff
      };
    })
    .sort((a, b) => (b.age_days || 0) - (a.age_days || 0));
  const out = {
    threshold_days: days,
    pending_total: ripe.length,
    ripe_total: ripe.filter(r => r.ripe).length,
    pending: ripe
  };
  console.log(JSON.stringify(out, null, 2));
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
  case 'pending': cmdPending(); break;
  case 'lookback': cmdLookback(); break;
  case 'path': console.log(JOURNAL); break;
  default:
    console.log([
      'infosec-council decision journal (Node, zero-dependency)',
      '',
      '  node journal.js log                 read one run as JSON on stdin, append it',
      '  node journal.js outcome <sha> <correct|partial|wrong|not-tested> [note]',
      '  node journal.js meta                calibration (hit-rate + Brier + ECE)',
      '  node journal.js journal [n]         show last n runs (default 10)',
      '  node journal.js pending [days]      ungraded runs, ripe after N days (default 30)',
      '  node journal.js lookback <text>     comparable past runs (pre-flight)',
      '  node journal.js path                print the journal file path',
      '',
      'Environment: COUNCIL_HOME (default ~/.infosec-council), COUNCIL_ORG (per-org subfolder)'
    ].join('\n'));
}
