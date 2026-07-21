#!/usr/bin/env bash
# infosec-council HTML report generator (Luméro-branded, plain-language, two-layer)
# Renders a council run (rich JSON on stdin, or a sha from the journal) as a
# self-contained HTML dossier styled to match lumero.nl. Dependency: jq.
#
# Branding (optional; sensible defaults are bundled in assets/):
#   LUMERO_LOGO_LIGHT  logo for the light header. URL or local image (base64-embedded).
#                      default: assets/lumero-logo-black.webp
#   LUMERO_LOGO        logo for the dark footer.
#                      default: assets/lumero-logo-white.webp
#   LUMERO_TAGLINE     default below.
set -euo pipefail

COUNCIL_HOME="${COUNCIL_HOME:-$HOME/.infosec-council}"
JOURNAL="$COUNCIL_HOME/journal.jsonl"
REPORT_DIR="${COUNCIL_REPORT_DIR:-.}"
TAGLINE="${LUMERO_TAGLINE:-We do the academic research, you get the infosec tools.}"

die() { echo "council-report: $*" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || die "jq is required (brew install jq / apt-get install jq)."

# ---- resolve input -----------------------------------------------------------
if [ "${1:-}" = "--sha" ] && [ -n "${2:-}" ]; then
  [ -f "$JOURNAL" ] || die "no journal at $JOURNAL"
  run="$(jq -c --arg s "$2" 'select(.sha==$s)' "$JOURNAL" | tail -1)"
  [ -n "$run" ] || die "no run with sha $2"
else
  run="$(cat)"
  echo "$run" | jq empty 2>/dev/null || die "stdin is not valid JSON (or pass --sha <sha>)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS="$SCRIPT_DIR/assets"

# ---- logo helper: emit <img> (base64-embedded) or wordmark fallback ----------
mk_logo() {  # $1 = path-or-url   $2 = css-class (light|dark)
  local src="$1" cls="$2" mime b64
  [ -z "$src" ] && { echo "<span class=\"wordmark $cls\">Lum&eacute;ro</span>"; return; }
  case "$src" in
    http://*|https://*) echo "<img class=\"brandimg $cls\" src=\"$src\" alt=\"Lumero\">"; return;;
  esac
  if [ -r "$src" ]; then
    mime="image/png"
    case "$src" in *.svg) mime="image/svg+xml";; *.jpg|*.jpeg) mime="image/jpeg";; *.webp) mime="image/webp";; esac
    b64="$(base64 -w0 "$src" 2>/dev/null || base64 "$src" | tr -d '\n')"
    echo "<img class=\"brandimg $cls\" src=\"data:$mime;base64,$b64\" alt=\"Lumero\">"
  else
    echo "<span class=\"wordmark $cls\">Lum&eacute;ro</span>"
  fi
}
logo_light="$(mk_logo "${LUMERO_LOGO_LIGHT:-$ASSETS/lumero-logo-black.webp}" light)"
logo_dark="$(mk_logo  "${LUMERO_LOGO:-$ASSETS/lumero-logo-white.webp}" dark)"

# ---- render ------------------------------------------------------------------
sha="$(echo "$run" | jq -r '.sha // "draft"')"
out="$REPORT_DIR/council-report-$(date -u +%Y%m%d-%H%M%S)-$sha.html"
mkdir -p "$REPORT_DIR"

