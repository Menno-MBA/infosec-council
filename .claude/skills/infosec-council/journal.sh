#!/usr/bin/env bash
# infosec-council decision journal (bash + jq).
# Prefer journal.js (zero-dependency Node); use this only where Node is absent.
# Logs council runs to JSONL, records real-world outcomes, and surfaces calibration
# (hit-rate AND Brier score) over time. Dependency: jq. No network, no other deps.
set -euo pipefail

COUNCIL_HOME="${COUNCIL_HOME:-$HOME/.infosec-council}"
COUNCIL_ORG="${COUNCIL_ORG:-}"
if [ -n "$COUNCIL_ORG" ]; then HOME_DIR="$COUNCIL_HOME/$COUNCIL_ORG"; else HOME_DIR="$COUNCIL_HOME"; fi
JOURNAL="$HOME_DIR/journal.jsonl"

die() { echo "council-journal: $*" >&2; exit 1; }

need_jq() {
  command -v jq >/dev/null 2>&1 || \
    die "jq is required (or use journal.js with Node). Install jq: 'brew install jq' (macOS) or 'apt-get install jq' (Linux)."
}

ensure() { mkdir -p "$HOME_DIR"; [ -f "$JOURNAL" ] || : > "$JOURNAL"; }

sha8() {
  if command -v sha1sum >/dev/null 2>&1; then sha1sum | cut -c1-8
  elif command -v shasum  >/dev/null 2>&1; then shasum  | cut -c1-8
  else die "neither sha1sum nor shasum is available"; fi
}

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

cmd="${1:-help}"; shift || true

