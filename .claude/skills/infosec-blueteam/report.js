#!/usr/bin/env node
/*
 * Detection & Hardening Plan -> HTML dossier (Luméro-branded).
 * Zero-dependency Node. Reuses the infosec-council brand shell (CSS, logos, risk
 * bar) for visual consistency across the suite, and renders the blue-team
 * deliverable: exec + coverage tiles, TTP scope, log-source coverage map,
 * coverage heatmap, detections, hunt hypotheses, hardening backlog, purple-team
 * scorecard, seats.
 *
 * Usage:
 *   node report.js < plan.json          # rich detection-hardening JSON on stdin
 *   node report.js --in plan.json       # ... or from a file
 *   node report.js --example            # render the bundled UM TA505/Clop sample
 *
 * Branding (optional; logos resolved from the sibling council skill by default):
 *   LUMERO_LOGO_LIGHT / LUMERO_LOGO   header / footer logo (URL or local image)
 *   BLUETEAM_REPORT_DIR               output dir (default: cwd)
 */
'use strict';
const fs = require('fs');
const path = require('path');

function die(msg) { console.error('blueteam-report: ' + msg); process.exit(1); }

const ASSETS = process.env.LUMERO_ASSETS || path.join(__dirname, '..', 'infosec-council', 'assets');
const OUT_DIR = process.env.BLUETEAM_REPORT_DIR || process.cwd();
const TAGLINE = process.env.LUMERO_TAGLINE || 'We do the academic research, you get the infosec tools.';
const EXAMPLE = path.join(__dirname, '..', 'infosec-shared', 'examples', 'um-ransomware-2019', 'detection-hardening.json');

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
  // ---- blue-team report-specific additions (coverage heatmap grid) ----------
  '.covlegend{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 18px;}',
  '.covkey{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px;color:var(--muted);}',
  '.covkey .sw{width:14px;height:14px;border-radius:3px;border:1px solid var(--border);display:inline-block;}',
  '.covtactic{margin:0 0 14px;}',
  '.covtactic h4{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:0 0 6px;font-weight:700;}',
  '.covcells{display:flex;flex-wrap:wrap;gap:8px;}',
  '.covcell{flex:0 0 auto;min-width:130px;max-width:200px;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--ink);}',
  '.covcell .tid{font-family:var(--mono);font-size:11px;font-weight:700;display:block;}',
  '.covcell .tcmt{font-size:11px;color:#334155;margin-top:3px;display:block;line-height:1.35;}',
  '.cov-gap{background:#e2e8f0}',
  '.cov-logged{background:#fde68a}',
  '.cov-hunted{background:#bfdbfe}',
  '.cov-detected{background:#bbf7d0}',
  '.cov-hardened{background:#86efac}'
].join('');

