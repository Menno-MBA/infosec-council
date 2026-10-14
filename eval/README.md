# Council eval

A fixed set of cases and a deterministic scorer, so a change to the council can be measured
rather than argued. The scorer (`scripts/eval-council.js`) never runs the council: runs are
costly and non-deterministic, so the maintainer generates them in Claude Code and the
scorer reads what they produced. The same runs always give the same scores.

Maintainer-only. Nothing here ships to users or touches a real journal.

## Cases

| Case | Type | What it tests |
|---|---|---|
| `um-ransomware-2019` | choice | Pay or rebuild after domain-wide encryption with backups gone; graded against the documented outcome |
| `van-elst-invoice-fraud` | bundle, plan primary | A five-question bundle; the action plan should carry a finance process control |
| `nogo-canary` | decision | Dropping MFA for the people who approve payments; a sound panel stops it |
| `go-canary` | decision | Passkeys on four admin accounts, two hours of work; a sound panel backs it at 70 or above |
| `hindsight-divergence` | choice | One option clearly better, an incident near-certain either way; separates "would still choose it" from "nothing bad happens" |

Each `cases/<id>.json` holds the question, where the brief is, the invocation, what the
scorer expects, the ground truth, and a grading hint for the worksheet.

## Arms

- **baseline**: v2.2.0, the behaviour before any v3 change. Check out tag `v2.2.0`.
- **v3**: the current release.

Run the baseline first, and from the tag rather than from memory of how v2 behaved. A
comparison is only as honest as its "before" picture.

## Generating an arm

1. **Isolate it.** Use a scratch directory **outside this git repository**, so a seat cannot
   find earlier dossiers or this folder, and a fresh journal:
   ```
   export COUNCIL_HOME="$HOME/council-eval/<arm>"
   ```
2. **Install the arm's personas user-level** from the arm's checkout, then prove what is loaded:
   ```
   git -C <repo> checkout v2.2.0        # or the v3 commit
   node <repo>/bin/cli.js install --global --force
   node <repo>/bin/cli.js verify > verify.txt
   ```
   For the v3 arm, `verify` must report no stale council persona. The scorer refuses a v3 arm
   whose `verify` output names one, because a v2 persona copy outranks the plugin's and turns
   the run back into v2. Pre-approve `WebSearch` and `WebFetch`, or background seats stall.
3. **One council run per case**, at Standard unless the case says otherwise, using the
   case's `invocation`. Copy the logged record into the runs directory:
   ```
   node <repo>/.claude/skills/infosec-council/journal.js path     # find the journal
   # take the run's line (by sha) and save it as:
   <runs>/<arm>/<case-id>/council.json
   ```
4. **Seat micro-evals, 5 repetitions per seat that matters** (at least `offensive-security`
   and `security-architect`, the two the 2026-10 probe used). Dispatch the persona directly by
   its `subagent_type`, with the case brief and the arm's output block, and add one line to
   the prompt: *"After the block, add one line: PROBABILITY MEANS: <what your number
   estimates, in your own words>."* Save each return as
   `<runs>/<arm>/<case-id>/seats/<persona>-<n>.md`.
5. **Write `<runs>/<arm>/arm.json`**:
   ```json
   {"arm": "v3", "version": "3.0.0", "verify": "<contents of verify.txt>"}
   ```

## Scoring and comparing

```
node scripts/eval-council.js <runs>            # table across arms
node scripts/eval-council.js <runs> --json     # everything, per run and per seat
```

Read these first:

- **Seat PROBABILITY read as "no incident"**: the 2026-10 probe found 8 of 8. v3 should bring
  it near zero. The classification is a keyword match; read the `unclear` ones by hand.
- **Offensive-security gap**: the other seats' mean minus offensive-security's. v2 ran at
  roughly 12 to 20 points. Under decision quality the attacking seat has no reason to sit
  lowest when it agrees with the call.
- **No-go seat positions**: v2 logged zero in 63. The no-go canary should produce several.
- **Atomic CONDITION rate** and **converged contradicts matrix**.

A run is **invalid**, and kept out of every metric with its reason printed, when the seats
loaded were not the arm's (stale personas), more than one seat is missing, the seat count does
not fit the mode, or the record's protocol does not match the arm. Fix the run and regenerate
it; never hand-edit a record to make it valid.

## Grading the exercise runs

```
node scripts/grading-worksheet.js --journal "$COUNCIL_HOME/journal.jsonl"
```

prints each ungraded run beside its case's documented outcome, with the `outcome` command
ready to paste and prefixed `exercise:`. It writes nothing. You make the judgement; the agent
never grades its own advice.
