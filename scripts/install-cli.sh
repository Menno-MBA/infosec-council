#!/usr/bin/env bash
# Install the council for Claude Code (CLI) GLOBALLY (~/.claude), so it's available
# in every project. Skip this and just run `claude` from the repo to use it project-scoped.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$HOME/.claude/agents" "$HOME/.claude/skills"
cp "$ROOT/.claude/agents/"*.md "$HOME/.claude/agents/"
cp -r "$ROOT/.claude/skills/infosec-council" "$HOME/.claude/skills/"
echo "installed 7 agents -> ~/.claude/agents/ and skill -> ~/.claude/skills/infosec-council"
echo "open Claude Code anywhere and try:  convene the council: <your decision> deep"
