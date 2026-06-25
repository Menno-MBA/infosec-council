#!/usr/bin/env python3
"""
Luméro-branded HTML report generator for the Information Security Council (ChatGPT edition).

ChatGPT Code Interpreter runs Python, not bash, so this is the Python port of the repo's
report.sh. It turns one council run (a dict / JSON) into a self-contained, branded HTML
dossier you can offer the user as a download.

Usage inside Code Interpreter:
    import json, report
    path = report.make_report(run_dict)          # run_dict = the synthesized run
    # then offer `path` to the user as a download

Or from a JSON file:
    python report.py run.json

Logos (lumero-logo-black.webp = light header, lumero-logo-white.webp = dark footer) are
read from this file's folder and base64-embedded, so the report is fully self-contained.
"""
import base64, html as _html, json, os, re, sys, datetime

ASSETS = os.path.dirname(os.path.abspath(__file__))
TAGLINE = os.environ.get("LUMERO_TAGLINE", "We do the academic research, you get the infosec tools.")

def e(v):
    s = "" if v is None else str(v)
    s = re.sub(r"\s*—\s*", ", ", s)          # strip em-dashes -> comma
    return _html.escape(s)

def conf_class(v):
    return {"high":"high","medium":"med","low":"low"}.get((v or "").strip().lower(), "na")

def vclass(v):
    s = (v or "").lower()
    if re.search(r"recommend|best", s): return "vg"
    if re.search(r"reckless|avoid|do not", s): return "vr"
    return "va"

ROLE_LABEL = {"ciso":"CISO","security-architect":"Security Architect","offensive-security":"Offensive Security (Red Team)","security-operations":"Security Operations","compliance-analyst":"Compliance Analyst","dpo":"DPO / Privacy","risk-manager":"Risk Manager"}
ROLE_DESC  = {"ciso":"Security posture, budget, and business enablement","security-architect":"Secure design and technical controls (can we build it safely)","offensive-security":"How a real attacker would try to break it","security-operations":"Detection, monitoring, and incident response (can we spot and survive it)","compliance-analyst":"Standards, regulations, and the evidence to prove compliance","dpo":"Lawful, fair handling of personal data and privacy","risk-manager":"Sizing the risk, risk appetite, and third-party exposure"}

def _logo(name, cls):
    p = os.path.join(ASSETS, name)
    if os.path.exists(p):
        b = base64.b64encode(open(p, "rb").read()).decode()
        return f'<img class="brandimg {cls}" src="data:image/webp;base64,{b}" alt="Lumero">'
    return f'<span class="wordmark {cls}">Lum&eacute;ro</span>'

IMP_LABEL = {"limited":"Limited","serious":"Serious","severe":"Severe"}
LIK_LABEL = {"rare":"Rare","possible":"Possible","likely":"Likely"}
IMP_N = {"limited":2,"serious":3,"severe":5}
LIK_N = {"rare":2,"possible":3,"likely":5}

def _band(score):
    if score <= 6:  return ("Low","low")
    if score <= 12: return ("Moderate","moderate")
    if score <= 18: return ("High","high")
    return ("Critical","critical")

def risk_block(rs):
    if not isinstance(rs, dict):
        return ""
    imp = (rs.get("impact") or "").strip().lower()
    lik = (rs.get("likelihood") or "").strip().lower()
    if imp not in IMP_N or lik not in LIK_N:
        return ""
    score = IMP_N[imp] * LIK_N[lik]
    band, cls = _band(score)
    pos = round(score / 25 * 100)
    why = f'<p class="riskwhy">{e(rs.get("rationale"))}</p>' if rs.get("rationale") else ""
    legend = ('<details class="risklegend"><summary>What the scale means</summary>'
              '<p><strong>Impact:</strong> Limited (minor service impact, low cost); Serious (moderate to serious damage, high cost, possible legal consequences); Severe (severe legal consequences, lasting damage or outage).</p>'
              '<p><strong>Likelihood:</strong> Rare (conceivable but unlikely); Possible (unlikely but plausible in edge cases); Likely (almost certain to materialize).</p>'
              '<p><strong>Exposure</strong> = impact x likelihood, scored out of 25.</p></details>')
    return ('<section class="block"><h2>Risk rating</h2>'
            '<p class="lead">A qualitative read of this decision: impact against likelihood, mapped to an exposure score. It rates the decision or change, not only a vulnerability.</p>'
            f'<div class="expo"><div class="expohead">Risk exposure &middot; <b>{score}/25</b> &middot; <span class="expoband band-{cls}">{band}</span></div>'
            f'<div class="expobar"><span class="expomark" style="left:{pos}%"></span></div>'
            '<div class="expolabels"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>'
            f'<p class="riskmeta2">Impact: {IMP_LABEL[imp]} &middot; Likelihood: {LIK_LABEL[lik]}</p></div>'
            f'{why}{legend}</section>')

