#!/usr/bin/env node
/*
 * Tests for the eval scorer and the grading worksheet.
 *
 * The scorer is what a v2.2.0 baseline and a v3 run are compared through, so its own
 * failure modes are the ones worth pinning: scoring a run it should have refused (stale
 * personas, missing seats, the wrong protocol for the arm), and misreading the numbers it
 * exists to measure (the offensive-security gap, atomic conditions, how a seat defines its
 * PROBABILITY). The worksheet must never write to the journal.
 *
 *   node scripts/test-eval.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EVAL = path.join(ROOT, 'scripts', 'eval-council.js');
const SHEET = path.join(ROOT, 'scripts', 'grading-worksheet.js');
const { parseSeat, scoreArm, loadCases } = require(EVAL);

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log('  ok: ' + msg);
  else { console.error('  FAIL: ' + msg); failed++; }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'council-eval-test-'));
const NAMES = ['ciso', 'security-architect', 'offensive-security', 'security-operations',
  'compliance-analyst', 'dpo', 'risk-manager'];
const all = (v) => Object.fromEntries(NAMES.map(a => [a, Object.fromEntries(NAMES.filter(b => b !== a).map(b => [b, v]))]));
function write(f, content) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof content === 'string' ? content : JSON.stringify(content));
}
const cases = loadCases(path.join(ROOT, 'eval', 'cases'));

console.log('case definitions:');
for (const id of ['um-ransomware-2019', 'van-elst-invoice-fraud', 'nogo-canary', 'go-canary', 'hindsight-divergence']) {
  const c = cases[id];
  assert(c && c.question && c.ground_truth && c.expect, id + ' is defined with a question, ground truth and expectations');
  if (c && /^eval\//.test(c.brief)) assert(fs.existsSync(path.join(ROOT, c.brief)), id + ' brief file exists');
}

console.log('seat parsing:');
{
  const v2 = parseSeat('Analysis...\nSTANCE: conditional-go\nCONDITION: MFA on admins and a tested restore\nCONFIDENCE: medium\nPROBABILITY: 35%\nPROBABILITY MEANS: the chance this survives a 12-month look-back with no breach\n');
  assert(v2.probability === 35 && v2.wrote_confidence, 'a v2 block parses, and its CONFIDENCE line is noticed');
  assert(v2.meaningClass === 'outcome-contaminated', '"no breach" reads as outcome-contaminated');
  const v3 = parseSeat('**CHOICE:** A\nPROBABILITY: 78\nPROBABILITY MEANS: the chance a reviewer would still choose A with hindsight, incident or not\n');
  assert(v3.choice === 'A' && v3.probability === 78 && !v3.wrote_confidence, 'a v3 choice block parses, bold keys included');
  assert(v3.meaningClass === 'decision-quality', '"would still choose" reads as decision quality');
  const prose = parseSeat('FIRST: we look at the logs\nanalysis\nFIRST: Callback verification on payee changes\nNOT NOW: SIEM\nPROBABILITY: 70\n');
  assert(prose.first === 'Callback verification on payee changes', 'the block wins over an earlier prose line with the same key');
  const neg = parseSeat('CHOICE: A\nPROBABILITY: 80\nPROBABILITY MEANS: a reviewer would still choose A with hindsight, whether or not an incident happens\n');
  assert(neg.meaningClass === 'decision-quality', 'the v3 definition, negation included, is not misread as outcome-contaminated');
}

console.log('arm scoring:');
{
  const runs = path.join(TMP, 'runs');
  // Baseline arm, shaped like the v2 journal: compound conditions, offensive-security low.
  const v2members = NAMES.map(n => ({ name: n, stance: 'conditional-go',
    condition: 'Sign the DPA and run a DPIA and test restores', probability: n === 'offensive-security' ? 30 : 70 }));
  write(path.join(runs, 'baseline', 'arm.json'), { arm: 'baseline', version: '2.2.0' });
  write(path.join(runs, 'baseline', 'hindsight-divergence', 'council.json'),
    { sha: 'b1', question: 'credentials on sale: A or B', mode: 'standard', members: v2members, converged: 'after-challenge' });
  write(path.join(runs, 'baseline', 'hindsight-divergence', 'seats', 'offensive-security-1.md'),
    'STANCE: conditional-go\nCONDITION: reset and MFA\nCONFIDENCE: low\nPROBABILITY: 30\nPROBABILITY MEANS: chance of no incident in 12 months\n');

  // v3 arm: atomic conditions, the choice, consistent convergence.
  const v3members = NAMES.map(n => ({ name: n, stance: 'conditional-go', choice: 'A',
    condition: 'Security keys issued to every payroll user', probability: n === 'offensive-security' ? 72 : 76 }));
  write(path.join(runs, 'v3', 'arm.json'), { arm: 'v3', version: '3.0.0', verify: 'Integrity OK: all 19 executable files match' });
  write(path.join(runs, 'v3', 'hindsight-divergence', 'council.json'),
    { sha: 'c1', question: 'credentials on sale: A or B', mode: 'standard', protocol: '3.0.0', question_type: 'choice',
      members: v3members, acceptance: all(true), converged: 'after-challenge', alternatives: ['B'] });
  write(path.join(runs, 'v3', 'hindsight-divergence', 'seats', 'offensive-security-1.md'),
    'CHOICE: A\nPROBABILITY: 72\nPROBABILITY MEANS: whether a reviewer would still choose A with hindsight\n');
  // A broken v3 run: two seats missing.
  write(path.join(runs, 'v3', 'nogo-canary', 'council.json'),
    { sha: 'c2', question: 'drop MFA', mode: 'standard', protocol: '3.0.0', alternatives: ['keep MFA'],
      members: NAMES.map((n, i) => i < 2 ? { name: n, stance: 'missing' } : { name: n, stance: 'no-go', probability: 85 }) });

  const base = scoreArm(path.join(runs, 'baseline'), cases).summary;
  const v3 = scoreArm(path.join(runs, 'v3'), cases).summary;
  assert(base.mean_offsec_gap === 40 && v3.mean_offsec_gap === 4, 'the offensive-security gap is the other seats\' mean minus its own');
  assert(base.atomic_condition_rate === 0 && v3.atomic_condition_rate === 1, 'compound conditions are counted as not atomic');
  assert(v3.valid_runs === 1 && v3.invalid_runs.length === 1 && /2 seats missing/.test(v3.invalid_runs[0].reasons[0]),
    'a run with two missing seats is invalid, with the reason');
  assert(v3.expectations_passed === v3.expectations_total && v3.expectations_total >= 3,
    'the v3 hindsight run passes the case expectations (choice, floor, offensive-security floor)');
  assert(base.expectations_passed < base.expectations_total, 'the v2-shaped run fails them');
  assert(base.seat_meaning.outcome_contaminated === 1 && v3.seat_meaning.decision_quality === 1,
    'seat micro-evals report how each arm reads its number');
  assert(v3.converged_inconsistent === 0, 'a recorded outcome the matrix supports is consistent');

  // A v3 label is not enough: stale personas make the whole arm invalid.
  write(path.join(runs, 'stale', 'arm.json'), { arm: 'stale', version: '3.0.0',
    verify: '  * stale council persona without the v3 tool list: C:/Users/x/.claude/agents/ciso.md' });
  write(path.join(runs, 'stale', 'hindsight-divergence', 'council.json'),
    { sha: 'd1', question: 'q', mode: 'standard', protocol: '3.0.0', members: v3members, alternatives: ['B'] });
  write(path.join(runs, 'stale', 'hindsight-divergence', 'seats', 'ciso-1.md'), 'CHOICE: A\nPROBABILITY: 70\n');
  const stale = scoreArm(path.join(runs, 'stale'), cases);
  assert(stale.summary.valid_runs === 0 && /stale council personas/.test(stale.arm_invalid[0]),
    'an arm whose verify output reports stale personas is invalid as a whole');
  assert(stale.seats.length === 0, 'and its seat returns are not scored either');

  // A baseline record written by v3 is in the wrong arm.
  write(path.join(runs, 'mixed', 'arm.json'), { arm: 'mixed', version: '2.2.0' });
  write(path.join(runs, 'mixed', 'go-canary', 'council.json'),
    { sha: 'e1', question: 'q', mode: 'standard', protocol: '3.0.0', members: v3members });
  assert(/written by v3/.test(scoreArm(path.join(runs, 'mixed'), cases).summary.invalid_runs[0].reasons.join(' ')),
    'a v3 record in the baseline arm is refused');

  const cli = cp.spawnSync('node', [EVAL, runs], { encoding: 'utf8' });
  assert(cli.status === 0 && /\| Metric \| baseline \|/.test(cli.stdout) && /offensive-security gap/.test(cli.stdout),
    'the CLI prints a comparison table across arms');
}

console.log('grading worksheet:');
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'council-sheet-test-'));
  const jl = path.join(home, 'journal.jsonl');
  const rec = { sha: 'ab12cd34', question: 'Should we permanently switch off MFA for the finance team and use a shared vault?',
    recommendation: 'No; fix the prompt friction instead.', alternatives: ['Switch MFA off'], probability: 88,
    probability_basis: 'decision-quality', outcome: { recorded: false } };
  const live = { sha: 'ffff0000', question: 'Should we buy a new coffee machine for the office kitchen?', outcome: { recorded: false } };
  fs.writeFileSync(jl, JSON.stringify(rec) + '\n' + JSON.stringify(live) + '\n');
  const before = fs.readFileSync(jl, 'utf8');
  const r = cp.spawnSync('node', [SHEET, '--journal', jl], { encoding: 'utf8' });
  assert(r.status === 0 && /nogo-canary/.test(r.stdout) && /ab12cd34/.test(r.stdout), 'a run is matched to its case');
  assert(/'exercise: nogo-canary/.test(r.stdout), 'the pasteable command carries the exercise: prefix');
  assert(/would you still choose this course/.test(r.stdout), 'a v3 run is graded on the hindsight question');
  assert(!/ffff0000/.test(r.stdout), 'a run matching no case is left to `grade`');
  assert(fs.readFileSync(jl, 'utf8') === before, 'the worksheet never writes to the journal');
  fs.rmSync(home, { recursive: true, force: true });
}

fs.rmSync(TMP, { recursive: true, force: true });
if (failed) { console.error('\n' + failed + ' eval test(s) failed.'); process.exit(1); }
console.log('\nall eval tests passed.');
