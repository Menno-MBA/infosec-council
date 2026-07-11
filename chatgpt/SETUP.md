# Information Security Council, ChatGPT (custom GPT) edition

A third edition alongside Claude Code (CLI) and Claude.ai/Desktop. A custom GPT has one
model and one context and no sub-agents, so it maps onto the **Desktop** design: the GPT
role-plays all seven advisors sequentially in a single context, then synthesizes.

## How it maps

| Council piece | In the GPT |
|---|---|
| Orchestrator (SKILL.md) | the **Instructions** field (see `INSTRUCTIONS.md`) |
| 7 advisor personas | **Knowledge** file `council-personas.md` |
| Regulatory single source of truth | **Knowledge** file `frameworks.md` |
| Strategic house-context | **Knowledge** file `context.md` (ship the blank template, see privacy note) |
| Sub-agents (parallel, isolated) | not available; personas are role-played in one context |
| `report.sh` (bash) HTML report | `report.py` (Python) run by **Code Interpreter** |
| Luméro branding on the report | logos `lumero-logo-black.webp` / `lumero-logo-white.webp` |
| Decision journal (`journal.jsonl`) | not portable (no persistent FS); export the HTML report instead |

## Fill in the GPT builder with these values

**Name**

```
Information Security Council by Luméro
```

**Description**

```
Seven security advisors (CISO, architect, red team, ops, compliance, DPO, risk) debate your security, privacy, compliance or risk decision and return one synthesized verdict, with confidence, key risks and a clear next step. Built for EU SMEs. By Luméro.
```

**Instructions**: paste the full contents of `INSTRUCTIONS.md` (5.5k chars, within the 8k limit).

**Conversation starters**

```
Ask the council: should we let an AI note-taker join customer calls and store transcripts? ~25 staff, B2B SaaS, SOC 2 in progress. -deep
Ask the council: a phishing email led to a compromised Microsoft 365 account with new mailbox forwarding rules. Blast radius, response, and our GDPR/NIS2 notification duties? -deep
Ask the council: do we need a DPO, and what are our NIS2 obligations as a 60-person EU SaaS?
Stress-test this: adopting a US marketing tool that processes customer emails. -deep
```

**Knowledge** (upload all of `chatgpt/knowledge/`):

- `council-personas.md`        the seven advisor definitions
- `frameworks.md`              regulations/standards single source of truth
- `context.md`                 strategic house-context (blank template, see privacy note)
- `report.py`                  Python report generator (Code Interpreter)
- `CREDITS.md`                 license + attribution (CC BY-SA 4.0, claude-council)
- `lumero-logo-black.webp`     report header logo (light)
- `lumero-logo-white.webp`     report footer logo (dark)

**Recommended Model**

```
GPT-5.4 Thinking  (the reasoning model)
```

A council is only as good as the depth of its reasoning, so default to the **Thinking /
reasoning** model, not the Instant model. On a Pro plan, the GPT-5.5 flagship is an even
stronger choice. (Model names as of June 2026; pick the strongest reasoning model your
plan offers.)

**Capabilities**

| Capability | Set | Why |
|---|---|---|
| Web Search | **ON** | Verify current regulation status and framework versions (e.g. EU-US DPF, a standard's version) instead of relying on memory. |
| Code Interpreter & Data Analysis | **ON** | Required to run `report.py` and produce the branded, downloadable HTML dossier. |
| Canvas | Off (optional) | Could be used to co-edit the verdict, but the HTML report already covers polished output. |
| Image Generation | Off | Not relevant to a security advisory council. |

## Privacy note (important for a PUBLIC GPT)

The builder warns that conversations can reveal the **instructions** and the **uploaded
files**. That is fine for `council-personas.md`, `frameworks.md`, `report.py` and the
logos (all your own, openly licensed). But do **not** upload a `context.md` filled with
real, confidential organization data to a public GPT, it could leak. Ship the **blank
template** `context.md` and let each user paste their own house-context into the chat.

## Note on licensing and attribution

This edition is the same project, so the same dual license applies (MIT for `report.py`,
CC BY-SA 4.0 for the council content), and the multi-agent architecture is adapted from
`TorpedoD/claude-council` (see the main README Credits). Keep that attribution if you
publish the GPT.
