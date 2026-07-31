# Contributing

Improvements are welcome: a new advisor seat, a sharper persona mandate, a `frameworks.md`
update, or a fix. Open an issue to discuss first, or send a pull request.

Contributors are credited here and in the release notes. By contributing you agree your changes
are licensed under the project's terms: MIT for code, CC BY-SA 4.0 for content. See
[LICENSE.md](LICENSE.md) for which is which.

## Before you push

Run the gate. Zero dependencies; `jq` and Python are optional and their checks skip cleanly
when absent.

```bash
npm test
```

That runs, in order: version parity across the three manifests, edition parity across the
council / desktop / ChatGPT protocol mirrors, the SHA-256 integrity manifest, the ChatGPT
knowledge sync and its instruction-byte budget, the report-generator tests, and the journal and
calibration tests.

If you changed any shipped script, regenerate the integrity manifest:

```bash
npm run integrity:write
```

If you changed `frameworks.md`, `context.md` or a persona file, regenerate the ChatGPT
knowledge folder:

```bash
node scripts/sync-chatgpt.js
```

CI runs the same gate on every push and pull request, and again on every version tag. A release
will not build if the three manifests disagree, the tag does not match the version, a shipped
script no longer matches the integrity manifest, or an edition has lost a rule the others state.

## Things worth knowing before you edit

**The three protocol editions are hand-maintained mirrors, not generated.** `SKILL.md`,
`desktop/SKILL.md` and `chatgpt/INSTRUCTIONS.md` legitimately differ. Desktop has no isolated
sub-agents, the GPT has no persistent journal. If you change a load-bearing rule in one, change
it in all three and add a needle to `scripts/check-desktop-parity.js` so the next person cannot
drop it silently.

**`chatgpt/INSTRUCTIONS.md` has a hard 8000-byte ceiling** set by the ChatGPT platform, and it
sits close to it. The budget check warns when headroom gets thin. Do not absorb a protocol
change by shaving prose there. A clause cut to fit is a rule cut to fit. Move detail into a
knowledge file instead; those have no size limit.

**A guard that has never failed is an untested guard.** If you add one, break the thing it
guards and watch it go red before you trust it.

**Regulatory facts carry a "last verified" date.** Moving that date without re-checking
everything is worse than leaving it stale. If you verify one row, date that row.

## Release process (maintainers)

No build artifacts are committed; `dist/` is gitignored. CI builds the desktop and plugin ZIPs
and attaches them to the release, which is what makes the one-click download link in the README
work.

```bash
# 1. bump all three manifests to the same version
#    package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json

# 2. regenerate the integrity manifest and confirm the gate is green
npm run integrity:write && npm test

# 3. tag and push. The tag must match the version or CI fails the release
git tag v2.2.0 && git push origin v2.2.0
```

The release body carries the integrity manifest's own SHA-256, published outside the repo so
the in-repo manifest has an anchor to be checked against.

## Contributors

- **Luméro** (maintainer)

## Reporting a vulnerability

Please do not open a public issue. See [SECURITY.md](SECURITY.md).
