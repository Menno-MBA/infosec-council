#!/usr/bin/env node
/*
 * Golden-file test for the report generators. Guards the verdict-colour
 * regression (a "Not recommended" verdict must not render green) and checks the
 * Node generator emits the calibration fields. If bash+jq are available it also
 * asserts report.sh is byte-identical to report.js. Also guards the incident
 * report generator's assumptions-guardrail rendering (inline ASSUMED tags + the
 * Assumptions-to-verify register). Zero dependencies.
 *
 *   node scripts/test-reports.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SKILL = path.join(ROOT, '.claude', 'skills', 'infosec-council');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'council-test-'));

const FIXTURE = {
  question: 'Golden test: should we adopt tool X?',
  subtitle: 'A concrete detail line that would otherwise bloat the H1 into a run-on.',
  mode: 'deep', confidence: 'high', probability: 68,
  recommendation: 'Deploy after clearing the gates.',
  executive_summary: 'The case is real but conditional. Do the prerequisites first.',
  key_assumption: 'A named owner holds the conditions.',
  next_step: 'Request the vendor DPA this week.',
  unverified: ['adequacy decision still valid on the deploy date'],
  converged: 'forced-debate',
  risks: ['Vendor-side breach you cannot see'],
  consensus: 'All seven agree it is deployable with conditions.',
  conflicts: ['Verbatim vs summaries'],
  blind_spots: ['Nobody wrote the IR runbook'],
  risk_score: {
    inherent: { impact: 'severe', likelihood: 'almost certain', rationale: 'Adverse impact already observed; treat it as materialized.' },
    residual: { impact: 'serious', likelihood: 'possible', rationale: 'Vendor risk cannot be eliminated.' }
  },
  obligations: {
    triggered: [
      { label: 'GDPR breach notification to the DPA', action: 'Notify the supervisory authority; open the breach register at awareness.', determination: 'DPO', execution: 'DPO', clock: '72h from awareness', recipient: 'Autoriteit Persoonsgegevens (AP)', ref: 'GDPR Art.33' }
    ],
    ruled_out: [
      { label: 'NIS2 Art.23 early warning (24h)', reason: 'entity not in NIS2/Cbw scope at the decision date' }
    ]
  },
  minority_report: 'Deploy-with-conditions decays once nobody maintains the conditions.',
  ranking: [
    { position: 'Expert A (dpo)', score: 4.6, note: 'Legal argument strongest' },
    { position: 'Expert B (offensive-security)', score: 4.1, note: 'Concrete attack path' }
  ],
  options: [
    { option: 'A. Summaries only', effort: 'Low', risk_reduction: 'High', cost: 'Low', reversibility: 'High', verdict: 'Recommended' },
    { option: 'B. Verbatim transcripts', effort: 'Low', risk_reduction: 'Low', cost: 'Med', reversibility: 'Low', verdict: 'Not recommended' }
  ],
  risk_appetite: 'A risk-averse owner should pick A.',
  highest_leverage: 'Admin-lock summaries only.',
  members: [
    { name: 'dpo', stance: 'conditional-go', confidence: 'high', probability: 70, summary: 'DPIA and DPA first.', assumptions: 'US vendor.', change_my_mind: 'EEA-only processing.' },
    { name: 'offensive-security', stance: 'no-go', confidence: 'medium', probability: 40, summary: 'Breach is invisible to you.', assumptions: 'Growth-stage SaaS.', change_my_mind: 'BYOK.' }
  ]
};

let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ok: ' + msg); }
  else { console.error('  FAIL: ' + msg); failed++; }
}

function render(cmd, args) {
  const env = Object.assign({}, process.env, { COUNCIL_REPORT_DIR: TMP });
  const r = cp.spawnSync(cmd, args, { input: JSON.stringify(FIXTURE), env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error((cmd + ' failed: ' + (r.stderr || r.stdout)));
  const line = (r.stdout || '').trim().split(/\r?\n/).pop();
  const m = line.match(/(\S+\.html)/);
  if (!m) throw new Error('no output path from ' + cmd);
  return fs.readFileSync(m[1], 'utf8');
}

console.log('report.js:');
const js = render('node', [path.join(SKILL, 'report.js')]);
assert(/class="vc vr">Not recommended/.test(js), '"Not recommended" renders red (vr), not green');
assert(/class="vc vg">Recommended/.test(js), '"Recommended" renders green (vg)');
assert(js.includes('68% it survives a 12-month review'), 'recommendation probability shown');
assert(js.includes('forced debate'), 'converged outcome shown');
assert(js.includes('Not independently verified'), 'unverified callout shown');
assert(js.includes('How the panel rated each other'), 'peer ranking section shown');
assert(js.includes('Stance: conditional-go'), 'member stance shown');
assert(/high &middot; 70%/.test(js), 'member probability shown');
assert(js.includes('inherent <b>25/25</b>'), 'inherent exposure shown on the 5x5 scale (observed impact scored Almost certain)');
assert(js.includes('residual <b>9/25</b>'), 'residual exposure shown as a distinct, lower score');
assert(/residual <b>9\/25<\/b> <span class="expoband band-moderate">Moderate/.test(js), 'residual 9/25 bands as Moderate on the 5x5 scale');
assert(js.includes('likelihood Almost certain'), '5-level likelihood label (Almost certain) renders');
assert(js.includes('<span class="expomark inh"'), 'inherent ghost marker rendered alongside residual');
assert(js.includes('<p class="subtitle">A concrete detail line'), 'subtitle renders under the title');
assert(js.includes('<h2>Regulatory obligations</h2>'), 'obligations section renders');
assert(/<td><span class="st req">Required<\/span><\/td>/.test(js), 'a triggered obligation renders as a Required action');
assert(js.includes('72h from awareness'), 'triggered obligation shows its determination owner and clock');
assert(js.includes('Considered and ruled out this deliberation'), 'explicit-negative ledger renders');
assert(js.includes('entity not in NIS2/Cbw scope at the decision date'), 'a ruled-out obligation shows its one-line reason');

function has(cmd) { try { return cp.spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0 || cmd === 'bash'; } catch (_) { return false; } }

if (cp.spawnSync('bash', ['-c', 'command -v jq'], { encoding: 'utf8' }).stdout.trim()) {
  console.log('report.sh (parity):');
  try {
    const sh = render('bash', [path.join(SKILL, 'report.sh')]);
    assert(js.replace(/\n+$/, '') === sh.replace(/\n+$/, ''), 'report.sh is byte-identical to report.js');
  } catch (e) { assert(false, 'report.sh ran: ' + e.message); }
} else {
  console.log('report.sh: skipped (jq not available)');
}

// Incident-team report generator: inline-data generator (no stdin), writes to
// INCIDENT_REPORT_DIR. Guards the assumptions-guardrail rendering: inline
// ASSUMED tags on timeline rows and the Assumptions-to-verify register.
console.log('incident report.js:');
{
  const incGen = path.join(ROOT, '.claude', 'skills', 'infosec-incidentteam', 'report.js');
  const env = Object.assign({}, process.env, { INCIDENT_REPORT_DIR: TMP });
  const r = cp.spawnSync('node', [incGen], { env, encoding: 'utf8' });
  if (r.status !== 0) {
    assert(false, 'incident report.js ran: ' + (r.stderr || r.stdout));
  } else {
    const line = (r.stdout || '').trim().split(/\r?\n/).pop();
    const m = line.match(/(\S+\.html)/);
    if (!m) {
      assert(false, 'no output path from incident report.js');
    } else {
      const ic = fs.readFileSync(m[1], 'utf8');
      assert(ic.includes('<span class="assumed"'), 'incident timeline renders an inline ASSUMED tag');
      assert(ic.includes('verify virtualization platform exists: infra lead'), 'the hypervisor line is flagged ASSUMED with a verify-owner');
      assert(ic.includes('<h2>Assumptions to verify</h2>'), 'the Assumptions-to-verify register section renders');
      assert(/<th>Verify-owner<\/th>/.test(ic), 'the assumptions register has a verify-owner column');
      assert(ic.includes('SEV-1 / CRITICAL'), 'the severity banner renders');
    }
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
if (failed) { console.error('\n' + failed + ' assertion(s) failed.'); process.exit(1); }
console.log('\nall report tests passed.');
