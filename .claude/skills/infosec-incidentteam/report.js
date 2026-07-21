#!/usr/bin/env node
/*
 * Incident Response Report -> HTML dossier (Lumero-branded).
 * Reuses the infosec-council report.js stylesheet + base64 logo embedding for
 * brand/visual consistency, but renders the incident-team deliverable sections:
 * status, exec summary, risk rating, obligations, timeline, containment dial,
 * evidence register, legal tracker, decision log, eradication gates, escalations,
 * seat positions, lessons + next step.
 *
 * Usage: node incident-report.js            (data is inline below)
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Brand logos live in the council skill; resolve relative to this file so the
// generator is portable (no hardcoded absolute paths).
const ASSETS = process.env.LUMERO_ASSETS || path.join(__dirname, '..', 'infosec-council', 'assets');
const OUT_DIR = process.env.INCIDENT_REPORT_DIR || process.cwd();
const TAGLINE = 'We do the academic research, you get the infosec tools.';

// ---- helpers (ported from council report.js) --------------------------------
function htmlEscape(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,'&quot;');}
function e(s){return htmlEscape(String(s==null?'':s).replace(/\s*—\s*/g,', '));}
function mkLogo(src,cls){
  if(fs.existsSync(src)){
    let mime='image/webp';
    if(/\.svg$/i.test(src))mime='image/svg+xml';else if(/\.jpe?g$/i.test(src))mime='image/jpeg';else if(/\.png$/i.test(src))mime='image/png';
    const b64=fs.readFileSync(src).toString('base64');
    return '<img class="brandimg '+cls+'" src="data:'+mime+';base64,'+b64+'" alt="Lumero">';
  }
  return '<span class="wordmark '+cls+'">Lum&eacute;ro</span>';
}
const logoLight=mkLogo(path.join(ASSETS,'lumero-logo-black.webp'),'light');
const logoDark=mkLogo(path.join(ASSETS,'lumero-logo-white.webp'),'dark');

