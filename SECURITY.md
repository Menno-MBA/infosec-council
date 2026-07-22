# Security

This project is a set of **zero-dependency, local** scripts: a Node installer
(`bin/cli.js`), four HTML report generators (`report.js`), a decision journal
(`journal.js`), and bash/Python equivalents. They are fetched from GitHub and run
on the user's own machine (`npx`, plugin install, or Claude Code). There is no
server and no network calls at runtime; generated dossiers embed their assets
(base64) and render offline.

## Threat model

| Asset | Threat | Control |
|---|---|---|
| The generated HTML dossier | A crafted/booby-trapped input JSON (`plan.json`, `incident.json`, a journal line) injects script or CSS that fires when a human opens or shares the dossier (stored XSS / CSS injection). | Every value taken from the input JSON is HTML-escaped before it reaches the DOM; CSS colours are validated against an allowlist; numeric widths/positions are coerced and clamped. See "Input handling". |
| The scripts themselves | Fetched from GitHub and run locally, so a corrupted or altered copy could run unnoticed. | SHA-256 integrity manifest + `verify` command (see "Integrity"). |
| The install target | Path traversal or arbitrary write/delete during install or report output. | All installer paths derive from the package root, the home directory, and fixed constants, never from untrusted input; the one JSON-derived filename component (the council report `sha`) is sanitised to a safe charset. |

Out of scope (operator trust boundary): environment variables the operator sets
themselves (`LUMERO_LOGO*` image path/URL, `*_REPORT_DIR`, `COUNCIL_HOME`) and a
`--in <file>` path the operator chooses. These are trusted operator input.

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