// ---- blue-team helpers ------------------------------------------------------
function attckTags(list) { return arr(list).map(function (t) { return '<span class="tag attck">' + e(t) + '</span>'; }).join(' '); }
function plainTags(list) { return arr(list).map(function (t) { return e(t); }).join(', '); }
// Sanitize a JSON-supplied CSS colour before it reaches a style attribute.
// e() blocks HTML breakout but not CSS injection (';', 'url(...)'), so a crafted
// legend colour could smuggle an external url() beacon into an "offline" dossier.
// Allow only hex, rgb/rgba/hsl/hsla, or a bare named colour; else fall back.
function cssColor(c, dflt) {
  c = String(c == null ? '' : c).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\)$/i.test(c)) return c;
  if (/^[a-zA-Z]{1,24}$/.test(c)) return c;
  return dflt || '#e2e8f0';
}
function logStatusPill(s) {
  s = String(s || '').toLowerCase();
  if (s === 'collected-and-alerting') return '<span class="st ok">alerting</span>';
  if (s === 'collected-unwatched') return '<span class="st warn">unwatched</span>';
  if (s === 'not-collected') return '<span class="st bad">not collected</span>';
  return '<span class="st mute">' + e(s || 'n/a') + '</span>';
}
function nativePill(v) {
  if (v === true) return '<span class="st ok">native alert</span>';
  const s = String(v || '').toLowerCase();
  if (s === 'rule-not-built') return '<span class="st mute">rule not built</span>';
  if (s === 'no-siem') return '<span class="st bad">no SIEM</span>';
  if (s === 'true') return '<span class="st ok">native alert</span>';
  return '<span class="st mute">' + e(v || 'n/a') + '</span>';
}
function levelChip(l) {
  const s = String(l || '').toLowerCase();
  let cls = 'mute';
  if (/crit/.test(s)) cls = 'bad'; else if (/high/.test(s)) cls = 'warn'; else if (/med/.test(s)) cls = 'info';
  return '<span class="st ' + cls + '">' + e(l || 'n/a') + '</span>';
}
function huntTypeBadge(t) {
  const s = String(t || '').toLowerCase();
  const cls = (s === 'baseline') ? 'slate' : 'teal';
  return '<span class="badge ' + cls + '">' + e(t || 'hunt') + '</span>';
}
function outcomePill(o) {
  const s = String(o || '').toLowerCase();
  if (s === 'found') return '<span class="st bad">found</span>';
  if (s === 'not-found') return '<span class="st ok">not found</span>';
  if (s === 'inconclusive') return '<span class="st mute">inconclusive</span>';
  return '<span class="st mute">' + e(o || 'n/a') + '</span>';
}
function igBadge(ig) {
  const s = String(ig || '').toUpperCase();
  let cls = 'slate';
  if (s === 'IG1') cls = 'green'; else if (s === 'IG2') cls = 'amber';
  return '<span class="badge ' + cls + '">' + e(s || 'IG?') + '</span>';
}
function effImpPill(v) {
  const s = String(v || '').toLowerCase();
  let cls = 'na';
  if (s === 'high') cls = 'high'; else if (s === 'medium' || s === 'med') cls = 'med'; else if (s === 'low') cls = 'low';
  return '<span class="pill ' + cls + '">' + e(v || 'n/a') + '</span>';
}
function covClass(s) {
  s = String(s || '').toLowerCase();
  const m = { gap: 'cov-gap', 'logged-unwatched': 'cov-logged', hunted: 'cov-hunted', detected: 'cov-detected', hardened: 'cov-hardened' };
  return m[s] || 'cov-gap';
}
function ragPill(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'detected' || s === 'hardened') return '<span class="st ok">' + e(status) + '</span>';
  if (s === 'hunted') return '<span class="st info">' + e(status) + '</span>';
  if (s === 'gap') return '<span class="st bad">' + e(status) + '</span>';
  return '<span class="st mute">' + e(status || 'n/a') + '</span>';
}