// ---- CSS (council stylesheet + a few incident-specific rules) ---------------
const CSS=[
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
'.intro{font-size:15px;color:var(--muted);margin:.4em 0 0;}',
'.meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}',
'.meta b{color:var(--muted);font-weight:600;}',
'.lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}',
// severity banner
'.sev{margin:26px 0 6px;border-radius:14px;padding:20px 24px;background:linear-gradient(90deg,rgba(185,28,28,.08),rgba(180,83,9,.05));border:1.5px solid var(--red);border-left:6px solid var(--red);}',
'.sev h2{margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--red);font-weight:800;}',
'.sev .lvl{font-size:22px;font-weight:800;color:var(--ink);}',
'.sev p{margin:.5em 0 0;font-size:14.5px;color:var(--body);}',
'.badges{margin:10px 0 0;display:flex;gap:8px;flex-wrap:wrap;}',
'.badge{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:9999px;border:1px solid currentColor;}',
'.badge.red{color:var(--red);background:rgba(185,28,28,.08);}.badge.amber{color:var(--amber);background:rgba(180,83,9,.08);}.badge.slate{color:var(--slate);background:rgba(100,116,139,.08);}.badge.teal{color:var(--ga);background:rgba(32,128,162,.08);}',
// exec
'.exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}',
'.exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.5em 0;color:var(--body);font-size:15.5px;}',
'.exec .prio{margin:12px 0 0;padding-left:1.15em;}.exec .prio li{margin:.4em 0;font-size:15px;}',
// sections
'.divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}',
'.divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}',
'.divider p{margin:0;font-size:13px;color:var(--faint);}',
'.block{margin:26px 0;}.block h2{font-size:18px;margin:0 0 2px;color:var(--ink);font-weight:800;}.block p{margin:.3em 0;}',
'.block h3{font-size:14px;margin:16px 0 4px;color:var(--ink);font-weight:700;}',
'.block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}',
// tables
'table.t{border-collapse:collapse;width:100%;margin:8px 0 0;font-size:13px;}',
'table.t th,table.t td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;}',
'table.t th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}',
'table.t td.mono,table.t th.mono{font-family:var(--mono);white-space:nowrap;}',
'.tag{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:9999px;white-space:nowrap;display:inline-block;}',
'.tag.obs{color:var(--slate);background:rgba(100,116,139,.1);border:1px solid var(--slate);}',
'.tag.act{color:var(--ga);background:rgba(32,128,162,.1);border:1px solid var(--ga);}',
'.tag.dec{color:var(--amber);background:rgba(180,83,9,.1);border:1px solid var(--amber);}',
'.assumed{font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#7c3aed;background:rgba(124,58,237,.09);border:1px dashed #7c3aed;border-radius:6px;padding:1px 6px;margin-left:6px;white-space:nowrap;}',
'.assumereg{margin:14px 0 0;}',
'.assumereg .st.wait{margin-left:0;}',
'.st{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:9999px;white-space:nowrap;}',
'.st.req{color:#b45309;background:rgba(180,83,9,.10);border:1px solid #b45309;}',
'.st.trig{color:#b91c1c;background:rgba(185,28,28,.10);border:1px solid #b91c1c;}',
'.st.wait{color:var(--slate);background:rgba(100,116,139,.10);border:1px solid var(--slate);}',
'.st.no{color:var(--green);background:rgba(21,128,61,.10);border:1px solid var(--green);}',
// containment dial
'.dial{margin:14px 0 0;display:grid;gap:10px;}',
'.dstep{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:12px 16px;}',
'.dstep.carve{border-left-color:var(--green);}',
'.dstep h4{margin:0 0 4px;font-size:14px;color:var(--ink);font-weight:700;}.dstep p{margin:0;font-size:13.5px;color:var(--body);}',
'.pctwrap{margin:16px 0 0;}',
'.pctrow{display:flex;align-items:center;gap:12px;margin:6px 0;}',
'.pctlab{font-family:var(--mono);font-size:12px;color:var(--muted);flex:0 0 250px;}',
'.pctbar{position:relative;flex:1;height:12px;border-radius:9999px;background:#eef2f6;overflow:hidden;}',
'.pctfill{position:absolute;top:0;left:0;height:100%;border-radius:9999px;background:var(--grad);}',
'.pctnum{font-family:var(--mono);font-size:12px;color:var(--ink);font-weight:700;flex:0 0 48px;text-align:right;}',
// risk exposure (from council)
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
// ledger / callouts
'.ledger{margin:16px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--slate);border-radius:10px;padding:14px 16px;}.ledger h3{margin:0 0 8px;font-size:13px;color:var(--ink);font-weight:700;font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase;}.ledger ul{margin:0;padding-left:1.1em;}.ledger li{margin:.35em 0;font-size:13.5px;color:var(--body);}.ledger li b{color:var(--ink);}',
'.callout{margin:16px 0 0;background:rgba(32,128,162,.05);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:14px 16px;font-size:14px;color:var(--body);}',
'.callout.warn{background:rgba(180,83,9,.06);border-left-color:var(--amber);}',
'.callout strong{color:var(--ink);}',
// seats
'.advisors{display:grid;gap:14px;margin-top:14px;}',
'.advisor{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;box-shadow:0 4px 12px rgba(2,6,23,.05);}',
'.advisor header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}',
'.advisor h3{font-size:17px;margin:0;color:var(--ink);font-weight:700;}',
'.role{font-size:12.5px;color:var(--muted);margin:2px 0 8px;}',
'.stance{font-family:var(--mono);font-size:12px;color:var(--ga);margin:8px 0;}',
'.advisor p.sum{margin:.2em 0;color:var(--body);}',
'.pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}',
'.pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low{color:var(--slate);background:rgba(100,116,139,.08);}',
'.unverified{margin:16px 0 0;background:rgba(180,83,9,.06);border:1px dashed var(--amber);border-radius:10px;padding:14px 16px;font-size:13.5px;color:var(--body);}.unverified h3{margin:0 0 6px;font-size:12px;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--amber);}',
// footer
'footer{margin-top:60px;background:var(--footer);padding:42px 20px 48px;text-align:center;border-top:4px solid transparent;border-image:var(--grad) 1;}',
'.brandimg.dark{height:40px;width:auto;display:inline-block;}',
'.tagline{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:#cbd5e1;margin-top:16px;}',
'.fineprint{font-size:10px;color:#64748b;margin-top:14px;font-family:var(--mono);}',
'@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}.pctlab{flex-basis:140px}}'
].join('');

