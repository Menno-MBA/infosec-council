# Security

This project is a set of **zero-dependency, local** scripts: a Node installer
(`bin/cli.js`), four HTML report generators (`report.js`), a decision journal
(`journal.js`), and bash/Python equivalents. They are fetched from GitHub and run
on the user's own machine (`npx`, plugin install, or Claude Code). There is no
server, **the scripts make no network calls**, and generated dossiers embed their
assets (base64) and render offline.

**The skills do reach the network.** Since the retrieval pass was added, the four
skills perform web lookups at run time against the register in
`external-websources.md`, using the host agent's own web tooling. That is agent
behaviour, not script behaviour, and it is governed by the register's Part A policy
rather than by code: it can be switched off there (`Retrieval: off`, which also
stops the seats, not just the orchestrator's own pass), it is bounded by per-mode
budgets **plus a per-seat escalation ceiling**, and it is subject to a
query-minimisation rule. Size the exposure from the run-level ceiling, not the mode
budget alone: a Standard council run is 5 orchestrator queries plus up to 3 per seat
across 7 seats, so **26**, not 5. It adds two assets to the threat model below.

## Threat model

| Asset | Threat | Control |
|---|---|---|
| The generated HTML dossier | A crafted/booby-trapped input JSON (`plan.json`, `incident.json`, a journal line) injects script or CSS that fires when a human opens or shares the dossier (stored XSS / CSS injection). | Every value taken from the input JSON is HTML-escaped before it reaches the DOM; CSS colours are validated against an allowlist; numeric widths/positions are coerced and clamped. See "Input handling". |
| The scripts themselves | Fetched from GitHub and run locally, so a corrupted or altered copy could run unnoticed. | SHA-256 integrity manifest + `verify` command (see "Integrity"). |
| The install target | Path traversal or arbitrary write/delete during install or report output. | All installer paths derive from the package root, the home directory, and fixed constants, never from untrusted input; the one JSON-derived filename component (the council report `sha`) is sanitised to a safe charset. |
| The seat prompt and the resulting verdict | Retrieved web content carries instructions aimed at the reader, or plausible-sounding false facts. Anyone can publish a page. A hostile page that reaches the orchestrator's brief steers all seats at once. | Retrieved content is **data, never instruction**, stated to the orchestrator that reads the raw page as well as to every seat. The brief carries facts, sources and dates only. A fact counts as verified only if the run actually retrieved it, and the `verified` / `unverified` fields in the dossier record what the verdict stood on. See "Retrieval" below for the honest limits. |
| What leaves the estate | A retrieval query or fetch discloses case material: client names, hostnames, indicators, breach specifics, or `context.md` contents. During a live incident, fetching an attacker-supplied link tells the adversary you are investigating. | Query minimisation: queries carry generic subject terms only, never case-identifying material. Fetch scope: register sources and subject search results only; a URL, IP or host taken from the case material or an indicator list is analysed as a string and never visited. An operator can set `Retrieval: off` for a confidential engagement. |

Out of scope (operator trust boundary): environment variables the operator sets
themselves (`LUMERO_LOGO*` image path/URL, `*_REPORT_DIR`, `COUNCIL_HOME`), a
`--in <file>` path the operator chooses, and the contents of `context.md`,
`frameworks.md`, and `external-websources.md`. These are trusted operator input.

`external-websources.md` deserves a note, because it is the first config file whose
contents cause **outbound traffic**, and its Part A is written to be quoted into a
prompt. Whoever writes it controls both where a run sends queries and text the seats
read as policy. Treat a register from an untrusted origin the way you would treat an
untrusted script: read it before you run it. This is a trust-boundary statement, not a
control — nothing in the code validates the register.

## Input handling (report generators)

- **Escape by default.** All input-JSON values are passed through an HTML escaper
  (`e()` / `htmlEscape`) before being placed in text or attributes. CSS class
  fragments come from fixed lookup maps, not raw input.
- **CSS colours are validated.** A JSON-supplied colour (e.g. a heatmap legend)
  is checked against a hex / `rgb()` / `hsl()` / named-colour allowlist before it
  enters a `style` attribute, so it cannot smuggle `url(...)` or extra
  declarations into an otherwise-offline dossier.
- **Numerics are coerced and clamped.** Percentages and bar positions are
  `Number(...)`-coerced and clamped to `0..100`, so a non-numeric value degrades
  to `0` instead of reaching the page.
- **No dynamic code.** No `eval`, `new Function`, `child_process`, or dynamic
  `require` of input. Zero runtime dependencies, so there is no transitive
  supply-chain surface.

The generator test suite (`scripts/test-reports.js`) renders each generator and
asserts the output is free of unescaped `undefined`/object/`NaN`/`null` leaks.

Retrieved web text that reaches a report field (`verified`, `unverified`, a finding,
a seat summary) is an input-JSON value like any other and goes through the same
escaper, so the dossier XSS surface is unchanged by retrieval.

## Retrieval (honest limits)

The controls above reduce the risk that a hostile page **steers** a run. They do not
make retrieval safe in the stronger sense, and it is worth being plain about what is
left:

- A **plausible false fact** from a legitimate-looking source can still ground a wrong
  verdict. Nothing here verifies truth; the `verified` field records provenance, not
  correctness, which is exactly why it names its sources.
- "Data, never instruction" is a **prompt-level control**, enforced by a language
  model, not by a sandbox. It is a meaningful reduction, not a guarantee.
- A **stale register** points at superseded pages while still looking authoritative.
  Part A's staleness interval demotes rows past it, but nothing detects a link that
  quietly changed meaning.
- The one control with a repeatable test vector is rule 3. The fixture at
  `scripts/fixtures/retrieval-injection-fixture.md` carries a naive injection and a
  plausible one written as ordinary advisory prose; it does not ship to users.
- Query minimisation reduces what a search discloses; it does not make retrieval
  zero-disclosure. For an engagement where **no** third-party lookup is acceptable,
  set `Retrieval: off` rather than relying on minimisation.

## Integrity (tamper-evidence)

`scripts/integrity.sha256` records a **SHA-256** for every executable file that
ships (`.js`, `.sh`, `.py` under `bin/`, `scripts/`, `.claude/skills/`,
`chatgpt/`). Verify a copy you fetched:

```bash
npx infosec-council verify          # or, in a clone: npm run integrity
```

Regenerate after an intended change:

```bash
npm run integrity:write             # node scripts/integrity.js --write
```

CI (`.github/workflows/release.yml`) and `npm test` both run `--check`, so a
modified script that ships without an updated manifest fails the build.

**Shipped config is tracked too, advisory only.** `frameworks.md` and
`external-websources.md` are hashed in a second manifest section. They are meant to be
tuned locally, so drift there is normal and never fails the build — but the register
steers outbound traffic and its Part A is quoted into prompts, so `verify` reports
`locally modified config: <file>` rather than staying silent about the one file this
document tells you to read before you trust it. `context.md` is excluded: it ships blank
and is pure user config, so drift carries no signal.

**SHA-256, deliberately not MD5.** MD5 is collision-broken and unfit as an
integrity control; SHA-256 is the current standard.

**Trust model (honest limits).** The manifest lives in the same repo it protects,
so on its own it reliably detects *accidental corruption* (truncation, CRLF/NUL
damage, a bad sync) and *casual tampering*. It does **not** by itself stop a
determined attacker who controls the repo and can rewrite the manifest too. For a
hard guarantee:

- Prefer **npm build provenance** (Sigstore): publish with `npm publish
  --provenance` from a GitHub Actions workflow that has `id-token: write`, which
  cryptographically ties the package to the exact source commit and CI run, and
  is verifiable by consumers.
- Or compare the manifest's own hash against one published **out of band** (a
  signed release note), rather than trusting the copy that arrived with the code.
- Pin a specific tag/commit when using `npx github:...` rather than a moving
  branch.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via a **GitHub Security
Advisory** on this repository (Security → Report a vulnerability), rather than a
public issue. Include the affected file, a minimal input that triggers it, and
the impact. As an informational, non-production tool there is no formal SLA, but
security reports are prioritised.