CSS = """
:root{--bg:#ffffff;--surface:#f8fafc;--border:#e5e7eb;--ink:#0f172a;--body:#334155;--muted:#475569;--faint:#64748b;--ga:#2080a2;--gb:#49cd64;--footer:#0e2a36;--green:#15803d;--amber:#b45309;--slate:#64748b;--grad:linear-gradient(90deg,#2080a2,#49cd64);--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--body);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;}
.brandrule{height:4px;background:var(--grad);}.wrap{max-width:860px;margin:0 auto;padding:44px 28px 0;}
.head{display:flex;align-items:center;gap:14px;margin-bottom:8px;}.brandimg.light{height:34px;width:auto;display:block;}
.wordmark{font-weight:800;font-size:22px;color:var(--ink);}.wordmark.dark{color:#fff;}
.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ga);font-weight:600;border-left:2px solid var(--border);padding-left:14px;}
h1{font-weight:800;font-size:clamp(27px,4.4vw,40px);line-height:1.13;letter-spacing:-.02em;color:var(--ink);margin:.3em 0 .15em;}
.intro{font-size:15px;color:var(--muted);margin:.2em 0 0;}
.meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}.meta b{color:var(--muted);font-weight:600;}
.lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}
.verdict{margin:32px 0 22px;border-radius:16px;padding:26px 28px;background:linear-gradient(#fff,#fff) padding-box,var(--grad) border-box;border:1.5px solid transparent;box-shadow:0 10px 30px -12px rgba(2,6,23,.18);}
.verdict h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
.verdict .lead{margin-bottom:14px;}.verdict p{margin:.4em 0;}.rec{font-size:19px;color:var(--ink);font-weight:600;line-height:1.45;}
.assume{font-size:14px;color:var(--muted);margin-top:10px;}.assume strong{color:var(--ink);}
.note{font-size:12px;color:var(--faint);margin-top:10px;font-style:italic;}
.pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}
.pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}
.exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}.exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.4em 0;color:var(--body);font-size:15.5px;}
.divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}.divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}.divider p{margin:0;font-size:13px;color:var(--faint);}
h2.sec{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:40px 0 4px;font-weight:700;}
.block{margin:22px 0;}.block h2{font-size:17px;margin:0 0 2px;color:var(--ink);font-weight:700;}.block p{margin:.3em 0;}.block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}
.minority{border-left:3px solid var(--amber);padding-left:16px;color:var(--body);font-style:italic;}
table.opts{border-collapse:collapse;width:100%;margin:8px 0 0;font-size:13px;}table.opts th,table.opts td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;}table.opts th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}
.vc{font-weight:700;white-space:nowrap;}.vc.vg{color:var(--green);}.vc.vr{color:#b91c1c;}.vc.va{color:var(--amber);}
.appetite{margin:18px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:14px 16px;}.appetite h3{margin:0 0 4px;font-size:14px;color:var(--ink);font-weight:700;}.appetite p{margin:0;font-size:14px;color:var(--body);}
.leverage{margin:14px 0 0;font-size:15px;color:var(--ink);}.leverage strong{color:var(--ga);}
.advisors{display:grid;gap:14px;margin-top:14px;}.advisor{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;box-shadow:0 4px 12px rgba(2,6,23,.05);}
.advisor header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}.advisor h3{font-size:17px;margin:0;color:var(--ink);font-weight:700;}
.role{font-size:12.5px;color:var(--muted);margin:2px 0 8px;}.stance{font-family:var(--mono);font-size:12px;color:var(--ga);margin:8px 0;}.advisor p.sum{margin:.2em 0;color:var(--body);}
.advisor dl{margin:12px 0 0;font-size:13px;color:var(--muted);}.advisor dt{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-top:10px;color:var(--faint);}.advisor dd{margin:3px 0 0;}
footer{margin-top:60px;background:var(--footer);padding:42px 20px 48px;text-align:center;border-top:4px solid transparent;border-image:var(--grad) 1;}.brandimg.dark{height:40px;width:auto;display:inline-block;}
.tagline{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:#cbd5e1;margin-top:16px;}.fineprint{font-size:10px;color:#64748b;margin-top:14px;font-family:var(--mono);}
@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}}
.expo{margin:14px 0 0;}
.expohead{font-family:var(--mono);font-size:13px;color:var(--muted);margin-bottom:12px;}.expohead b{color:var(--ink);}
.expoband{font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
.band-low{color:#15803d;}.band-moderate{color:#b45309;}.band-high{color:#c2410c;}.band-critical{color:#b91c1c;}
.expobar{position:relative;height:12px;border-radius:9999px;background:linear-gradient(90deg,#15803d 0%,#a3b817 38%,#e0a800 62%,#d23b2e 100%);}
.expomark{position:absolute;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--ink);transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(255,255,255,.65),0 2px 8px rgba(0,0,0,.35);}
.expolabels{display:flex;justify-content:space-between;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}
.riskmeta2{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:12px;}
.riskwhy{margin:12px 0 0;color:var(--body);font-size:14px;}
.risklegend{margin:12px 0 0;font-size:12.5px;color:var(--muted);}.risklegend summary{cursor:pointer;color:var(--ga);font-weight:600;}.risklegend p{margin:6px 0;}
"""

