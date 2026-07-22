#!/usr/bin/env node
/*
 * Adversary Emulation Plan -> HTML dossier (Luméro-branded).
 * Zero-dependency Node. Reuses the infosec-council brand shell (CSS, logos, risk
 * bar) for visual consistency across the suite, and renders the red-team
 * deliverable: exec + scorecard tiles, scope/RoE, emulated adversary, ATT&CK
 * kill chain, detection scorecard, findings, safety attestation, seats.
 *
 * Usage:
 *   node report.js < plan.json          # rich adversary-emulation JSON on stdin
 *   node report.js --in plan.json       # ... or from a file
 *   node report.js --example            # render the bundled UM TA505/Clop sample
 *
 * Branding (optional; logos resolved from the sibling council skill by default):
 *   LUMERO_LOGO_LIGHT / LUMERO_LOGO   header / footer logo (URL or local image)
 *   REDTEAM_REPORT_DIR                 output dir (default: cwd)
 */
'use strict';
const fs = require('fs');
const path = require('path');

function die(msg) { console.error('redteam-report: ' + msg); process.exit(1); }

const ASSETS = process.env.LUMERO_ASSETS || path.join(__dirname, '..', 'infosec-council', 'assets');
const OUT_DIR = process.env.REDTEAM_REPORT_DIR || process.cwd();
const TAGLINE = process.env.LUMERO_TAGLINE || 'We do the academic research, you get the infosec tools.';
const EXAMPLE = path.join(__dirname, '..', 'infosec-shared', 'examples', 'um-ransomware-2019', 'adversary-emulation.json');

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
  '@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}.pctlab{flex-basis:140px}}'
].join('');

// ---- detection-category chip (ATT&CK Evaluations taxonomy) ------------------
function catChip(cat) {
  const c = String(cat || '').toLowerCase();
  const map = { none: ['bad', 'None'], telemetry: ['warn', 'Telemetry'], general: ['warn', 'General'], tactic: ['info', 'Tactic'], technique: ['ok', 'Technique'] };
  const m = map[c] || ['mute', cat || 'n/a'];
  return '<span class="st ' + m[0] + '">' + e(m[1]) + '</span>';
}