// ---- section builders -------------------------------------------------------
function execBlock() {
  const ex = D.executive_summary || {};
  let h = '<section class="exec"><h2>Executive summary</h2>';
  if (len(g(ex, 'threat_one_liner'))) h += '<p><strong>Threat.</strong> ' + e(ex.threat_one_liner) + '</p>';
  if (len(g(ex, 'coverage_one_liner'))) h += '<p><strong>Coverage.</strong> ' + e(ex.coverage_one_liner) + '</p>';
  h += tiles(ex.tiles);
  if (arr(ex.top_gaps).length) {
    h += '<p class="lead" style="margin-top:10px">Top gaps to close</p><ul>';
    h += arr(ex.top_gaps).map(function (t) {
      const owner = len(g(t, 'owner')) ? ' <span class="st mute">owner: ' + e(t.owner) + '</span>' : ' <span class="st warn">needs owner</span>';
      const conf = len(g(t, 'confidence')) ? ' <span class="st info">' + e(t.confidence) + '</span>' : '';
      const impact = len(g(t, 'impact')) ? ' <em>' + e(t.impact) + '</em>' : '';
      return '<li>' + e(g(t, 'gap')) + impact + owner + conf + '</li>';
    }).join('');
    h += '</ul>';
  }
  return h + '</section>';
}
function ttpScopeBlock() {
  const list = arr(D.ttp_scope);
  if (!list.length) return '';
  const order = [];
  const byTactic = {};
  list.forEach(function (t) {
    const tac = g(t, 'tactic', 'Other');
    if (!byTactic[tac]) { byTactic[tac] = []; order.push(tac); }
    byTactic[tac].push(t);
  });
  let h = '<section class="block"><h2>Threat and TTP scope</h2><p class="lead">The adversary techniques being defended against, ATT&amp;CK-mapped and grouped by tactic. The join key across every section below is the technique ID.</p>';
  order.forEach(function (tac) {
    h += '<h3>' + e(tac) + '</h3><div class="badges">';
    h += byTactic[tac].map(function (t) {
      const pre = String(g(t, 'priority')).toLowerCase() === 'pre-ransomware' ? ' <span class="badge amber">pre-ransomware</span>' : '';
      const src = len(g(t, 'source')) ? '<span class="lead" style="margin:0"> &middot; ' + e(t.source) + '</span>' : '';
      return '<span class="tag attck">' + e(g(t, 'technique_id')) + (len(g(t, 'technique_name')) ? ' ' + e(t.technique_name) : '') + '</span>' + pre + src;
    }).join(' ');
    h += '</div>';
  });
  return h + '</section>';
}
function logSourcesBlock() {
  const list = arr(D.log_sources);
  if (!list.length) return '';
  let h = '<section class="block"><h2>Log-source coverage map</h2><p class="lead">No detection is possible without a log source. Per source: is it collected, where it centralizes, how long it is kept, who watches it, and the CIS Controls v8 safeguards it supports.</p>'
    + '<table class="t"><thead><tr><th>Source</th><th class="mono">Central</th><th class="mono">Retention</th><th>Reviewed by</th><th>Status</th><th class="mono">CIS</th><th>Notes</th></tr></thead><tbody>';
  h += list.map(function (s) {
    const ret = g(s, 'retention_days');
    const retTxt = (ret === 0 || ret === '0') ? 'none' : (len(ret) ? e(ret) + 'd' : '—');
    return '<tr><td>' + e(g(s, 'name')) + '</td><td class="mono">' + e(g(s, 'centralization', '—')) + '</td><td class="mono">' + retTxt + '</td><td>' + e(g(s, 'reviewed_by', '—')) + '</td><td>' + logStatusPill(g(s, 'status')) + '</td><td class="mono">' + e(plainTags(s.cis_safeguards) || '—') + '</td><td>' + e(g(s, 'notes')) + '</td></tr>';
  }).join('');
  return h + '</tbody></table></section>';
}
function heatmapBlock() {
  const hm = D.coverage_heatmap || {};
  const techs = arr(hm.techniques);
  if (!techs.length) return '';
  let h = '<section class="block"><h2>Coverage heatmap</h2><p class="lead">The scoped techniques colored by current coverage state, grouped by tactic. Right-sized to the threat, not the full ATT&amp;CK matrix.</p>';
  if (arr(hm.legend).length) {
    h += '<div class="covlegend">' + arr(hm.legend).map(function (l) {
      return '<span class="covkey"><span class="sw" style="background:' + cssColor(g(l, 'color'), '#e2e8f0') + '"></span>' + e(g(l, 'label')) + '</span>';
    }).join('') + '</div>';
  }
  const order = [];
  const byTactic = {};
  techs.forEach(function (t) {
    const tac = g(t, 'tactic', 'Other');
    if (!byTactic[tac]) { byTactic[tac] = []; order.push(tac); }
    byTactic[tac].push(t);
  });
  order.forEach(function (tac) {
    h += '<div class="covtactic"><h4>' + e(tac) + '</h4><div class="covcells">';
    h += byTactic[tac].map(function (t) {
      const cmt = len(g(t, 'comment')) ? '<span class="tcmt">' + e(t.comment) + '</span>' : '';
      return '<div class="covcell ' + covClass(g(t, 'state')) + '"><span class="tid">' + e(g(t, 'techniqueID')) + '</span>' + cmt + '</div>';
    }).join('');
    h += '</div></div>';
  });
  return h + '</section>';
}
function detectionsBlock() {
  const list = arr(D.detections);
  if (!list.length) return '';
  let h = '<section class="block"><h2>Detection rules</h2><p class="lead">Sigma-style detections mapped to the ATT&amp;CK technique they catch and the D3FEND / CIS control they support. The native pill says whether the rule fires as a watched alert today.</p>'
    + '<table class="t"><thead><tr><th>Detection</th><th class="mono">ATT&amp;CK</th><th class="mono">D3FEND</th><th class="mono">CIS</th><th>Log source</th><th>Logic &amp; triage</th><th>Level</th><th>Native</th></tr></thead><tbody>';
  h += list.map(function (x) {
    const status = len(g(x, 'status')) ? '<br><span class="st mute">' + e(x.status) + '</span>' : '';
    let logic = e(g(x, 'logic_prose'));
    if (arr(x.false_positives).length) logic += '<br><span class="lead" style="margin:0"><b>FP:</b> ' + arr(x.false_positives).map(e).join('; ') + '</span>';
    if (len(g(x, 'tuning_note'))) logic += '<br><span class="lead" style="margin:0"><b>Tuning:</b> ' + e(x.tuning_note) + '</span>';
    const tr = x.triage || {};
    if (g(tr, 'severity') || g(tr, 'route_to') || g(tr, 'first_action')) {
      logic += '<br><span class="lead" style="margin:0"><b>Triage:</b> ' + e(g(tr, 'severity')) + (len(g(tr, 'route_to')) ? ' &rarr; ' + e(tr.route_to) : '') + (len(g(tr, 'first_action')) ? '; ' + e(tr.first_action) : '') + '</span>';
    }
    return '<tr><td><b>' + e(g(x, 'name')) + '</b>' + status + '</td><td class="mono">' + attckTags(x.attack_technique) + '</td><td class="mono">' + e(plainTags(x.d3fend) || '—') + '</td><td class="mono">' + e(g(x, 'cis_safeguard', '—')) + '</td><td>' + e(g(x, 'log_source')) + '</td><td>' + logic + '</td><td>' + levelChip(g(x, 'level')) + '</td><td>' + nativePill(g(x, 'fires_natively')) + '</td></tr>';
  }).join('');
  return h + '</tbody></table></section>';
}
function huntsBlock() {
  const list = arr(D.hunts);
  if (!list.length) return '';
  let h = '<section class="block"><h2>Hunt hypotheses</h2><p class="lead">Assume-breach hunts for the techniques detection cannot reliably cover. Where telemetry does not span the window, a clean result is "we could not look", not "clear".</p><div class="advisors">';
  h += list.map(function (x) {
    let a = '<article class="advisor"><header><div><h3>' + e(len(g(x, 'id')) ? 'Hunt ' + x.id : 'Hunt') + '</h3>';
    a += '<p class="role">' + attckTags(x.attack_techniques) + '</p></div>' + huntTypeBadge(g(x, 'hunt_type')) + '</header>';
    if (len(g(x, 'hypothesis'))) a += '<p class="sum"><strong>' + e(x.hypothesis) + '</strong></p>';
    if (len(g(x, 'rationale'))) a += '<p class="sum">' + e(x.rationale) + '</p>';
    const bits = [];
    if (arr(x.data_sources).length) bits.push('<b>Data:</b> ' + arr(x.data_sources).map(e).join(', '));
    if (len(g(x, 'scope'))) bits.push('<b>Scope:</b> ' + e(x.scope));
    if (len(g(x, 'analytic_logic'))) bits.push('<b>Logic:</b> ' + e(x.analytic_logic));
    if (bits.length) a += '<p class="stance">' + bits.join(' &middot; ') + '</p>';
    a += '<p class="sum">Outcome: ' + outcomePill(g(x, 'outcome')) + (len(g(x, 'outcome_detail')) ? ' ' + e(x.outcome_detail) : '') + '</p>';
    if (len(g(x, 'what_negative_proves'))) a += '<div class="callout warn"><strong>What a negative proves.</strong> ' + e(x.what_negative_proves) + '</div>';
    const foot = [];
    if (len(g(x, 'owner'))) foot.push('<b>Owner:</b> ' + e(x.owner));
    if (len(g(x, 'next_action'))) foot.push('<b>Next:</b> ' + e(x.next_action));
    if (foot.length) a += '<p class="role" style="margin-top:8px">' + foot.join(' &middot; ') + '</p>';
    return a + '</article>';
  }).join('');
  return h + '</div></section>';
}
function backlogBlock() {
  const list = arr(D.backlog).slice().sort(function (a, b) { return (g(a, 'rank') || 999) - (g(b, 'rank') || 999); });
  const seq = D.sequencing || {};
  if (!list.length && !arr(seq.now).length && !arr(seq.later).length) return '';
  let h = '<section class="block"><h2>Control-gap analysis and hardening backlog</h2><p class="lead">Prioritized controls, each mapped to the attacker step it closes, with an effort/impact read and the CIS Implementation Group. IG1 is the SME floor; IG2/IG3 are stretch.</p>';
  if (list.length) {
    h += '<table class="t"><thead><tr><th class="mono">#</th><th>Control</th><th class="mono">ATT&amp;CK</th><th class="mono">D3FEND</th><th class="mono">CIS</th><th>Closes</th><th>Effort</th><th>Impact</th><th>Residual gap</th></tr></thead><tbody>';
    h += list.map(function (x) {
      const cis = x.cis || {};
      const cisCell = e(g(cis, 'control', '—')) + '<br>' + igBadge(g(cis, 'ig'));
      const resid = len(g(x, 'residual_gap')) ? '<span class="lead" style="margin:0">' + e(x.residual_gap) + '</span>' : '—';
      const note = len(g(x, 'sme_note')) ? '<br><span class="lead" style="margin:0"><b>SME:</b> ' + e(x.sme_note) + '</span>' : '';
      return '<tr><td class="mono">' + e(g(x, 'rank')) + '</td><td><b>' + e(g(x, 'control')) + '</b>' + note + '</td><td class="mono">' + attckTags(x.attack_techniques) + '</td><td class="mono">' + e(plainTags(x.d3fend) || '—') + '</td><td class="mono">' + cisCell + '</td><td>' + e(g(x, 'attacker_step_closed')) + '</td><td>' + effImpPill(g(x, 'effort')) + '</td><td>' + effImpPill(g(x, 'impact')) + '</td><td>' + resid + '</td></tr>';
    }).join('');
    h += '</tbody></table>';
  }
  if (arr(seq.now).length || arr(seq.later).length) {
    h += '<div class="ledger"><h3>Sequencing' + (len(g(seq, 'confidence')) ? ' &middot; confidence ' + e(seq.confidence) : '') + '</h3>';
    if (arr(seq.now).length) h += '<p style="margin:0 0 4px"><b>Now</b></p>' + ulOf(seq.now);
    if (arr(seq.later).length) h += '<p style="margin:8px 0 4px"><b>Later</b></p>' + ulOf(seq.later);
    h += '</div>';
  }
  return h + '</section>';
}
function purpleBlock() {
  if (!D.purpleTeam) return '';
  const sc = D.scorecard || {};
  const steps = arr(sc.steps);
  if (!steps.length) return '';
  const sum = sc.summary || {};
  let h = '<section class="block"><h2>Purple-team coverage scorecard</h2><p class="lead">Each red-team kill-chain step scored by current coverage: detected, hunted, hardened, or still a gap. Every gap row must carry an owner or it is flagged incomplete.</p>'
    + '<table class="t"><thead><tr><th>Kill-chain step</th><th class="mono">ATT&amp;CK</th><th>Status</th><th>Control / detection</th><th class="mono">Before &rarr; after</th><th>Owner / next step</th></tr></thead><tbody>';
  h += steps.map(function (s) {
    const status = String(g(s, 'status')).toLowerCase();
    let owner = e(g(s, 'ownerOrNextStep'));
    if (status === 'gap' && !len(g(s, 'ownerOrNextStep'))) owner = '<span class="st warn">needs owner</span>';
    const ba = e(g(s, 'before', '—')) + ' &rarr; ' + e(g(s, 'after', '—'));
    return '<tr><td>' + e(g(s, 'step')) + '</td><td class="mono">' + attckTags(s.attack_techniques) + '</td><td>' + ragPill(g(s, 'status')) + '</td><td>' + e(g(s, 'controlOrDetectionRef')) + '</td><td class="mono">' + ba + '</td><td>' + owner + '</td></tr>';
  }).join('');
  h += '</tbody></table>';
  const rows = [
    { lab: 'Detected', k: 'detectedPct' },
    { lab: 'Hunted', k: 'huntedPct' },
    { lab: 'Hardened', k: 'hardenedPct' },
    { lab: 'Still a gap', k: 'gapPct' }
  ];
  if (rows.some(function (r) { return sum[r.k] != null; })) {
    h += '<h3>Coverage summary</h3>';
    h += rows.map(function (r) {
      if (sum[r.k] == null) return '';
      const pct = Math.max(0, Math.min(100, Number(sum[r.k]) || 0));
      return '<div class="pctrow"><span class="pctlab">' + r.lab + '</span><span class="pctbar"><span class="pctfill" style="width:' + pct + '%"></span></span><span class="pctnum">' + pct + '%</span></div>';
    }).join('');
  }
  return h + '</section>';
}
function seatsBlock() {
  const seats = arr(D.seats);
  if (!seats.length) return '';
  let h = '<h2 class="sec">The blue team</h2><p class="lead">Three isolated seats produced this plan: detection engineer, threat hunter, and hardening architect. The plan is honest about what the estate can and cannot see today.</p><div class="advisors">';
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
if (len(g(D, 'scope'))) metaPairs.push('<span><b>Scope</b>&nbsp;&nbsp;' + e(D.scope) + '</span>');
if (len(g(D, 'attack_version'))) metaPairs.push('<span><b>ATT&amp;CK</b>&nbsp;&nbsp;' + e(D.attack_version) + '</span>');
if (len(g(D, 'version'))) metaPairs.push('<span><b>Version</b>&nbsp;&nbsp;' + e(D.version) + '</span>');
if (len(g(D, 'next_review'))) metaPairs.push('<span><b>Next review</b>&nbsp;&nbsp;' + e(D.next_review) + '</span>');
metaPairs.push('<span>' + tlpBadge(D.tlp || 'AMBER+STRICT') + '</span>');

let out = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>Detection &amp; Hardening Plan: ' + e(g(D, 'title')) + '</title>'
  + '<style>' + CSS + '</style></head><body><div class="brandrule"></div><div class="wrap">'
  + '<header class="head">' + logoLight + '<div class="kicker">Detection &amp; Hardening Plan</div></header>'
  + '<h1>' + e(g(D, 'title')) + '</h1>'
  + (len(g(D, 'subtitle')) ? '<p class="subtitle">' + e(D.subtitle) + '</p>' : '')
  + '<p class="intro">An assume-breach detection and hardening plan. It maps the estate\'s telemetry reality, turns the attacker\'s TTPs into concrete ATT&amp;CK / D3FEND-mapped detections and assume-breach hunts, and produces a prioritized, CIS-mapped hardening backlog. Where it scores a red-team plan, the purple-team scorecard shows what is now detected, hunted, hardened, or still a gap.</p>'
  + '<div class="meta">' + metaPairs.join('') + '</div>'
  + execBlock()
  + ttpScopeBlock()
  + (D.risk ? riskBlock(D.risk, 'Risk rating', null) : '')
  + '<div class="divider"><h2>Detection posture</h2><p>The log-source reality, the coverage heatmap, the detections, and the hunts that cover what detection cannot.</p></div>'
  + logSourcesBlock()
  + heatmapBlock()
  + detectionsBlock()
  + huntsBlock()
  + '<div class="divider"><h2>Hardening &amp; scoring</h2><p>The prioritized backlog and, where a red-team plan was the input, the purple-team coverage scorecard.</p></div>'
  + backlogBlock()
  + purpleBlock()
  + seatsBlock()
  + verifiedBlock()
  + '</div><footer>' + logoDark
  + '<div class="tagline">' + htmlEscape(TAGLINE) + '</div>'
  + '<div class="fineprint">Generated by the Information Security Blue Team &middot; ' + tlpBadge(D.tlp || 'AMBER+STRICT').replace(/<[^>]+>/g, '') + ' &middot; detection &amp; hardening guidance, not a substitute for professional advice</div>'
  + '</footer></body></html>';

out = out.replace(/[\x00]/g, '');
const d = new Date();
const p2 = function (n) { return String(n).padStart(2, '0'); };
const stamp = '' + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds());
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, 'detection-hardening-report-' + stamp + '.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('report written: ' + outPath);