echo "$run" | jq -r --arg logo "$logo_dark" --arg logolight "$logo_light" --arg tagline "$TAGLINE" '
  # text cleaner: strip em-dashes (to a comma) then HTML-escape
  def e: (. // "") | gsub("\\s*—\\s*"; ", ") | @html;
  def conf_class: (. // "" | ascii_downcase) as $c
    | if $c=="high" then "high" elif $c=="medium" then "med" elif $c=="low" then "low" else "na" end;
  def vclass: (. // "" | ascii_downcase) as $v
    | if ($v|test("reckless|avoid|do not|don.t|not recommend|no-go")) then "vr" elif ($v|test("recommend|best|go\\b")) then "vg" else "va" end;
  def converged_label: (. // "" | ascii_downcase) as $c
    | if $c=="after-challenge" then "the panel converged after being challenged"
      elif $c=="split" then "the panel stayed split, so the trade-offs below are real choices for you"
      elif $c=="forced-debate" then "consensus was stress-tested in a forced debate before it was trusted"
      else "" end;
  # friendly names + role descriptions for the known seats
  def role_label: ({"ciso":"CISO","security-architect":"Security Architect","offensive-security":"Offensive Security (Red Team)","security-operations":"Security Operations","compliance-analyst":"Compliance Analyst","dpo":"DPO / Privacy","risk-manager":"Risk Manager"}[(.|ascii_downcase)]) // .;
  def role_desc: ({"ciso":"Security posture, budget, and business enablement","security-architect":"Secure design and technical controls (can we build it safely)","offensive-security":"How a real attacker would try to break it","security-operations":"Detection, monitoring, and incident response (can we spot and survive it)","compliance-analyst":"Standards, regulations, and the evidence to prove compliance","dpo":"Lawful, fair handling of personal data and privacy","risk-manager":"Sizing the risk, risk appetite, and third-party exposure"}[(.|ascii_downcase)]) // "";
  def list_block($items; $title; $lead):
    if ($items|type)=="array" and ($items|length)>0
    then "<section class=\"block\"><h2>" + $title + "</h2><p class=\"lead\">" + $lead + "</p><ul>"
         + ([$items[] | "<li>" + (.|e) + "</li>"] | join(""))
         + "</ul></section>"
    else "" end;

  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
+ "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
+ "<title>Council Dossier: " + (.question|e) + "</title>"
+ "<style>"
+ ":root{--bg:#ffffff;--surface:#f8fafc;--border:#e5e7eb;--ink:#0f172a;--body:#334155;--muted:#475569;--faint:#64748b;--ga:#2080a2;--gb:#49cd64;--footer:#0e2a36;--green:#15803d;--amber:#b45309;--slate:#64748b;--grad:linear-gradient(90deg,#2080a2,#49cd64);--sans:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Liberation Mono\",monospace;}"
+ "*{box-sizing:border-box}"
+ "body{margin:0;background:var(--bg);color:var(--body);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;}"
+ ".brandrule{height:4px;background:var(--grad);}"
+ ".wrap{max-width:860px;margin:0 auto;padding:44px 28px 0;}"
+ ".head{display:flex;align-items:center;gap:14px;margin-bottom:10px;}"
+ ".brandimg.light{height:34px;width:auto;display:block;}"
+ ".wordmark{font-weight:800;font-size:22px;color:var(--ink);}.wordmark.dark{color:#fff;}"
+ ".kicker{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ga);font-weight:600;border-left:2px solid var(--border);padding-left:14px;}"
+ "h1{font-weight:800;font-size:clamp(27px,4.4vw,40px);line-height:1.13;letter-spacing:-.02em;color:var(--ink);margin:.3em 0 .15em;}"
+ ".intro{font-size:15px;color:var(--muted);margin:.2em 0 0;}"
+ ".subtitle{font-size:15.5px;color:var(--body);margin:.4em 0 0;line-height:1.5;}"
+ ".meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}"
+ ".meta b{color:var(--muted);font-weight:600;}"
+ ".lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}"
+ ".verdict{margin:32px 0 22px;border-radius:16px;padding:26px 28px;background:linear-gradient(#fff,#fff) padding-box,var(--grad) border-box;border:1.5px solid transparent;box-shadow:0 10px 30px -12px rgba(2,6,23,.18);}"
+ ".verdict h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}"
+ ".verdict .lead{margin-bottom:14px;}.verdict p{margin:.4em 0;}.rec{font-size:19px;color:var(--ink);font-weight:600;line-height:1.45;}"
+ ".assume{font-size:14px;color:var(--muted);margin-top:10px;}.assume strong{color:var(--ink);}"
+ ".note{font-size:12px;color:var(--faint);margin-top:10px;font-style:italic;}"
+ "table.opts{border-collapse:collapse;width:100%;margin:8px 0 0;font-size:13px;}"
+ "table.opts th,table.opts td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top;}"
+ "table.opts th{background:var(--surface);font-weight:700;color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}"
+ ".vc{font-weight:700;white-space:nowrap;}.vc.vg{color:var(--green);}.vc.vr{color:#b91c1c;}.vc.va{color:var(--amber);}"
+ ".appetite{margin:18px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ga);border-radius:10px;padding:14px 16px;}"
+ ".appetite h3{margin:0 0 4px;font-size:14px;color:var(--ink);font-weight:700;}.appetite p{margin:0;font-size:14px;color:var(--body);}"
+ ".leverage{margin:14px 0 0;font-size:15px;color:var(--ink);}.leverage strong{color:var(--ga);}"
+ ".st{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:9999px;white-space:nowrap;}.st.req{color:#b45309;background:rgba(180,83,9,.10);border:1px solid #b45309;}"
+ ".ledger{margin:16px 0 0;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--slate);border-radius:10px;padding:14px 16px;}.ledger h3{margin:0 0 8px;font-size:13px;color:var(--ink);font-weight:700;font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase;}.ledger ul{margin:0;padding-left:1.1em;}.ledger li{margin:.35em 0;font-size:13.5px;color:var(--body);}.ledger li b{color:var(--ink);}"
+ ".expo{margin:14px 0 0;}"
+ ".expohead{font-family:var(--mono);font-size:13px;color:var(--muted);margin-bottom:12px;}.expohead b{color:var(--ink);}"
+ ".expoband{font-weight:700;text-transform:uppercase;letter-spacing:.06em;}"
+ ".band-low{color:#15803d;}.band-moderate{color:#b45309;}.band-high{color:#c2410c;}.band-critical{color:#b91c1c;}"
+ ".expobar{position:relative;height:12px;border-radius:9999px;background:linear-gradient(90deg,#15803d 0%,#a3b817 38%,#e0a800 62%,#d23b2e 100%);}"
+ ".expomark{position:absolute;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--ink);transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(255,255,255,.65),0 2px 8px rgba(0,0,0,.35);}"
+ ".expomark.inh{background:#e2e8f0;border-color:#94a3b8;box-shadow:0 0 0 4px rgba(255,255,255,.6),0 1px 4px rgba(0,0,0,.25);}"
+ ".expolabels{display:flex;justify-content:space-between;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}"
+ ".riskmeta2{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:12px;}"
+ ".riskwhy{margin:12px 0 0;color:var(--body);font-size:14px;}"
+ ".risklegend{margin:12px 0 0;font-size:12.5px;color:var(--muted);}.risklegend summary{cursor:pointer;color:var(--ga);font-weight:600;}.risklegend p{margin:6px 0;}"
+ ".pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}"
+ ".pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}"
+ ".pill.prob{color:var(--ga);background:rgba(32,128,162,.08);margin-left:6px;}"
+ ".exec{margin:22px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;}"
+ ".exec h2{font-size:17px;margin:0 0 6px;color:var(--ink);font-weight:800;}.exec p{margin:.4em 0;color:var(--body);font-size:15.5px;}"
+ ".divider{margin:48px 0 18px;padding-top:20px;border-top:1px solid var(--border);}"
+ ".divider h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ga);margin:0 0 4px;font-weight:700;}"
+ ".divider p{margin:0;font-size:13px;color:var(--faint);}"
+ "h2.sec{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);margin:40px 0 4px;font-weight:700;}"
+ ".block{margin:22px 0;}.block h2{font-size:17px;margin:0 0 2px;color:var(--ink);font-weight:700;}.block p{margin:.3em 0;}"
+ ".block ul{margin:6px 0 0;padding-left:1.15em;}.block li{margin:.4em 0;}"
+ ".minority{border-left:3px solid var(--amber);padding-left:16px;color:var(--body);font-style:italic;}"
+ ".advisors{display:grid;gap:14px;margin-top:14px;}"
+ ".advisor{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;box-shadow:0 4px 12px rgba(2,6,23,.05);}"
+ ".advisor header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}"
+ ".advisor h3{font-size:17px;margin:0;color:var(--ink);font-weight:700;}"
+ ".role{font-size:12.5px;color:var(--muted);margin:2px 0 8px;}"
+ ".stance{font-family:var(--mono);font-size:12px;color:var(--ga);margin:8px 0;}"
+ ".advisor p.sum{margin:.2em 0;color:var(--body);}"
+ ".advisor dl{margin:12px 0 0;font-size:13px;color:var(--muted);}"
+ ".advisor dt{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-top:10px;color:var(--faint);}"
+ ".advisor dd{margin:3px 0 0;}"
+ "footer{margin-top:60px;background:var(--footer);padding:42px 20px 48px;text-align:center;border-top:4px solid transparent;border-image:var(--grad) 1;}"
+ ".brandimg.dark{height:40px;width:auto;display:inline-block;}"
+ ".tagline{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:#cbd5e1;margin-top:16px;}"
+ ".fineprint{font-size:10px;color:#64748b;margin-top:14px;font-family:var(--mono);}"
+ "@media(max-width:600px){.wrap{padding-top:30px}.meta{gap:14px}.head{flex-wrap:wrap;gap:10px}}"
+ "</style></head><body><div class=\"brandrule\"></div><div class=\"wrap\">"

+ "<header class=\"head\">" + $logolight + "<div class=\"kicker\">Security Decision Dossier</div></header>"
+ "<h1>" + (.question|e) + "</h1>"
+ (if ((.subtitle // "")|length)>0 then "<p class=\"subtitle\">" + (.subtitle|e) + "</p>" else "" end)
+ "<p class=\"intro\">A panel of security advisors reviewed this decision. This dossier gives you the recommendation and a short executive summary first, then the full analysis underneath: the risks, where the advisors agreed and disagreed, and each advisor in their own words.</p>"
+ "<div class=\"meta\"><span><b>Depth</b>&nbsp;&nbsp;" + (.mode|e|ascii_upcase) + "</span>"
+ "<span><b>Reference</b>&nbsp;&nbsp;" + (.sha // "draft" | e) + "</span>"
+ (if (.ts // "")|length>0 then "<span>" + (.ts|e) + "</span>" else "" end) + "</div>"

+ "<div class=\"verdict\"><h2>What we recommend</h2>"
+ "<p class=\"lead\">The bottom-line advice, and how strongly the panel backs it.</p>"
+ "<p class=\"rec\">" + (.recommendation|e) + "</p>"
+ "<p><span class=\"pill " + (.confidence|conf_class) + "\">Confidence: " + (.confidence|e) + "</span>"
+ (if (.probability|type)=="number" then "<span class=\"pill prob\">" + (.probability|tostring) + "% it survives a 12-month review</span>" else "" end)
+ "</p>"
+ "<p class=\"note\">Confidence shows how strongly the panel stands behind this advice given what is still unknown (High, Medium or Low); the percentage is how likely the panel thinks this call still looks right a year from now.</p>"
+ ((.converged|converged_label) as $cl | if ($cl|length)>0 then "<p class=\"note\">Panel outcome: " + $cl + ".</p>" else "" end)
+ (if (.key_assumption // "")|length>0 then "<p class=\"assume\"><strong>This advice depends on:</strong> " + (.key_assumption|e) + "</p>" else "" end)
+ (if ((.unverified|type)=="array" and (.unverified|length)>0) then "<p class=\"assume\"><strong>Not independently verified (check before relying):</strong> " + (.unverified|join("; ")|e) + "</p>" else "" end)
+ (if (.next_step // "")|length>0 then "<p class=\"assume\"><strong>Do this next:</strong> " + (.next_step|e) + "</p>" else "" end)
+ "</div>"

+ ((.risk_score // {}) as $rs
   | def sc(o): (o) as $o
       | (($o.impact // "")|ascii_downcase) as $imp
       | (($o.likelihood // "")|ascii_downcase) as $lik
       | ({"negligible":1,"minor":2,"limited":2,"moderate":3,"serious":3,"major":4,"severe":5}[$imp]) as $in
       | ({"rare":1,"unlikely":2,"possible":3,"likely":4,"almost certain":5,"almost-certain":5,"certain":5}[$lik]) as $ln
       | if ($in != null and $ln != null)
         then ($in*$ln) as $n
           | {n:$n,
              band:(if $n<=4 then ["Low","low"] elif $n<=9 then ["Moderate","moderate"] elif $n<=15 then ["High","high"] else ["Critical","critical"] end),
              pos:(($n/25*100)|round),
              impL:({"negligible":"Negligible","minor":"Minor","limited":"Limited","moderate":"Moderate","serious":"Serious","major":"Major","severe":"Severe"}[$imp]),
              likL:({"rare":"Rare","unlikely":"Unlikely","possible":"Possible","likely":"Likely","almost certain":"Almost certain","almost-certain":"Almost certain","certain":"Almost certain"}[$lik]),
              rat:($o.rationale // "")}
         else null end;
     (sc($rs.inherent // $rs.residual // $rs)) as $i0
     | (sc($rs.residual // $rs.inherent // $rs)) as $r0
     | if ($i0 == null and $r0 == null) then ""
       else
         ($i0 // $r0) as $i
         | ($r0 // $i0) as $r
         | ($i.rat) as $ratI
         | (if (($r.rat|length)>0 and $r.rat != $i.rat) then $r.rat else "" end) as $ratR
         | "<section class=\"block\"><h2>Risk rating</h2>"
         + "<p class=\"lead\">A qualitative read of this decision: impact against likelihood, mapped to an exposure score. It shows inherent exposure (before the recommended response) and residual exposure (after it); the gap is the value of the recommendation.</p>"
         + "<div class=\"expo\"><div class=\"expohead\">Risk exposure &middot; inherent <b>" + ($i.n|tostring) + "/25</b> <span class=\"expoband band-" + $i.band[1] + "\">" + $i.band[0] + "</span> &rarr; residual <b>" + ($r.n|tostring) + "/25</b> <span class=\"expoband band-" + $r.band[1] + "\">" + $r.band[0] + "</span></div>"
         + "<div class=\"expobar\"><span class=\"expomark inh\" style=\"left:" + ($i.pos|tostring) + "%\"></span><span class=\"expomark\" style=\"left:" + ($r.pos|tostring) + "%\"></span></div>"
         + "<div class=\"expolabels\"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>"
         + "<p class=\"riskmeta2\">Inherent: impact " + $i.impL + " &middot; likelihood " + $i.likL + " &nbsp;&middot;&nbsp; Residual: impact " + $r.impL + " &middot; likelihood " + $r.likL + "</p></div>"
         + (if ($ratI|length)>0 then "<p class=\"riskwhy\"><strong>Inherent.</strong> " + ($ratI|e) + "</p>" else "" end)
         + (if ($ratR|length)>0 then "<p class=\"riskwhy\"><strong>Residual.</strong> " + ($ratR|e) + "</p>" else "" end)
         + "<details class=\"risklegend\"><summary>What the scale means</summary><p><strong>Impact:</strong> Negligible (minimal service impact, negligible cost); Minor (limited service impact, low cost); Moderate (moderate to serious damage, high cost, possible legal consequences); Major (major damage, high cost, likely legal or regulatory consequences); Severe (severe legal consequences, lasting damage or being put out of operation).</p><p><strong>Likelihood:</strong> Rare (conceivable but unlikely); Unlikely (could occur but is not expected); Possible (unlikely but plausible in edge cases); Likely (more likely than not to occur); Almost certain (occurring now or virtually certain to materialize). An impact that has already been observed is scored Almost certain, not Possible.</p><p><strong>Inherent</strong> is exposure before the recommended response; <strong>residual</strong> is what remains after it. <strong>Exposure</strong> = impact x likelihood (each scored 1 to 5), scored out of 25.</p></details>"
         + "</section>"
       end)

+ ((.obligations // {}) as $ob
   | ($ob.triggered // []) as $tr
   | ($ob.ruled_out // []) as $ro
   | if (($tr|length)==0 and ($ro|length)==0) then ""
     else "<section class=\"block\"><h2>Regulatory obligations</h2>"
        + "<p class=\"lead\">Every registered obligation is evaluated before the panel deliberates. Each appears here as a required action with a named owner and a clock, or as explicitly considered and ruled out; a missing obligation is a decision on the record, not a silent omission.</p>"
        + (if ($tr|length)>0
           then "<table class=\"opts\"><thead><tr><th>Obligation</th><th>Required action</th><th>Owner (determine &rarr; execute)</th><th>Clock</th><th>Recipient</th><th>Ref</th><th>Status</th></tr></thead><tbody>"
              + ([ $tr[] | "<tr><td><strong>" + ((.label // .id // "")|e) + "</strong></td><td>" + ((.action // "")|e) + "</td><td>" + ((.determination // .determination_owner // "")|e) + " &rarr; " + ((.execution // .execution_owner // "")|e) + "</td><td>" + ((.clock // "")|e) + "</td><td>" + ((.recipient // "")|e) + "</td><td>" + ((.ref // "")|e) + "</td><td><span class=\"st req\">Required</span></td></tr>" ] | join(""))
              + "</tbody></table>"
           else "<p class=\"riskwhy\">No registered obligation triggered for this decision, which is the correct, auditable default. The obligations considered are listed below.</p>" end)
        + (if ($ro|length)>0
           then "<div class=\"ledger\"><h3>Considered and ruled out this deliberation</h3><ul>"
              + ([ $ro[] | "<li><b>" + ((.label // .id // "")|e) + "</b>: " + ((.reason // "")|e) + "</li>" ] | join(""))
              + "</ul></div>"
           else "" end)
        + "</section>"
     end)

+ (if (.executive_summary // "")|length>0
   then "<section class=\"exec\"><h2>Executive summary</h2><p>" + (.executive_summary|e) + "</p></section>"
   else "" end)

+ (if ((.options|type)=="array" and (.options|length)>0)
   then "<section class=\"block\"><h2>Decision-science pass</h2><p class=\"lead\">The realistic options side by side: effort, risk reduction, ongoing cost, reversibility, and the verdict.</p>"
      + "<table class=\"opts\"><thead><tr><th>Option</th><th>Effort</th><th>Risk reduction</th><th>Ongoing cost</th><th>Reversibility</th><th>Verdict</th></tr></thead><tbody>"
      + ([ .options[] | "<tr><td><strong>" + (.option // .name // ""|e) + "</strong></td><td>" + (.effort // ""|e) + "</td><td>" + (.risk_reduction // ""|e) + "</td><td>" + (.cost // .ongoing_cost // ""|e) + "</td><td>" + (.reversibility // ""|e) + "</td><td class=\"vc " + (.verdict|vclass) + "\">" + (.verdict // ""|e) + "</td></tr>" ] | join(""))
      + "</tbody></table>"
      + (if (.risk_appetite // "")|length>0 then "<div class=\"appetite\"><h3>Risk-appetite check (owner decision)</h3><p>" + (.risk_appetite|e) + "</p></div>" else "" end)
      + (if (.highest_leverage // "")|length>0 then "<p class=\"leverage\"><strong>Highest-leverage move:</strong> " + (.highest_leverage|e) + "</p>" else "" end)
      + "</section>"
   else "" end)
+ "<div class=\"divider\"><h2>The detailed analysis</h2><p>For readers who want the full picture: the risks, the agreements and trade-offs, and each advisor in their own words.</p></div>"

+ list_block(.risks; "Key risks"; "The main risks to weigh before you decide.")
+ (if (.consensus // "")|length>0 then "<section class=\"block\"><h2>Where the advisors agree</h2><p class=\"lead\">Points the whole panel lined up on, so you can treat these as settled.</p><p>" + (.consensus|e) + "</p></section>" else "" end)
+ list_block(.conflicts; "Where the advisors disagree"; "Open trade-offs with no single right answer. These are the calls you, as decision-maker, need to make.")
+ list_block(.blind_spots; "Risks that are easy to miss"; "Subtle points the panel flagged that are simple to overlook.")
+ (if (.minority_report // "")|length>0 then "<section class=\"block\"><h2>The strongest objection</h2><p class=\"lead\">A dissenting view worth keeping in mind, even though most of the panel leaned the other way.</p><p class=\"minority\">" + (.minority_report|e) + "</p></section>" else "" end)

+ (if ((.ranking|type)=="array" and (.ranking|length)>0)
   then "<section class=\"block\"><h2>How the panel rated each other</h2><p class=\"lead\">In anonymized cross-examination each advisor scored the others on how well their position would survive scrutiny (1 to 5, higher is sounder). This is a signal, not a vote, and it never overrides a hard legal stop.</p><table class=\"opts\"><thead><tr><th>Position</th><th>Peer score</th><th>Note</th></tr></thead><tbody>"
      + ([ .ranking | sort_by(-(.score // 0)) | .[] | "<tr><td><strong>" + (.position // ""|e) + "</strong></td><td>" + ((.score // 0)|tostring) + " / 5</td><td>" + (.note // ""|e) + "</td></tr>" ] | join(""))
      + "</tbody></table></section>"
   else "" end)

+ (if ((.members|type)=="array" and (.members|length)>0)
   then "<h2 class=\"sec\">The expert panel</h2><p class=\"lead\">The recommendation above is the synthesis of these independent expert views. Each advisor looked at the decision only through their own lens; where they pull in different directions is exactly the value.</p><div class=\"advisors\">"
      + ([ .members[] |
          "<article class=\"advisor\"><header><div><h3>" + (.name|role_label|e) + "</h3>"
        + (((.name|role_desc)) as $rd | if ($rd|length)>0 then "<p class=\"role\">" + ($rd|e) + "</p>" else "" end)
        + "</div>"
        + "<span class=\"pill " + (.confidence|conf_class) + "\">" + (.confidence // "n/a"|e) + (if (.probability|type)=="number" then " &middot; " + (.probability|tostring) + "%" else "" end) + "</span></header>"
        + (if (.stance // "")|length>0 then "<p class=\"stance\">Stance: " + (.stance|e) + "</p>" else "" end)
        + (if (.summary // "")|length>0 then "<p class=\"sum\">" + (.summary|e) + "</p>" else "" end)
        + "<dl>"
        + (if (.assumptions // "")|length>0 then "<dt>What they assume</dt><dd>" + (.assumptions|e) + "</dd>" else "" end)
        + (if (.change_my_mind // "")|length>0 then "<dt>What would change their view</dt><dd>" + (.change_my_mind|e) + "</dd>" else "" end)
        + "</dl></article>"
        ] | join(""))
      + "</div>"
   else "" end)

+ "</div><footer>" + $logo
+ "<div class=\"tagline\">" + ($tagline|@html) + "</div>"
+ "<div class=\"fineprint\">Generated by the Information Security Council &middot; guidance only, not a substitute for professional advice</div>"
+ "</footer></body></html>"
' > "$out"

echo "report written: $out"