// ---- DATA -------------------------------------------------------------------
const D = {
  title: 'Suspected University-Wide Ransomware',
  subtitle: 'Live incident response, decentralized research university, single flat Active Directory domain (~1,600 servers, ~7,300 workstations). No central SIEM or 24/7 SOC; holiday run-up, thin coverage. Exercise run.',
  ref: 'INC-RANSOM / SEV-1',
  date: '2026-07-21 (reference date assumed)',
  status: 'LIVE / ACTIVE INTRUSION (working assumption)',
  severity: {
    level: 'SEV-1 / CRITICAL',
    text: 'Impact is already materialized (files are encrypted now), so this is not a "possible" risk. Two correlated signals in the same window on a flat, unsegmented ~8,900-host estate, plus loss of the normal coordination channel (email) and thin holiday staffing, all amplify it. Re-rate at every material change.',
    badges: ['Active intrusion assumed','Email untrusted','AD untrusted','Exfil not excluded','GDPR clock live']
  },
  exec: [
    'Three simultaneous signals are being treated as one active intrusion until proven otherwise: the mail platform is down and silent, a phishing report (link + Excel) sits on record from earlier, and files are being found encrypted across shares.',
    'The most likely story, unconfirmed, is a phished foothold, easy lateral movement across a single flat Active Directory domain, escalation to privileged access, then mail knocked out and ransomware pushed broadly. Scope, whether the attacker still has access, whether backups are clean, and whether data was stolen are all still unknown.'
  ],
  priorities: [
    'Stand up out-of-band command and comms; email and AD cannot be trusted.',
    'Contain by network isolation, not power-off: cut internet egress, the backup plane, the virtualization management plane, and privileged authentication first and quietly.',
    'Preserve domain-controller and volatile evidence before anyone re-images.',
    'Pin the awareness timestamp and open the GDPR breach register now.',
    'Call the cyber-insurer before engaging any outside firm, then DFIR and the sector CSIRT (SURFcert).'
  ],
  risk: {
    inherent: {impact:'severe', likelihood:'almost certain', rationale:'Encryption is confirmed and spreading potential is high on a flat domain with no segmentation and no central monitoring; the adverse impact is already observed, so likelihood is Almost certain, not Possible. Data-theft and backup-loss tails are open.'},
    residual: {impact:'major', likelihood:'likely', rationale:'Disciplined isolation, evidence preservation, and gated recovery reduce further spread and protect the ability to rebuild cleanly. Residual stays high because probable prior exfiltration, possible backup compromise, and attacker persistence surviving recovery cannot yet be excluded.'}
  },
  timeline: [
    ['Pre-T0 (weeks)','Phishing email reported to service desk (link + Excel). Action taken unknown.','obs'],
    ['T0','Mail server unreachable and silent; email down (send + receive).','obs'],
    ['T0','Encrypted files / altered extensions / possible ransom note reported across shares.','obs'],
    ['T0+0','Declared SEV-1; roles named; decision log opened.','act'],
    ['T0+5','Email and AD-federated tools declared untrusted; out-of-band channel + physical war room stood up.','act'],
    ['T0+15','Hold order issued: no touch, no reboot, no re-image on affected hosts.','act'],
    ['T0+18','Perimeter egress locked to allowlist (cut C2 cheaply, keep power on).','act'],
    ['T0+22','Backup plane isolated; backup jobs paused; immutable copies checked.','act','verify immutable/offline backups exist: backup lead'],
    ['T0+30','Hypervisor management plane isolated; Tier-0 accounts frozen.','act','verify virtualization platform exists: infra lead'],
    ['T0+30','Working hypothesis set: ONE intrusion, phishing report as unconfirmed candidate entry.','dec'],
    ['T0+45','Awareness timestamp pinned; GDPR breach register opened.','act'],
    ['T0+60-90','First board brief; insurer policy pulled; DFIR + SURFcert engaged.','act']
  ],
  triage: {
    roles: [
      ['Commander','Holds tempo and final call authority.'],
      ['Scribe / decision-log keeper','One job: timestamp every decision with a one-line reason.'],
      ['Evidence custodian','Senior sysadmin; authority to veto evidence-destroying moves, even the commander’s.'],
      ['Comms / Legal + DPO','Looped in from minute one given likely personal-data exposure.'],
      ['Tech leads','AD/Windows, network, backup/storage, plus a faculty-IT liaison per affected faculty.']
    ],
    hypothesis: 'One intrusion. Same window, same estate, and a flat single domain is exactly the topology where one stolen credential explains both a dead mail server and encrypted shares elsewhere. The phishing report is an open thread to test, not a proven cause. Forensics owns disproving the single-incident theory; until then this is one case file, not three tickets.'
  },
  dial: {
    cutFirst: [
      ['1. Internet egress (server VLANs to tight allowlist)','Kills command-and-control cheaply, low evidence cost, no one inside notices immediately.'],
      ['2. Backup plane','Isolate repositories, pause jobs so encrypted data cannot overwrite good backups, rotate backup-console credentials, confirm immutable/offline copies untouched.'],
      ['3. Virtualization / hypervisor management network','A hypervisor compromise is a mass-encryption multiplier.'],
      ['4. Privileged authentication','Freeze Domain Admin / Tier-0 use; do not push AD-wide changes from an AD we do not yet trust.']
    ],
    widen: 'Quarantine VLANs for subnets showing new encryption; block SMB/RDP lateral paths at the firewall; suspend non-essential VPN. Re-decide the dial every 30 to 60 minutes.',
    carve: 'Never cold-cut life-safety and OT, building-management, lab-safety and environmental controls, or any clinical/medical-research and live-experiment systems. Assess each with the facility owner; network-isolate at most, with continuous physical-safety monitoring.',
    pct: [
      ['Perimeter egress control', 100],
      ['Backup plane isolated', 100],
      ['Hypervisor management isolated', 100],
      ['Tier-0 auth frozen', 100],
      ['Host-level isolation (~8,900 assets)', 4]
    ],
    pctNote: 'Targets by T0+90. Host-level isolation across ~8,900 assets is the long pole; expect low single-digit percent given the manual, faculty-by-faculty pace. Reported as-is, not rounded up.'
  },
  evidence: {
    rule: 'Network-isolate immediately, but do not power off and do not re-image a host until at least a memory capture and a process/network snapshot exist, or the commander explicitly accepts and logs the evidence loss. Isolation stops spread as well as power-off does, without destroying memory-resident evidence.',
    tiers: [
      ['Tier 0 (first, before further touch)','Live memory + process/network state on the mail server, first few encrypted servers, any DC showing interactive attacker logon, and the phishing-reported workstation if identifiable.'],
      ['Tier 1','Ransom note text/location from several hosts; a sample encrypted file plus a known-good original; DC state (NTDS.dit, SYSTEM hive, Security/System logs) BEFORE any password reset or ticket invalidation; mail server image or at least transport/message-tracking logs before any reboot.'],
      ['Tier 2 (perishable)','EDR/AV console exports, firewall/proxy/DNS egress logs, VPN/remote-access logs, backup-server job history (check for attacker deletion), any netflow.']
    ],
    custody: 'With email down: paper or offline USB-carried log; per item record collector, UTC+local time, SHA-256 at collection and re-verified at each handoff, and storage location. Evidence goes to write-once media or an isolated evidence store with no domain trust, not a share on the possibly-compromised domain.',
    scope: 'Patient zero, dwell time, and blast radius are NOT yet established. With no SIEM, the timeline is a manual correlation of scattered, faculty-owned sources (DC auth logs first, then the phished endpoint, EDR/AV history, file-share modification times, VPN and backup logs). In a flat domain, "how far did it spread" largely equals "where did the stolen credentials work". External DFIR handoff for the deep timeline is expected.',
    exfil: 'Cannot be excluded. "No evidence of theft" and "evidence of no theft" are different claims; we have neither. This environment likely lacks an egress baseline, so exclusion may never be achievable, not merely "not yet". Legal and comms must plan on that basis.',
    topRisk: 'The biggest evidence risk right now is not the attacker, it is us: stressed faculty IT re-imaging machines to "just fix it" before capture. The hold order must reach every faculty, not just central IT.'
  },
  assumptions: [
    {claim:'The estate is virtualized (a hypervisor / vCenter-class management plane exists).', basis:'Inferred from ~1,600 servers; not stated in the incident inputs.', confirm:'Infra lead confirms the virtualization platform and its management network; if the servers are mostly physical the "isolate hypervisor plane" step is a no-op and is dropped.', owner:'Infra lead', status:'Open'},
    {claim:'Immutable or offline backup copies exist and were untouched at time of compromise.', basis:'Assumed so that "protect the backup plane" and "restore from clean media" are viable; not stated.', confirm:'Backup lead verifies immutability/offline status and last-known-good timestamps from a trusted console.', owner:'Backup lead', status:'Open'},
    {claim:'The intrusion is one event (mail outage + encryption + prior phishing report linked).', basis:'Working hypothesis on a flat domain, not yet evidenced.', confirm:'Forensics correlates DC auth logs, the phishing sample IOCs, and encryption timestamps.', owner:'Forensics lead', status:'Open'},
    {claim:'Personal and/or special-category data is in scope (drives the GDPR posture).', basis:'Assumed from the nature of a university; specific data categories unconfirmed.', confirm:'DPO/forensics identify which data-bearing systems were reached.', owner:'DPO', status:'Open'},
    {claim:'EDR / endpoint telemetry exists to reconstruct patient zero.', basis:'Hoped-for, not confirmed; coverage likely inconsistent across autonomous faculties.', confirm:'Forensics inventories what EDR/AV logging actually exists per faculty.', owner:'Forensics lead', status:'Open'}
  ],
  obligations: {
    triggered: [
      {label:'GDPR Art. 33 breach notification', action:'File a phased notification even if scope is incomplete; state what is known, what is not, and commit to follow-up.', det:'DPO', exe:'Controller (Executive Board) decides, DPO files', clock:'72h from awareness', recipient:'Autoriteit Persoonsgegevens (AP)', ref:'GDPR Art. 33(1),(4)'},
      {label:'GDPR Art. 33(5) internal register', action:'Open and maintain the breach register now, regardless of notifiability.', det:'DPO', exe:'DPO', clock:'Immediate', recipient:'Internal record', ref:'GDPR Art. 33(5)'},
      {label:'Executive Board briefing', action:'Notify the controller of a live suspected ransomware incident with personal-data exposure.', det:'Commander', exe:'Commander', clock:'Immediate', recipient:'College van Bestuur', ref:'Governance duty'},
      {label:'Sector CSIRT engagement', action:'Engage the education/research sector CSIRT as standard first call (accepts voluntary reports now).', det:'CISO', exe:'CISO / IT security', clock:'Now (recommended)', recipient:'SURFcert (cert@surfcert.nl / 030 23 05 112)', ref:'Sector good practice'}
    ],
    ruledOut: [
      {label:'GDPR Art. 34 notification to individuals', reason:'Requires a high-risk determination that needs scope; cannot tell until scoped. Route breadth/channel to the controller.'},
      {label:'NIS2 / Cyberbeveiligingswet (Cbw) notification (24h/72h/1-month)', reason:'Cbw enters into force 15 Aug 2026; NOT in force on 2026-07-21. Re-check after that date and confirm entity scope.'},
      {label:'Current-law Wbni (AED designation duty)', reason:'No blanket university designation found; check this institution’s own designation file. Not confirmed triggered today.'},
      {label:'Law-enforcement report (politie aangifte)', reason:'No statutory deadline; recommended and timed with DFIR/insurer after evidence is secured, not an immediate legal gate.'}
    ]
  },
  legalExtra: {
    awareness: 'Pinned at the moment a designated incident owner confirms, on signals 1+3 together, a suspected ransomware event touching personal-data systems, not at the first helpdesk ticket, and not gated on knowing which data. Everything downstream measures from this one stamp, so precision matters.',
    seventyTwo: 'If scope is still unknown at 72h from awareness (very plausible here), file anyway as a phased notification. The AP explicitly does not accept holiday or understaffing as an excuse for lateness. An honest partial filing on time beats a complete filing late.',
    insurer: 'Call the cyber-insurer first: engaging DFIR or a negotiator before insurer notice can void cover. UNVERIFIED per policy, read the actual wording today.',
    doNotClaim: 'Public do-not-claim list: no "data was not accessed", no "no health/financial/research data affected", no "fully contained/eradicated", no attacker name, no affected-count, no "safe to use again", no statement on whether a ransom will be paid. One designated spokesperson; all regulator/press/law-enforcement contact through Legal.'
  },
  decisions: [
    ['T0+0','Declared SEV-1: materialized encryption + correlated mail outage on a flat domain.','Commander'],
    ['T0+2','Named roles: command clarity before any technical action.','Commander'],
    ['T0+5','Email/AD declared untrusted; out-of-band channel + war room.','Commander'],
    ['T0+15','Hold order (no touch/reboot/re-image): preserve volatile evidence.','Evidence custodian'],
    ['T0+18','Perimeter egress to allowlist: cut C2 cheaply, power stays on.','Network lead'],
    ['T0+22','Backup plane isolated, jobs paused: protect good backups.','Backup lead'],
    ['T0+30','Hypervisor mgmt isolated, Tier-0 frozen: kill the mass-encryption multiplier.','AD lead'],
    ['T0+30','Hypothesis = one intrusion: parsimony on a flat domain; forensics to disprove.','Commander'],
    ['T0+45','Awareness pinned, breach register opened: start the GDPR clock deliberately.','DPO'],
    ['T0+60','Insurer policy pulled before DFIR engagement: avoid voiding cover.','Legal/Risk']
  ],
  eradication: 'Only after scoping. Sequence: identify and remove persistence; rotate all credentials (with DC state captured first); rebuild or restore ONLY from verified-clean, offline/immutable media. Verification gates before anything returns to production: entry vector closed, persistence removed, credentials rotated, backups proven clean and proven to have been offline/immutable at time of compromise, and AD trust re-established from a known-good baseline. Rebuild-greenfield vs restore is a council/board call, not a unilateral commander decision.',
  escalations: [
    'Pay vs no-pay, with mandatory sanctions-screening of actor/wallet before any contact (a payment to a sanctioned entity is itself a violation).',
    'Rebuild-greenfield vs restore the domain (a flat compromised domain often argues for a hardened rebuild).',
    'Notification breadth under GDPR Art. 34: whether and how widely to tell individuals, and by what channel with email down.'
  ],
  lessons: [
    'Flat single AD domain is the core weakness; no segmentation to slow lateral movement.',
    'No central SIEM or 24/7 monitoring meant the intrusion ran unseen.',
    'No pre-agreed out-of-band comms and no pre-staged forensic tooling/evidence store slowed hour one.',
    'Backup immutability and segmentation of the backup and hypervisor planes are decisive.',
    'Holiday coverage and escalation need a standing on-call plan.'
  ],
  nextStep: 'Stand up out-of-band command now (physical war room + a freshly created, phone-invited secure channel) and issue the estate-wide hold order, then execute the four quiet cuts (egress, backup plane, hypervisor management, Tier-0 freeze) in the first 30 minutes. Everything else depends on a trustworthy way to coordinate and a preserved scene.',
  seats: [
    {name:'Incident Commander', role:'Declares severity and roles, runs triage to contain to recover, keeps the decision log', conf:'medium', prob:65, stance:'Network-isolate C2 / backup / hypervisor / privileged auth now, power stays on, hold all restores until eradication and clean-backup verification are proven.', sum:'Treats the signals as one active intrusion; contains fast and quietly without powering hosts off; carves out life-safety/OT; escalates pay/no-pay and rebuild-vs-restore rather than settling them.'},
    {name:'Forensics Lead', role:'Preserves evidence and chain of custody, reconstructs the timeline, reads whether exfiltration can be excluded', conf:'low', prob:35, stance:'Preserve DC/identity and volatile evidence first; treat as one incident until disproven; default to exfiltration-not-excluded. Scope and patient zero not yet established.', sum:'Low confidence is honest: with no IOC correlation done and a large flat AD with many possible entry points, both the single-incident linkage and phishing-as-patient-zero are still unproven. Biggest near-term risk is well-meaning staff destroying evidence.'},
    {name:'Legal & Comms (DPO facet)', role:'Pins awareness, tracks notification clocks, keeps the breach register, gates external comms and victim-data sharing', conf:'medium', prob:70, stance:'File a phased GDPR Art. 33 notification within 72h of awareness regardless of scope; SURFcert now; Cbw not yet live; gate comms and victim-data sharing; route ransom and Art. 34 breadth to the controller.', sum:'Verified the live legal picture: GDPR is the only hard statutory clock today; the Dutch NIS2 transposition is not in force until 15 Aug 2026. Insurer must likely be called before any external firm.'}
  ],
  seatNote: 'The three seats do not conflict; they layer. The one tension worth naming is speed: the commander wants to cut fast, forensics wants to capture first. The sequencing rule (isolate at the network layer immediately, capture memory before power-off or re-image, log any accepted evidence loss) resolves it without either side losing.',
  unverified: [
    'The cyber-insurance policy’s exact notice and pre-authorization terms (read the policy today).',
    'This university’s current Wbni / AED designation status (check the designation file).',
    'The exact wall-clock awareness timestamp (forensics to backfill from tickets/logs).'
  ],
  verified: [
    'GDPR Art. 33 = 72h from awareness; phased notification permitted; register all breaches (Art. 33(5)). Source: gdpr-info.eu, EDPB Guidelines 9/2022 v2.0.',
    'AP guidance: file within 72h for ransomware/phishing even if incomplete; holiday/understaffing is not an accepted excuse. Source: autoriteitpersoonsgegevens.nl.',
    'Cyberbeveiligingswet (Dutch NIS2) enters into force 15 Aug 2026, no transition period; not in force on 2026-07-21. Source: ncsc.nl, Eerste Kamer 36.764.',
    'SURFcert is the education/research sector CSIRT and accepts voluntary reports now. Source: sec.surf.nl.'
  ]
};

