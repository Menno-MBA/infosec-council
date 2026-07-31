#!/usr/bin/env node
/*
 * Tests for the council decision journal.
 *
 * journal.js carries the calibration maths -- Brier, ECE, the reliability curve --
 * that every synthesis quotes its measured reliability from, and it had no tests.
 * That was tolerable while the file only appended records. It stopped being
 * tolerable when it started computing things decisions are calibrated against.
 *
 * Two things are being held here:
 *
 *   1. Backwards compatibility. There are live journals in the wild with records
 *      written before these fields existed, including one carrying a `confidence`
 *      value outside the documented vocabulary. Reading them must not break, and
 *      a missing field must not be silently read as a zero.
 *   2. The Round-2 value statistics, which are the whole point of instrumenting
 *      the cross-exam: they must stay honest about a small sample rather than
 *      producing a number that reads as a finding.
 *
 * Zero dependencies, same shape as scripts/test-reports.js. Runs against a
 * throwaway COUNCIL_HOME so it never touches the real journal.
 *
 *   node scripts/test-journal.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const JOURNAL_JS = path.join(ROOT, '.claude', 'skills', 'infosec-council', 'journal.js');

let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ok: ' + msg); }
  else { console.error('  FAIL: ' + msg); failed++; }
}

// Each case gets its own COUNCIL_HOME so one test's records cannot leak into another.
function freshHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'council-journal-test-'));
}
function seed(home, records) {
  fs.writeFileSync(path.join(home, 'journal.jsonl'),
    records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''));
  return home;
}
function run(home, args, stdin) {
  const env = Object.assign({}, process.env, { COUNCIL_HOME: home });
  delete env.COUNCIL_ORG;            // a set ORG would redirect to a subfolder
  const r = cp.spawnSync('node', [JOURNAL_JS].concat(args),
    { env, encoding: 'utf8', input: stdin == null ? '' : stdin });
  return { status: r.status, out: (r.stdout || ''), err: (r.stderr || '') };
}
function runJSON(home, args) {
  const r = run(home, args);
  if (r.status !== 0) throw new Error(args.join(' ') + ' exited ' + r.status + ': ' + r.err);
  try { return JSON.parse(r.out); }
  catch (e) { throw new Error(args.join(' ') + ' did not emit JSON: ' + r.out.slice(0, 200)); }
}

function member(name, stance, probability, extra) {
  return Object.assign({ name, stance, confidence: 'medium', probability }, extra || {});
}
// A record in the shape written before Round-2 instrumentation existed: no
// stance_r1, no probability_r1, no blind_spots_from_r2 anywhere.
function legacyRecord(sha, over) {
  return Object.assign({
    sha, family: 'aaaaaaaa', ts: '2026-01-01T00:00:00Z', mode: 'deep',
    question: 'Legacy run ' + sha, confidence: 'medium', probability: 70,
    recommendation: 'Do the thing.', key_assumption: 'Someone owns it.',
    converged: 'after-challenge',
    members: [member('ciso', 'go', 70), member('dpo', 'conditional-go', 65)],
    outcome: { recorded: false }
  }, over || {});
}
// A record carrying the Round-2 instrumentation.
function r2Record(sha, members, over) {
  return Object.assign(legacyRecord(sha), { members }, over || {});
}

// ---------------------------------------------------------------------------
console.log('backwards compatibility with pre-instrumentation records:');
// ---------------------------------------------------------------------------
{
  const home = seed(freshHome(), [
    legacyRecord('11111111'),
    // The real journal contains a run logged with `medium-high`, which is outside
    // the documented low|medium|high vocabulary. Validating new writes must not
    // break reads of records already on disk.
    legacyRecord('22222222', { confidence: 'medium-high' }),
    legacyRecord('33333333', { outcome: { recorded: true, ts: '2026-02-01T00:00:00Z', result: 'partial', note: '' } })
  ]);

  const meta = runJSON(home, ['meta']);
  assert(meta.total_runs === 3, 'meta counts every legacy record');
  assert(meta.with_outcome === 1 && meta.pending === 2, 'meta separates graded from pending legacy records');

  const buckets = meta.calibration_by_confidence.map(c => c.confidence).sort();
  assert(buckets.includes('medium-high'),
    'an out-of-vocabulary confidence already on disk still reports as its own bucket');

  const listed = run(home, ['journal', '10']);
  assert(listed.status === 0 && (listed.out.match(/"sha"/g) || []).length === 3,
    'journal lists every legacy record');

  const pending = runJSON(home, ['pending']);
  assert(pending.pending_total === 2, 'pending finds the ungraded legacy records');

  const look = runJSON(home, ['lookback', 'Legacy run 11111111']);
  assert(Array.isArray(look.matches) && look.matches.length > 0,
    'lookback still matches legacy records');
}

// ---------------------------------------------------------------------------
console.log('round-2 value statistics:');
// ---------------------------------------------------------------------------
{
  // Below the threshold there is not enough to say anything, and saying it is the
  // required behaviour: a mean over two runs presented as a headline reads as a
  // finding. Same discipline as the measured-reliability line in synthesis.
  const home = seed(freshHome(), [
    r2Record('aaaaaaa1', [member('ciso', 'go', 70, { stance_r1: 'go', probability_r1: 70 })]),
    r2Record('aaaaaaa2', [member('ciso', 'go', 70, { stance_r1: 'defer', probability_r1: 50 })])
  ]);
  const meta = runJSON(home, ['meta']);
  assert(meta.round2_value != null, 'meta reports a round2_value block');
  assert(meta.round2_value.runs_with_data === 2, 'round2_value counts the runs carrying the data');
  assert(typeof meta.round2_value.note === 'string' && meta.round2_value.note.length > 0,
    'below the threshold round2_value states why it cannot say');
  assert(meta.round2_value.mean_seats_with_stance_flip === undefined
      && meta.round2_value.mean_abs_probability_delta === undefined,
    'below the threshold round2_value emits no headline numbers');
}

{
  // Five runs is the floor. Composition below is deliberate:
  //  - run 1: nothing moved at all
  //  - run 2: two of seven seats flip stance, one seat moves 30 points
  //  - run 3: one seat moves DOWN 20 points (must not cancel run 2's gain)
  //  - run 4: legacy shape mixed in -- must be excluded, not read as "no movement"
  //  - run 5, 6: quiet runs to reach the threshold
  const seven = (fn) => Array.from({ length: 7 }, (_, i) => fn(i));
  const still = seven(i => member('seat' + i, 'go', 70, { stance_r1: 'go', probability_r1: 70 }));

  const moved = seven(i => {
    if (i === 0) return member('seat0', 'go', 70, { stance_r1: 'defer', probability_r1: 70 });
    if (i === 1) return member('seat1', 'go', 70, { stance_r1: 'reframe', probability_r1: 70 });
    if (i === 2) return member('seat2', 'go', 90, { stance_r1: 'go', probability_r1: 60 });
    return member('seat' + i, 'go', 70, { stance_r1: 'go', probability_r1: 70 });
  });

  const movedDown = seven(i =>
    i === 0 ? member('seat0', 'go', 50, { stance_r1: 'go', probability_r1: 70 })
            : member('seat' + i, 'go', 70, { stance_r1: 'go', probability_r1: 70 }));

  const home = seed(freshHome(), [
    r2Record('bbbbbbb1', still, { blind_spots_from_r2: 0 }),
    r2Record('bbbbbbb2', moved, { blind_spots_from_r2: 2 }),
    r2Record('bbbbbbb3', movedDown),                       // no blind_spots_from_r2 field
    legacyRecord('bbbbbbb4'),                              // excluded: no r1 data
    r2Record('bbbbbbb5', still, { blind_spots_from_r2: 1 }),
    r2Record('bbbbbbb6', still, { blind_spots_from_r2: 1 })
  ]);
  const rv = runJSON(home, ['meta']).round2_value;

  assert(rv.runs_with_data === 5, 'a legacy record is excluded from round2_value, not counted as no movement');
  assert(rv.note === undefined, 'at the threshold round2_value stops hedging and reports');
  assert(rv.runs_with_a_stance_flip === 1, 'exactly one run had a seat change stance');
  assert(Math.abs(rv.share_of_runs_with_a_stance_flip - 0.2) < 1e-9,
    'share of runs with a stance flip is 1 in 5');
  assert(Math.abs(rv.mean_seats_with_stance_flip - (2 / 5)) < 1e-9,
    'mean seats flipping stance averages the 2 in one run across all 5');

  // run2 delta = 30/7, run3 delta = 20/7 (absolute, not signed), others 0.
  // Signed arithmetic would cancel these to (30 - 20)/7 and understate the movement.
  const expectedDelta = +((((30 / 7) + (20 / 7)) / 5).toFixed(3));
  assert(rv.mean_abs_probability_delta === expectedDelta,
    'a downward move contributes its absolute value and does not cancel an upward one');

  // Partial instrumentation must be visible. Runs 1/3/5/6 carry all seven seats;
  // run 2 carries seven too, so 35 of 35 here -- the next case exercises the gap.
  assert(rv.seats_measured && rv.seats_measured.rate === 1,
    'full instrumentation reports a measurement rate of 1');

  assert(rv.blind_spots_attributed_to_round2 != null, 'blind-spot attribution is reported');
  assert(rv.blind_spots_attributed_to_round2.runs_with_data === 4,
    'a record missing blind_spots_from_r2 is skipped, not counted as zero');
  assert(Math.abs(rv.blind_spots_attributed_to_round2.mean - 1) < 1e-9,
    'blind-spot mean is (0+2+1+1)/4, with the missing record excluded');
  assert(!Number.isNaN(rv.blind_spots_attributed_to_round2.mean),
    'a missing blind_spots_from_r2 never produces NaN');
  assert(typeof rv.blind_spots_attributed_to_round2.note === 'string'
      && /self-report/i.test(rv.blind_spots_attributed_to_round2.note),
    'the blind-spot figure is labelled as self-reported, unlike the arithmetic deltas');
}

{
  // Partial instrumentation: five runs of seven seats where only ONE seat per run
  // carries probability_r1, and that seat moved 70 points. The denominator is the
  // whole panel by design ("movement per panel seat"), so the mean is 70/7 = 10 --
  // NOT 70. A denominator over measured seats only would report 70 and read as a
  // panel in turmoil. This pins the choice, which no fixture previously did.
  const partial = (i) => i === 0
    ? member('seat0', 'go', 90, { stance_r1: 'go', probability_r1: 20 })
    : member('seat' + i, 'go', 70, { stance_r1: 'go' });
  const runs = ['g1', 'g2', 'g3', 'g4', 'g5'].map(
    s => r2Record(s, Array.from({ length: 7 }, (_, i) => partial(i))));
  const rv = runJSON(seed(freshHome(), runs), ['meta']).round2_value;
  assert(rv.mean_abs_probability_delta === 10,
    'the probability delta is per panel seat, not per measured seat');
  assert(rv.seats_measured.measured === 5 && rv.seats_measured.of === 35,
    'partial instrumentation is reported, so a diluted mean is not read as full coverage');
  assert(rv.seats_measured.rate === +(5 / 35).toFixed(3),
    'the measurement rate exposes how much of the panel the mean actually covers');
}

{
  // A Quick run has no Round 2 to measure. Excluding it matters: counted as a run
  // with no movement, three-seat Quick runs would drag the mean toward "Round 2
  // changes nothing" without any cross-exam ever having happened.
  const home = seed(freshHome(), [
    r2Record('ccccccc1', [member('ciso', 'go', 70, { stance_r1: 'defer', probability_r1: 40 })]),
    Object.assign(legacyRecord('ccccccc2'), {
      mode: 'quick',
      members: [member('ciso', 'go', 70), member('dpo', 'go', 70), member('risk-manager', 'go', 70)]
    })
  ]);
  const rv = runJSON(home, ['meta']).round2_value;
  assert(rv.runs_with_data === 1, 'a Quick run is excluded from round2_value rather than counted as no movement');
}

// ---------------------------------------------------------------------------
console.log('confidence vocabulary at log time:');
// ---------------------------------------------------------------------------
{
  const base = { question: 'Should we do X?', mode: 'deep', probability: 70 };
  const home = freshHome();

  for (const value of ['low', 'medium', 'high']) {
    const r = run(home, ['log'], JSON.stringify(Object.assign({}, base, { confidence: value })));
    assert(r.status === 0, 'log accepts confidence "' + value + '"');
  }

  // The live journal contains a run logged as `medium-high`. meta buckets calibration
  // by this value, so a fourth spelling silently splits the meter -- and the split is
  // invisible until someone reads the bucket list and wonders why it has four rows.
  const bad = run(home, ['log'], JSON.stringify(Object.assign({}, base, { confidence: 'medium-high' })));
  assert(bad.status !== 0, 'log rejects a confidence outside the documented vocabulary');
  assert(/low/.test(bad.err) && /medium/.test(bad.err) && /high/.test(bad.err),
    'the rejection names the three valid values');
  assert(/medium-high/.test(bad.err), 'the rejection quotes the offending value');

  // Absent confidence was always allowed; validating new writes must not turn an
  // optional field into a required one.
  const none = run(home, ['log'], JSON.stringify(base));
  assert(none.status === 0, 'log still accepts a record with no confidence at all');
}

{
  // Validating case-insensitively while storing verbatim reopens the split the check
  // exists to close: the guard passes, and meta then buckets "High", " high " and
  // "high" separately. The value must be normalised on the way in, not just compared.
  const home = freshHome();
  for (const v of ['High', ' high ', 'HIGH', 'high']) {
    const r = run(home, ['log'], JSON.stringify({ question: 'Q ' + v, mode: 'deep', confidence: v, probability: 80 }));
    assert(r.status === 0, 'log accepts confidence "' + v + '"');
  }
  const meta = runJSON(home, ['meta']);
  const buckets = meta.calibration_by_confidence.map(c => c.confidence);
  assert(buckets.length === 1 && buckets[0] === 'high',
    'case and whitespace variants collapse into one bucket instead of splitting the meter');
  assert(meta.calibration_by_confidence[0].runs === 4, 'all four variants land in that one bucket');
}

// ---------------------------------------------------------------------------
console.log('grade: turning the pending count into pasteable actions:');
// ---------------------------------------------------------------------------
{
  const empty = run(freshHome(), ['grade']);
  assert(empty.status === 0 && !/undefined/.test(empty.out) && empty.out.trim().length > 0,
    'grade on an empty journal says so instead of printing an empty block or crashing');
}

{
  const home = seed(freshHome(), [
    legacyRecord('dddddddd1'),
    legacyRecord('dddddddd2'),
    legacyRecord('dddddddd3', { outcome: { recorded: true, ts: '2026-02-01T00:00:00Z', result: 'correct', note: '' } })
  ]);
  const r = run(home, ['grade']);
  assert(r.status === 0, 'grade exits clean');

  const commands = (r.out.match(/^\s*node .*outcome .*/gm) || []);
  assert(commands.length === 2, 'grade emits one pasteable command per pending run, and none for the graded one');
  assert(!/dddddddd3/.test(r.out), 'an already-graded run does not appear');

  // The point of the command line is that it works. Parse one back out and run it.
  const m = commands[0].match(/outcome\s+(\S+)/);
  assert(m != null, 'the emitted line carries the sha in the position outcome expects');
  const applied = run(home, ['outcome', m[1], 'partial', 'graded from the emitted line']);
  assert(applied.status === 0, 'an emitted command line is accepted verbatim by outcome');

  const after = run(home, ['grade']);
  assert((after.out.match(/^\s*node .*outcome .*/gm) || []).length === 1,
    'a run drops off the grade list once its outcome is recorded');
}

