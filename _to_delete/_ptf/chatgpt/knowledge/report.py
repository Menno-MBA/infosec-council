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
    # test negatives FIRST: "not recommended" / "do not recommend" contain "recommend"
    if re.search(r"reckless|avoid|do not|don't|not recommend|no-go", s): return "vr"
    if re.search(r"recommend|best|go\b", s): return "vg"
    return "va"

def converged_label(v):
    return {
        "after-challenge": "the panel converged after being challenged",
        "split": "the panel stayed split, so the trade-offs below are real choices for you",
        "forced-debate": "consensus was stress-tested in a forced debate before it was trusted",
    }.get((v or "").strip().lower(), "")

ROLE_LABEL = {"ciso":"CISO","security-architect":"Security Architect","offensive-security":"Offensive Security (Red Team)","security-operations":"Security Operations","compliance-analyst":"Compliance Analyst","dpo":"DPO / Privacy","risk-manager":"Risk Manager"}
ROLE_DESC  = {"ciso":"Security posture, budget, and business enablement","security-architect":"Secure design and technical controls (can we build it safely)","offensive-security":"How a real attacker would try to break it","security-operations":"Detection, monitoring, and incident response (can we spot and survive it)","compliance-analyst":"Standards, regulations, and the evidence to prove compliance","dpo":"Lawful, fair handling of personal data and privacy","risk-manager":"Sizing the risk, risk appetite, and third-party exposure"}

def _logo(name, cls):
    p = os.path.join(ASSETS, name)
    if os.path.exists(p):
        b = base64.b64encode(open(p, "rb").read()).decode()
        return f'<img class="brandimg {cls}" src="data:image/webp;base64,{b}" alt="Lumero">'
    return f'<span class="wordmark {cls}">Lum&eacute;ro</span>'

IMP_LABEL = {"negligible":"Negligible","minor":"Minor","limited":"Limited","moderate":"Moderate","serious":"Serious","major":"Major","severe":"Severe"}
LIK_LABEL = {"rare":"Rare","unlikely":"Unlikely","possible":"Possible","likely":"Likely","almost certain":"Almost certain","almost-certain":"Almost certain","certain":"Almost certain"}
IMP_N = {"negligible":1,"minor":2,"limited":2,"moderate":3,"serious":3,"major":4,"severe":5}
LIK_N = {"rare":1,"unlikely":2,"possible":3,"likely":4,"almost certain":5,"almost-certain":5,"certain":5}

def _band(score):
    if score <= 4:  return ("Low","low")
    if score <= 9:  return ("Moderate","moderate")
    if score <= 15: return ("High","high")
    return ("Critical","critical")

def _score_one(o):
    if not isinstance(o, dict):
        return None
    imp = (o.get("impact") or "").strip().lower()
    lik = (o.get("likelihood") or "").strip().lower()
    if imp not in IMP_N or lik not in LIK_N:
        return None
    n = IMP_N[imp] * LIK_N[lik]
    band, cls = _band(n)
    return {"n": n, "band": band, "cls": cls, "pos": round(n / 25 * 100),
            "impL": IMP_LABEL[imp], "likL": LIK_LABEL[lik],
            "rat": (o.get("rationale") or "")}

