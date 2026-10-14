#!/usr/bin/env node
/*
 * Grading worksheet for exercise runs (maintainer only).
 *
 * An exercise run, a council run on a documented case such as the UM ransomware fixture,
 * can be graded now, because the case's outcome is already known. The council must never
 * grade its own advice, so this script does not record anything: it prints a worksheet
 * that sets each ungraded run's call beside its case's ground truth, with the outcome
 * command ready to paste once the maintainer has made the judgement.
 *
 *   node scripts/grading-worksheet.js [--cases eval/cases] [--journal <journal.jsonl>]
 *
 * Without --journal it reads the journal journal.js would use (COUNCIL_HOME, COUNCIL_ORG).
 * A run is matched to a case by question similarity; runs that match no case are skipped,
 * because a live decision is graded with `journal.js grade`, not against a fixture.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JOURNAL_JS = path.join(ROOT, '.claude', 'skills', 'infosec-council', 'journal.js');
const MATCH_MIN = 0.25;

const STOP = new Set('a,an,the,and,or,but,if,then,to,of,for,in,on,at,by,we,our,us,you,your,it,is,are,be,do,should,could,would,can,may,with,without,this,that,these,those,as,from,into,about,new,use,using,let,their,they,i'.split(','));
function tokens(s) { return (String(s || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(t => t.length > 2 && !STOP.has(t)); }
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / (A.size + B.size - n);
}

function journalPath(args) {
  const i = args.indexOf('--journal');
  if (i >= 0) return args[i + 1];
  const home = process.env.COUNCIL_HOME || path.join(os.homedir(), '.infosec-council');
  const org = (process.env.COUNCIL_ORG || '').trim();
  return path.join(org ? path.join(home, org) : home, 'journal.jsonl');
}

function loadCases(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) : [];
}

function worksheet(records, cases) {
  const lines = ['# Exercise grading worksheet', '',
    'Grade each run yourself, with the case\'s documented outcome in front of you. The council',
    'never records an outcome on its own advice. Paste the command only once you have decided.', ''];
  let n = 0;
  for (const r of records) {
    if (r.outcome && r.outcome.recorded) continue;
    let best = null, sim = 0;
    for (const c of cases) {
      const s = jaccard(tokens(r.question), tokens(c.question));
      if (s > sim) { sim = s; best = c; }
    }
    if (!best || sim < MATCH_MIN) continue;
    n++;
    const dq = r.probability_basis === 'decision-quality';
    // Similarity cannot tell an exercise run from a live decision that resembles a case,
    // so the maintainer confirms which it was before using the fixture's ground truth.
    lines.push('## ' + n + '. ' + best.id + '  (run ' + r.sha + ', match ' + sim.toFixed(2) + ')', '');
    lines.push('- **First confirm:** this was an exercise run on the case, not a live decision that resembles it. If live, grade it with `journal.js grade` instead.');
    lines.push('- **Question asked:** ' + (r.question || '(not recorded)'));
    lines.push('- **Call:** ' + (r.recommendation || '(not recorded)'));
    lines.push('- **Chosen over:** ' + (Array.isArray(r.alternatives) && r.alternatives.length ? r.alternatives.join('; ') : '(not recorded)'));
    lines.push('- **Probability:** ' + (typeof r.probability === 'number' ? r.probability + '%' : '(not recorded)')
      + (dq ? ' (decision quality)' : ' (legacy basis: read as "right and no incident")'));
    lines.push('- **Documented outcome:** ' + (best.ground_truth || '(case has none)'));
    lines.push('- **Grading hint:** ' + (best.grading_hint || '(none)'));
    lines.push('- **Ask:** ' + (dq
      ? 'knowing what the case documents, would you still choose this course over the listed alternatives?'
      : 'did the advice hold up against what the case documents?'));
    lines.push('', '```', 'node "' + JOURNAL_JS + '" outcome ' + r.sha
      + " '<correct|partial|wrong>' 'exercise: " + best.id + ", <one line on why>'", '```', '');
  }
  if (!n) lines.push('No ungraded run matches an eval case.');
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--cases');
  const cases = loadCases(ci >= 0 ? args[ci + 1] : path.join(ROOT, 'eval', 'cases'));
  const jp = journalPath(args);
  const records = fs.existsSync(jp) ? fs.readFileSync(jp, 'utf8').split(/\r?\n/).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean) : [];
  console.log(worksheet(records, cases));
}

if (require.main === module) main();
module.exports = { worksheet };
