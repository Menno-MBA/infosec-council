# Example Incident Response Report, suspected university-wide ransomware

> **Illustrative example run.** Produced from **Part A only** (what the team
> knows at T0). It shows the shape and reasoning of a good response, not a script
> to copy. Relative timestamps (`T0+NN`) and any figure marked *(illustrative)*
> are placeholders, not real readings. Everything the team could not know at T0
> is not asserted as fact; it sits in the **Assumptions register** with a
> verify-owner. Verified legal facts carry a source and a check date.

- **Reference:** INC-RANSOM / SEV-1
- **Status:** LIVE, treated as one active intrusion until disproven
- **As of:** T0+90 (illustrative), reference date assumed current

---

## 1. Executive summary

Three signals landed in the same window and are being treated as **one active
intrusion until proven otherwise**: the mail platform is down and silent, a
phishing report (link + Excel) is on record from earlier, and files are being
found encrypted across shares. Scope, whether the attacker still has access,
whether backups are clean, and whether data was stolen are all still unknown.

Immediate priorities: (1) stand up out-of-band command and comms, because email
and AD cannot be trusted; (2) contain by network isolation, not power-off,
cutting internet egress, the backup path, the virtualization management path (if
present), and privileged authentication first and quietly; (3) preserve
domain-controller and volatile evidence before anyone re-images; (4) pin the
awareness timestamp and open the GDPR breach register now; (5) call the insurer
before engaging any outside firm, then DFIR and the sector CSIRT. Three
bet-the-organization calls are escalated, not settled here: pay/no-pay,
rebuild-greenfield vs restore, and how widely to notify individuals.

## 2. Triage and severity

- **Severity: SEV-1 / Critical.** Impact is already materialized (files are
  encrypted now), so this is not a "possible" risk. A flat, unsegmented estate,
  loss of the normal coordination channel, and thin holiday staffing all amplify
  it. Re-rate on every material change.
- **Roles named now:** commander (owns tempo and final call), scribe (timestamps
  every decision), evidence custodian (can veto evidence-destroying moves), comms
  and legal with DPO looped in, tech leads for AD, network, backup, plus a
  faculty-IT liaison per affected faculty.
- **Working hypothesis:** one intrusion. On a flat single domain, one stolen
  credential explains both a dead mail server and encrypted shares elsewhere. The
  phishing report is a thread to test, not a proven cause. Forensics owns
  disproving the single-incident theory.

## 3. Incident timeline (illustrative relative stamps)

Wall-clock times are not known at T0; forensics backfills them from tickets and
logs. Entries tagged `[ASSUMED]` rest on a fact not in the inputs; see section 8.

| Time | Event / action | Type |
|---|---|---|
| Pre-T0 (weeks) | Phishing email reported to service desk (link + Excel). Action unknown. | Observation |
| T0 | Mail server unreachable and silent; email down. | Observation |
| T0 | Encrypted files / altered extensions / possible ransom note across shares. | Observation |
| T0+0 | Declared SEV-1; roles named; decision log opened. | Action |
| T0+5 | Email and AD-federated tools declared untrusted; out-of-band channel + war room stood up. | Action |
| T0+15 | Hold order: no touch, no reboot, no re-image on affected hosts. | Action |
| T0+18 | Perimeter egress locked to allowlist (cut C2 cheaply, power stays on). | Action |
| T0+22 | Backup path isolated; jobs paused `[ASSUMED immutable/offline backups exist]`. | Action |
| T0+30 | Virtualization management path isolated `[ASSUMED estate is virtualized]`; Tier-0 accounts frozen. | Action |
| T0+30 | Hypothesis set: one intrusion, phishing report as candidate entry. | Decision |
| T0+45 | Awareness timestamp pinned; GDPR breach register opened. | Action |
| T0+60-90 | First board brief; insurer policy pulled; DFIR + sector CSIRT engaged. | Action |

## 4. Containment: isolation as a dial (power stays on)

Contain by network isolation, not power-off. Cut the highest-leverage paths first
and quietly, then widen; carve out anything that protects human safety.

**Cut first, quietly (minutes):**
1. Internet egress from server VLANs to a tight allowlist (kills command and
   control cheaply, low evidence cost).
2. Backup path: isolate repositories, pause jobs so encrypted data cannot
   overwrite good backups, rotate backup-console credentials. `[ASSUMED backups
   exist and are reachable to protect]`