// ---- risk scoring (ported) --------------------------------------------------
function scoreOne(o){
  const imp=String(o.impact).toLowerCase(), lik=String(o.likelihood).toLowerCase();
  const impN={negligible:1,minor:2,moderate:3,major:4,severe:5}[imp];
  const likN={rare:1,unlikely:2,possible:3,likely:4,'almost certain':5}[lik];
  const n=impN*likN;
  let band;
  if(n<=4)band=['Low','low'];else if(n<=9)band=['Moderate','moderate'];else if(n<=15)band=['High','high'];else band=['Critical','critical'];
  const impLab={negligible:'Negligible',minor:'Minor',moderate:'Moderate',major:'Major',severe:'Severe'}[imp];
  const likLab={rare:'Rare',unlikely:'Unlikely',possible:'Possible',likely:'Likely','almost certain':'Almost certain'}[lik];
  return {n,band,pos:Math.round(n/25*100),impLab,likLab,rat:o.rationale};
}
function riskBlock(){
  const inh=scoreOne(D.risk.inherent), res=scoreOne(D.risk.residual);
  return '<section class="block"><h2>Risk rating</h2>'
    +'<p class="lead">A qualitative read: impact against likelihood, mapped to an exposure score. Inherent is exposure before the recommended response; residual is what remains after it. The gap is the value of disciplined response.</p>'
    +'<div class="expo"><div class="expohead">Risk exposure &middot; inherent <b>'+inh.n+'/25</b> <span class="expoband band-'+inh.band[1]+'">'+inh.band[0]+'</span> &rarr; residual <b>'+res.n+'/25</b> <span class="expoband band-'+res.band[1]+'">'+res.band[0]+'</span></div>'
    +'<div class="expobar"><span class="expomark inh" style="left:'+inh.pos+'%"></span><span class="expomark" style="left:'+res.pos+'%"></span></div>'
    +'<div class="expolabels"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>'
    +'<p class="riskmeta2">Inherent: impact '+inh.impLab+' &middot; likelihood '+inh.likLab+' &nbsp;&middot;&nbsp; Residual: impact '+res.impLab+' &middot; likelihood '+res.likLab+'</p></div>'
    +'<p class="riskwhy"><strong>Inherent.</strong> '+e(inh.rat)+'</p>'
    +'<p class="riskwhy"><strong>Residual.</strong> '+e(res.rat)+'</p>'
    +'<p class="riskwhy" style="font-size:12.5px;color:var(--faint)">Residual stays high on purpose: probable prior exfiltration, possible backup compromise, and persistence surviving recovery keep a real tail even after a textbook response.</p>'
    +'</section>';
}