// ---- section builders -------------------------------------------------------
function execBlock() {
  const ex = D.exec || {};
  let h = '<section class="exec"><h2>Executive summary</h2>';
  arr(ex.narrative_paras || (ex.narrative ? [ex.narrative] : [])).forEach(function (p) { h += '<p>' + e(p) + '</p>'; });
  h += tiles(ex.tiles);
  if (arr(ex.systemic_issues).length) h += '<p class="lead" style="margin-top:10px">Systemic (root-cause) issues</p><ul>' + arr(ex.systemic_issues).map(function (s) { return '<li>' + e(s) + '</li>'; }).join('') + '</ul>';
  if (len(g(ex, 'ask_of_management'))) h += '<p class="ask"><strong>Ask of management:</strong> ' + e(ex.ask_of_management) + '</p>';
  return h + '</section>';
}
function scopeBlock() {
  const s = D.scope || {};
  let h = '<section class="block"><h2>Scope and rules of engagement</h2>';
  if (len(g(s, 'authorization_ref'))) h += '<p><strong>Authorization:</strong> ' + e(s.authorization_ref) + '</p>';
  const inS = arr(s.in_scope), outS = arr(s.out_of_scope);
  if (inS.length || outS.length) {
    const n = Math.max(inS.length, outS.length);
    h += '<table class="t"><thead><tr><th>In scope</th><th>Out of scope</th></tr></thead><tbody>';
    for (let i = 0; i < n; i++) {
      const a = inS[i], b = outS[i];
      const av = a ? (a.asset != null ? a.asset + (a.notes ? ' — ' + a.notes : '') : String(a)) : '';
      const bv = b ? (b.asset != null ? b.asset + (b.reason ? ' — ' + b.reason : '') : String(b)) : '';
      h += '<tr><td>' + e(av) + '</td><td>' + e(bv) + '</td></tr>';
    }
    h += '</tbody></table>';
  }
  const meta = [];
  if (len(g(s, 'environment'))) meta.push('<span><b>Environment</b>&nbsp;&nbsp;' + e(s.environment) + '</span>');
  if (s.window && (s.window.start || s.window.end)) meta.push('<span><b>Window</b>&nbsp;&nbsp;' + e(g(s.window, 'start')) + ' &rarr; ' + e(g(s.window, 'end')) + '</span>');
  if (len(g(s, 'deconfliction'))) meta.push('<span><b>Deconfliction</b>&nbsp;&nbsp;' + e(s.deconfliction) + '</span>');
  if (meta.length) h += '<div class="meta" style="margin-top:14px">' + meta.join('') + '</div>';
  if (arr(s.stop_conditions).length) h += '<div class="callout warn"><strong>Stop conditions.</strong> ' + arr(s.stop_conditions).map(e).join(' &middot; ') + '</div>';
  if (arr(s.exclusions).length) { h += '<h3>Exclusions</h3>' + ulOf(s.exclusions); }
  return h + '</section>';
}
function adversaryBlock() {
  const a = D.adversary || {};
  if (!len(g(a, 'name'))) return '';
  let h = '<section class="block"><h2>Emulated adversary and rationale</h2>';
  h += '<div class="fcard"><header><h3>' + e(a.name) + '</h3><span class="pill ' + (String(g(a, 'confidence')).toLowerCase() === 'high' ? 'high' : String(g(a, 'confidence')).toLowerCase() === 'medium' ? 'med' : 'low') + '">Fit confidence: ' + e(g(a, 'confidence', 'n/a')) + '</span></header>';
  h += '<p class="fmeta">' + e(g(a, 'motivation')) + (len(g(a, 'sector_geo_fit')) ? ' &middot; ' + e(a.sector_geo_fit) : '') + '</p>';
  h += '<dl>';
  if (len(g(a, 'source_intrusion'))) h += '<dt>Source intrusion emulated</dt><dd>' + e(a.source_intrusion) + '</dd>';
  if (arr(a.objectives).length) h += '<dt>Objectives</dt><dd>' + arr(a.objectives).map(e).join('; ') + '</dd>';
  if (arr(a.flags).length) h += '<dt>Flags (win conditions)</dt><dd>' + arr(a.flags).map(e).join('; ') + '</dd>';
  h += '</dl></div>';
  if (arr(a.runners_up).length) {
    h += '<div class="ledger"><h3>Considered and set aside</h3><ul>' + arr(a.runners_up).map(function (r) { return '<li><b>' + e(g(r, 'name')) + '</b>: ' + e(g(r, 'reason')) + '</li>'; }).join('') + '</ul></div>';
  }
  if (arr(a.sources).length) h += '<p class="lead" style="margin-top:12px">Provenance: ' + arr(a.sources).map(function (s) { return e(typeof s === 'string' ? s : g(s, 'title')); }).join(' &middot; ') + '</p>';
  return h + '</section>';
}
function killchainBlock() {
  const k = arr(D.killchain);
  if (!k.length) return '';
  let h = '<section class="block"><h2>ATT&amp;CK kill chain</h2><p class="lead">The emulated procedure, ordered. Each step maps to an ATT&amp;CK technique and, where one exists, a re-runnable atomic test.</p>'
    + '<table class="t"><thead><tr><th>#</th><th>Tactic</th><th class="mono">Technique</th><th>Action</th><th>Target</th><th>Expected observable</th></tr></thead><tbody>';
  h += k.map(function (s, i) {
    const tech = e(g(s, 'technique_id')) + (len(g(s, 'technique_name')) ? ' ' + e(s.technique_name) : '');
    const test = len(g(s, 'atomic_test_ref')) ? '<br><span class="tag attck">' + e(s.atomic_test_ref) + '</span>' : '';
    const rangeOnly = s.range_only ? ' <span class="st mute">range-only</span>' : '';
    return '<tr><td class="mono">' + (g(s, 'step_no') || (i + 1)) + '</td><td>' + e(g(s, 'tactic')) + '</td><td class="mono">' + tech + test + '</td><td>' + e(g(s, 'procedure_detail')) + rangeOnly + '</td><td>' + e(g(s, 'target_asset')) + '</td><td>' + e(g(s, 'expected_observable')) + '</td></tr>';
  }).join('');
  return h + '</tbody></table></section>';
}
function scorecardBlock() {
  const sc = arr(D.scorecard);
  if (!sc.length) return '';
  const sum = D.scorecard_summary || {};
  let h = '<section class="block"><h2>Detection opportunities: blue-team scorecard</h2><p class="lead">Per step, the telemetry that should have caught it and whether it did. Categories follow the ATT&amp;CK Evaluations taxonomy (None &rarr; Telemetry &rarr; General &rarr; Tactic &rarr; Technique).</p>'
    + '<table class="t"><thead><tr><th>#</th><th>Expected log source / control</th><th>Detection</th><th class="mono">TTD</th><th>Analyst note</th></tr></thead><tbody>';
  h += sc.map(function (s, i) {
    return '<tr><td class="mono">' + (g(s, 'step_no') || (i + 1)) + '</td><td>' + e(g(s, 'expected_log_source')) + (len(g(s, 'control_expected')) ? '<br><span class="lead">' + e(s.control_expected) + '</span>' : '') + '</td><td>' + catChip(g(s, 'detection_category')) + '</td><td class="mono">' + e(g(s, 'time_to_detect', '—')) + '</td><td>' + e(g(s, 'analyst_note')) + '</td></tr>';
  }).join('');
  h += '</tbody></table>';
  if (sum && (sum.pct_technique_or_tactic != null || sum.detected_pct != null)) {
    const pctRaw = sum.pct_technique_or_tactic != null ? sum.pct_technique_or_tactic : sum.detected_pct;
    const pct = Math.max(0, Math.min(100, Number(pctRaw) || 0));
    h += '<div class="pctrow"><span class="pctlab">Steps meaningfully detected (Tactic/Technique)</span><span class="pctbar"><span class="pctfill" style="width:' + pct + '%"></span></span><span class="pctnum">' + pct + '%</span></div>';
    if (len(g(sum, 'mean_time_to_detect'))) h += '<p class="lead">Mean time to detect: ' + e(sum.mean_time_to_detect) + '</p>';
  }
  return h + '</section>';
}
function findingsBlock() {
  const f = arr(D.findings);
  if (!f.length) return '';
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  f.forEach(function (x) { const s = String(g(x, 'severity')).toLowerCase(); if (counts[s] != null) counts[s]++; });
  let h = '<section class="block"><h2>Findings and remediation</h2>';
  h += tiles([{ num: counts.critical, lab: 'Critical', kind: 'bad' }, { num: counts.high, lab: 'High', kind: 'warn' }, { num: counts.medium, lab: 'Medium', kind: 'info' }, { num: counts.low, lab: 'Low', kind: 'neutral' }]);
  h += f.map(function (x) {
    const crit = (typeof x.exploitability === 'object' && typeof x.blast_radius === 'object' && x.exploitability.score && x.blast_radius.score) ? (x.exploitability.score * x.blast_radius.score) : g(x, 'criticality');
    let c = '<article class="fcard"><header><h3>' + e(g(x, 'id') ? x.id + '. ' : '') + e(g(x, 'title')) + '</h3><span class="badge ' + sevClass(g(x, 'severity')) + '">' + e(g(x, 'severity', 'n/a')) + '</span></header>';
    const bits = [];
    if (crit) bits.push('criticality ' + crit + '/9');
    if (typeof x.exploitability === 'object') bits.push('exploitability ' + g(x.exploitability, 'score'));
    if (typeof x.blast_radius === 'object') bits.push('blast radius ' + g(x.blast_radius, 'score'));
    if (arr(x.chained_path).length) bits.push('chains steps ' + arr(x.chained_path).join(', '));
    if (bits.length) c += '<p class="fmeta">' + e(bits.join(' · ')) + '</p>';
    c += '<dl>';
    if (len(g(x, 'description'))) c += '<dt>What it is</dt><dd>' + e(x.description) + '</dd>';
    if (len(g(x, 'remediation'))) c += '<dt>Remediation</dt><dd>' + e(x.remediation) + '</dd>';
    if (len(g(x, 'detection_fix'))) c += '<dt>Paired detection fix</dt><dd>' + e(x.detection_fix) + '</dd>';
    c += '</dl></article>';
    return c;
  }).join('');
  return h + '</section>';
}
function safetyBlock() {
  const s = D.safety;
  if (!s) return '';
  let h = '<section class="block"><h2>Safety attestation</h2><div class="badges">';
  h += '<span class="badge ' + (s.roe_held ? 'green' : 'red') + '">RoE ' + (s.roe_held ? 'held' : 'BREACHED') + '</span>';
  h += '<span class="badge ' + (s.production_harm ? 'red' : 'green') + '">' + (s.production_harm ? 'PRODUCTION HARM' : 'No production harm') + '</span>';
  h += '</div>';
  if (arr(s.deconfliction_events).length) h += '<h3>Deconfliction events</h3>' + ulOf(arr(s.deconfliction_events).map(function (d) { return typeof d === 'string' ? d : (g(d, 'time') + ' — ' + g(d, 'description') + (d.resolution ? ' (' + d.resolution + ')' : '')); }));
  if (arr(s.aborts).length) h += '<h3>Aborts</h3>' + ulOf(arr(s.aborts).map(function (d) { return typeof d === 'string' ? d : (g(d, 'reason') + (d.step_no ? ' at step ' + d.step_no : '')); }));
  if (len(g(s, 'evidence_handling'))) h += '<p><strong>Evidence handling.</strong> ' + e(s.evidence_handling) + '</p>';
  if (s.safety_lead_signoff) h += '<div class="callout"><strong>Safety-lead sign-off:</strong> ' + e(g(s.safety_lead_signoff, 'name')) + (s.safety_lead_signoff.date ? ' (' + e(s.safety_lead_signoff.date) + ')' : '') + '</div>';
  return h + '</section>';
}
function seatsBlock() {
  const seats = arr(D.seats);
  if (!seats.length) return '';
  let h = '<h2 class="sec">The red team</h2><p class="lead">Three isolated seats produced this plan: threat intelligence, red-team operator, and safety lead. The deliverable is defensive evidence, not damage.</p><div class="advisors">';
  h += seats.map(function (m) {
    let a = '<article class="advisor"><header><div><h3>' + e(g(m, 'name')) + '</h3>';
    if (len(g(m, 'role'))) a += '<p class="role">' + e(m.role) + '</p>';
    a += '</div>';
    if (len(g(m, 'confidence'))) a += '<span class="pill ' + (String(m.confidence).toLowerCase() === 'high' ? 'high' : String(m.confidence).toLowerCase() === 'medium' ? 'med' : 'low') + '">' + e(m.confidence) + '</span>';
    a += '</header>';
    if (len(g(m, 'stance'))) a += '<p class="stance">Stance: ' + e(m.stance) + '</p>';
    if (len(g(m, 'summary'))) a += '<p class="sum">' + e(m.summary) + '</p>';
    return a + '</article>';
  }).join('');
  return h + '</div>';
}
function verifiedBlock() {
  const v = arr(D.verified), u = arr(D.unverified);
  if (!v.length && !u.length) return '';
  let h = '<section class="block"><h2>What this rests on</h2>';
  if (v.length) h += '<div class="ledger"><h3>Verified (load-bearing)</h3><ul>' + v.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul></div>';
  if (u.length) h += '<div class="unverified"><h3>Not independently verified, check before relying</h3><ul>' + u.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul></div>';
  return h + '</section>';
}

