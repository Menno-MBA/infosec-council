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
TAGLINE="${LUMERO_TAGLINE:-We do the academic research, you get the tools.}"

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
+ ".intro{font-size:15px;color:var(--muted);margin:.2em 0 0;max-width:66ch;}"
+ ".meta{font-family:var(--mono);font-size:12px;color:var(--faint);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:12px 0;margin:18px 0 0;display:flex;gap:24px;flex-wrap:wrap;}"
+ ".meta b{color:var(--muted);font-weight:600;}"
+ ".lead{font-size:13px;color:var(--faint);margin:.1em 0 12px;}"
+ ".verdict{margin:32px 0 22px;border-radius:16px;padding:26px 28px;background:linear-gradient(#fff,#fff) padding-box,var(--grad) border-box;border:1.5px solid transparent;box-shadow:0 10px 30px -12px rgba(2,6,23,.18);}"
+ ".verdict h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 4px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}"
+ ".verdict .lead{margin-bottom:14px;}.verdict p{margin:.4em 0;}.rec{font-size:19px;color:var(--ink);font-weight:600;line-height:1.45;}"
+ ".assume{font-size:14px;color:var(--muted);margin-top:10px;}.assume strong{color:var(--ink);}"
+ ".note{font-size:12px;color:var(--faint);margin-top:10px;font-style:italic;}"
+ ".pill{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;border:1px solid currentColor;font-weight:600;}"
+ ".pill.high{color:var(--green);background:rgba(21,128,61,.08);}.pill.med{color:var(--amber);background:rgba(180,83,9,.08);}.pill.low,.pill.na{color:var(--slate);background:rgba(100,116,139,.08);}"
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
+ "<p class=\"intro\">A panel of security advisors reviewed this decision. This dossier gives you the recommendation and a short executive summary first, then the full analysis underneath: the risks, where the advisors agreed and disagreed, and each advisor in their own words.</p>"
+ "<div class=\"meta\"><span><b>Depth</b>&nbsp;&nbsp;" + (.mode|e|ascii_upcase) + "</span>"
+ "<span><b>Reference</b>&nbsp;&nbsp;" + (.sha // "draft" | e) + "</span>"
+ (if (.ts // "")|length>0 then "<span>" + (.ts|e) + "</span>" else "" end) + "</div>"

+ "<div class=\"verdict\"><h2>What we recommend</h2>"
+ "<p class=\"lead\">The bottom-line advice, and how strongly the panel backs it.</p>"
+ "<p class=\"rec\">" + (.recommendation|e) + "</p>"
+ "<p><span class=\"pill " + (.confidence|conf_class) + "\">Confidence: " + (.confidence|e) + "</span></p>"
+ "<p class=\"note\">Confidence shows how strongly the panel stands behind this advice given what is still unknown (High, Medium or Low).</p>"
+ (if (.key_assumption // "")|length>0 then "<p class=\"assume\"><strong>This advice depends on:</strong> " + (.key_assumption|e) + "</p>" else "" end)
+ (if (.next_step // "")|length>0 then "<p class=\"assume\"><strong>Do this next:</strong> " + (.next_step|e) + "</p>" else "" end)
+ "</div>"

+ (if (.executive_summary // "")|length>0
   then "<section class=\"exec\"><h2>Executive summary</h2><p>" + (.executive_summary|e) + "</p></section>"
   else "" end)

+ "<div class=\"divider\"><h2>The detailed analysis</h2><p>For readers who want the full picture: the risks, the agreements and trade-offs, and each advisor in their own words.</p></div>"

+ list_block(.risks; "Key risks"; "The main risks to weigh before you decide.")
+ (if (.consensus // "")|length>0 then "<section class=\"block\"><h2>Where the advisors agree</h2><p class=\"lead\">Points the whole panel lined up on, so you can treat these as settled.</p><p>" + (.consensus|e) + "</p></section>" else "" end)
+ list_block(.conflicts; "Where the advisors disagree"; "Open trade-offs with no single right answer. These are the calls you, as decision-maker, need to make.")
+ list_block(.blind_spots; "Risks that are easy to miss"; "Subtle points the panel flagged that are simple to overlook.")
+ (if (.minority_report // "")|length>0 then "<section class=\"block\"><h2>The strongest objection</h2><p class=\"lead\">A dissenting view worth keeping in mind, even though most of the panel leaned the other way.</p><p class=\"minority\">" + (.minority_report|e) + "</p></section>" else "" end)

+ (if ((.members|type)=="array" and (.members|length)>0)
   then "<h2 class=\"sec\">The expert panel</h2><p class=\"lead\">The recommendation above is the synthesis of these independent expert views. Each advisor looked at the decision only through their own lens; where they pull in different directions is exactly the value.</p><div class=\"advisors\">"
      + ([ .members[] |
          "<article class=\"advisor\"><header><div><h3>" + (.name|role_label|e) + "</h3>"
        + (((.name|role_desc)) as $rd | if ($rd|length)>0 then "<p class=\"role\">" + ($rd|e) + "</p>" else "" end)
        + "</div>"
        + "<span class=\"pill " + (.confidence|conf_class) + "\">" + (.confidence // "n/a"|e) + "</span></header>"
        + (if (.stance // "")|length>0 then "<p class=\"stance\">" + (.stance|e) + "</p>" else "" end)
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
