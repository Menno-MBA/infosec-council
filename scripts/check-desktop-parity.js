#!/usr/bin/env node
/*
 * Edition policy-parity guard (council / desktop / ChatGPT).
 *
 * The file name says "desktop" for history; it now guards all three editions. The
 * ChatGPT edition was added because its only check was a byte budget, so a gutted
 * INSTRUCTIONS.md passed as "in sync" -- and that file sits at its size ceiling, so
 * every pressure on it is to CUT, which is exactly when a rule goes missing.
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
 * appear in both files. The set has since grown past retrieval to cover the chairman's
 * closing checks and the convergence rule.
 *
 * Needles must match the RULE's own prose, not a token that also appears in a JSON
 * schema block or a heading. A needle on the bare token `label-only` passed with the
 * entire label-only branch deleted, because the token survived in two schema examples.
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
const CHATGPT = path.join(ROOT, 'chatgpt', 'INSTRUCTIONS.md');

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
  // NOT the bare token `label-only`: it also appears in two JSON schema blocks in the
  // council SKILL.md, so a needle on the token stayed green with the entire rule
  // deleted. Match a phrase that only occurs in the rule's own prose.
  ['label-only convergence outcome', 'split wearing one word'],
  ['an unnamed condition is not agreement', 'is not agreement evidence'],
  // Deliberately without the number. Coupling the guard to "20" made a threshold change
  // a five-file edit in which the check protecting you is one of the files you must
  // remember to edit. The rule is "a bounded spread gates convergence"; the value is a knob.
  ['probability spread bounds convergence', 'differ by at most'],
  // v3. PROBABILITY rates the choice, not the absence of an incident; every probed v2
  // seat read "survives a 12-month look-back" as "and nothing bad happens".
  ['probability is decision quality', 'whether or not an incident happens anyway'],
  ['question types are declared or classified', '-type=<decision|choice|plan|bundle>'],
  ['cross-acceptance feeds convergence', 'cross-acceptance'],
  ['a missing seat never agrees', 'counts in the panel and never as agreeing'],
  ['action plan is capped', 'at most five items'],
  ['owners route through the role map', 'unassigned (<duty>)'],
  ['NIS2 scope is a per-run entity test', 'entity test'],
  ['determination pass owns the clocks', 'determination pass owns the clocks'],
];

// Deliberately NOT shared, and asserted as such: each needle must be present in the
// council file and ABSENT from desktop. Documenting the exclusion is not enough -- an
// inert list lets the absence be "fixed" silently in either direction, and the reason
// these are excluded is a real constraint, not a preference. The pending ledger, the
// per-run calibration read, and the round-2 delta capture all need a journal that
// survives between sessions; plain Desktop storage is ephemeral, so mirroring them
// would spend prompt budget on a measurement nobody there can ever read.
// If Desktop ever gains durable storage by default, move these into SHARED_POLICY.
const NOT_SHARED = [
  ['pending ledger', 'journal.js pending'],
  ['ungraded prior run prompt', 'still pending'],
  // Round-2 instrumentation (stance_r1 / probability_r1 / blind_spots_from_r2) exists
  // to be aggregated by `journal.js meta` across many runs. With no journal there is
  // nothing to aggregate, so recording it in the Desktop edition would cost prompt
  // budget for a measurement nobody can ever read.
  ['round-2 delta capture', 'stance_r1'],
  // One voice plays every Desktop advisor, so anonymized peer scoring there would be one
  // model marking its own work seven times. Desktop runs a steelman instead (see below).
  ['anonymized peer scoring', 'Scored anonymous ranking'],
];

// The third edition. Its only guard was a byte budget, so a gutted INSTRUCTIONS.md
// passed as "in sync" -- and because that file sits at its size ceiling, the pressure
// on it is always to CUT, which is exactly when a rule goes missing. Fewer needles than
// the desktop set on purpose: this edition states the protocol far more tersely, so the
// list holds only rules whose loss would change what the GPT decides.
const CHATGPT_POLICY = [
  ['label-only convergence outcome', 'label-only'],
  ['unnamed condition is not agreement', 'is not agreement evidence'],
  ['spread bounds convergence', 'spread is at most'],
  ['condition test scoped to conditional stances', 'where any of those are conditional stances'],
  ['probability is the seat\'s own position, rated as decision quality', 'whether or not an incident happens anyway'],
  ['seats end with the per-type block', 'output-blocks.md'],
  ['steelman replaces peer scoring', 'steelman'],
  ['cross-acceptance, labelled a self-check', 'cross-acceptance (a self-check'],
  ['action plan is capped', 'at most 5 items'],
  ['NIS2 entity test', 'entity test'],
  ['obligation omission gate', 'GATE B'],
  ['determination pass runs first', 'NOT TRIGGERED'],
  ['anti-anchoring on house positions', 'defaults, not doctrine'],
  ['forced debate needs a pre-mortem', 'pre-mortem'],
  ['no false consensus', 'the conflict is the product'],
];

// The seven council personas. A persona is where the stale v2 definition survived the
// v2.2.0 fix: the orchestrator was corrected, the persona files still told every seat
// its number meant "this recommendation survives", and nothing compared them. They now
// point at the block the orchestrator injects instead of restating it, and they carry a
// web-only tool list. Claude Code ignores an unrecognised frontmatter key without an
// error, so a misspelt `tools:` silently restores every tool: the key is checked by name.
const AGENTS = path.join(ROOT, '.claude', 'agents');
const COUNCIL_PERSONAS = ['ciso', 'security-architect', 'offensive-security', 'security-operations',
  'compliance-analyst', 'dpo', 'risk-manager'];
const PERSONA_FORBIDDEN = [
  ['the v2 probability definition', 'survives a 12-month look-back'],
  ['the v2 probability definition', 'this recommendation survives'],
  ['a restated confidence word', 'STANCE / CONFIDENCE / PROBABILITY'],
];
// Seats that must not restate notification clocks: the determination pass owns them.
const CLOCK_FREE = ['ciso', 'security-operations'];

function checkPersonas(failures) {
  console.log('\ncouncil persona contract:');
  for (const name of COUNCIL_PERSONAS) {
    const file = path.join(AGENTS, name + '.md');
    if (!fs.existsSync(file)) { failures.push('persona ' + name + ' is missing'); continue; }
    const raw = fs.readFileSync(file, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const keys = {};
    if (fm) for (const line of fm[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (kv) keys[kv[1]] = kv[2].trim();
    }
    const problems = [];
    if (keys.tools !== 'WebSearch, WebFetch') problems.push('frontmatter `tools` must be exactly "WebSearch, WebFetch" (got ' + JSON.stringify(keys.tools) + ')');
    if (keys.omitClaudeMd !== 'true') problems.push('frontmatter `omitClaudeMd: true` is missing');
    const body = raw.slice(fm ? fm[0].length : 0);
    for (const [label, needle] of PERSONA_FORBIDDEN) {
      if (body.includes(needle)) problems.push('still carries ' + label + ' ("' + needle + '")');
    }
    if (!body.includes('output block the orchestrator hands you')) problems.push('does not point at the injected output block');
    if (CLOCK_FREE.includes(name) && /\b(24h|72h)\b/.test(body)) problems.push('restates a notification clock the determination pass owns');
    if (problems.length) failures.push('persona ' + name + ': ' + problems.join('; '));
    else console.log('  ok: ' + name);
  }
}

// The per-type blocks are the one stretch of text the CLI and Desktop editions must hold
// byte for byte: the CLI injects them into every seat, Desktop states them inline, and a
// needle check on a few phrases would pass with a whole block missing.
function checkOutputBlocks(councilRaw, desktopRaw, failures) {
  const grab = function (s) {
    const m = s.match(/<!-- OUTPUT-BLOCKS:BEGIN -->[\s\S]*?<!-- OUTPUT-BLOCKS:END -->/);
    return m ? m[0].replace(/\r\n/g, '\n') : null;
  };
  const a = grab(councilRaw), b = grab(desktopRaw);
  if (!a) failures.push('council SKILL.md has no OUTPUT-BLOCKS markers');
  else if (!b) failures.push('desktop/SKILL.md has no OUTPUT-BLOCKS markers');
  else if (a !== b) failures.push('the OUTPUT-BLOCKS text differs between the council and desktop SKILL.md; copy it across verbatim');
  else console.log('  ok: output blocks identical across council and desktop');
}

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
  const councilRaw = fs.readFileSync(COUNCIL, 'utf8');
  const desktopRaw = fs.readFileSync(DESKTOP, 'utf8');
  const council = norm(councilRaw);
  const desktop = norm(desktopRaw);

  console.log("council/desktop policy parity:");
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

  checkOutputBlocks(councilRaw, desktopRaw, failures);
  checkPersonas(failures);

  if (!fs.existsSync(CHATGPT)) {
    failures.push('chatgpt/INSTRUCTIONS.md is missing');
  } else {
    const chatgpt = norm(fs.readFileSync(CHATGPT, 'utf8'));
    console.log('\nchatgpt edition policy:');
    for (const [label, rawNeedle] of CHATGPT_POLICY) {
      if (chatgpt.includes(norm(rawNeedle))) {
        console.log('  ok: ' + label);
      } else {
        failures.push('chatgpt: ' + label + ' -- missing from chatgpt/INSTRUCTIONS.md; ' +
          'if it was cut to fit the 8000-byte budget, that budget cut a rule, not a redundancy');
      }
    }
    console.log('');
  }

  for (const [label, rawNeedle] of NOT_SHARED) {
    const needle = norm(rawNeedle);
    const inCouncil = council.includes(needle);
    const inDesktop = desktop.includes(needle);
    if (inCouncil && !inDesktop) {
      console.log('  ok: ' + label + ' (council-only, as intended)');
    } else if (inDesktop) {
      failures.push(label + ' -- present in desktop/SKILL.md, which NOT_SHARED says it must not be; ' +
        'either the Desktop edition gained durable storage (move the row to SHARED_POLICY) or the rule leaked');
    } else {
      failures.push(label + ' -- absent from BOTH files; drop the row from NOT_SHARED if the rule was retired');
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
  console.log('\nedition parity passed.');
}

if (require.main === module) main();
module.exports = { SHARED_POLICY };