def risk_block(rs):
    if not isinstance(rs, dict):
        return ""
    inh_src = rs.get("inherent") or rs.get("residual") or rs
    res_src = rs.get("residual") or rs.get("inherent") or rs
    inh = _score_one(inh_src)
    res = _score_one(res_src)
    if inh is None and res is None:
        return ""
    if inh is None: inh = res
    if res is None: res = inh
    rat_i = inh["rat"]
    rat_r = res["rat"] if (res["rat"] and res["rat"] != inh["rat"]) else ""
    why = ""
    if rat_i:
        why += f'<p class="riskwhy"><strong>Inherent.</strong> {e(rat_i)}</p>'
    if rat_r:
        why += f'<p class="riskwhy"><strong>Residual.</strong> {e(rat_r)}</p>'
    legend = ('<details class="risklegend"><summary>What the scale means</summary>'
              '<p><strong>Impact:</strong> Negligible (minimal service impact, negligible cost); Minor (limited service impact, low cost); Moderate (moderate to serious damage, high cost, possible legal consequences); Major (major damage, high cost, likely legal or regulatory consequences); Severe (severe legal consequences, lasting damage or being put out of operation).</p>'
              '<p><strong>Likelihood:</strong> Rare (conceivable but unlikely); Unlikely (could occur but is not expected); Possible (unlikely but plausible in edge cases); Likely (more likely than not to occur); Almost certain (occurring now or virtually certain to materialize). An impact that has already been observed is scored Almost certain, not Possible.</p>'
              '<p><strong>Inherent</strong> is exposure before the recommended response; <strong>residual</strong> is what remains after it. <strong>Exposure</strong> = impact x likelihood (each scored 1 to 5), scored out of 25.</p></details>')
    return ('<section class="block"><h2>Risk rating</h2>'
            '<p class="lead">A qualitative read of this decision: impact against likelihood, mapped to an exposure score. It shows inherent exposure (before the recommended response) and residual exposure (after it); the gap is the value of the recommendation.</p>'
            f'<div class="expo"><div class="expohead">Risk exposure &middot; inherent <b>{inh["n"]}/25</b> <span class="expoband band-{inh["cls"]}">{inh["band"]}</span> &rarr; residual <b>{res["n"]}/25</b> <span class="expoband band-{res["cls"]}">{res["band"]}</span></div>'
            f'<div class="expobar"><span class="expomark inh" style="left:{inh["pos"]}%"></span><span class="expomark" style="left:{res["pos"]}%"></span></div>'
            '<div class="expolabels"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>'
            f'<p class="riskmeta2">Inherent: impact {inh["impL"]} &middot; likelihood {inh["likL"]} &nbsp;&middot;&nbsp; Residual: impact {res["impL"]} &middot; likelihood {res["likL"]}</p></div>'
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
.subtitle{font-size:15.5px;color:var(--body);margin:.4em 0 0;line-height:1.5;}
.meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}.meta b{color:var(--muted);font-weight:600;}
.lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}
.verdict{margin:32px 0 22px;border-radius:16px;padding:26px 28px;background:linear-gradient(#fff,#fff) padding-box,var(--grad) border-box;border:1.5px solid transparent;box-shadow:0 10px 30px -12px rgba(2,6,23,.18);}
.verdict h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
.verdict .lead{margin-bottom:14px;}.verdict p{margin:.4em 0;}.rec{font-size:19px;color:var(--ink);font-weight:600;line-height:1.45;}
.assume{font-size:14px;color:var(--muted);margin-top:10px;}.assume strong{color:var(--ink);}
.note{font-size:12px;color:var(--faint);margin-top:10px;font-style:italic;}
.pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}
.pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}
.pill.prob{color:var(--ga);background:rgba(32,128,162,.08);margin-left:6px;}
.exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}.exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.4em 0;color:var(--body);font-size:15.5px;}
.divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}.divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}.divider p{margin:0;font-size:13px;color:var(--faint);}
h2.sec{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:40px 0 4px;font-weight:700;}
.block{margin:22px 0;}.block h2{font-size:17px;margin:0 0 2px;color:var(--ink);font-weight:700;}.block p{margin:.3em 0;}.block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}
.minority{border-left:3px solid var(--amber);padding-left:16px;color:var(--body);font-style:italic;}
table.opts{border-collapse:collapse;width:100%;margin:8px 0 0;font-size:13px;}table.opts th,table.opts td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;overflow-wrap:break-word;}table.opts th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}
.vc{font-weight:700;}.vc.vg{color:var(--green);}.vc.vr{color:#b91c1c;}.vc.va{color:var(--amber);}
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
.expomark.inh{background:#e2e8f0;border-color:#94a3b8;box-shadow:0 0 0 4px rgba(255,255,255,.6),0 1px 4px rgba(0,0,0,.25);}
.expolabels{display:flex;justify-content:space-between;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}
.riskmeta2{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:12px;}
.riskwhy{margin:12px 0 0;color:var(--body);font-size:14px;}
.risklegend{margin:12px 0 0;font-size:12.5px;color:var(--muted);}.risklegend summary{cursor:pointer;color:var(--ga);font-weight:600;}.risklegend p{margin:6px 0;}
.st{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:9999px;white-space:nowrap;}.st.req{color:#b45309;background:rgba(180,83,9,.10);border:1px solid #b45309;}
.ledger{margin:16px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--slate);border-radius:10px;padding:14px 16px;}.ledger h3{margin:0 0 8px;font-size:13px;color:var(--ink);font-weight:700;font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase;}.ledger ul{margin:0;padding-left:1.1em;}.ledger li{margin:.35em 0;font-size:13.5px;color:var(--body);}.ledger li b{color:var(--ink);}
"""

def obligations_block(ob):
    if not isinstance(ob, dict):
        return ""
    tr = ob.get("triggered") or []
    ro = ob.get("ruled_out") or []
    if not (isinstance(tr, list) and tr) and not (isinstance(ro, list) and ro):
        return ""
    html = ('<section class="block"><h2>Regulatory obligations</h2>'
            '<p class="lead">Every registered obligation is evaluated before the panel deliberates. Each appears here as a required action with a named owner and a clock, or as explicitly considered and ruled out; a missing obligation is a decision on the record, not a silent omission.</p>')
    if isinstance(tr, list) and tr:
        rows = ""
        for t in tr:
            tg = t.get
            label = tg("label") or tg("id") or ""
            det = tg("determination") or tg("determination_owner") or ""
            exe = tg("execution") or tg("execution_owner") or ""
            rows += (f'<tr><td><strong>{e(label)}</strong></td><td>{e(tg("action"))}</td>'
                     f'<td>{e(det)} &rarr; {e(exe)}</td><td>{e(tg("clock"))}</td>'
                     f'<td>{e(tg("recipient"))}</td><td>{e(tg("ref"))}</td>'
                     f'<td><span class="st req">Required</span></td></tr>')
        html += ('<table class="opts"><thead><tr><th>Obligation</th><th>Required action</th><th>Owner (determine &rarr; execute)</th><th>Clock</th><th>Recipient</th><th>Ref</th><th>Status</th></tr></thead><tbody>'
                 + rows + "</tbody></table>")
    else:
        html += '<p class="riskwhy">No registered obligation triggered for this decision, which is the correct, auditable default. The obligations considered are listed below.</p>'
    if isinstance(ro, list) and ro:
        lis = ""
        for r in ro:
            rg = r.get
            label = rg("label") or rg("id") or ""
            lis += f'<li><b>{e(label)}</b>: {e(rg("reason"))}</li>'
        html += f'<div class="ledger"><h3>Considered and ruled out this deliberation</h3><ul>{lis}</ul></div>'
    html += "</section>"
    return html

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
    if g('subtitle'):
        parts.append(f'<p class="subtitle">{e(g("subtitle"))}</p>')
    parts.append('<p class="intro">A panel of security advisors reviewed this decision. This dossier gives you the recommendation and a short executive summary first, then the full analysis underneath: the risks, where the advisors agreed and disagreed, and each advisor in their own words.</p>')
    parts.append(f'<div class="meta"><span><b>Depth</b>&nbsp;&nbsp;{e((g("mode") or "").upper())}</span><span><b>Reference</b>&nbsp;&nbsp;{sha}</span>' + (f'<span>{e(g("ts"))}</span>' if g("ts") else "") + "</div>")

    # verdict
    parts.append('<div class="verdict"><h2>What we recommend</h2><p class="lead">The bottom-line advice, and how strongly the panel backs it.</p>')
    parts.append(f'<p class="rec">{e(g("recommendation"))}</p>')
    prob = g("probability")
    prob_pill = f'<span class="pill prob">{prob}% it survives a 12-month review</span>' if isinstance(prob, (int, float)) else ""
    parts.append(f'<p><span class="pill {conf_class(g("confidence"))}">Confidence: {e(g("confidence"))}</span>{prob_pill}</p>')
    parts.append('<p class="note">Confidence shows how strongly the panel stands behind this advice given what is still unknown (High, Medium or Low); the percentage is how likely the panel thinks this call still looks right a year from now.</p>')
    cl = converged_label(g("converged"))
    if cl: parts.append(f'<p class="note">Panel outcome: {cl}.</p>')
    if g("key_assumption"): parts.append(f'<p class="assume"><strong>This advice depends on:</strong> {e(g("key_assumption"))}</p>')
    unv = g("unverified")
    if isinstance(unv, list) and unv:
        parts.append(f'<p class="assume"><strong>Not independently verified (check before relying):</strong> {e("; ".join(unv))}</p>')
    if g("next_step"): parts.append(f'<p class="assume"><strong>Do this next:</strong> {e(g("next_step"))}</p>')
    parts.append("</div>")
    parts.append(risk_block(g("risk_score")))
    parts.append(obligations_block(g("obligations")))

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

    ranking = g("ranking")
    if isinstance(ranking, list) and ranking:
        rrows = ""
        for r in sorted(ranking, key=lambda x: -(x.get("score") or 0)):
            rg = r.get
            sc = f'{rg("score"):.1f}' if isinstance(rg("score"), (int, float)) else e(rg("score") or "")
            rrows += f'<tr><td><strong>{e(rg("position"))}</strong></td><td>{sc} / 5</td><td>{e(rg("note"))}</td></tr>'
        parts.append('<section class="block"><h2>How the panel rated each other</h2><p class="lead">In anonymized cross-examination each advisor scored the others on how well their position would survive scrutiny (1 to 5, higher is sounder). This is a signal, not a vote, and it never overrides a hard legal stop.</p>'
                     '<table class="opts"><thead><tr><th>Position</th><th>Peer score</th><th>Note</th></tr></thead><tbody>'
                     + rrows + '</tbody></table></section>')

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
            mprob = mg("probability")
            mprob_txt = f' &middot; {mprob}%' if isinstance(mprob, (int, float)) else ""
            card += f'</div><span class="pill {conf_class(mg("confidence"))}">{e(mg("confidence") or "n/a")}{mprob_txt}</span></header>'
            if mg("stance"): card += f'<p class="stance">Stance: {e(mg("stance"))}</p>'
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