def _list_block(items, title, lead):
    if not isinstance(items, list) or not items:
        return ""
    lis = "".join(f"<li>{e(x)}</li>" for x in items)
    return f'<section class="block"><h2>{title}</h2><p class="lead">{lead}</p><ul>{lis}</ul></section>'

def make_report(run, out_dir="."):
    g = run.get
    sha = e(g("sha") or "draft")
    ts = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    out = os.path.join(out_dir, f"council-report-{ts}-{sha}.html")

    parts = []
    parts.append('<!doctype html><html lang="en"><head><meta charset="utf-8">')
    parts.append('<meta name="viewport" content="width=device-width, initial-scale=1">')
    parts.append(f"<title>Council Dossier: {e(g('question'))}</title>")
    parts.append(f"<style>{CSS}</style></head><body><div class=\"brandrule\"></div><div class=\"wrap\">")
    parts.append(f'<header class="head">{_logo("lumero-logo-black.webp","light")}<div class="kicker">Security Decision Dossier</div></header>')
    parts.append(f"<h1>{e(g('question'))}</h1>")
    parts.append('<p class="intro">A panel of security advisors reviewed this decision. This dossier gives you the recommendation and a short executive summary first, then the full analysis underneath: the risks, where the advisors agreed and disagreed, and each advisor in their own words.</p>')
    parts.append(f'<div class="meta"><span><b>Depth</b>&nbsp;&nbsp;{e((g("mode") or "").upper())}</span><span><b>Reference</b>&nbsp;&nbsp;{sha}</span>' + (f'<span>{e(g("ts"))}</span>' if g("ts") else "") + "</div>")

    # verdict
    parts.append('<div class="verdict"><h2>What we recommend</h2><p class="lead">The bottom-line advice, and how strongly the panel backs it.</p>')
    parts.append(f'<p class="rec">{e(g("recommendation"))}</p>')
    parts.append(f'<p><span class="pill {conf_class(g("confidence"))}">Confidence: {e(g("confidence"))}</span></p>')
    parts.append('<p class="note">Confidence shows how strongly the panel stands behind this advice given what is still unknown (High, Medium or Low).</p>')
    if g("key_assumption"): parts.append(f'<p class="assume"><strong>This advice depends on:</strong> {e(g("key_assumption"))}</p>')
    if g("next_step"): parts.append(f'<p class="assume"><strong>Do this next:</strong> {e(g("next_step"))}</p>')
    parts.append("</div>")
    parts.append(risk_block(g("risk_score")))

    if g("executive_summary"):
        parts.append(f'<section class="exec"><h2>Executive summary</h2><p>{e(g("executive_summary"))}</p></section>')

    # decision-science pass
    opts = g("options")
    if isinstance(opts, list) and opts:
        rows = ""
        for o in opts:
            og = o.get
            rows += (f'<tr><td><strong>{e(og("option") or og("name"))}</strong></td><td>{e(og("effort"))}</td>'
                     f'<td>{e(og("risk_reduction"))}</td><td>{e(og("cost") or og("ongoing_cost"))}</td>'
                     f'<td>{e(og("reversibility"))}</td><td class="vc {vclass(og("verdict"))}">{e(og("verdict"))}</td></tr>')
        sec = ('<section class="block"><h2>Decision-science pass</h2><p class="lead">The realistic options side by side: effort, risk reduction, ongoing cost, reversibility, and the verdict.</p>'
               '<table class="opts"><thead><tr><th>Option</th><th>Effort</th><th>Risk reduction</th><th>Ongoing cost</th><th>Reversibility</th><th>Verdict</th></tr></thead><tbody>'
               + rows + "</tbody></table>")
        if g("risk_appetite"):
            sec += f'<div class="appetite"><h3>Risk-appetite check (owner decision)</h3><p>{e(g("risk_appetite"))}</p></div>'
        if g("highest_leverage"):
            sec += f'<p class="leverage"><strong>Highest-leverage move:</strong> {e(g("highest_leverage"))}</p>'
        sec += "</section>"
        parts.append(sec)

    parts.append('<div class="divider"><h2>The detailed analysis</h2><p>For readers who want the full picture: the risks, the agreements and trade-offs, and each advisor in their own words.</p></div>')
    parts.append(_list_block(g("risks"), "Key risks", "The main risks to weigh before you decide."))
    if g("consensus"):
        parts.append(f'<section class="block"><h2>Where the advisors agree</h2><p class="lead">Points the whole panel lined up on, so you can treat these as settled.</p><p>{e(g("consensus"))}</p></section>')
    parts.append(_list_block(g("conflicts"), "Where the advisors disagree", "Open trade-offs with no single right answer. These are the calls you, as decision-maker, need to make."))
    parts.append(_list_block(g("blind_spots"), "Risks that are easy to miss", "Subtle points the panel flagged that are simple to overlook."))
    if g("minority_report"):
        parts.append(f'<section class="block"><h2>The strongest objection</h2><p class="lead">A dissenting view worth keeping in mind, even though most of the panel leaned the other way.</p><p class="minority">{e(g("minority_report"))}</p></section>')

    members = g("members")
    if isinstance(members, list) and members:
        parts.append('<h2 class="sec">The expert panel</h2><p class="lead">The recommendation above is the synthesis of these independent expert views. Each advisor looked at the decision only through their own lens; where they pull in different directions is exactly the value.</p><div class="advisors">')
        for m in members:
            mg = m.get
            key = (mg("name") or "").strip().lower()
            label = ROLE_LABEL.get(key, mg("name") or "")
            desc = ROLE_DESC.get(key, "")
            card = f'<article class="advisor"><header><div><h3>{e(label)}</h3>'
            if desc: card += f'<p class="role">{e(desc)}</p>'
            card += f'</div><span class="pill {conf_class(mg("confidence"))}">{e(mg("confidence") or "n/a")}</span></header>'
            if mg("stance"): card += f'<p class="stance">{e(mg("stance"))}</p>'
            if mg("summary"): card += f'<p class="sum">{e(mg("summary"))}</p>'
            card += "<dl>"
            if mg("assumptions"): card += f'<dt>What they assume</dt><dd>{e(mg("assumptions"))}</dd>'
            if mg("change_my_mind"): card += f'<dt>What would change their view</dt><dd>{e(mg("change_my_mind"))}</dd>'
            card += "</dl></article>"
            parts.append(card)
        parts.append("</div>")

    parts.append(f'</div><footer>{_logo("lumero-logo-white.webp","dark")}<div class="tagline">{e(TAGLINE)}</div>'
                 '<div class="fineprint">Generated by the Information Security Council &middot; guidance only, not a substitute for professional advice</div></footer></body></html>')

    html_out = "".join(parts).replace("\x00", "")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(html_out)
    return out

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else None
    data = json.load(open(src, encoding="utf-8")) if src else json.load(sys.stdin)
    print(make_report(data, out_dir="."))
