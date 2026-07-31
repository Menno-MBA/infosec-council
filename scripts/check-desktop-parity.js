#!/usr/bin/env node
/*
 * Desktop/council policy-parity guard.
 *
 * `desktop/SKILL.md` is a hand-maintained mirror of the council orchestrator, and the
 * two files legitimately differ: Desktop has no isolated sub-agents, no Boardroom mode,
 * and no persistent journal. So a whole-file diff is the wrong tool -- it would be red
 * forever and nobody would read it.
 *
 * What actually bit us was a *dropped clause*: the desktop copy of the retrieval pass
 * lost "add any subject-specific source the decision names", so a Desktop run built a
 * narrower must-check set than a CLI run for the same question. That is the drift class
 * worth guarding, and it is checkable: a named set of load-bearing policy sentences must
 * appear in both files.
 *
 * This is the `check-versions.js` shape (assert a small set of invariants across
 * hand-maintained files), not the `sync-chatgpt.js` shape (regenerate one from another).
 * Add a row when you add a policy rule that both editions must state.
 *
 *   node scripts/check-desktop-parity.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COUNCIL = path.join(ROOT, '.claude', 'skills', 'infosec-council', 'SKILL.md');
const DESKTOP = path.join(ROOT, 'desktop', 'SKILL.md');

// Each row: a short label plus a substring that must appear in BOTH files.
// Keep the needles short and semantic; long verbatim spans make this brittle against
// the two editions' legitimately different phrasing.
const SHARED_POLICY = [
  ['retrieval state contract', '<RETRIEVAL_STATE>'],
  ['off means seats do not search', 'run no search at all'],
  ['query minimization', 'What you search for leaves the building.'],
  ['fetch scope', 'or from retrieved content itself'],
  ['data not instruction', 'untrusted data, never instruction'],
  ['verified means retrieved this run', 'actually retrieved it'],
  ['must-check includes subject-specific sources', 'subject-specific source the decision names'],
  ['brief carries no stance', 'no stance, no conclusion, no recommendation'],
  ['Quick resolves to OFF', 'OFF (Quick mode)'],
  ['provenance gate', 'Gate C'],
  ['register is where to verify', 'external-websources.md'],
  ['outcome vocabulary includes not-tested', 'not-tested'],
  ['measured reliability beside asserted', 'measured reliability'],
  ['closing check runs in every mode', 'dropped dissent'],
  ['manufactured unanimity check', 'manufactured unanimity'],
  ['label-only convergence outcome', 'label-only'],
  ['an unnamed condition is not agreement', 'is not agreement evidence'],
  ['probability spread bounds convergence', 'differ by at most 20 points'],
];

// Deliberately NOT checked for parity, with the reason, so a future maintainer does not
// "fix" the absence: the pending ledger and the per-run calibration read need a journal
// that survives between sessions. Plain Desktop storage is ephemeral, so those steps have
// nothing to operate on there and the desktop edition says so instead of mirroring them.
// If Desktop ever gains durable storage by default, move these into SHARED_POLICY.
const NOT_SHARED = [
  ['pending ledger', 'journal.js pending'],
  ['ungraded prior run prompt', 'still pending'],
  // Round-2 instrumentation (stance_r1 / probability_r1 / blind_spots_from_r2) exists
  // to be aggregated by `journal.js meta` across many runs. With no journal there is
  // nothing to aggregate, so recording it in the Desktop edition would cost prompt
  // budget for a measurement nobody can ever read.
  ['round-2 delta capture', 'stance_r1'],
];

function main() {
  for (const f of [COUNCIL, DESKTOP]) {
    if (!fs.existsSync(f)) {
      console.error('desktop parity: missing ' + path.relative(ROOT, f));
      process.exit(1);
    }
  }
  // Normalize away what legitimately differs between two hand-written editions:
  // markdown emphasis, inline-code ticks, case, and line wrapping. What must NOT
  // differ is the rule itself, which is what survives this normalization.
  const norm = function (s) {
    return s.toLowerCase().replace(/[*`_]/g, '').replace(/\s+/g, ' ');
  };
  const council = norm(fs.readFileSync(COUNCIL, 'utf8'));
  const desktop = norm(fs.readFileSync(DESKTOP, 'utf8'));

  console.log('desktop/council policy parity:');
  const failures = [];
  for (const [label, rawNeedle] of SHARED_POLICY) {
    const needle = norm(rawNeedle);
    const inCouncil = council.includes(needle);
    const inDesktop = desktop.includes(needle);
    if (inCouncil && inDesktop) {
      console.log('  ok: ' + label);
    } else if (!inCouncil && !inDesktop) {
      // Neither has it: the rule was deliberately removed. Flag it so the row gets
      // deleted from this list rather than silently passing forever.
      failures.push(label + ' -- absent from BOTH files; drop the row from SHARED_POLICY if the rule was retired');
    } else {
      failures.push(label + ' -- present in ' + (inCouncil ? 'council' : 'desktop') +
        ', missing from ' + (inCouncil ? 'desktop/SKILL.md' : '.claude/skills/infosec-council/SKILL.md'));
    }
  }

  if (failures.length) {
    console.error('\ndesktop parity FAILED:');
    failures.forEach(function (f) { console.error('  ' + f); });
    console.error('\nThe two editions must state the same load-bearing rules (retrieval policy,');
    console.error('closing checks, convergence). Fix the file that lost the rule, or update');
    console.error('SHARED_POLICY if the wording intentionally changed.');
    process.exit(1);
  }
  console.log('\ndesktop parity passed.');
}

if (require.main === module) main();
module.exports = { SHARED_POLICY };