// ---- render sections --------------------------------------------------------
function badgeRow(items,cls){return '<div class="badges">'+items.map(b=>'<span class="badge '+cls+'">'+e(b)+'</span>').join('')+'</div>';}
function ulOf(items){return '<ul>'+items.map(i=>'<li>'+e(i)+'</li>').join('')+'</ul>';}

const tagClass={obs:'obs',act:'act',dec:'dec'};
const tagLabel={obs:'Observation',act:'Action',dec:'Decision'};

const timelineRows=D.timeline.map(r=>'<tr><td class="mono">'+e(r[0])+'</td><td>'+e(r[1])+(r[3]?' <span class="assumed" title="Rests on an assumption, verify before relying">ASSUMED, '+e(r[3])+'</span>':'')+'</td><td><span class="tag '+tagClass[r[2]]+'">'+tagLabel[r[2]]+'</span></td></tr>').join('');

const assumeRows=(D.assumptions||[]).map(a=>'<tr><td><strong>'+e(a.claim)+'</strong></td><td>'+e(a.basis)+'</td><td>'+e(a.confirm)+'</td><td class="mono">'+e(a.owner)+'</td><td><span class="st wait">'+e(a.status)+'</span></td></tr>').join('');

const rolesRows=D.triage.roles.map(r=>'<tr><td><strong>'+e(r[0])+'</strong></td><td>'+e(r[1])+'</td></tr>').join('');

