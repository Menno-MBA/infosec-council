#!/usr/bin/env node
/*
 * infosec-council HTML report generator (Luméro-branded, plain-language, two-layer).
 * Zero-dependency Node port of report.sh. Use this on machines without jq
 * (e.g. Windows): it produces byte-for-byte the same dossier and base64-embeds
 * the brand logos, so the header/footer always show the real logo, never a text
 * fallback.
 *
 * Usage:
 *   node report.js < run.json            # rich council JSON on stdin
 *   node report.js --sha <sha>           # pull a run from the journal by sha
 *
 * Branding (optional; sensible defaults bundled in assets/):
 *   LUMERO_LOGO_LIGHT  light-header logo. URL or local image (base64-embedded).
 *                      default: assets/lumero-logo-black.webp
 *   LUMERO_LOGO        dark-footer logo.  default: assets/lumero-logo-white.webp
 *   LUMERO_TAGLINE     footer tagline.    default below.
 *   COUNCIL_HOME       default: ~/.infosec-council
 *   COUNCIL_REPORT_DIR default: . (current directory)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function die(msg) { console.error('council-report: ' + msg); process.exit(1); }

const SCRIPT_DIR = __dirname;
const ASSETS = path.join(SCRIPT_DIR, 'assets');
const COUNCIL_HOME = process.env.COUNCIL_HOME || path.join(os.homedir(), '.infosec-council');
const JOURNAL = path.join(COUNCIL_HOME, 'journal.jsonl');
const REPORT_DIR = process.env.COUNCIL_REPORT_DIR || '.';
const TAGLINE = process.env.LUMERO_TAGLINE || 'We do the academic research, you get the infosec tools.';

// ---- resolve input ----------------------------------------------------------
let run;
const argv = process.argv.slice(2);
if (argv[0] === '--sha' && argv[1]) {
  if (!fs.existsSync(JOURNAL)) die('no journal at ' + JOURNAL);
  const want = argv[1];
  const lines = fs.readFileSync(JOURNAL, 'utf8').split(/\r?\n/).filter(Boolean);
  let match = null;
  for (const line of lines) {
    try { const o = JSON.parse(line); if (o && o.sha === want) match = o; } catch (_) {}
  }
  if (!match) die('no run with sha ' + want);
  run = match;
} else {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch (_) { raw = ''; }
  try { run = JSON.parse(raw); }
  catch (_) { die('stdin is not valid JSON (or pass --sha <sha>)'); }
}

// ---- helpers ----------------------------------------------------------------
function htmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
// text cleaner: strip em-dashes (to a comma) then HTML-escape
function e(s) {
  return htmlEscape(String(s == null ? '' : s).replace(/\s*—\s*/g, ', '));
}
function len(s) { return (s == null ? '' : String(s)).length; }

