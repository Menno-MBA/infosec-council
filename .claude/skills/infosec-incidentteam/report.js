#!/usr/bin/env node
/*
 * Incident Response Report -> HTML dossier (Luméro-branded).
 * Zero-dependency Node. Reuses the infosec-council brand shell (CSS, logos, risk
 * bar) for visual consistency across the suite, and renders the incident-team
 * deliverable: severity banner, exec + priorities, risk 5x5, notification
 * tracker with computed deadline clocks, breach register, timeline, triage,
 * containment dial, evidence register, decision log, eradication gates,
 * escalations, comms log + do-not-claim, assumptions register, lessons, seats.
 *
 * Usage:
 *   node report.js < incident.json     # rich incident JSON on stdin
 *   node report.js --in incident.json  # ... or from a file
 *   node report.js --example           # render the bundled UM ransomware sample
 *
 * Branding (optional; logos resolved from the sibling council skill by default):
 *   LUMERO_LOGO_LIGHT / LUMERO_LOGO    header / footer logo (URL or local image)
 *   INCIDENT_REPORT_DIR                output dir (default: cwd)
 */
'use strict';
const fs = require('fs');
const path = require('path');

function die(msg) { console.error('incident-report: ' + msg); process.exit(1); }

const ASSETS = process.env.LUMERO_ASSETS || path.join(__dirname, '..', 'infosec-council', 'assets');
const OUT_DIR = process.env.INCIDENT_REPORT_DIR || process.cwd();
const TAGLINE = process.env.LUMERO_TAGLINE || 'We do the academic research, you get the infosec tools.';
const EXAMPLE = path.join(__dirname, '..', 'infosec-shared', 'examples', 'um-ransomware-2019', 'incident-report.json');

// ---- resolve input ----------------------------------------------------------
let D;
const argv = process.argv.slice(2);
if (argv[0] === '--example') {
  if (!fs.existsSync(EXAMPLE)) die('no bundled example at ' + EXAMPLE);
  D = JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'));
} else if (argv[0] === '--in' && argv[1]) {
  if (!fs.existsSync(argv[1])) die('no such file: ' + argv[1]);
  try { D = JSON.parse(fs.readFileSync(argv[1], 'utf8')); } catch (_) { die('not valid JSON: ' + argv[1]); }
} else {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch (_) { raw = ''; }
  try { D = JSON.parse(raw); } catch (_) { die('stdin is not valid JSON (or pass --in <file> / --example)'); }
}