const dialFirst=D.dial.cutFirst.map(s=>'<div class="dstep"><h4>'+e(s[0])+'</h4><p>'+e(s[1])+'</p></div>').join('');
const pctRows=D.dial.pct.map(p=>'<div class="pctrow"><span class="pctlab">'+e(p[0])+'</span><span class="pctbar"><span class="pctfill" style="width:'+p[1]+'%"></span></span><span class="pctnum">'+p[1]+'%</span></div>').join('');

const evTiers=D.evidence.tiers.map(t=>'<div class="dstep"><h4>'+e(t[0])+'</h4><p>'+e(t[1])+'</p></div>').join('');

const trigRows=D.obligations.triggered.map(t=>'<tr><td><strong>'+e(t.label)+'</strong></td><td>'+e(t.action)+'</td><td>'+e(t.det)+' &rarr; '+e(t.exe)+'</td><td class="mono">'+e(t.clock)+'</td><td>'+e(t.recipient)+'</td><td class="mono">'+e(t.ref)+'</td><td><span class="st trig">Required</span></td></tr>').join('');
const ruledRows=D.obligations.ruledOut.map(r=>'<li><b>'+e(r.label)+'</b>: '+e(r.reason)+'</li>').join('');

const decRows=D.decisions.map(d=>'<tr><td class="mono">'+e(d[0])+'</td><td>'+e(d[1])+'</td><td>'+e(d[2])+'</td></tr>').join('');

