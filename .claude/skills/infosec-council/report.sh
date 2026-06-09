#!/usr/bin/env bash
# infosec-council HTML report generator
# Renders a council run (rich JSON on stdin, or a sha from the journal) as a
# self-contained, branded HTML dossier. Dependency: jq.
#
# Branding:
#   LUMERO_LOGO   optional. A URL (https://...) used as <img src>, OR a local
#                 image file which is base64-embedded so the report stays
#                 self-contained. If unset, a clean "Luméro" wordmark is used.
#   LUMERO_TAGLINE  optional. Defaults to the line below.
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

# ---- build the brand mark ----------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLED_LOGO="$SCRIPT_DIR/assets/lumero-logo-white.png"
logo_src="${LUMERO_LOGO:-}"
# fall back to the bundled Lumero logo if the user didn't override
[ -z "$logo_src" ] && [ -r "$BUNDLED_LOGO" ] && logo_src="$BUNDLED_LOGO"

logo_html='<span class="wordmark">Lum&eacute;ro</span>'
if [ -n "$logo_src" ]; then
  case "$logo_src" in
    http://*|https://*)
      logo_html="<img class=\"brandimg\" src=\"$logo_src\" alt=\"Lumero\">" ;;
    *)
      if [ -r "$logo_src" ]; then
        mime="image/png"; case "$logo_src" in *.svg) mime="image/svg+xml";; *.jpg|*.jpeg) mime="image/jpeg";; *.webp) mime="image/webp";; esac
        b64="$(base64 -w0 "$logo_src" 2>/dev/null || base64 "$logo_src" | tr -d '\n')"
        logo_html="<img class=\"brandimg\" src=\"data:$mime;base64,$b64\" alt=\"Lumero\">"
      fi ;;
  esac
fi

# ---- fonts: prefer the bundled base64-embedded stylesheet (fully offline) ----
FONTS_CSS="$SCRIPT_DIR/assets/fonts-embedded.css"
if [ -r "$FONTS_CSS" ]; then fontmode="embed"; fontsrc="$FONTS_CSS"; else fontmode="link"; fontsrc="/dev/null"; fi

# ---- render ------------------------------------------------------------------
sha="$(echo "$run" | jq -r '.sha // "draft"')"
out="$REPORT_DIR/council-report-$(date -u +%Y%m%d-%H%M%S)-$sha.html"
mkdir -p "$REPORT_DIR"