3. Virtualization management network, if present: a hypervisor compromise is a
   mass-encryption multiplier. `[ASSUMED estate is virtualized]`
4. Privileged authentication: freeze Domain Admin / Tier-0 use; do not push
   AD-wide changes from an AD not yet trusted.

**Widen next (evidence-led):** quarantine VLANs for subnets showing new
encryption; block SMB/RDP lateral paths; suspend non-essential VPN. Re-decide the
dial every 30 to 60 minutes.

**Carve out, never cold-cut:** life-safety and OT, building management, lab-safety
and environmental controls, clinical or live-experiment systems. Assess each with
the facility owner; network-isolate at most, with physical-safety monitoring.

**Percent isolated, tracked honestly:** the highest-leverage cuts (egress, backup
path, virtualization management, Tier-0 freeze) reach effectively full coverage
fast because they are few and central. Host-level isolation across the ~8,900
assets is the long pole and will sit in low single digits *(illustrative)* early
on. Report the real number, do not round up.

## 5. Evidence register and chain of custody

**Sequencing rule (resolves contain-vs-preserve):** network-isolate immediately,
but do not power off or re-image a host until at least a memory capture and a
process/network snapshot exist, or the commander explicitly accepts and logs the
evidence loss.

**Capture order (volatility first):**
- **Tier 0:** live memory + process/network state on the mail server, the first
  encrypted servers, any DC showing interactive attacker logon, and the
  phishing-reported workstation if identifiable.
- **Tier 1:** ransom note from several hosts; a sample encrypted file plus a
  known-good original; DC state (NTDS.dit, SYSTEM hive, Security/System logs)
  **before** any password reset or ticket invalidation; mail server image or at
  least transport logs before any reboot.
- **Tier 2 (perishable):** EDR/AV exports, firewall/proxy/DNS egress logs,
  VPN/remote-access logs, backup-server job history, any netflow.

**Custody with email down:** paper or offline USB-carried log; per item record
collector, UTC+local time, SHA-256 at collection and re-verified at each handoff,
and storage location. Evidence goes to write-once media or an isolated store with
no domain trust.

**Scope read (honest):** patient zero, dwell time, and blast radius are **not yet
established**. With no SIEM, the timeline is a manual correlation of scattered,
faculty-owned sources. In a flat domain, "how far did it spread" largely equals
"where did the stolen credentials work". External DFIR handoff for the deep
timeline is expected.

**Exfiltration read:** **cannot be excluded.** "No evidence of theft" and
"evidence of no theft" are different claims; the team has neither. If egress
logging is thin, exclusion may never be achievable, not merely "not yet". Legal
plans on that basis.

**Top evidence risk right now is us, not the attacker:** stressed faculty IT
re-imaging machines to "just fix it" before capture. The hold order must reach
every faculty.

## 6. Legal and notification tracker

*Volatile facts verified against primary sources; confirm again at run time.*

- **Awareness timestamp:** pinned when a designated incident owner confirms, on
  signals 1 and 3 together, a suspected ransomware event touching personal-data
  systems, not at the first helpdesk ticket. Everything downstream measures from
  this stamp.

| Obligation | Recipient | Clock | Status for this incident |
|---|---|---|---|
| GDPR Art. 33 | Supervisory authority (NL: Autoriteit Persoonsgegevens) | 72h from awareness, phased filing allowed | **Triggered (precautionary)**, risk cannot be excluded |
| GDPR Art. 33(5) register | Internal | Immediate | **Triggered** |
| GDPR Art. 34 | Affected individuals | Without undue delay, **if high risk** | **Cannot tell until scoped** |
| NIS2 / national transposition | Competent authority + sector CSIRT | Verify in-force date and entity scope at run time | **Confirm applicability**, do not assert |
| Sector CSIRT | Education/research CSIRT | No legal clock unless in scope | **Recommended now** |
| Law enforcement | Police / cybercrime unit | No statutory deadline | **Recommended**, timed after evidence secured |
| Cyber insurer | Insurer/broker | Per policy, often a condition precedent | **Call first**, engaging DFIR before insurer notice can void cover `[UNVERIFIED per policy]` |
| Executive board | Controller | Governance, immediate | **Triggered now** |

**The 72-hour reality:** if scope is unknown at 72h, file a **phased**
notification stating what is known and unknown, then follow up. Holiday and
understaffing are not accepted excuses for lateness.