function confClass(c){c=String(c).toLowerCase();return c==='high'?'high':c==='medium'?'med':'low';}
const seatCards=D.seats.map(s=>'<article class="advisor"><header><div><h3>'+e(s.name)+'</h3><p class="role">'+e(s.role)+'</p></div>'
  +'<span class="pill '+confClass(s.conf)+'">'+e(s.conf)+' &middot; '+s.prob+'%</span></header>'
  +'<p class="stance">Stance: '+e(s.stance)+'</p><p class="sum">'+e(s.sum)+'</p></article>').join('');

// ---- assemble ---------------------------------------------------------------
let out='<!doctype html><html lang="en"><head><meta charset="utf-8">'
+'<meta name="viewport" content="width=device-width, initial-scale=1">'
+'<title>Incident Response Report: '+e(D.title)+'</title>'
+'<style>'+CSS+'</style></head><body><div class="brandrule"></div><div class="wrap">'
+'<header class="head">'+logoLight+'<div class="kicker">Incident Response Report</div></header>'
+'<h1>'+e(D.title)+'</h1>'
+'<p class="subtitle">'+e(D.subtitle)+'</p>'
+'<p class="intro">This dossier gives the current status and the immediate priorities first, then the full response record underneath: timeline, containment, evidence, legal clocks, the decision log, and the seat positions that produced it.</p>'
+'<div class="meta"><span><b>Reference</b>&nbsp;&nbsp;'+e(D.ref)+'</span><span><b>Status</b>&nbsp;&nbsp;'+e(D.status)+'</span><span><b>As of</b>&nbsp;&nbsp;'+e(D.date)+'</span></div>'
// severity banner
+'<div class="sev"><h2>Severity</h2><div class="lvl">'+e(D.severity.level)+'</div><p>'+e(D.severity.text)+'</p>'+badgeRow(D.severity.badges,'red')+'</div>'
// exec summary
+'<section class="exec"><h2>Executive summary</h2>'+D.exec.map(p=>'<p>'+e(p)+'</p>').join('')
+'<h3 style="margin-top:14px;font-size:13px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em;font-family:var(--mono)">Immediate priorities</h3><ol class="prio">'+D.priorities.map(p=>'<li>'+e(p)+'</li>').join('')+'</ol></section>'
// risk
+riskBlock()
// obligations
+'<section class="block"><h2>Legal and notification obligations</h2>'
+'<p class="lead">Each obligation is evaluated against this incident. It appears as a required action with a named owner and a clock, or as explicitly considered and ruled out, so a missing obligation is a decision on the record, not a silent omission.</p>'
+'<table class="t"><thead><tr><th>Obligation</th><th>Required action</th><th>Owner (determine &rarr; execute)</th><th>Clock</th><th>Recipient</th><th>Ref</th><th>Status</th></tr></thead><tbody>'+trigRows+'</tbody></table>'
+'<div class="ledger"><h3>Considered and ruled out (for now)</h3><ul>'+ruledRows+'</ul></div>'
+'<div class="callout"><strong>Awareness timestamp.</strong> '+e(D.legalExtra.awareness)+'</div>'
+'<div class="callout warn"><strong>The 72-hour reality.</strong> '+e(D.legalExtra.seventyTwo)+'</div>'
+'<div class="callout warn"><strong>Insurer first.</strong> '+e(D.legalExtra.insurer)+'</div>'
+'<div class="callout"><strong>External comms discipline.</strong> '+e(D.legalExtra.doNotClaim)+'</div>'
+'</section>'
// divider
+'<div class="divider"><h2>The response record</h2><p>The operational detail: timeline, triage, containment, evidence, decisions, and recovery gates.</p></div>'
// timeline
+'<section class="block"><h2>Incident timeline</h2><p class="lead">Observations and actions with relative stamps. Wall-clock times to be backfilled by forensics from tickets and logs.</p>'
+'<table class="t"><thead><tr><th class="mono">Time</th><th>Event / action</th><th>Type</th></tr></thead><tbody>'+timelineRows+'</tbody></table></section>'
// triage
+'<section class="block"><h2>Triage, roles, and hypothesis</h2>'
+'<table class="t"><thead><tr><th>Role</th><th>Mandate</th></tr></thead><tbody>'+rolesRows+'</tbody></table>'
+'<div class="callout"><strong>Working hypothesis.</strong> '+e(D.triage.hypothesis)+'</div></section>'
// containment
+'<section class="block"><h2>Containment: isolation as a dial</h2><p class="lead">Contain by network isolation, not power-off. Cut the highest-leverage paths first and quietly, then widen; carve out anything that protects human safety.</p>'
+'<h3>Cut first, quietly (minutes)</h3><div class="dial">'+dialFirst+'</div>'
+'<h3>Widen next (evidence-led)</h3><p>'+e(D.dial.widen)+'</p>'
+'<div class="dstep carve" style="margin-top:12px"><h4>Carve out, never cold-cut</h4><p>'+e(D.dial.carve)+'</p></div>'
+'<div class="pctwrap"><h3>Percent isolated (tracked honestly)</h3>'+pctRows+'<p class="lead" style="margin-top:10px">'+e(D.dial.pctNote)+'</p></div></section>'
// evidence
+'<section class="block"><h2>Evidence register and chain of custody</h2>'
+'<div class="callout"><strong>Sequencing rule.</strong> '+e(D.evidence.rule)+'</div>'
+'<h3>Capture order (volatility first)</h3><div class="dial">'+evTiers+'</div>'
+'<h3>Custody with email down</h3><p>'+e(D.evidence.custody)+'</p>'
+'<h3>Scope read (honest)</h3><p>'+e(D.evidence.scope)+'</p>'
+'<h3>Exfiltration read</h3><p>'+e(D.evidence.exfil)+'</p>'
+'<div class="callout warn"><strong>Top evidence risk right now.</strong> '+e(D.evidence.topRisk)+'</div></section>'
// assumptions register
+(assumeRows?'<section class="block assumereg"><h2>Assumptions to verify</h2>'
  +'<p class="lead">Facts the response acted on that were assumed, not observed in the incident inputs. Each is a lead to confirm or kill, not an established fact; entries marked ASSUMED in the timeline above trace here. This keeps a decisive commander’s fast gap-fills visible and owned instead of hardening silently into the record.</p>'
  +'<table class="t"><thead><tr><th>Assumed fact</th><th>Basis</th><th>What confirms or kills it</th><th>Verify-owner</th><th>Status</th></tr></thead><tbody>'+assumeRows+'</tbody></table></section>':'')
