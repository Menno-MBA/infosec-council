#!/usr/bin/env bash
# infosec-council decision journal
# Logs council runs to JSONL, records real-world outcomes, and surfaces
# calibration over time. Dependency: jq. No network, no other deps.
set -euo pipefail

COUNCIL_HOME="${COUNCIL_HOME:-$HOME/.infosec-council}"
JOURNAL="$COUNCIL_HOME/journal.jsonl"

die() { echo "council-journal: $*" >&2; exit 1; }

need_jq() {
  command -v jq >/dev/null 2>&1 || \
    die "jq is required. Install: 'brew install jq' (macOS) or 'apt-get install jq' (Linux)."
}

ensure() { mkdir -p "$COUNCIL_HOME"; [ -f "$JOURNAL" ] || : > "$JOURNAL"; }

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
    s="$(echo "$input" | jq -r '.sha // ""')"
    if [ -z "$s" ] || [ "$s" = "null" ]; then s="$(printf '%s' "$q" | sha8)"; fi
    record="$(echo "$input" | jq -c --arg sha "$s" --arg ts "$(now)" '
      . + {sha: $sha, ts: $ts}
      | .mode    = (.mode    // "standard")
      | .members = (.members // [])
      | .outcome = (.outcome // {recorded: false})
    ')"
    printf '%s\n' "$record" >> "$JOURNAL"
    echo "logged run $s"
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
      {
        total_runs:    length,
        with_outcome:  ([.[] | select(.outcome.recorded == true)] | length),

        # Calibration: for each confidence level, how did the calls turn out?
        calibration_by_confidence: (
          group_by(.confidence // "unknown")
          | map({
              confidence:        (.[0].confidence // "unknown"),
              runs:              length,
              outcomes_recorded: ([.[] | select(.outcome.recorded == true)] | length),
              correct:           ([.[] | select(.outcome.result == "correct")] | length),
              partial:           ([.[] | select(.outcome.result == "partial")] | length),
              wrong:             ([.[] | select(.outcome.result == "wrong")]   | length)
            })
        ),

        # The runs to actually learn from: high confidence that did NOT pan out.
        high_confidence_misses: [
          .[]
          | select(.confidence == "high" and (.outcome.result == "wrong" or .outcome.result == "partial"))
          | {sha, question, result: .outcome.result, note: (.outcome.note // "")}
        ],

        # Who shows up, and how confident they tend to be.
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
      sha, ts, mode,
      confidence: (.confidence // "n/a"),
      question:   (.question[0:80]),
      outcome:    (.outcome.result // "pending")
    }'
    ;;

  path) echo "$JOURNAL" ;;

  help|*)
    cat <<'USAGE'
infosec-council decision journal

  journal.sh log
      Read one run as JSON from stdin and append it. Example:
      echo '{"question":"...","mode":"deep","confidence":"medium",
             "recommendation":"...","key_assumption":"...",
             "members":[{"name":"ciso","stance":"conditional-go","confidence":"medium"}]}' \
        | journal.sh log

  journal.sh outcome <sha> <correct|partial|wrong> [note]
      Record how the decision actually turned out, later.

  journal.sh meta
      Calibration report: hit-rate by confidence level, high-confidence misses,
      and member appearance counts.

  journal.sh journal [n]
      Show the last n runs (default 10).

  journal.sh path
      Print the journal file path.

Environment:
  COUNCIL_HOME   journal directory (default: ~/.infosec-council)
USAGE
    ;;
esac