{
  // The earliest runs predate `recommendation` and `key_assumption`. A block that
  // prints "undefined" for them is worse than one that says nothing was recorded.
  const home = seed(freshHome(), [
    { sha: 'eeeeeeee', ts: '2026-01-01T00:00:00Z', mode: 'deep', question: 'A bare old run', outcome: { recorded: false } }
  ]);
  const r = run(home, ['grade']);
  assert(r.status === 0 && !/undefined/.test(r.out) && !/null/.test(r.out),
    'a record missing recommendation and key_assumption still renders a usable block');
  assert(/eeeeeeee/.test(r.out), 'the sparse record is still offered for grading');
}

{
  // Same day-threshold semantics as `pending`: the argument moves what counts as
  // ripe, it does not filter records out of the list.
  const recent = { sha: 'ffffffff', ts: new Date(Date.now() - 40 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z'),
    mode: 'deep', question: 'Forty days ago', confidence: 'medium', probability: 70, outcome: { recorded: false } };
  const home = seed(freshHome(), [recent]);
  const at30 = run(home, ['grade', '30']);
  const at60 = run(home, ['grade', '60']);
  // Assert on the per-record marker, not on the word "ripe": the header always reads
  // "(ripe after N days)", so a substring test passed even with ripeness hard-wired
  // to false. The positive direction has to be pinned by the marker itself.
  assert(/\[ripe\]/.test(at30.out) && !/too recent to judge/.test(at30.out),
    'a 40-day-old run is marked ripe at the 30-day threshold');
  assert(/too recent to judge/.test(at60.out) && !/\[ripe\]/.test(at60.out),
    'the same run is marked too recent at the 60-day threshold');
  assert(/ffffffff/.test(at60.out), 'a not-yet-ripe run is still listed, not filtered away');
  // `grade` claims the same day semantics as `pending`; nothing compared them.
  const pend30 = runJSON(home, ['pending', '30']);
  const pend60 = runJSON(home, ['pending', '60']);
  assert(pend30.ripe_total === 1 && pend60.ripe_total === 0,
    'pending agrees with grade on what is ripe at each threshold');
}

// ---------------------------------------------------------------------------
if (failed) {
  console.error('\n' + failed + ' journal test(s) failed.');
  process.exit(1);
}
console.log('\nall journal tests passed.');