// ---- assemble ---------------------------------------------------------------
const metaPairs = [];
if (len(g(D, 'ref'))) metaPairs.push('<span><b>Reference</b>&nbsp;&nbsp;' + e(D.ref) + '</span>');
if (len(g(D, 'version'))) metaPairs.push('<span><b>Version</b>&nbsp;&nbsp;' + e(D.version) + '</span>');
if (len(g(D, 'date'))) metaPairs.push('<span><b>Date</b>&nbsp;&nbsp;' + e(D.date) + '</span>');
metaPairs.push('<span>' + tlpBadge(D.tlp || 'AMBER+STRICT') + '</span>');

let out = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>Adversary Emulation Plan: ' + e(g(D, 'title')) + '</title>'
  + '<style>' + CSS + '</style></head><body><div class="brandrule"></div><div class="wrap">'
  + '<header class="head">' + logoLight + '<div class="kicker">Adversary Emulation Plan</div></header>'
  + '<h1>' + e(g(D, 'title')) + '</h1>'
  + (len(g(D, 'subtitle')) ? '<p class="subtitle">' + e(D.subtitle) + '</p>' : '')
  + '<p class="intro">A threat-informed, safety-gated adversary-emulation plan. It emulates a realistic actor step by step, maps each move to MITRE ATT&amp;CK, and scores the detection opportunity every step creates. The deliverable is defensive evidence, not damage.</p>'
  + '<div class="meta">' + metaPairs.join('') + '</div>'
  + execBlock()
  + scopeBlock()
  + adversaryBlock()
  + '<div class="divider"><h2>The emulation</h2><p>The kill chain step by step, the detection opportunities each step creates, and the findings.</p></div>'
  + killchainBlock()
  + scorecardBlock()
  + findingsBlock()
  + safetyBlock()
  + seatsBlock()
  + verifiedBlock()
  + '</div><footer>' + logoDark
  + '<div class="tagline">' + htmlEscape(TAGLINE) + '</div>'
  + '<div class="fineprint">Generated by the Information Security Red Team &middot; ' + tlpBadge(D.tlp || 'AMBER+STRICT').replace(/<[^>]+>/g, '') + ' &middot; authorized emulation only, guidance not a substitute for professional advice</div>'
  + '</footer></body></html>';

out = out.replace(/[\x00]/g, '');
const d = new Date();
const p2 = function (n) { return String(n).padStart(2, '0'); };
const stamp = '' + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds());
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, 'adversary-emulation-report-' + stamp + '.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('report written: ' + outPath);
