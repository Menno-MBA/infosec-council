#!/usr/bin/env bash
# Assemble the Claude.ai / Desktop skill ZIP from the canonical sources.
# Single source of truth: personas live in .claude/agents, scripts/assets in
# .claude/skills/infosec-council. This script copies them into one uploadable folder.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$ROOT/dist/infosec-council"          # folder that becomes the zip's top dir
ZIP="$ROOT/dist/infosec-council-desktop.zip"

rm -rf "$BUILD" "$ZIP"; mkdir -p "$BUILD/personas"
cp "$ROOT/desktop/SKILL.md"                              "$BUILD/SKILL.md"
cp "$ROOT/.claude/skills/infosec-council/frameworks.md"  "$BUILD/frameworks.md"
cp "$ROOT/.claude/skills/infosec-council/context.md"     "$BUILD/context.md"
# Council edition ships only the seven council personas (the operational
# red/blue/incident team personas belong to the Claude Code / plugin edition).
for p in ciso security-architect offensive-security security-operations compliance-analyst dpo risk-manager; do
  cp "$ROOT/.claude/agents/$p.md"                         "$BUILD/personas/"
done
cp "$ROOT/.claude/skills/infosec-council/report.js"      "$BUILD/report.js"
cp "$ROOT/.claude/skills/infosec-council/report.sh"      "$BUILD/report.sh"
cp "$ROOT/.claude/skills/infosec-council/journal.js"     "$BUILD/journal.js"
cp "$ROOT/.claude/skills/infosec-council/journal.sh"     "$BUILD/journal.sh"
cp -r "$ROOT/.claude/skills/infosec-council/assets"      "$BUILD/assets"
chmod +x "$BUILD/"*.sh

( cd "$ROOT/dist" && zip -r -q "infosec-council-desktop.zip" "infosec-council" )
echo "built: $ZIP"
echo "upload this in Claude.ai/Desktop:  Settings > Capabilities (enable Code execution"
echo "and file creation) then Customize/Features > Skills > + Create/Upload skill."
