# Council House Context, strategic configuration

This file is the council's standing **strategic** context for one organization:
its architecture preferences, its categorical risk-appetite boundaries, and the
strategic decisions it has already taken. Where `frameworks.md` holds the
**regulatory** configuration (what the law and the standards require), `context.md`
holds the **strategic** configuration (what this organization has decided and prefers).

The orchestrator (SKILL.md) loads this file and injects it into every member's prompt
before deliberation, alongside `frameworks.md`. Fill in Parts A to D by hand; the
council appends observations to Part E over time.

---

## CRITICAL: house positions are defaults, not doctrine

> House positions in context.md are standing defaults, NOT doctrine.
> Challenge them when your mandate warrants it, and state explicitly
> when you are overriding a house position and why.

A house-context file is dangerous to an adversarial council: left unchecked it turns
the seats into a confirmation machine (anchoring), and you lose exactly the
disagreement that gives this council its value. The rule above is load-bearing. Keep
it. Every member is licensed, indeed expected, to attack a house position when their
mandate warrants it.

---

## Part A. Architecture preferences (standing defaults)

How this organization prefers to build, buy, and host. State the preference *and* the
reason, so a seat can judge whether the reason still holds for the decision at hand.

| Area | Standing preference | Rationale / trigger |
|---|---|---|
| Data residency / hosting | _e.g. Art. 9 or trade-secret data stays on an own EU endpoint, not vendor-orchestrated_ | _confidentiality + cross-border transfer exposure_ |
| Build vs buy | _e.g. buy and configure SaaS by default; build only for differentiating IP_ | _limited headcount_ |
| Identity | _e.g. one IdP, SSO-first, phishing-resistant MFA_ | _reduce attack surface and admin overhead_ |
| _add rows as needed_ | | |

## Part B. Risk-appetite boundaries (categorical)

Risks that are categorically **out of appetite**, regardless of ROI or business upside.
Treat these as gates, not tradeoffs. A seat may still argue one should change, but must
say so explicitly (see the anti-anchoring rule above). Tunable appetite *levels* live
in `frameworks.md` Part A; the hard lines live here.

| # | Categorically out of appetite | Why it is a hard line |
|---|---|---|
| 1 | _e.g. customer PII processed outside the EU/EEA without an adequacy or SCC basis_ | _legal + reputational_ |
| 2 | _e.g. any production system without tested, immutable backups_ | _ransomware survivability_ |
| _add as needed_ | | |

## Part C. Prior strategic decisions and preferred patterns

Decisions already taken and the vendors/patterns the organization defaults to, so the
council does not relitigate settled ground, unless a seat shows the basis has changed.

| Date | Decision / preferred vendor or pattern | Still load-bearing because | Revisit if |
|---|---|---|---|
| _YYYY-MM_ | _e.g. standardized on <IdP>, <EDR>, <cloud>_ | _..._ | _..._ |
| _add as needed_ | | |

## Part D. Role map (who actually holds each duty here)

The seven seats are lenses, not staff. Most SMEs have no in-house DPO, SOC, or CISO, so
an action routed to "the DPO" can be an action routed to nobody. Name who carries each
duty in this organization: a person's role (not their name), an external provider, or
`nobody`. The chairman routes every owner in the action plan and the obligations ledger
through this table; a `nobody` row is reported as a risk, not filled in with a guess.
Leave a row as the placeholder and it reads as `unassigned (<duty>)`.

| Duty | Held by here | Notes |
|---|---|---|
| Security program, delivery and capacity | _e.g. managing director, with the MSP_ | |
| Risk acceptance (signs off residual risk) | _e.g. managing director_ | |
| Platform configuration and hardening | _e.g. MSP_ | |
| Detection, response and recovery | _e.g. MDR provider; MSP out of hours_ | |
| Compliance evidence and certification | _e.g. office manager, or nobody_ | |
| GDPR breach notification and data-protection advice | _e.g. external DPO service_ | |
| NIS2/Cbw notification (notifier) | _e.g. managing director, or "not in scope"_ | |
| Finance process controls (payment changes, callback verification) | _e.g. finance lead_ | |
| Supplier and contract management | _e.g. operations lead_ | |
| Backups and tested restore | _e.g. MSP_ | |

---

## Part E. Organization context (auto-appended)

Durable organizational facts the council learns over time (size, sector, data types,
key constraints), so future runs start better-informed. Treat these as observations,
not commitments; promote anything strategic into Parts A to D by hand. The council adds
dated bullets between the markers below; do not remove the markers.

<!-- COUNCIL:AUTO-CONTEXT:BEGIN -->
<!-- Nothing recorded yet. The council appends dated bullets here, e.g.:
- 2026-06-23: ~25 staff, B2B SaaS, SOC 2 in progress, no in-house security hire. -->
<!-- COUNCIL:AUTO-CONTEXT:END -->
