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

if (CHECK && drift > 0) {
  console.error('\n' + drift + ' file(s) out of sync. The ChatGPT knowledge folder is generated;');
  console.error('edit the canonical sources under .claude/, then run node scripts/sync-chatgpt.js.');
  process.exit(1);
}
console.log(CHECK ? 'chatgpt knowledge is in sync.' : 'done.');