**Do-not-claim list (public):** no "data was not accessed", no "no
health/financial/research data affected", no "fully contained", no attacker name,
no affected-count, no "safe to use again", no statement on ransom. One
spokesperson; all regulator and press contact through Legal.

> **Verify these at run time (they move):** the GDPR authority and its current
> breach guidance; the NIS2 national transposition in-force date and whether a
> research university is an in-scope entity; the correct sector CSIRT. In one
> prior run for a Dutch university, the national NIS2 transposition
> (Cyberbeveiligingswet) was **not yet in force** on the run date, which changed
> the notification picture. Do not assume; confirm.

## 7. Decision log (seed)

| Time | Decision and rationale | Owner |
|---|---|---|
| T0+0 | Declared SEV-1: materialized encryption + correlated mail outage on a flat domain. | Commander |
| T0+5 | Email/AD declared untrusted; out-of-band channel + war room. | Commander |
| T0+15 | Hold order (no touch/reboot/re-image): preserve volatile evidence. | Evidence custodian |
| T0+18 | Perimeter egress to allowlist: cut C2 cheaply, power stays on. | Network lead |
| T0+22 | Backup path isolated, jobs paused: protect good backups. `[ASSUMED backups exist]` | Backup lead |
| T0+30 | Virtualization management isolated, Tier-0 frozen. `[ASSUMED virtualized]` | AD/infra lead |
| T0+30 | Hypothesis = one intrusion; forensics to disprove. | Commander |
| T0+45 | Awareness pinned, breach register opened. | DPO |
| T0+60 | Insurer policy pulled before DFIR engagement. | Legal/Risk |

## 8. Assumptions register

Facts the response acted on that were **assumed, not observed** in Part A. Each is
a lead to confirm or kill, not an established fact; the `[ASSUMED]` tags above
trace here.

| Assumed fact | Basis | What confirms or kills it | Verify-owner | Status |
|---|---|---|---|---|
| The estate is virtualized (a hypervisor management plane exists). | Inferred from ~1,600 servers; not stated. | Infra lead confirms the platform; if mostly physical, the "isolate hypervisor plane" step is a no-op and is dropped. | Infra lead | Open |
| Immutable/offline backups exist and were untouched at compromise. | Assumed so "protect the backups" and "restore from clean media" are viable. | Backup lead verifies immutability and last-known-good from a trusted console. | Backup lead | Open |
| The intrusion is one event (mail outage + encryption + phishing linked). | Working hypothesis on a flat domain, not yet evidenced. | Forensics correlates DC auth logs, phishing sample IOCs, encryption timestamps. | Forensics lead | Open |
| Personal and/or special-category data is in scope (drives GDPR posture). | Assumed from a university's nature; categories unconfirmed. | DPO/forensics identify which data-bearing systems were reached. | DPO | Open |
| EDR/endpoint telemetry exists to reconstruct patient zero. | Hoped-for; coverage likely inconsistent across faculties. | Forensics inventories what logging exists per faculty. | Forensics lead | Open |

## 9. Eradication and recovery plan (gated)

Only after scoping. Remove persistence; rotate all credentials (DC state captured
first); rebuild or restore **only from verified-clean, offline/immutable media**.
Gates before anything returns to production: entry vector closed, persistence
removed, credentials rotated, backups proven clean and proven offline at time of
compromise, AD trust re-established from a known-good baseline.
**Rebuild-greenfield vs restore is a council/board call.**

## 10. Escalate to the council / board (not settled here)

- **Pay vs no-pay**, with mandatory sanctions screening of actor/wallet before
  any contact.
- **Rebuild-greenfield vs restore** the domain.
- **Notification breadth** under GDPR Art. 34: whether and how widely to tell
  individuals, and by what channel with email down.

## 11. Lessons and next steps (feed to the blue team)

- Flat single AD domain is the core weakness; no segmentation to slow lateral
  movement.
- No central SIEM or monitoring meant the intrusion ran unseen.
- No pre-agreed out-of-band comms and no pre-staged forensic tooling slowed hour
  one.
- Backup immutability and segmentation of the backup and virtualization paths are
  decisive.
- Holiday coverage and escalation need a standing on-call plan.

**Single most useful next step:** stand up out-of-band command now (physical war
room + a freshly created, phone-invited secure channel) and issue the estate-wide
hold order, then execute the four quiet cuts in the first 30 minutes. Everything
else depends on a trustworthy way to coordinate and a preserved scene.