// decision log
+'<section class="block"><h2>Decision log (seed)</h2><p class="lead">Each significant call, the reason, and who owned it.</p>'
+'<table class="t"><thead><tr><th class="mono">Time</th><th>Decision and rationale</th><th>Owner</th></tr></thead><tbody>'+decRows+'</tbody></table></section>'
// eradication
+'<section class="block"><h2>Eradication and recovery plan (gated)</h2><p>'+e(D.eradication)+'</p></section>'
// escalations
+'<section class="block"><h2>Escalate to the council / board</h2><p class="lead">Bet-the-organization calls the response team does not settle alone.</p>'+ulOf(D.escalations)+'</section>'
// seats
+'<h2 class="block" style="margin-bottom:0">The incident team</h2><p class="lead" style="margin-top:4px">Three isolated seats produced this response. They layer rather than conflict; the calibrated positions are shown as they stand.</p><div class="advisors">'+seatCards+'</div>'
+'<div class="callout" style="margin-top:16px">'+e(D.seatNote)+'</div>'
// verified / unverified
+'<section class="block"><h2>What this rests on</h2>'
+'<div class="ledger"><h3>Verified (load-bearing)</h3><ul>'+D.verified.map(v=>'<li>'+e(v)+'</li>').join('')+'</ul></div>'
+'<div class="unverified"><h3>Not independently verified, check before relying</h3><ul style="margin:0;padding-left:1.1em">'+D.unverified.map(u=>'<li>'+e(u)+'</li>').join('')+'</ul></div></section>'
// next step
+'<section class="exec"><h2>Single most useful next step</h2><p>'+e(D.nextStep)+'</p></section>'
+'</div><footer>'+logoDark
+'<div class="tagline">'+htmlEscape(TAGLINE)+'</div>'
+'<div class="fineprint">Generated by the Information Security Incident Team &middot; exercise run &middot; guidance only, not a substitute for professional advice</div>'
+'</footer></body></html>';

out=out.replace(/[\x00]/g,'');
const d=new Date();
const p2=n=>String(n).padStart(2,'0');
const stamp=''+d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())+'-'+p2(d.getUTCHours())+p2(d.getUTCMinutes())+p2(d.getUTCSeconds());
const outPath=path.join(OUT_DIR,'incident-report-'+stamp+'.html');
fs.writeFileSync(outPath,out,'utf8');
console.log('report written: '+outPath);