function confClass(c) {
  c = String(c == null ? '' : c).toLowerCase();
  if (c === 'high') return 'high';
  if (c === 'medium') return 'med';
  if (c === 'low') return 'low';
  return 'na';
}
function vClass(v) {
  v = String(v == null ? '' : v).toLowerCase();
  // test negatives FIRST: "not recommended" / "do not recommend" contain "recommend"
  if (/reckless|avoid|do not|don't|not recommend|no-go/.test(v)) return 'vr';
  if (/recommend|best|go\b/.test(v)) return 'vg';
  return 'va';
}
const CONVERGED_LABEL = {
  'after-challenge': 'the panel converged after being challenged',
  'split': 'the panel stayed split, so the trade-offs below are real choices for you',
  'forced-debate': 'consensus was stress-tested in a forced debate before it was trusted'
};
function convergedLabel(v) {
  return CONVERGED_LABEL[String(v == null ? '' : v).toLowerCase()] || '';
}
const ROLE_LABEL = {
  'ciso': 'CISO', 'security-architect': 'Security Architect',
  'offensive-security': 'Offensive Security (Red Team)',
  'security-operations': 'Security Operations',
  'compliance-analyst': 'Compliance Analyst', 'dpo': 'DPO / Privacy',
  'risk-manager': 'Risk Manager'
};
const ROLE_DESC = {
  'ciso': 'Security posture, budget, and business enablement',
  'security-architect': 'Secure design and technical controls (can we build it safely)',
  'offensive-security': 'How a real attacker would try to break it',
  'security-operations': 'Detection, monitoring, and incident response (can we spot and survive it)',
  'compliance-analyst': 'Standards, regulations, and the evidence to prove compliance',
  'dpo': 'Lawful, fair handling of personal data and privacy',
  'risk-manager': 'Sizing the risk, risk appetite, and third-party exposure'
};
function roleLabel(name) {
  const k = String(name == null ? '' : name).toLowerCase();
  return ROLE_LABEL[k] != null ? ROLE_LABEL[k] : String(name == null ? '' : name);
}
function roleDesc(name) {
  const k = String(name == null ? '' : name).toLowerCase();
  return ROLE_DESC[k] != null ? ROLE_DESC[k] : '';
}
function listBlock(items, title, lead) {
  if (Array.isArray(items) && items.length > 0) {
    return '<section class="block"><h2>' + title + '</h2><p class="lead">' + lead + '</p><ul>'
      + items.map(function (i) { return '<li>' + e(i) + '</li>'; }).join('')
      + '</ul></section>';
  }
  return '';
}

// ---- logo helper: emit <img> (base64-embedded) or wordmark fallback ---------
function mkLogo(src, cls) {
  if (!src) return '<span class="wordmark ' + cls + '">Lum&eacute;ro</span>';
  if (/^https?:\/\//.test(src)) return '<img class="brandimg ' + cls + '" src="' + src + '" alt="Lumero">';
  if (fs.existsSync(src)) {
    let mime = 'image/png';
    if (/\.svg$/i.test(src)) mime = 'image/svg+xml';
    else if (/\.jpe?g$/i.test(src)) mime = 'image/jpeg';
    else if (/\.webp$/i.test(src)) mime = 'image/webp';
    const b64 = fs.readFileSync(src).toString('base64');
    return '<img class="brandimg ' + cls + '" src="data:' + mime + ';base64,' + b64 + '" alt="Lumero">';
  }
  return '<span class="wordmark ' + cls + '">Lum&eacute;ro</span>';
}
const logoLight = mkLogo(process.env.LUMERO_LOGO_LIGHT || path.join(ASSETS, 'lumero-logo-black.webp'), 'light');
const logoDark = mkLogo(process.env.LUMERO_LOGO || path.join(ASSETS, 'lumero-logo-white.webp'), 'dark');

// ---- CSS (identical to report.sh) -------------------------------------------
const CSS = [
  ':root{--bg:#ffffff;--surface:#f8fafc;--border:#e5e7eb;--ink:#0f172a;--body:#334155;--muted:#475569;--faint:#64748b;--ga:#2080a2;--gb:#49cd64;--footer:#0e2a36;--green:#15803d;--amber:#b45309;--slate:#64748b;--grad:linear-gradient(90deg,#2080a2,#49cd64);--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--body);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;}',
  '.brandrule{height:4px;background:var(--grad);}',
  '.wrap{max-width:860px;margin:0 auto;padding:44px 28px 0;}',
  '.head{display:flex;align-items:center;gap:14px;margin-bottom:10px;}',
  '.brandimg.light{height:34px;width:auto;display:block;}',
  '.wordmark{font-weight:800;font-size:22px;color:var(--ink);}.wordmark.dark{color:#fff;}',
  '.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ga);font-weight:600;border-left:2px solid var(--border);padding-left:14px;}',
  'h1{font-weight:800;font-size:clamp(27px,4.4vw,40px);line-height:1.13;letter-spacing:-.02em;color:var(--ink);margin:.3em 0 .15em;}',
  '.intro{font-size:15px;color:var(--muted);margin:.2em 0 0;}',
  '.meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}',
  '.meta b{color:var(--muted);font-weight:600;}',
  '.lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}',
  '.verdict{margin:32px 0 22px;border-radius:16px;padding:26px 28px;background:linear-gradient(#fff,#fff) padding-box,var(--grad) border-box;border:1.5px solid transparent;box-shadow:0 10px 30px -12px rgba(2,6,23,.18);}',
  '.verdict h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}',
  '.verdict .lead{margin-bottom:14px;}.verdict p{margin:.4em 0;}.rec{font-size:19px;color:var(--ink);font-weight:600;line-height:1.45;}',
  '.assume{font-size:14px;color:var(--muted);margin-top:10px;}.assume strong{color:var(--ink);}',
  '.note{font-size:12px;color:var(--faint);margin-top:10px;font-style:italic;}',
  'table.opts{border-collapse:collapse;width:100%;margin:8px 0 0;font-size:13px;}',
  'table.opts th,table.opts td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;}',
  'table.opts th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}',
  '.vc{font-weight:700;white-space:nowrap;}.vc.vg{color:var(--green);}.vc.vr{color:#b91c1c;}.vc.va{color:var(--amber);}',
  '.appetite{margin:18px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:14px 16px;}',
  '.appetite h3{margin:0 0 4px;font-size:14px;color:var(--ink);font-weight:700;}.appetite p{margin:0;font-size:14px;color:var(--body);}',
  '.leverage{margin:14px 0 0;font-size:15px;color:var(--ink);}.leverage strong{color:var(--ga);}',
  '.expo{margin:14px 0 0;}',
  '.expohead{font-family:var(--mono);font-size:13px;color:var(--muted);margin-bottom:12px;}.expohead b{color:var(--ink);}',
  '.expoband{font-weight:700;text-transform:uppercase;letter-spacing:.06em;}',
  '.band-low{color:#15803d;}.band-moderate{color:#b45309;}.band-high{color:#c2410c;}.band-critical{color:#b91c1c;}',
  '.expobar{position:relative;height:12px;border-radius:9999px;background:linear-gradient(90deg,#15803d 0%,#a3b817 38%,#e0a800 62%,#d23b2e 100%);}',
  '.expomark{position:absolute;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--ink);transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(255,255,255,.65),0 2px 8px rgba(0,0,0,.35);}',
  '.expomark.inh{background:#e2e8f0;border-color:#94a3b8;box-shadow:0 0 0 4px rgba(255,255,255,.6),0 1px 4px rgba(0,0,0,.25);}',
  '.expolabels{display:flex;justify-content:space-between;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}',
  '.riskmeta2{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:12px;}',
  '.riskwhy{margin:12px 0 0;color:var(--body);font-size:14px;}',
  '.risklegend{margin:12px 0 0;font-size:12.5px;color:var(--muted);}.risklegend summary{cursor:pointer;color:var(--ga);font-weight:600;}.risklegend p{margin:6px 0;}',
  '.pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}',
  '.pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}',
  '.pill.prob{color:var(--ga);background:rgba(32,128,162,.08);margin-left:6px;}',
  '.exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}',
  '.exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.4em 0;color:var(--body);font-size:15.5px;}',
  '.divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}',
  '.divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}',
  '.divider p{margin:0;font-size:13px;color:var(--faint);}',
  'h2.sec{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:40px 0 4px;font-weight:700;}',
  '.block{margin:22px 0;}.block h2{font-size:17px;margin:0 0 2px;color:var(--ink);font-weight:700;}.block p{margin:.3em 0;}',
  '.block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}',
  '.minority{border-left:3px solid var(--amber);padding-left:16px;color:var(--body);font-style:italic;}',
  '.advisors{display:grid;gap:14px;margin-top:14px;}',
  '.advisor{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;box-shadow:0 4px 12px rgba(2,6,23,.05);}',
  '.advisor header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}',
  '.advisor h3{font-size:17px;margin:0;color:var(--ink);font-weight:700;}',
  '.role{font-size:12.5px;color:var(--muted);margin:2px 0 8px;}',
  '.stance{font-family:var(--mono);font-size:12px;color:var(--ga);margin:8px 0;}',
  '.advisor p.sum{margin:.2em 0;color:var(--body);}',
  '.advisor dl{margin:12px 0 0;font-size:13px;color:var(--muted);}',
  '.advisor dt{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-top:10px;color:var(--faint);}',
  '.advisor dd{margin:3px 0 0;}',
  'footer{margin-top:60px;background:var(--footer);padding:42px 20px 48px;text-align:center;border-top:4px solid transparent;border-image:var(--grad) 1;}',
  '.brandimg.dark{height:40px;width:auto;display:inline-block;}',
  '.tagline{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:#cbd5e1;margin-top:16px;}',
  '.fineprint{font-size:10px;color:#64748b;margin-top:14px;font-family:var(--mono);}',
  '@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}}'
].join('');

// ---- field accessors --------------------------------------------------------
function g(o, k, d) { return (o && o[k] != null) ? o[k] : (d == null ? '' : d); }
const question = g(run, 'question');
const mode = g(run, 'mode');
const sha = run && run.sha ? run.sha : 'draft';
const ts = g(run, 'ts');

// ---- risk rating block ------------------------------------------------------
function scoreOne(o) {
  const imp = String(g(o, 'impact')).toLowerCase();
  const lik = String(g(o, 'likelihood')).toLowerCase();
  const impN = { limited: 2, serious: 3, severe: 5 }[imp];
  const likN = { rare: 2, possible: 3, likely: 5 }[lik];
  if (impN == null || likN == null) return null;
  const n = impN * likN;
  let band;
  if (n <= 6) band = ['Low', 'low'];
  else if (n <= 12) band = ['Moderate', 'moderate'];
  else if (n <= 18) band = ['High', 'high'];
  else band = ['Critical', 'critical'];
  return {
    n: n, band: band, pos: Math.round(n / 25 * 100),
    impLabel: { limited: 'Limited', serious: 'Serious', severe: 'Severe' }[imp],
    likLabel: { rare: 'Rare', possible: 'Possible', likely: 'Likely' }[lik],
    rat: String(g(o, 'rationale'))
  };
}
function riskBlock() {
  const rs = (run && run.risk_score) ? run.risk_score : {};
  const inhSrc = rs.inherent || rs.residual || rs;
  const resSrc = rs.residual || rs.inherent || rs;
  let inh = scoreOne(inhSrc);
  let res = scoreOne(resSrc);
  if (inh == null && res == null) return '';
  if (inh == null) inh = res;
  if (res == null) res = inh;
  const ratI = inh.rat;
  const ratR = (res.rat && res.rat !== inh.rat) ? res.rat : '';
  let html = '<section class="block"><h2>Risk rating</h2>'
    + '<p class="lead">A qualitative read of this decision: impact against likelihood, mapped to an exposure score. It shows inherent exposure (before the recommended response) and residual exposure (after it); the gap is the value of the recommendation.</p>'
    + '<div class="expo"><div class="expohead">Risk exposure &middot; inherent <b>' + inh.n + '/25</b> <span class="expoband band-' + inh.band[1] + '">' + inh.band[0] + '</span> &rarr; residual <b>' + res.n + '/25</b> <span class="expoband band-' + res.band[1] + '">' + res.band[0] + '</span></div>'
    + '<div class="expobar"><span class="expomark inh" style="left:' + inh.pos + '%"></span><span class="expomark" style="left:' + res.pos + '%"></span></div>'
    + '<div class="expolabels"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>'
    + '<p class="riskmeta2">Inherent: impact ' + inh.impLabel + ' &middot; likelihood ' + inh.likLabel + ' &nbsp;&middot;&nbsp; Residual: impact ' + res.impLabel + ' &middot; likelihood ' + res.likLabel + '</p></div>';
  if (ratI.length > 0) html += '<p class="riskwhy"><strong>Inherent.</strong> ' + e(ratI) + '</p>';
  if (ratR.length > 0) html += '<p class="riskwhy"><strong>Residual.</strong> ' + e(ratR) + '</p>';
  html += '<details class="risklegend"><summary>What the scale means</summary><p><strong>Impact:</strong> Limited (minor service impact, low cost); Serious (moderate to serious damage, high cost, possible legal consequences); Severe (severe legal consequences, lasting damage or outage).</p><p><strong>Likelihood:</strong> Rare (conceivable but unlikely); Possible (unlikely but plausible in edge cases); Likely (almost certain to materialize). An impact that has already been observed is scored Likely, not Possible.</p><p><strong>Inherent</strong> is exposure before the recommended response; <strong>residual</strong> is what remains after it. <strong>Exposure</strong> = impact x likelihood, scored out of 25.</p></details>';
  html += '</section>';
  return html;
}

// ---- options / decision-science block ---------------------------------------
function optionsBlock() {
  if (!(Array.isArray(run.options) && run.options.length > 0)) return '';
  let html = '<section class="block"><h2>Decision-science pass</h2><p class="lead">The realistic options side by side: effort, risk reduction, ongoing cost, reversibility, and the verdict.</p>'
    + '<table class="opts"><thead><tr><th>Option</th><th>Effort</th><th>Risk reduction</th><th>Ongoing cost</th><th>Reversibility</th><th>Verdict</th></tr></thead><tbody>';
  html += run.options.map(function (o) {
    const name = o.option != null ? o.option : (o.name != null ? o.name : '');
    const cost = o.cost != null ? o.cost : (o.ongoing_cost != null ? o.ongoing_cost : '');
    return '<tr><td><strong>' + e(name) + '</strong></td><td>' + e(g(o, 'effort')) + '</td><td>'
      + e(g(o, 'risk_reduction')) + '</td><td>' + e(cost) + '</td><td>' + e(g(o, 'reversibility'))
      + '</td><td class="vc ' + vClass(o.verdict) + '">' + e(g(o, 'verdict')) + '</td></tr>';
  }).join('');
  html += '</tbody></table>';
  if (len(g(run, 'risk_appetite')) > 0) html += '<div class="appetite"><h3>Risk-appetite check (owner decision)</h3><p>' + e(run.risk_appetite) + '</p></div>';
  if (len(g(run, 'highest_leverage')) > 0) html += '<p class="leverage"><strong>Highest-leverage move:</strong> ' + e(run.highest_leverage) + '</p>';
  html += '</section>';
  return html;
}

// ---- peer ranking block -----------------------------------------------------
function rankingBlock() {
  if (!(Array.isArray(run.ranking) && run.ranking.length > 0)) return '';
  const rows = run.ranking.slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  let html = '<section class="block"><h2>How the panel rated each other</h2>'
    + '<p class="lead">In anonymized cross-examination each advisor scored the others on how well their position would survive scrutiny (1 to 5, higher is sounder). This is a signal, not a vote, and it never overrides a hard legal stop.</p>'
    + '<table class="opts"><thead><tr><th>Position</th><th>Peer score</th><th>Note</th></tr></thead><tbody>';
  html += rows.map(function (r) {
    const sc = (typeof r.score === 'number') ? r.score.toFixed(1) : e(g(r, 'score'));
    return '<tr><td><strong>' + e(g(r, 'position')) + '</strong></td><td>' + sc + ' / 5</td><td>' + e(g(r, 'note')) + '</td></tr>';
  }).join('');
  html += '</tbody></table></section>';
  return html;
}

// ---- members block ----------------------------------------------------------
function membersBlock() {
  if (!(Array.isArray(run.members) && run.members.length > 0)) return '';
  let html = '<h2 class="sec">The expert panel</h2><p class="lead">The recommendation above is the synthesis of these independent expert views. Each advisor looked at the decision only through their own lens; where they pull in different directions is exactly the value.</p><div class="advisors">';
  html += run.members.map(function (m) {
    let a = '<article class="advisor"><header><div><h3>' + e(roleLabel(m.name)) + '</h3>';
    const rd = roleDesc(m.name);
    if (len(rd) > 0) a += '<p class="role">' + e(rd) + '</p>';
    a += '</div>';
    a += '<span class="pill ' + confClass(m.confidence) + '">' + e(m.confidence != null ? m.confidence : 'n/a') + (typeof m.probability === 'number' ? ' &middot; ' + m.probability + '%' : '') + '</span></header>';
    if (len(g(m, 'stance')) > 0) a += '<p class="stance">Stance: ' + e(m.stance) + '</p>';
    if (len(g(m, 'summary')) > 0) a += '<p class="sum">' + e(m.summary) + '</p>';
    a += '<dl>';
    if (len(g(m, 'assumptions')) > 0) a += '<dt>What they assume</dt><dd>' + e(m.assumptions) + '</dd>';
    if (len(g(m, 'change_my_mind')) > 0) a += '<dt>What would change their view</dt><dd>' + e(m.change_my_mind) + '</dd>';
    a += '</dl></article>';
    return a;
  }).join('');
  html += '</div>';
  return html;
}

// ---- assemble ---------------------------------------------------------------
let out = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>Council Dossier: ' + e(question) + '</title>'
  + '<style>' + CSS + '</style></head><body><div class="brandrule"></div><div class="wrap">'
  + '<header class="head">' + logoLight + '<div class="kicker">Security Decision Dossier</div></header>'
  + '<h1>' + e(question) + '</h1>'
  + '<p class="intro">A panel of security advisors reviewed this decision. This dossier gives you the recommendation and a short executive summary first, then the full analysis underneath: the risks, where the advisors agreed and disagreed, and each advisor in their own words.</p>'
  + '<div class="meta"><span><b>Depth</b>&nbsp;&nbsp;' + e(mode).toUpperCase() + '</span>'
  + '<span><b>Reference</b>&nbsp;&nbsp;' + e(sha) + '</span>'
  + (len(ts) > 0 ? '<span>' + e(ts) + '</span>' : '') + '</div>'
  + '<div class="verdict"><h2>What we recommend</h2>'
  + '<p class="lead">The bottom-line advice, and how strongly the panel backs it.</p>'
  + '<p class="rec">' + e(g(run, 'recommendation')) + '</p>'
  + '<p><span class="pill ' + confClass(run.confidence) + '">Confidence: ' + e(g(run, 'confidence')) + '</span>'
  + (typeof run.probability === 'number' ? '<span class="pill prob">' + run.probability + '% it survives a 12-month review</span>' : '')
  + '</p>'
  + '<p class="note">Confidence shows how strongly the panel stands behind this advice given what is still unknown (High, Medium or Low); the percentage is how likely the panel thinks this call still looks right a year from now.</p>'
  + (len(convergedLabel(g(run, 'converged'))) > 0 ? '<p class="note">Panel outcome: ' + convergedLabel(run.converged) + '.</p>' : '')
  + (len(g(run, 'key_assumption')) > 0 ? '<p class="assume"><strong>This advice depends on:</strong> ' + e(run.key_assumption) + '</p>' : '')
  + (Array.isArray(run.unverified) && run.unverified.length > 0 ? '<p class="assume"><strong>Not independently verified (check before relying):</strong> ' + e(run.unverified.join('; ')) + '</p>' : '')
  + (len(g(run, 'next_step')) > 0 ? '<p class="assume"><strong>Do this next:</strong> ' + e(run.next_step) + '</p>' : '')
  + '</div>'
  + riskBlock()
  + (len(g(run, 'executive_summary')) > 0 ? '<section class="exec"><h2>Executive summary</h2><p>' + e(run.executive_summary) + '</p></section>' : '')
  + optionsBlock()
  + '<div class="divider"><h2>The detailed analysis</h2><p>For readers who want the full picture: the risks, the agreements and trade-offs, and each advisor in their own words.</p></div>'
  + listBlock(run.risks, 'Key risks', 'The main risks to weigh before you decide.')
  + (len(g(run, 'consensus')) > 0 ? '<section class="block"><h2>Where the advisors agree</h2><p class="lead">Points the whole panel lined up on, so you can treat these as settled.</p><p>' + e(run.consensus) + '</p></section>' : '')
  + listBlock(run.conflicts, 'Where the advisors disagree', 'Open trade-offs with no single right answer. These are the calls you, as decision-maker, need to make.')
  + listBlock(run.blind_spots, 'Risks that are easy to miss', 'Subtle points the panel flagged that are simple to overlook.')
  + (len(g(run, 'minority_report')) > 0 ? '<section class="block"><h2>The strongest objection</h2><p class="lead">A dissenting view worth keeping in mind, even though most of the panel leaned the other way.</p><p class="minority">' + e(run.minority_report) + '</p></section>' : '')
  + rankingBlock()
  + membersBlock()
  + '</div><footer>' + logoDark
  + '<div class="tagline">' + htmlEscape(TAGLINE) + '</div>'
  + '<div class="fineprint">Generated by the Information Security Council &middot; guidance only, not a substitute for professional advice</div>'
  + '</footer></body></html>';

// strip any stray NUL bytes (sync/mount safety net)
out = out.replace(/[\x00]/g, '');

// ---- write ------------------------------------------------------------------
const d = new Date();
const p2 = function (n) { return String(n).padStart(2, '0'); };
const stamp = '' + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate())
  + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds());
fs.mkdirSync(REPORT_DIR, { recursive: true });
const outPath = path.join(REPORT_DIR, 'council-report-' + stamp + '-' + sha + '.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('report written: ' + outPath);
