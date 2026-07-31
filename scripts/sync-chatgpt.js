#!/usr/bin/env node
/*
 * Regenerate the ChatGPT edition's knowledge files from the canonical sources,
 * so the three editions never drift. Zero dependencies, cross-platform.
 *
 *   node scripts/sync-chatgpt.js          # write the generated files
 *   node scripts/sync-chatgpt.js --check  # CI: exit 1 if anything is out of sync
 *
 * Canonical sources (single source of truth):
 *   .claude/skills/infosec-council/frameworks.md  -> chatgpt/knowledge/frameworks.md
 *   .claude/skills/infosec-council/context.md     -> chatgpt/knowledge/context.md
 *   .claude/agents/*.md  (in council order)       -> chatgpt/knowledge/council-personas.md
 *
 * It also guards `chatgpt/INSTRUCTIONS.md`, which is NOT generated -- it is
 * hand-maintained, because the GPT edition states the protocol in its own condensed
 * voice rather than mirroring the orchestrator verbatim. What it shares with the
 * generated files is the failure mode: an edit here breaks the ChatGPT edition and
 * nothing in the CLI notices. See the budget check below.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILL = path.join(ROOT, '.claude', 'skills', 'infosec-council');
const AGENTS = path.join(ROOT, '.claude', 'agents');
const KNOW = path.join(ROOT, 'chatgpt', 'knowledge');
const CHECK = process.argv.includes('--check');

// Council order (drives Round-1 order in the GPT edition).
const ORDER = [
  'ciso', 'security-architect', 'offensive-security', 'security-operations',
  'compliance-analyst', 'dpo', 'risk-manager'
];

const PERSONAS_PREAMBLE =
  '# Information Security Council, advisor personas\n\n' +
  'This file defines the seven advisor personas the GPT role-plays. In Round 1 adopt each one\n' +
  'fully and in isolation. Frameworks/versions come from frameworks.md; house-context from context.md.\n' +
  "(The 'model: sonnet' lines are for the Claude Code CLI edition and can be ignored here.)";

function buildPersonas() {
  const parts = ORDER.map(function (name) {
    return fs.readFileSync(path.join(AGENTS, name + '.md'), 'utf8').trim();
  });
  return PERSONAS_PREAMBLE + '\n\n---\n\n' + parts.join('\n\n---\n\n') + '\n';
}

// ChatGPT's hard ceiling on a custom GPT's instruction field. This is a platform
// limit, not a house style rule: exceed it and the GPT builder truncates at the
// boundary, so the protocol would silently lose whatever sits past the cut -- with
// no error anywhere in this repo. The file is close to the line by design (the
// council protocol is long), so every edit needs the headroom in front of it.
const CHATGPT_INSTRUCTION_LIMIT = 8000;
const INSTRUCTIONS = path.join(ROOT, 'chatgpt', 'INSTRUCTIONS.md');

// Measured in BYTES, not characters. The file carries non-ASCII (accented brand
// names, HTML entities in the report spec), so a `.length` character count would
// pass a file the platform rejects.
function checkInstructionBudget() {
  const rel = path.relative(ROOT, INSTRUCTIONS);
  if (!fs.existsSync(INSTRUCTIONS)) {
    console.error('MISSING: ' + rel);
    return 1;
  }
  const bytes = Buffer.byteLength(fs.readFileSync(INSTRUCTIONS, 'utf8'), 'utf8');
  const headroom = CHATGPT_INSTRUCTION_LIMIT - bytes;
  if (headroom < 0) {
    console.error('OVER BUDGET: ' + rel + ' is ' + bytes + ' bytes, limit is '
      + CHATGPT_INSTRUCTION_LIMIT + ', over by ' + (-headroom) + '.');
    console.error('  ChatGPT truncates at the limit; cut a clause rather than shipping a half-stated rule.');
    return 1;
  }
  console.log('instruction budget: ' + rel + ' = ' + bytes + '/' + CHATGPT_INSTRUCTION_LIMIT
    + ' bytes (' + headroom + ' to spare)');
  return 0;
}

const targets = [
  { dst: path.join(KNOW, 'frameworks.md'), content: fs.readFileSync(path.join(SKILL, 'frameworks.md'), 'utf8') },
  { dst: path.join(KNOW, 'context.md'), content: fs.readFileSync(path.join(SKILL, 'context.md'), 'utf8') },
  { dst: path.join(KNOW, 'council-personas.md'), content: buildPersonas() }
];

let drift = 0;
for (const t of targets) {
  const cur = fs.existsSync(t.dst) ? fs.readFileSync(t.dst, 'utf8') : null;
  const rel = path.relative(ROOT, t.dst);
  if (cur === t.content) { console.log('in sync: ' + rel); continue; }
  drift++;
  if (CHECK) {
    console.error('OUT OF SYNC: ' + rel + '  (run: node scripts/sync-chatgpt.js)');
  } else {
    fs.writeFileSync(t.dst, t.content);
    console.log('regenerated: ' + rel);
  }
}

// The budget check runs in both modes. Regenerating the knowledge files does not make
// an over-budget instruction file acceptable, and a maintainer who ran the write path
// should learn about it here rather than from a silently truncated GPT.
const overBudget = checkInstructionBudget();

if (CHECK && drift > 0) {
  console.error('\n' + drift + ' file(s) out of sync. The ChatGPT knowledge folder is generated;');
  console.error('edit the canonical sources under .claude/, then run node scripts/sync-chatgpt.js.');
}
if ((CHECK && drift > 0) || overBudget) process.exit(1);
console.log(CHECK ? 'chatgpt knowledge is in sync.' : 'done.');