case "$cmd" in
  log)
    need_jq; ensure
    input="$(cat)"
    echo "$input" | jq empty 2>/dev/null || die "log: stdin is not valid JSON"
    q="$(echo "$input" | jq -r '.question // ""')"
    [ -n "$q" ] || die "log: .question is required in the JSON"
    family="$(printf '%s' "$q" | sha8)"                 # stable per-question id (links reruns)
    ts="$(now)"
    s="$(echo "$input" | jq -r '.sha // ""')"
    if [ -z "$s" ] || [ "$s" = "null" ]; then
      s="$(printf '%s|%s' "$q" "$ts" | sha8)"           # salted: reruns get distinct shas
    fi
    record="$(echo "$input" | jq -c --arg sha "$s" --arg fam "$family" --arg ts "$ts" '
      . + {sha: $sha, family: $fam, ts: $ts}
      | .mode    = (.mode    // "standard")
      | .members = (.members // [])
      | .outcome = (.outcome // {recorded: false})
    ')"
    printf '%s\n' "$record" >> "$JOURNAL"
    echo "logged run $s (family $family)"
    ;;

  outcome)
    need_jq; ensure
    s="${1:-}"; result="${2:-}"; shift 2 2>/dev/null || true
    note="${*:-}"
    [ -n "$s" ] || die "usage: journal.sh outcome <sha> <correct|partial|wrong> [note]"
    case "$result" in correct|partial|wrong) ;; *) die "result must be: correct | partial | wrong";; esac
    jq -e --arg s "$s" 'select(.sha==$s)' "$JOURNAL" >/dev/null 2>&1 || die "no run found with sha $s"
    tmp="$(mktemp)"
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if [ "$(echo "$line" | jq -r '.sha')" = "$s" ]; then
        echo "$line" | jq -c --arg ts "$(now)" --arg r "$result" --arg n "$note" \
          '.outcome = {recorded: true, ts: $ts, result: $r, note: $n}'
      else
        printf '%s\n' "$line"
      fi
    done < "$JOURNAL" > "$tmp"
    mv "$tmp" "$JOURNAL"
    echo "recorded outcome for $s: $result"
    ;;

  meta)
    need_jq; ensure
    [ -s "$JOURNAL" ] || die "journal is empty - nothing to analyze yet"
    jq -s '
      def actual: {"correct":1,"partial":0.5,"wrong":0}[.];
      def brier(list):
        [ list[]
          | select((.probability|type=="number") and (.outcome.recorded == true) and ((.outcome.result|actual) != null))
          | ((.probability/100) - (.outcome.result|actual)) as $d | $d*$d ]
        | if length>0 then {n: length, brier: ((add/length)*1000|round/1000)} else null end;
      {
        total_runs:    length,
        with_outcome:  ([.[] | select(.outcome.recorded == true)] | length),
        brier_overall: brier(.),

        calibration_by_confidence: (
          group_by(.confidence // "unknown")
          | map({
              confidence:        (.[0].confidence // "unknown"),
              runs:              length,
              outcomes_recorded: ([.[] | select(.outcome.recorded == true)] | length),
              correct:           ([.[] | select(.outcome.result == "correct")] | length),
              partial:           ([.[] | select(.outcome.result == "partial")] | length),
              wrong:             ([.[] | select(.outcome.result == "wrong")]   | length),
              brier:             brier(.)
            })
        ),

        high_confidence_misses: [
          .[]
          | select(.confidence == "high" and (.outcome.result == "wrong" or .outcome.result == "partial"))
          | {sha, question, result: .outcome.result, note: (.outcome.note // ""), probability}
        ],

        member_appearances: (
          [ .[].members[]? | if type == "object" then (.name // "unknown") else . end ]
          | group_by(.) | map({member: .[0], count: length}) | sort_by(-.count)
        )
      }
    ' "$JOURNAL"
    ;;

  journal)
    need_jq; ensure
    n="${1:-10}"
    [ -s "$JOURNAL" ] || { echo "(journal empty)"; exit 0; }
    tail -n "$n" "$JOURNAL" | jq -c '{
      sha, family, ts, mode,
      confidence: (.confidence // "n/a"),
      probability: (.probability // null),
      converged: (.converged // null),
      question:   (.question[0:80]),
      outcome:    (.outcome.result // "pending")
    }'
    ;;

  lookback)
    need_jq; ensure
    q="$*"
    [ -n "$q" ] || die "usage: journal.sh lookback <question text>"
    family="$(printf '%s' "$q" | sha8)"
    [ -s "$JOURNAL" ] || { echo '{"query_family":"'"$family"'","matches":[]}'; exit 0; }
    jq -s --arg q "$q" --arg fam "$family" '
      def toks: (ascii_downcase | [scan("[a-z0-9]+")] | map(select(length>2)) | unique);
      ($q|toks) as $qt
      | [ .[]
          | . as $r
          | (($r.question // "")|toks) as $rt
          | (if $r.family == $fam then 1
             else ( ([$qt[]|select(. as $t|$rt|index($t))]|length) as $i
                    | if (($qt|length)+($rt|length)-$i) > 0 then ($i / (($qt|length)+($rt|length)-$i)) else 0 end)
             end) as $sim
          | select($sim >= 0.3)
          | {sha: $r.sha, family: $r.family, question: $r.question,
             confidence: $r.confidence, probability: $r.probability,
             outcome: ($r.outcome.result // "pending"), note: ($r.outcome.note // ""), sim: (($sim*100|round)/100)} ]
      | sort_by([( .outcome != "pending" ), .sim]) | reverse | .[0:5]
      | {query_family: $fam, matches: .}
    ' "$JOURNAL"
    ;;

  path) echo "$JOURNAL" ;;

  help|*)
    cat <<'USAGE'
infosec-council decision journal (bash + jq). Prefer journal.js (Node, no deps).

  journal.sh log
      Read one run as JSON from stdin and append it. Salts the sha so reruns of the
      same question are distinct; also stores a stable "family" id per question.

  journal.sh outcome <sha> <correct|partial|wrong> [note]
      Record how the decision actually turned out, later.

  journal.sh meta
      Calibration: hit-rate AND Brier score by confidence level, high-confidence
      misses, and member appearance counts.

  journal.sh journal [n]
      Show the last n runs (default 10).

  journal.sh lookback <question text>
      Comparable past runs (same family or similar wording), outcomes first.

  journal.sh path
      Print the journal file path.

Environment:
  COUNCIL_HOME   journal directory (default: ~/.infosec-council)
  COUNCIL_ORG    per-org subfolder (keeps one client's journal out of another's)
USAGE
    ;;
esac