// ---- helpers (canonical shell, shared across the suite) ---------------------
function htmlEscape(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }
function e(s) { return htmlEscape(String(s == null ? '' : s).replace(/\s*—\s*/g, ', ')); }
function len(s) { return (s == null ? '' : String(s)).length; }
function g(o, k, d) { return (o && o[k] != null) ? o[k] : (d == null ? '' : d); }
function arr(x) { return Array.isArray(x) ? x : []; }
function ulOf(items) { return '<ul>' + arr(items).map(function (i) { return '<li>' + e(i) + '</li>'; }).join('') + '</ul>'; }
function mkLogo(src, cls) {
  if (!src) return '<span class="wordmark ' + cls + '">Lum&eacute;ro</span>';
  if (/^https?:\/\//.test(src)) return '<img class="brandimg ' + cls + '" src="' + src + '" alt="Lumero">';
  if (fs.existsSync(src)) {
    let mime = 'image/png';
    if (/\.svg$/i.test(src)) mime = 'image/svg+xml'; else if (/\.jpe?g$/i.test(src)) mime = 'image/jpeg'; else if (/\.webp$/i.test(src)) mime = 'image/webp';
    return '<img class="brandimg ' + cls + '" src="data:' + mime + ';base64,' + fs.readFileSync(src).toString('base64') + '" alt="Lumero">';
  }
  return '<span class="wordmark ' + cls + '">Lum&eacute;ro</span>';
}
const logoLight = mkLogo(process.env.LUMERO_LOGO_LIGHT || path.join(ASSETS, 'lumero-logo-black.webp'), 'light');
const logoDark = mkLogo(process.env.LUMERO_LOGO || path.join(ASSETS, 'lumero-logo-white.webp'), 'dark');

function tlpBadge(tlp) {
  const t = String(tlp || 'AMBER+STRICT').toUpperCase().replace(/^TLP:?/, '');
  let cls = 'amber';
  if (/CLEAR/.test(t)) cls = 'clear'; else if (/GREEN/.test(t)) cls = 'green'; else if (/^RED/.test(t)) cls = 'red';
  return '<span class="tlp ' + cls + '">TLP:' + e(t) + '</span>';
}
function tiles(list) {
  if (!arr(list).length) return '';
  return '<div class="tiles">' + arr(list).map(function (t) {
    return '<div class="tile ' + e(g(t, 'kind', 'neutral')) + '"><div class="num">' + e(g(t, 'num')) + '</div><div class="lab">' + e(g(t, 'lab')) + '</div></div>';
  }).join('') + '</div>';
}
function scoreOne(o) {
  const imp = String(g(o, 'impact')).toLowerCase();
  const lik = String(g(o, 'likelihood')).toLowerCase();
  const impN = { negligible: 1, minor: 2, limited: 2, moderate: 3, serious: 3, major: 4, severe: 5 }[imp];
  const likN = { rare: 1, unlikely: 2, possible: 3, likely: 4, 'almost certain': 5, 'almost-certain': 5, certain: 5 }[lik];
  if (impN == null || likN == null) return null;
  const n = impN * likN;
  let band; if (n <= 4) band = ['Low', 'low']; else if (n <= 9) band = ['Moderate', 'moderate']; else if (n <= 15) band = ['High', 'high']; else band = ['Critical', 'critical'];
  const impCap = { negligible: 'Negligible', minor: 'Minor', limited: 'Limited', moderate: 'Moderate', serious: 'Serious', major: 'Major', severe: 'Severe' };
  const likCap = { rare: 'Rare', unlikely: 'Unlikely', possible: 'Possible', likely: 'Likely', 'almost certain': 'Almost certain', 'almost-certain': 'Almost certain', certain: 'Almost certain' };
  return { n: n, band: band, pos: Math.round(n / 25 * 100), impLabel: impCap[imp], likLabel: likCap[lik], rat: String(g(o, 'rationale')) };
}
function riskBlock(rs, heading, lead) {
  rs = rs || {};
  const inhSrc = rs.inherent || rs.residual || rs; const resSrc = rs.residual || rs.inherent || rs;
  let inh = scoreOne(inhSrc); let res = scoreOne(resSrc);
  if (inh == null && res == null) return '';
  if (inh == null) inh = res; if (res == null) res = inh;
  const ratI = inh.rat; const ratR = (res.rat && res.rat !== inh.rat) ? res.rat : '';
  let html = '<section class="block"><h2>' + e(heading || 'Risk rating') + '</h2>'
    + '<p class="lead">' + e(lead || 'A qualitative read: impact against likelihood, mapped to an exposure score. Inherent exposure (before treatment) and residual (after); the gap is the value of the fix.') + '</p>'
    + '<div class="expo"><div class="expohead">Risk exposure &middot; inherent <b>' + inh.n + '/25</b> <span class="expoband band-' + inh.band[1] + '">' + inh.band[0] + '</span> &rarr; residual <b>' + res.n + '/25</b> <span class="expoband band-' + res.band[1] + '">' + res.band[0] + '</span></div>'
    + '<div class="expobar"><span class="expomark inh" style="left:' + inh.pos + '%"></span><span class="expomark" style="left:' + res.pos + '%"></span></div>'
    + '<div class="expolabels"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>'
    + '<p class="riskmeta2">Inherent: impact ' + inh.impLabel + ' &middot; likelihood ' + inh.likLabel + ' &nbsp;&middot;&nbsp; Residual: impact ' + res.impLabel + ' &middot; likelihood ' + res.likLabel + '</p></div>';
  if (ratI.length) html += '<p class="riskwhy"><strong>Inherent.</strong> ' + e(ratI) + '</p>';
  if (ratR.length) html += '<p class="riskwhy"><strong>Residual.</strong> ' + e(ratR) + '</p>';
  return html + '</section>';
}
function sevClass(s) {
  s = String(s || '').toLowerCase();
  if (/crit/.test(s)) return 'red'; if (/high/.test(s)) return 'amber'; if (/med/.test(s)) return 'amber'; if (/low/.test(s)) return 'slate'; return 'teal';
}

// ---- CSS: council shell + suite additions -----------------------------------
const CSS = [
  ':root{--bg:#ffffff;--surface:#f8fafc;--border:#e5e7eb;--ink:#0f172a;--body:#334155;--muted:#475569;--faint:#64748b;--ga:#2080a2;--gb:#49cd64;--footer:#0e2a36;--green:#15803d;--amber:#b45309;--slate:#64748b;--red:#b91c1c;--grad:linear-gradient(90deg,#2080a2,#49cd64);--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--body);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;}',
  '.brandrule{height:4px;background:var(--grad);}',
  '.wrap{max-width:880px;margin:0 auto;padding:44px 28px 0;}',
  '.head{display:flex;align-items:center;gap:14px;margin-bottom:10px;}',
  '.brandimg.light{height:34px;width:auto;display:block;}',
  '.wordmark{font-weight:800;font-size:22px;color:var(--ink);}.wordmark.dark{color:#fff;}',
  '.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ga);font-weight:600;border-left:2px solid var(--border);padding-left:14px;}',
  'h1{font-weight:800;font-size:clamp(27px,4.4vw,40px);line-height:1.13;letter-spacing:-.02em;color:var(--ink);margin:.3em 0 .15em;}',
  '.subtitle{font-size:15.5px;color:var(--body);margin:.4em 0 0;line-height:1.5;}',
  '.intro{font-size:15px;color:var(--muted);margin:.2em 0 0;}',
  '.meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;align-items:center;}',
  '.meta b{color:var(--muted);font-weight:600;}',
  '.lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}',
  '.exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}',
  '.exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.4em 0;color:var(--body);font-size:15.5px;}',
  '.exec .ask{margin-top:12px;font-size:15px;color:var(--ink);}.exec .ask strong{color:var(--ga);}',
  '.divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}',
  '.divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}',
  '.divider p{margin:0;font-size:13px;color:var(--faint);}',
  '.block{margin:22px 0;}.block h2{font-size:17px;margin:0 0 2px;color:var(--ink);font-weight:700;}.block h3{font-size:14px;margin:14px 0 2px;color:var(--ink);font-weight:700;}.block p{margin:.3em 0;}',
  '.block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}',
  'table.t{border-collapse:collapse;width:100%;margin:10px 0 0;font-size:13px;}',
  'table.t th,table.t td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;overflow-wrap:break-word;}',
  'table.t th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}',
  'table.t td.mono,table.t th.mono{font-family:var(--mono);font-size:12px;white-space:nowrap;}',
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
  '.pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}',
  '.pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}',
  '.st{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:9999px;white-space:nowrap;}',
  '.st.ok{color:#15803d;background:rgba(21,128,61,.10);border:1px solid #15803d;}.st.warn{color:#b45309;background:rgba(180,83,9,.10);border:1px solid #b45309;}.st.bad{color:#b91c1c;background:rgba(185,28,28,.10);border:1px solid #b91c1c;}.st.info{color:#2080a2;background:rgba(32,128,162,.10);border:1px solid #2080a2;}.st.mute{color:#64748b;background:rgba(100,116,139,.10);border:1px solid #64748b;}',
  '.ledger{margin:16px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--slate);border-radius:10px;padding:14px 16px;}.ledger h3{margin:0 0 8px;font-size:13px;color:var(--ink);font-weight:700;font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase;}.ledger ul{margin:0;padding-left:1.1em;}.ledger li{margin:.35em 0;font-size:13.5px;color:var(--body);}.ledger li b{color:var(--ink);}',
  '.callout{margin:14px 0;background:rgba(32,128,162,.06);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:14px 16px;font-size:14px;color:var(--body);}.callout.warn{background:rgba(180,83,9,.07);border-left-color:var(--amber);}.callout strong{color:var(--ink);}',
  '.tiles{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0;}',
  '.tile{flex:1 1 120px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;text-align:center;}',
  '.tile .num{font-size:28px;font-weight:800;color:var(--ink);line-height:1.1;}',
  '.tile .lab{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-top:6px;}',
  '.tile.good .num{color:var(--green);}.tile.warn .num{color:var(--amber);}.tile.bad .num{color:#b91c1c;}.tile.info .num{color:var(--ga);}',
  '.badges{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}',
  '.badge{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:9999px;border:1px solid currentColor;}',
  '.badge.red{color:#b91c1c;}.badge.amber{color:#b45309;}.badge.green{color:#15803d;}.badge.slate{color:#64748b;}.badge.teal{color:#2080a2;}',
  '.tag{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:9999px;white-space:nowrap;display:inline-block;}.tag.attck{color:#334155;background:rgba(51,65,85,.08);}',
  '.tlp{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:4px;border:1px solid #b8860b;color:#3b2f00;background:#FFC000;}.tlp.green{background:#33FF00;border-color:#1a8a00;color:#04340a;}.tlp.clear{background:#fff;border-color:#94a3b8;color:#334155;}.tlp.red{background:#111;border-color:#000;color:#ff6b6e;}',
  '.fcard{border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin:12px 0;box-shadow:0 4px 12px rgba(2,6,23,.05);}',
  '.fcard header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}',
  '.fcard h3{font-size:16px;margin:0;color:var(--ink);font-weight:700;}',
  '.fcard .fmeta{font-family:var(--mono);font-size:11px;color:var(--muted);margin:6px 0;}',
  '.fcard dl{margin:8px 0 0;font-size:13px;}.fcard dt{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-top:8px;}.fcard dd{margin:2px 0 0;color:var(--body);}',
  '.pctrow{display:flex;align-items:center;gap:10px;margin:6px 0;}',
  '.pctlab{flex-basis:220px;font-size:13px;color:var(--body);}',
  '.pctbar{flex:1;height:12px;border-radius:9999px;background:var(--surface);border:1px solid var(--border);overflow:hidden;}',
  '.pctfill{display:block;height:100%;background:var(--grad);}',
  '.pctnum{font-family:var(--mono);font-size:12px;color:var(--muted);flex-basis:52px;text-align:right;}',
  '.advisors{display:grid;gap:14px;margin-top:14px;}',
  '.advisor{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;box-shadow:0 4px 12px rgba(2,6,23,.05);}',
  '.advisor header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}',
  '.advisor h3{font-size:17px;margin:0;color:var(--ink);font-weight:700;}',
  '.role{font-size:12.5px;color:var(--muted);margin:2px 0 8px;}',
  '.stance{font-family:var(--mono);font-size:12px;color:var(--ga);margin:8px 0;}',
  '.advisor p.sum{margin:.2em 0;color:var(--body);}',
  '.unverified{margin:16px 0 0;background:rgba(180,83,9,.05);border:1px dashed var(--amber);border-radius:10px;padding:14px 16px;}.unverified h3{margin:0 0 8px;font-size:13px;color:var(--amber);font-weight:700;font-family:var(--mono);text-transform:uppercase;letter-spacing:.04em;}.unverified ul{margin:0;padding-left:1.1em;}',
  'h2.sec{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:40px 0 4px;font-weight:700;}',
  'footer{margin-top:60px;background:var(--footer);padding:42px 20px 48px;text-align:center;border-top:4px solid transparent;border-image:var(--grad) 1;}',
  '.brandimg.dark{height:40px;width:auto;display:inline-block;}',
  '.tagline{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:#cbd5e1;margin-top:16px;}',
  '.fineprint{font-size:10px;color:#64748b;margin-top:14px;font-family:var(--mono);}',
  '@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}.pctlab{flex-basis:140px}}',
  // ---- incident-specific additions -----------------------------------------
  '.sev{margin:26px 0 6px;border-radius:14px;padding:20px 24px;background:linear-gradient(90deg,rgba(185,28,28,.08),rgba(180,83,9,.05));border:1.5px solid var(--red);border-left:6px solid var(--red);}',
  '.sev h2{margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--red);font-weight:800;}',
  '.sev .lvl{font-size:22px;font-weight:800;color:var(--ink);}',
  '.sev p{margin:.5em 0 0;font-size:14.5px;color:var(--body);}',
  '.sevhist{margin:12px 0 0;font-family:var(--mono);font-size:11px;color:var(--muted);line-height:1.7;}',
  '.exec .prio{margin:12px 0 0;padding-left:1.15em;}.exec .prio li{margin:.4em 0;font-size:15px;}',
  '.clock{font-family:var(--mono);font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px}',
  '.clock.ok{color:#15803d;background:rgba(21,128,61,.10)}',
  '.clock.warn{color:#b45309;background:rgba(180,83,9,.12)}',
  '.clock.over{color:#b91c1c;background:rgba(185,28,28,.12)}',
  '.tag.obs{color:var(--slate);background:rgba(100,116,139,.12);}',
  '.tag.act{color:var(--ga);background:rgba(32,128,162,.12);}',
  '.tag.dec{color:var(--amber);background:rgba(180,83,9,.12);}',
  '.tag.esc{color:#7c3aed;background:rgba(124,58,237,.12);}',
  '.dial{margin:14px 0 0;display:grid;gap:10px;}',
  '.dstep{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:12px 16px;}',
  '.dstep.carve{border-left-color:var(--green);}',
  '.dstep h4{margin:0 0 4px;font-size:14px;color:var(--ink);font-weight:700;}.dstep p{margin:0;font-size:13.5px;color:var(--body);}',
  '.forbid{margin:12px 0 0;padding-left:1.1em;list-style:none}',
  '.forbid li{margin:.35em 0;color:#b91c1c;position:relative;padding-left:1.4em}',
  '.forbid li:before{content:"\\2717";position:absolute;left:0;font-weight:700}'
].join('');

// ---- normalizers / small builders ------------------------------------------
function o2(x, a, b) { if (Array.isArray(x)) { const r = {}; r[a] = x[0]; r[b] = x[1]; return r; } return x || {}; }
function phaseBadge(p) {
  if (!len(p)) return '';
  const map = { prepare: 'slate', identify: 'amber', contain: 'red', eradicate: 'amber', recover: 'teal', lessons: 'green' };
  return '<span class="badge ' + (map[String(p).toLowerCase()] || 'teal') + '">' + e(p) + '</span>';
}
function stPill(s) {
  const k = String(s || '').toLowerCase();
  let cls = 'mute';
  if (/over|breach|fail|miss/.test(k)) cls = 'bad';
  else if (/confirm|met|done|closed|complete|filed|verified|resolved/.test(k)) cls = 'ok';
  else if (/open|assess|progress|pending|in ?review|required|wip/.test(k)) cls = 'warn';
  else if (/kill|n\/?a|dropped|not ?applicable/.test(k)) cls = 'mute';
  return '<span class="st ' + cls + '">' + e(s || 'n/a') + '</span>';
}
function confClass(c) { c = String(c).toLowerCase(); return c === 'high' ? 'high' : c === 'medium' ? 'med' : 'low'; }

// ---- severity banner --------------------------------------------------------
function severityBlock() {
  const s = D.severity; if (!s) return '';
  let h = '<div class="sev"><h2>Severity</h2><div class="lvl">' + e(g(s, 'level')) + '</div>';
  if (len(g(s, 'text'))) h += '<p>' + e(s.text) + '</p>';
  if (arr(s.badges).length) h += '<div class="badges">' + arr(s.badges).map(function (b) { return '<span class="badge red">' + e(b) + '</span>'; }).join('') + '</div>';
  if (arr(s.history).length) {
    h += '<div class="sevhist">Re-rating trail: ' + arr(s.history).map(function (x) {
      return e(g(x, 'time')) + ' &rarr; <b>' + e(g(x, 'level')) + '</b>' + (len(g(x, 'reason')) ? ' (' + e(x.reason) + ')' : '');
    }).join(' &nbsp;&middot;&nbsp; ') + '</div>';
  }
  return h + '</div>';
}

// ---- exec + priorities ------------------------------------------------------
function execBlock() {
  let h = '<section class="exec"><h2>Executive summary</h2>';
  arr(D.exec).forEach(function (p) { h += '<p>' + e(p) + '</p>'; });
  if (arr(D.priorities).length) {
    h += '<h3 style="margin-top:14px;font-size:13px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em;font-family:var(--mono)">Immediate priorities</h3><ol class="prio">'
      + arr(D.priorities).map(function (p) { return '<li>' + e(p) + '</li>'; }).join('') + '</ol>';
  }
  if (len(g(D, 'askOfManagement'))) h += '<p class="ask"><strong>Ask of management:</strong> ' + e(D.askOfManagement) + '</p>';
  return h + '</section>';
}

// ---- notification tracker ---------------------------------------------------
function clockBadge(n, awarenessTs) {
  let deadline = g(n, 'deadline_ts');
  if (!deadline) {
    const clk = n.clock || {};
    const dur = clk.duration_hours;
    if (awarenessTs && dur != null) {
      const t = Date.parse(awarenessTs);
      if (!isNaN(t)) deadline = new Date(t + dur * 3600000).toISOString();
    }
  }
  if (!deadline) return '';
  const dl = Date.parse(deadline);
  if (isNaN(dl)) return '';
  const remH = (dl - Date.now()) / 3600000;
  let cls, txt;
  if (remH < 0) { cls = 'over'; txt = 'overdue ' + Math.abs(Math.round(remH)) + 'h'; }
  else if (remH < 24) { cls = 'warn'; txt = Math.round(remH) + 'h left'; }
  else { cls = 'ok'; txt = Math.round(remH) + 'h left'; }
  return '<span class="clock ' + cls + '">' + e(txt) + '</span>';
}
function statePill(status) {
  const s = String(status).toLowerCase();
  if (s === 'filed') return '<span class="st ok">Filed</span>';
  if (s === 'triggered') return '<span class="st bad">Required</span>';
  if (s === 'assessing') return '<span class="st warn">Assessing</span>';
  return '<span class="st mute">' + e(status || 'n/a') + '</span>';
}
function notifRow(n, awarenessTs) {
  const status = String(g(n, 'status')).toLowerCase();
  const clk = n.clock;
  let ctext = '';
  if (typeof clk === 'string') ctext = e(clk);
  else if (clk) { if (clk.duration_hours != null) ctext = e(clk.duration_hours) + 'h from ' + e(g(clk, 'start_event', 'awareness')); else ctext = e(g(clk, 'start_event', '')); }
  let clockCell = ctext;
  if (status === 'triggered' || status === 'assessing') { const b = clockBadge(n, awarenessTs); if (b) clockCell += (ctext ? '<br>' : '') + b; }
  const owner = e(g(n, 'determination_owner')) + (len(g(n, 'execution_owner')) ? ' &rarr; ' + e(g(n, 'execution_owner')) : '');
  let statusCell = statePill(status);
  if (len(g(n, 'status_reason'))) statusCell += '<div class="lead">' + e(g(n, 'status_reason')) + '</div>';
  if (status === 'filed' && len(g(n, 'filing_ref'))) statusCell += '<div class="lead">' + e(g(n, 'filing_ref')) + (len(g(n, 'filed_ts')) ? ' &middot; ' + e(g(n, 'filed_ts')) : '') + '</div>';
  const oblig = '<strong>' + e(g(n, 'label')) + '</strong>' + (len(g(n, 'ref')) ? '<br><span class="lead">' + e(g(n, 'ref')) + '</span>' : '');
  return '<tr><td>' + oblig + '</td><td>' + e(g(n, 'trigger')) + '</td><td>' + owner + '</td><td class="mono">' + clockCell + '</td><td>' + e(g(n, 'recipient')) + '</td><td>' + statusCell + '</td></tr>';
}
function notificationsBlock() {
  const ns = arr(D.notifications);
  if (!ns.length) return '';
  const br = D.breachRegister || {};
  const awarenessTs = (br.awareness && br.awareness.timestamp) || D.awareness_ts || '';
  const active = ns.filter(function (n) { return String(g(n, 'status')).toLowerCase() !== 'ruled_out'; });
  const ruled = ns.filter(function (n) { return String(g(n, 'status')).toLowerCase() === 'ruled_out'; });
  let h = '<section class="block"><h2>Notification tracker</h2>'
    + '<p class="lead">Each notification duty runs a four-state lifecycle (assessing &rarr; triggered &rarr; filed), with a computed deadline where a clock is live. Duties considered and ruled out sit in the ledger, so a missing obligation is a decision on the record, not a silent omission.</p>';
  if (active.length) {
    h += '<table class="t"><thead><tr><th>Obligation</th><th>Trigger / basis</th><th>Owner (determine &rarr; execute)</th><th>Clock</th><th>Recipient</th><th>Status</th></tr></thead><tbody>'
      + active.map(function (n) { return notifRow(n, awarenessTs); }).join('') + '</tbody></table>';
  }
  if (ruled.length) {
    h += '<div class="ledger"><h3>Considered and ruled out (for now)</h3><ul>'
      + ruled.map(function (n) { return '<li><b>' + e(g(n, 'label')) + '</b>: ' + e(g(n, 'status_reason') || g(n, 'reason')) + '</li>'; }).join('') + '</ul></div>';
  }
  return h + '</section>';
}

// ---- breach register --------------------------------------------------------
function breachBlock() {
  const b = D.breachRegister; if (!b) return '';
  const rows = [];
  const add = function (k, v) { if (len(v)) rows.push('<tr><td class="mono">' + e(k) + '</td><td>' + v + '</td></tr>'); };
  add('Entry no.', e(g(b, 'entry_no')));
  add('Controller', e(g(b, 'controller_name')));
  add('DPO contact', e(g(b, 'dpo_contact')));
  add('Data categories', arr(b.data_categories).map(e).join(', '));
  add('Approx. data subjects', e(g(b, 'approx_data_subjects')));
  add('Approx. records', e(g(b, 'approx_records')));
  add('Likely consequences', e(g(b, 'likely_consequences')));
  add('Measures taken', arr(b.measures_taken).map(e).join('; '));
  const ra = b.risk_assessment || {};
  add('Art. 33 risk (to authority)', e(g(ra, 'art33_risk')));
  add('Art. 34 risk (to individuals)', e(g(ra, 'art34_risk')));
  add('Risk rationale', e(g(ra, 'rationale')));
  let h = '<section class="block"><h2>Breach register (GDPR Art. 33(5))</h2>'
    + '<p class="lead">Maintained regardless of notifiability. This internal record is the auditable spine of the response.</p>'
    + '<table class="t"><tbody>' + rows.join('') + '</tbody></table>';
  const aw = b.awareness || {};
  if (len(g(aw, 'timestamp')) || len(g(aw, 'basis'))) {
    h += '<div class="callout"><strong>Awareness pinned.</strong> ' + e(g(aw, 'timestamp'))
      + (len(g(aw, 'basis')) ? ', ' + e(aw.basis) : '')
      + (len(g(aw, 'pinned_by')) ? ' (pinned by ' + e(aw.pinned_by) + ')' : '') + '</div>';
  }
  return h + '</section>';
}

// ---- timeline ---------------------------------------------------------------
const tlLabel = { obs: 'Observation', act: 'Action', dec: 'Decision', esc: 'Escalation' };
function timelineBlock() {
  const rows = arr(D.timeline);
  if (!rows.length) return '';
  const body = rows.map(function (r) {
    let time, event, type, assumed, source;
    if (Array.isArray(r)) { time = r[0]; event = r[1]; type = r[2]; assumed = r[3]; }
    else { time = g(r, 'time'); event = g(r, 'event'); type = g(r, 'type'); assumed = r.assumed; source = g(r, 'source'); }
    const tcls = tlLabel[type] ? type : 'obs';
    let cell = e(event);
    if (assumed) cell += ' <span class="st mute">ASSUMED' + (typeof assumed === 'string' && len(assumed) ? ', ' + e(assumed) : '') + '</span>';
    if (len(source)) cell += ' <span class="lead">[' + e(source) + ']</span>';
    return '<tr><td class="mono">' + e(time) + '</td><td>' + cell + '</td><td><span class="tag ' + tcls + '">' + (tlLabel[tcls]) + '</span></td></tr>';
  }).join('');
  return '<section class="block"><h2>Incident timeline</h2>'
    + '<p class="lead">Observations, actions, decisions and escalations with relative stamps. Wall-clock times to be backfilled by forensics from tickets and logs.</p>'
    + '<table class="t"><thead><tr><th class="mono">Time</th><th>Event / action</th><th>Type</th></tr></thead><tbody>' + body + '</tbody></table></section>';
}

// ---- triage -----------------------------------------------------------------
function triageBlock() {
  const t = D.triage; if (!t) return '';
  let h = '<section class="block"><h2>Triage, roles, and hypothesis</h2>';
  const roles = arr(t.roles);
  if (roles.length) {
    h += '<table class="t"><thead><tr><th>Role</th><th>Mandate</th></tr></thead><tbody>'
      + roles.map(function (r) { const o = o2(r, 'role', 'mandate'); return '<tr><td><strong>' + e(g(o, 'role')) + '</strong></td><td>' + e(g(o, 'mandate')) + '</td></tr>'; }).join('')
      + '</tbody></table>';
  }
  if (len(g(t, 'hypothesis'))) h += '<div class="callout"><strong>Working hypothesis.</strong> ' + e(t.hypothesis) + '</div>';
  return h + '</section>';
}

// ---- containment dial -------------------------------------------------------
function containmentBlock() {
  const d = D.dial; if (!d) return '';
  let h = '<section class="block"><h2>Containment: isolation as a dial</h2>'
    + '<p class="lead">Contain by network isolation, not power-off. Cut the highest-leverage paths first and quietly, then widen; carve out anything that protects human safety.</p>';
  const cf = arr(d.cutFirst);
  if (cf.length) {
    h += '<h3>Cut first, quietly (minutes)</h3><div class="dial">'
      + cf.map(function (s) { const o = o2(s, 'title', 'desc'); return '<div class="dstep"><h4>' + e(g(o, 'title')) + '</h4><p>' + e(g(o, 'desc')) + '</p></div>'; }).join('')
      + '</div>';
  }
  if (len(g(d, 'widen'))) h += '<h3>Widen next (evidence-led)</h3><p>' + e(d.widen) + '</p>';
  const carveOuts = arr(d.carveOuts);
  if (carveOuts.length) {
    h += '<div class="dstep carve" style="margin-top:12px"><h4>Carve out, never cold-cut</h4><ul>'
      + carveOuts.map(function (c) { return '<li><b>' + e(g(c, 'system')) + '</b>, ' + e(g(c, 'treatment')) + (len(g(c, 'ownerSignoff')) ? ' (sign-off: ' + e(c.ownerSignoff) + ')' : '') + '</li>'; }).join('')
      + '</ul></div>';
  } else if (len(g(d, 'carve'))) {
    h += '<div class="dstep carve" style="margin-top:12px"><h4>Carve out, never cold-cut</h4><p>' + e(d.carve) + '</p></div>';
  }
  const pct = arr(d.pct);
  if (pct.length) {
    h += '<h3>Percent isolated (tracked honestly)</h3>'
      + pct.map(function (p) { const o = o2(p, 'label', 'percent'); const v = Math.max(0, Math.min(100, Number(g(o, 'percent', 0)) || 0)); return '<div class="pctrow"><span class="pctlab">' + e(g(o, 'label')) + '</span><span class="pctbar"><span class="pctfill" style="width:' + v + '%"></span></span><span class="pctnum">' + v + '%</span></div>'; }).join('');
    if (len(g(d, 'pctNote'))) h += '<p class="lead" style="margin-top:10px">' + e(d.pctNote) + '</p>';
  }
  if (len(g(d, 'lastReviewed')) || len(g(d, 'nextReview'))) {
    h += '<p class="lead" style="margin-top:8px">Dial last reviewed ' + e(g(d, 'lastReviewed', 'n/a')) + ' &middot; next review ' + e(g(d, 'nextReview', 'n/a')) + '</p>';
  }
  return h + '</section>';
}

// ---- evidence register ------------------------------------------------------
function evidenceBlock() {
  const ev = D.evidence; if (!ev) return '';
  let h = '<section class="block"><h2>Evidence register and chain of custody</h2>';
  if (len(g(ev, 'rule'))) h += '<div class="callout"><strong>Sequencing rule.</strong> ' + e(ev.rule) + '</div>';
  const tiers = arr(ev.tiers);
  if (tiers.length) {
    h += '<h3>Capture order (volatility first)</h3><div class="dial">'
      + tiers.map(function (t) { const o = o2(t, 'title', 'desc'); return '<div class="dstep"><h4>' + e(g(o, 'title')) + '</h4><p>' + e(g(o, 'desc')) + '</p></div>'; }).join('')
      + '</div>';
  }
  const reg = arr(ev.register);
  if (reg.length) {
    h += '<h3>Itemized register</h3><table class="t"><thead><tr><th class="mono">ID</th><th>Item</th><th>Source host</th><th>Tier</th><th>Collected by</th><th class="mono">Time</th><th class="mono">Hash (acq)</th><th class="mono">Hash (verify)</th><th>Storage</th><th>Custody note</th></tr></thead><tbody>';
    h += reg.map(function (r) {
      return '<tr><td class="mono">' + e(g(r, 'id')) + '</td><td>' + e(g(r, 'item')) + '</td><td>' + e(g(r, 'sourceHost')) + '</td><td class="mono">' + e(g(r, 'tier')) + '</td><td>' + e(g(r, 'collectedBy')) + '</td><td class="mono">' + e(g(r, 'time')) + '</td><td class="mono">' + e(g(r, 'hashAcq')) + '</td><td class="mono">' + e(g(r, 'hashVerify')) + '</td><td>' + e(g(r, 'storage')) + '</td><td>' + e(g(r, 'custodyNote')) + '</td></tr>';
    }).join('');
    h += '</tbody></table>';
  }
  if (len(g(ev, 'custody'))) h += '<h3>Custody with email down</h3><p>' + e(ev.custody) + '</p>';
  if (len(g(ev, 'scope'))) h += '<div class="callout warn"><strong>Scope read (honest).</strong> ' + e(ev.scope) + '</div>';
  if (len(g(ev, 'exfil'))) h += '<div class="callout warn"><strong>Exfiltration read.</strong> ' + e(ev.exfil) + '</div>';
  if (len(g(ev, 'topRisk'))) h += '<div class="callout warn"><strong>Top evidence risk right now.</strong> ' + e(ev.topRisk) + '</div>';
  return h + '</section>';
}

// ---- decision log -----------------------------------------------------------
function decisionsBlock() {
  const ds = arr(D.decisions);
  if (!ds.length) return '';
  const body = ds.map(function (d) {
    let time, decision, rationale, owner, escalated, verdict;
    if (Array.isArray(d)) { time = d[0]; decision = d[1]; owner = d[2]; }
    else { time = g(d, 'time'); decision = g(d, 'decision'); rationale = g(d, 'rationale'); owner = g(d, 'owner'); escalated = d.escalated; verdict = g(d, 'verdict'); }
    let cell = e(decision);
    if (len(rationale)) cell += '. ' + e(rationale);
    if (escalated) cell += ' <span class="badge teal">escalated</span>' + (len(verdict) ? ' <span class="lead">' + e(verdict) + '</span>' : '');
    return '<tr><td class="mono">' + e(time) + '</td><td>' + cell + '</td><td>' + e(owner) + '</td></tr>';
  }).join('');
  return '<section class="block"><h2>Decision log</h2><p class="lead">Each significant call, the reason, who owned it, and any escalation and its verdict.</p>'
    + '<table class="t"><thead><tr><th class="mono">Time</th><th>Decision and rationale</th><th>Owner</th></tr></thead><tbody>' + body + '</tbody></table></section>';
}

// ---- eradication gates ------------------------------------------------------
function eradicationBlock() {
  const er = D.eradication;
  if (!er) return '';
  if (typeof er === 'string') {
    return '<section class="block"><h2>Eradication and recovery plan (gated)</h2><p>' + e(er) + '</p></section>';
  }
  let h = '<section class="block"><h2>Eradication and recovery plan (gated)</h2>';
  if (len(g(er, 'approach'))) h += '<div class="badges"><span class="badge amber">Approach: ' + e(er.approach) + '</span></div>';
  if (arr(er.sequence).length) h += '<h3>Sequence</h3>' + ulOf(er.sequence);
  const gates = arr(er.gates);
  if (gates.length) {
    h += '<h3>Verification gates (before anything returns to production)</h3><table class="t"><thead><tr><th>Gate</th><th>Status</th><th>Note</th></tr></thead><tbody>'
      + gates.map(function (x) { return '<tr><td><strong>' + e(g(x, 'gate')) + '</strong></td><td>' + stPill(g(x, 'status')) + '</td><td>' + e(g(x, 'note')) + '</td></tr>'; }).join('')
      + '</tbody></table>';
  }
  if (len(g(er, 'cleanroomNote'))) h += '<div class="callout"><strong>Clean-room.</strong> ' + e(er.cleanroomNote) + '</div>';
  if (arr(er.reconnectOrder).length) h += '<h3>Reconnect order</h3>' + ulOf(er.reconnectOrder);
  return h + '</section>';
}

// ---- escalations ------------------------------------------------------------
function escalationsBlock() {
  const es = arr(D.escalations);
  if (!es.length) return '';
  return '<section class="block"><h2>Escalate to the council / board</h2>'
    + '<p class="lead">Bet-the-organization calls the response team does not settle alone.</p>' + ulOf(es) + '</section>';
}

// ---- comms log + do-not-claim ----------------------------------------------
function commsBlock() {
  const cl = arr(D.commsLog);
  const dnc = D.doNotClaim;
  if (!cl.length && !dnc) return '';
  let h = '<section class="block"><h2>Comms log and external discipline</h2>';
  if (cl.length) {
    h += '<table class="t"><thead><tr><th class="mono">Time</th><th>Channel</th><th>Audience</th><th>Statement</th><th>Cleared by</th></tr></thead><tbody>'
      + cl.map(function (c) { return '<tr><td class="mono">' + e(g(c, 'time')) + '</td><td>' + e(g(c, 'channel')) + '</td><td>' + e(g(c, 'audience')) + '</td><td>' + e(g(c, 'statement')) + '</td><td>' + e(g(c, 'cleared_by')) + '</td></tr>'; }).join('')
      + '</tbody></table>';
  }
  if (dnc) {
    h += '<div class="callout warn"><strong>Do-not-claim list.</strong> ' + e(g(dnc, 'rule'))
      + (arr(dnc.forbidden_until_forensic_signoff).length ? '<ul class="forbid">' + arr(dnc.forbidden_until_forensic_signoff).map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul>' : '')
      + (len(g(dnc, 'approved_holding_line')) ? '<p style="margin:12px 0 0"><strong>Approved holding line:</strong> ' + e(dnc.approved_holding_line) + '</p>' : '')
      + (len(g(dnc, 'spokesperson')) ? '<p style="margin:6px 0 0"><strong>Spokesperson:</strong> ' + e(dnc.spokesperson) + '</p>' : '')
      + '</div>';
  }
  return h + '</section>';
}

// ---- assumptions register ---------------------------------------------------
function assumptionsBlock() {
  const as = arr(D.assumptions);
  if (!as.length) return '';
  const hasRes = as.some(function (a) { return len(g(a, 'resolution')); });
  let h = '<section class="block"><h2>Assumptions to verify</h2>'
    + '<p class="lead">Facts the response acted on that were assumed, not observed. Each is a lead to confirm or kill, not an established fact; entries marked ASSUMED in the timeline trace here.</p>'
    + '<table class="t"><thead><tr><th>Assumed fact</th><th>Basis</th><th>What confirms or kills it</th><th>Verify-owner</th><th>Status</th>' + (hasRes ? '<th>Resolution</th>' : '') + '</tr></thead><tbody>';
  h += as.map(function (a) {
    return '<tr><td><strong>' + e(g(a, 'claim')) + '</strong></td><td>' + e(g(a, 'basis')) + '</td><td>' + e(g(a, 'confirm')) + '</td><td class="mono">' + e(g(a, 'owner')) + '</td><td>' + stPill(g(a, 'status')) + '</td>' + (hasRes ? '<td>' + e(g(a, 'resolution')) + '</td>' : '') + '</tr>';
  }).join('');
  return h + '</tbody></table></section>';
}

// ---- lessons ----------------------------------------------------------------
function lessonsBlock() {
  const l = D.lessons;
  let nextStep = D.nextStep;
  let h = '<section class="block"><h2>Lessons and next steps</h2>';
  let any = false;
  if (Array.isArray(l)) { h += '<h3>Contributing factors</h3>' + ulOf(l); any = true; }
  else if (l) {
    if (arr(l.wentWell).length) { h += '<h3>What went well</h3>' + ulOf(l.wentWell); any = true; }
    if (arr(l.contributingFactors).length) { h += '<h3>Contributing factors</h3>' + ulOf(l.contributingFactors); any = true; }
    if (arr(l.actionItems).length) {
      any = true;
      h += '<h3>Action items</h3><table class="t"><thead><tr><th>Item</th><th>Owner</th><th class="mono">Due</th><th>Status</th></tr></thead><tbody>'
        + arr(l.actionItems).map(function (a) { return '<tr><td>' + e(g(a, 'item')) + '</td><td>' + e(g(a, 'owner')) + '</td><td class="mono">' + e(g(a, 'dueDate')) + '</td><td>' + stPill(g(a, 'status')) + '</td></tr>'; }).join('')
        + '</tbody></table>';
    }
    if (len(g(l, 'nextStep'))) nextStep = l.nextStep;
  }
  if (len(nextStep)) { h += '<div class="callout"><strong>Single most useful next step.</strong> ' + e(nextStep) + '</div>'; any = true; }
  if (!any) return '';
  return h + '</section>';
}

// ---- seats ------------------------------------------------------------------
function seatsBlock() {
  const seats = arr(D.seats);
  if (!seats.length && !arr(D.verified).length && !arr(D.unverified).length) return '';
  let h = '';
  if (seats.length) {
    h += '<h2 class="sec">The incident team</h2><p class="lead">Three isolated seats produced this response: incident commander, forensics lead, and legal &amp; comms. They layer rather than conflict; the calibrated positions are shown as they stand.</p><div class="advisors">';
    h += seats.map(function (m) {
      const conf = g(m, 'conf') || g(m, 'confidence');
      let a = '<article class="advisor"><header><div><h3>' + e(g(m, 'name')) + '</h3>';
      if (len(g(m, 'role'))) a += '<p class="role">' + e(m.role) + '</p>';
      a += '</div>';
      if (len(conf)) a += '<span class="pill ' + confClass(conf) + '">' + e(conf) + (g(m, 'prob') != null ? ' &middot; ' + e(m.prob) + '%' : '') + '</span>';
      a += '</header>';
      if (len(g(m, 'stance'))) a += '<p class="stance">Stance: ' + e(m.stance) + '</p>';
      const sum = g(m, 'sum') || g(m, 'summary');
      if (len(sum)) a += '<p class="sum">' + e(sum) + '</p>';
      return a + '</article>';
    }).join('');
    h += '</div>';
    if (len(g(D, 'seatNote'))) h += '<div class="callout" style="margin-top:16px">' + e(D.seatNote) + '</div>';
  }
  const v = arr(D.verified), u = arr(D.unverified);
  if (v.length || u.length) {
    h += '<section class="block"><h2>What this rests on</h2>';
    if (v.length) h += '<div class="ledger"><h3>Verified (load-bearing)</h3><ul>' + v.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul></div>';
    if (u.length) h += '<div class="unverified"><h3>Not independently verified, check before relying</h3><ul>' + u.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul></div>';
    h += '</section>';
  }
  return h;
}

// ---- assemble ---------------------------------------------------------------
const metaPairs = [];
if (len(g(D, 'ref'))) metaPairs.push('<span><b>Reference</b>&nbsp;&nbsp;' + e(D.ref) + '</span>');
if (len(g(D, 'status'))) metaPairs.push('<span><b>Status</b>&nbsp;&nbsp;' + e(D.status) + '</span>');
if (len(g(D, 'date'))) metaPairs.push('<span><b>As of</b>&nbsp;&nbsp;' + e(D.date) + '</span>');
if (len(g(D, 'phase'))) metaPairs.push('<span><b>Phase</b>&nbsp;&nbsp;' + phaseBadge(D.phase) + '</span>');
metaPairs.push('<span>' + tlpBadge(D.tlp || 'AMBER') + '</span>');

let out = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>Incident Response Report: ' + e(g(D, 'title')) + '</title>'
  + '<style>' + CSS + '</style></head><body><div class="brandrule"></div><div class="wrap">'
  + '<header class="head">' + logoLight + '<div class="kicker">Incident Response Report</div></header>'
  + '<h1>' + e(g(D, 'title')) + '</h1>'
  + (len(g(D, 'subtitle')) ? '<p class="subtitle">' + e(D.subtitle) + '</p>' : '')
  + '<p class="intro">This dossier gives the current status and the immediate priorities first, then the full response record: notification clocks, breach register, timeline, containment, evidence, decisions, recovery gates, comms, and the seat positions that produced it.</p>'
  + '<div class="meta">' + metaPairs.join('') + '</div>'
  + severityBlock()
  + execBlock()
  + riskBlock(D.risk, 'Risk rating', 'A qualitative read: impact against likelihood, mapped to an exposure score. Inherent is exposure before the recommended response; residual is what remains after it. The gap is the value of disciplined response.')
  + notificationsBlock()
  + breachBlock()
  + '<div class="divider"><h2>The response record</h2><p>The operational detail: timeline, triage, containment, evidence, decisions, recovery gates, and comms.</p></div>'
  + timelineBlock()
  + triageBlock()
  + containmentBlock()
  + evidenceBlock()
  + decisionsBlock()
  + eradicationBlock()
  + escalationsBlock()
  + commsBlock()
  + assumptionsBlock()
  + lessonsBlock()
  + seatsBlock()
  + '</div><footer>' + logoDark
  + '<div class="tagline">' + htmlEscape(TAGLINE) + '</div>'
  + '<div class="fineprint">Generated by the Information Security Incident Team &middot; exercise run &middot; ' + tlpBadge(D.tlp || 'AMBER').replace(/<[^>]+>/g, '') + ' &middot; guidance only, not a substitute for professional advice</div>'
  + '</footer></body></html>';

out = out.replace(/[\x00]/g, '');
const d = new Date();
const p2 = function (n) { return String(n).padStart(2, '0'); };
const stamp = '' + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds());
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, 'incident-report-' + stamp + '.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('report written: ' + outPath);