echo "$run" | jq -r --arg logo "$logo_html" --arg tagline "$TAGLINE" --arg fontmode "$fontmode" --rawfile fonts "$fontsrc" '
  def e: (. // "") | @html;
  def conf_class: (. // "" | ascii_downcase) as $c
    | if $c=="high" then "high" elif $c=="medium" then "med" elif $c=="low" then "low" else "na" end;
  def list_block($items; $title):
    if ($items|type)=="array" and ($items|length)>0
    then "<section class=\"block\"><h2>" + $title + "</h2><ul>"
         + ([$items[] | "<li>" + (.|e) + "</li>"] | join(""))
         + "</ul></section>"
    else "" end;

  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
+ "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
+ "<title>Council Dossier — " + (.question|e) + "</title>"
+ (if $fontmode=="embed" then "<style>" + $fonts + "</style>"
   else "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">" end)
+ "<style>"
+ ":root{--paper:#f4f1ea;--ink:#1c1a17;--muted:#6b655c;--line:#d8d2c6;--ox:#7c2d2d;--ox-soft:#a85c5c;--card:#fbf9f4;--green:#3f6f54;--amber:#9a6b1f;--grey:#8a847a;--brand-g:#5bbe61;--brand-b:#2f6fa8;--ink-dark:#12161c;}"
+ "*{box-sizing:border-box}"
+ "body{margin:0;background:var(--paper);color:var(--ink);font-family:\"IBM Plex Sans\",sans-serif;line-height:1.55;"
+ "background-image:radial-gradient(circle at 1px 1px,rgba(28,26,23,.035) 1px,transparent 0);background-size:22px 22px;}"
+ ".brandrule{height:4px;background:linear-gradient(90deg,var(--brand-g),var(--brand-b));}"
+ ".wrap{max-width:820px;margin:0 auto;padding:64px 28px 0;}"
+ ".kicker{font-family:\"IBM Plex Mono\",monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ox);}"
+ "h1{font-family:\"Fraunces\",serif;font-weight:800;font-size:clamp(30px,5vw,46px);line-height:1.08;margin:.3em 0 .2em;letter-spacing:-.01em;}"
+ ".meta{font-family:\"IBM Plex Mono\",monospace;font-size:12px;color:var(--muted);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:10px 0;margin:22px 0 0;display:flex;gap:22px;flex-wrap:wrap;}"
+ ".verdict{margin:40px 0;padding:26px 28px;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--ox);box-shadow:0 18px 40px -28px rgba(28,26,23,.5);}"
+ ".verdict h2{font-family:\"Fraunces\",serif;margin:0 0 6px;font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:var(--ox);}"
+ ".verdict p{margin:.35em 0;font-size:18px;}"
+ ".badge{display:inline-block;font-family:\"IBM Plex Mono\",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:3px 9px;border:1px solid currentColor;border-radius:2px;}"
+ ".badge.high{color:var(--green)}.badge.med{color:var(--amber)}.badge.low,.badge.na{color:var(--grey)}"
+ ".assume{font-size:14px;color:var(--muted);margin-top:10px;}"
+ "h2.sec{font-family:\"Fraunces\",serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:46px 0 14px;}"
+ ".advisors{display:grid;gap:16px;}"
+ ".advisor{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--ox-soft);padding:18px 20px;}"
+ ".advisor header{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}"
+ ".advisor h3{font-family:\"Fraunces\",serif;font-size:18px;margin:0;}"
+ ".stance{font-family:\"IBM Plex Mono\",monospace;font-size:12px;color:var(--ox);margin:2px 0 8px;}"
+ ".advisor p.sum{margin:.2em 0;font-size:15px;}"
+ ".advisor dl{margin:12px 0 0;font-size:13px;color:var(--muted);}"
+ ".advisor dt{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:8px;}"
+ ".advisor dd{margin:2px 0 0;}"
+ ".block{margin:26px 0;}.block h2{font-family:\"Fraunces\",serif;font-size:15px;margin:0 0 8px;}"
+ ".block ul{margin:0;padding-left:1.1em;}.block li{margin:.3em 0;}"
+ ".minority{border-left:3px solid var(--amber);padding-left:16px;color:var(--ink);font-style:italic;}"
+ "footer{margin-top:70px;background:var(--ink-dark);background-image:radial-gradient(120% 140% at 50% -40%,rgba(91,190,97,.18),transparent 55%),radial-gradient(120% 140% at 50% 160%,rgba(47,111,168,.22),transparent 55%);padding:46px 20px 52px;text-align:center;border-top:4px solid transparent;border-image:linear-gradient(90deg,var(--brand-g),var(--brand-b)) 1;}"
+ ".wordmark{font-family:\"Fraunces\",serif;font-weight:800;font-size:30px;letter-spacing:.01em;color:#fff;}"
+ ".brandimg{height:54px;width:auto;display:inline-block;}"
+ ".tagline{font-family:\"IBM Plex Mono\",monospace;font-size:13px;letter-spacing:.05em;color:#cdd4dc;margin-top:16px;}"
+ ".fineprint{font-size:10px;color:#5b636e;margin-top:16px;font-family:\"IBM Plex Mono\",monospace;}"
+ "@media(max-width:600px){.wrap{padding-top:40px}.meta{gap:14px}}"
+ "</style></head><body><div class=\"brandrule\"></div><div class=\"wrap\">"

+ "<div class=\"kicker\">Information Security Council — Decision Dossier</div>"
+ "<h1>" + (.question|e) + "</h1>"
+ "<div class=\"meta\"><span>MODE&nbsp;&nbsp;" + (.mode|e|ascii_upcase) + "</span>"
+ "<span>REF&nbsp;&nbsp;" + (.sha // "draft" | e) + "</span>"
+ "<span>" + (.ts // "" | e) + "</span></div>"

+ "<div class=\"verdict\"><h2>Recommendation</h2>"
+ "<p>" + (.recommendation|e) + "</p>"
+ "<p><span class=\"badge " + (.confidence|conf_class) + "\">Confidence: " + (.confidence|e) + "</span></p>"
+ (if (.key_assumption // "")|length>0 then "<p class=\"assume\"><strong>Key assumption:</strong> " + (.key_assumption|e) + "</p>" else "" end)
+ (if (.next_step // "")|length>0 then "<p class=\"assume\"><strong>Next step:</strong> " + (.next_step|e) + "</p>" else "" end)
+ "</div>"

+ (if (.consensus // "")|length>0 then "<section class=\"block\"><h2>Consensus</h2><p>" + (.consensus|e) + "</p></section>" else "" end)
+ list_block(.conflicts; "Live conflicts")
+ list_block(.blind_spots; "Blind spots caught")
+ (if (.minority_report // "")|length>0 then "<section class=\"block\"><h2>Minority report</h2><p class=\"minority\">" + (.minority_report|e) + "</p></section>" else "" end)

+ (if ((.members|type)=="array" and (.members|length)>0)
   then "<h2 class=\"sec\">The Council</h2><div class=\"advisors\">"
      + ([ .members[] |
          "<article class=\"advisor\"><header><h3>" + (.name|e) + "</h3>"
        + "<span class=\"badge " + (.confidence|conf_class) + "\">" + (.confidence // "n/a"|e) + "</span></header>"
        + (if (.stance // "")|length>0 then "<p class=\"stance\">" + (.stance|e) + "</p>" else "" end)
        + (if (.summary // "")|length>0 then "<p class=\"sum\">" + (.summary|e) + "</p>" else "" end)
        + "<dl>"
        + (if (.assumptions // "")|length>0 then "<dt>Assumptions</dt><dd>" + (.assumptions|e) + "</dd>" else "" end)
        + (if (.change_my_mind // "")|length>0 then "<dt>What would change my mind</dt><dd>" + (.change_my_mind|e) + "</dd>" else "" end)
        + "</dl></article>"
        ] | join(""))
      + "</div>"
   else "" end)

+ "</div><footer>" + $logo
+ "<div class=\"tagline\">" + ($tagline|@html) + "</div>"
+ "<div class=\"fineprint\">Generated by Information Security Council &middot; advisory only, not a substitute for professional counsel</div>"
+ "</footer></body></html>"
' > "$out"

echo "report written: $out"
