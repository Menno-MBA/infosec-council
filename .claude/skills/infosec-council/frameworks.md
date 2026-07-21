# Council Frameworks and Baselines, single source of truth

This file is the council's shared reference for every regulation, standard,
guideline, and technology the personas rely on. Personas reference subjects **by
name** and inherit the canonical version / level / scope from here, so a change
made **once** here propagates to every persona that cites it.

The orchestrator (SKILL.md) loads this file and injects it into every member's
prompt before deliberation. Maintain catalog facts here; do **not** re-hardcode
versions, control-baseline levels, or regime scope inside the persona files.

> **Register last verified: 2026-07-11.** Regulatory facts move faster than this
> file. Any seat that leans on a regulation's status, a deadline, a standard
> version, or a vendor fact that could have changed since the date above must
> verify it against a primary source (or mark it `UNVERIFIED`), per the
> volatile-fact rule in SKILL.md. Treat a stale row as a prompt to check, not as
> settled truth. Rows carrying a near-term or moving date are flagged **[VERIFY]**.

---

## Part A. Council configuration (the tunable knobs)

Flip a value here and every persona inherits it.

| Knob | Current value | Options / notes |
|---|---|---|
| **Control baseline** | **CIS Controls IG1** | IG1 / IG2 / IG3. Raise as the company matures or data sensitivity grows. This is the one-line flip that re-levels the whole council. |
| Jurisdiction | EU / Netherlands | Supervisory authority: Autoriteit Persoonsgegevens (AP); EDPB |
| Company profile | SME, SaaS-first, mostly buys not builds | Drives "right-sized, not enterprise" framing everywhere |
| Backup standard | 3-2-1-1-0 (immutable/offline plus zero verified restore errors) | 3-2-1 is the floor |
| MFA standard | Phishing-resistant (FIDO2 / passkeys) preferred | Any MFA beats none |
| Default risk posture | Owner-set, elicit and make explicit | averse / neutral / seeking |
| Quantification depth | Qualitative / semi-quantitative | Promote to FAIR-style money-quant only past IG2 or on a regulatory driver |

### Risk scoring scale (qualitative)

The council rates each decision on a qualitative impact x likelihood scale, and the report
renders it as a standard 5x5 heat map. It rates the decision or change, not only a vulnerability.

| Impact | Value | Meaning |
|---|---|---|
| **Negligible** | 1 | Minimal impact on service; negligible cost. |
| **Minor** | 2 | Limited impact on service; light damage at low cost. |
| **Moderate** | 3 | Moderate to serious damage, high cost, possible legal consequences. |
| **Major** | 4 | Major damage, high cost, likely legal or regulatory consequences. |
| **Severe** | 5 | Severe legal consequences; lasting damage or being put out of operation. |

| Likelihood | Value | Meaning |
|---|---|---|
| **Rare** | 1 | Conceivable, but unlikely. |
| **Unlikely** | 2 | Could occur, but is not expected. |
| **Possible** | 3 | Unlikely, but plausible in edge cases. |
| **Likely** | 4 | More likely than not to occur. |
| **Almost certain** | 5 | Occurring now, or virtually certain to materialize. |

Exposure score = impact x likelihood, each scored 1 to 5, giving a score out of 25. The report
renders it as a horizontal exposure bar with a marker, banded as:

| Exposure score | Band |
|---|---|
| 1 to 4 | Low |
| 5 to 9 | Moderate |
| 10 to 15 | High |
| 16 to 25 | Critical |

**Score inherent and residual.** Rate each decision twice: inherent exposure (the current state, before the recommended response) and residual exposure (what remains after it is executed as intended). The report draws both as two markers on the same bar, so the gap is the visible value of the recommendation. When an adverse impact has already been observed or confirmed (files encrypted, an outage under way, data exposed), the risk has materialized: score its likelihood as Almost certain, never Possible. Rating an already-observed impact as merely Possible is the most common scoring error and makes an active incident read as far lower than it is.

The three report generators (report.js, report.sh, report.py) accept the legacy 3-level words too (Limited, Serious, Severe; Rare, Possible, Likely) so older journal entries still render; new runs should use the 5-level vocabulary above.

### In-scope regulatory regimes (toggle as the business changes)

| Regime | In scope? | Trigger to flip "Yes" |
|---|---|---|
| GDPR | **Yes** | Any processing of personal data |
| ePrivacy / cookies | **Yes** (if website/marketing) | Non-essential cookies / tracking |
| NIS2 / Cyberbeveiligingswet (Cbw) | **Yes from 2026-08-15** [VERIFY] | NL transposition (Cbw) passed the Eerste Kamer 2026-07-07; in force **15 Aug 2026** together with the Wwke. From that date: zorgplicht, meldplicht (24h/72h/1-month), and registration with the NCSC apply to essential/important entities in scope. |
| DORA | No (horizon-scan only) | You become a financial entity or an ICT provider to one |
| EU AI Act | **Partly in force** [VERIFY] | Prohibited practices + AI literacy (Arts. 4, 5) apply since 2 Feb 2025; GPAI since 2 Aug 2025; **Art. 50 transparency from 2 Aug 2026**. High-risk (Annex III) obligations were **delayed to 2 Dec 2027** by the Digital Omnibus (Annex I embedded to 2 Aug 2028). Flip fuller scope on when you build or deploy AI. |
| Cyber Resilience Act (CRA) | If shipping products with digital elements | You ship hardware/software products. **Art. 14 reporting from 11 Sep 2026** [VERIFY] (imminent); main obligations 11 Dec 2027. |
| PCI DSS | If card data is handled | You store/process/transmit cardholder data |
| SOC 2 | Customer-driven | A (US/enterprise) buyer requires it; voluntary, not law |

---

## Part B. Reference register (subject, canonical detail, who cites it)

The **Personas** column is the cross-reference: it shows, per subject, which seats
rely on it. CISO=CISO, ARCH=Security Architect, OFF=Offensive Security, OPS=Security
Operations, COMP=Compliance, DPO=DPO, RISK=Risk Manager.

| Ref | Canonical name / current version | Category | One-line | Personas |
|---|---|---|---|---|
| CIS Controls | CIS Critical Security Controls **v8.1**; baseline = **IG1** (Part A) | Controls | Prioritized safeguards; IG1 = SME baseline | ARCH, OPS, COMP, RISK, CISO |
| CIS Benchmarks | current | Hardening | Secure-config baselines per platform | ARCH, OPS |
| CIS RAM | Center for Internet Security Risk Assessment Method | Method | SME-friendly risk assessment tied to the CIS Controls | RISK |
| NIST CSF | **CSF 2.0** (2024); functions GV/ID/PR/DE/RS/RC | Framework | Outcome-based cyber-risk framework | CISO, OPS |
| NIST SP 800-61 | **Rev. 3** (2025), CSF 2.0-aligned | Guideline | Incident-response lifecycle | OPS |
| SANS PICERL | Prep/Identify/Contain/Eradicate/Recover/Lessons | Guideline | IR execution model | OPS |
| Evidence preservation | per NIST SP 800-61r3 (preserve before remediate) | Guideline | Snapshot systems and export logs before wiping/restore | OPS |
| MITRE ATT&CK | current | Knowledge base | Adversary TTPs; detection-coverage map | OPS, OFF |
| ISO/IEC 27001 | **2022** (incl. Amd 1:2024, climate action); Annex A risk-selected via the SoA | Standard (certifiable) | ISMS certification. The 2013-edition transition ended 31 Oct 2025, so any 2013 reference is dead. | CISO, COMP |
| ISO/IEC 27002 | **2022**; 93 controls, 4 themes | Standard | Control catalogue | COMP, ARCH |
| ISO/IEC 27701 | **2025** (publ. 14 Oct 2025; supersedes 2019) [VERIFY] | Standard (certifiable) | Privacy information management (PIMS); now a **standalone**, independently certifiable management system (ISO 27001 no longer a prerequisite). 2019-certificate transition runs to ~Oct 2028. | COMP, DPO |
| ISO/IEC 27005 | **2022** | Guideline | Infosec risk process | RISK |
| ISO 31000 / 31073 | 2018 / 2022 | Standard / vocabulary | Risk-mgmt principles and terms (appetite, tolerance, attitude, treatment) | RISK |
| SOC 2 | AICPA **Trust Services Criteria**; Type I/II; CPA attestation | Attestation | Customer-driven trust report (not a certification) | COMP |
| PCI DSS | **v4.0.1**; fully in force | Standard | Cardholder-data security | COMP |
| Cyber Essentials | CE / CE Plus (UK scheme); Requirements **v3.3 "Danzell"** for assessments from 26 Apr 2026 (MFA on all cloud services and 14-day critical patching now auto-fail) [VERIFY] | Scheme | Baseline technical controls; UK-scheme, weigh whether it earns its place for a NL/EU entity | CISO, COMP, ARCH |
| GDPR | Reg. (EU) 2016/679; core entity obligations Arts. 5, 6, 25, 28, 30, 32, 33 to 34, 35, 37 to 39 (plus 9 and 44 to 49 where applicable; data-subject rights and the remaining articles per the Regulation, not enumerated) | Regulation | Data-protection law | DPO, COMP, RISK, OPS |
| ePrivacy | Dir. 2002/58/EC (NL: Telecommunicatiewet 11.7a) | Regulation | Cookies / consent | DPO |
| NIS2 / Cbw | Dir. (EU) 2022/2555, transposed per member state (NL: Cyberbeveiligingswet/Cbw). **NL Cbw in force 15 Aug 2026** [VERIFY] (Eerste Kamer 2026-07-07); check your own country's transposition, which can differ on scope, thresholds, and deadlines. Entity obligations Arts. 20 (governance/management accountability), 21 (risk-management measures), 23 (incident reporting: 24h/72h/1-month); NL adds registration with the NCSC. | Regulation (directive) | Cyber risk-management and reporting duties | CISO, COMP, OPS |
| DORA | Reg. (EU) 2022/2554 (applies since 17 Jan 2025); entity obligations Arts. 5 to 6 (governance + ICT risk-management framework), 19 (major-incident reporting), 24 (resilience testing), 28 (ICT third-party risk) | Regulation | Financial-sector ICT resilience; horizon-scan unless you are a financial entity or an ICT provider to one | COMP |
| EU AI Act | Reg. (EU) 2024/1689 (phased) [VERIFY]. Arts. 4 (AI literacy) and 5 (prohibited practices) apply since 2 Feb 2025; GPAI since 2 Aug 2025; **Art. 50 transparency from 2 Aug 2026** (chatbots + synthetic-content marking). High-risk obligations (Art. 26 deployers / Arts. 8 to 16 providers) were **postponed by the Digital Omnibus**: Annex III to **2 Dec 2027**, Annex I embedded to 2 Aug 2028 (Council final approval 29 Jun 2026). | Regulation | AI governance | COMP, DPO |
| CRA | Reg. (EU) 2024/2847 [VERIFY]: **Art. 14 reporting from 11 Sep 2026** (imminent); main obligations from 11 Dec 2027; manufacturer obligations Art. 13 + Annex I (essential cybersecurity requirements), Art. 14 (actively-exploited-vulnerability and severe-incident reporting: 24h/72h/14-day, via the ENISA single reporting platform) | Regulation | Product cybersecurity | COMP, ARCH |
| EU-US DPF | adequacy Decision (EU) 2023/1795 (verify current status before relying on it) | Transfer mechanism | Transfers to certified US importers | DPO |
| SCF | Secure Controls Framework (NIST IR 8477 STRM) | Metaframework | Crosswalk backbone ("comply once, satisfy many") | COMP |
| NIST OLIR | Online Informative References | Mapping | Authoritative framework crosswalks | COMP |
| Threat Modeling Manifesto | 2020; four questions | Guideline | Threat-modeling framing | ARCH |
| STRIDE | Microsoft | Method | Security threat taxonomy | ARCH |
| LINDDUN | KU Leuven | Method | Privacy threat taxonomy | ARCH, DPO |
| OWASP | ASVS, Top 10, Threat Dragon | Guideline / tooling | App-security standards | ARCH |
| Zero Trust | NIST SP 800-207 | Principle | Identity-centric, no implicit trust | ARCH |
| Secure by Design/Default | CISA (2023) | Principle | Vendor-shifted secure defaults | ARCH |
| Cloud shared responsibility | provider-vs-customer split | Model | Who secures what in SaaS/cloud | ARCH, OPS |
| Secure-config baselines | CISA SCuBA, Microsoft Secure Score | Baselines | Hardening / posture targets | ARCH, OPS |
| Phishing-resistant MFA | FIDO2 / passkeys (CISA) | Technology | Identity control | ARCH, OPS |
| Secure SDLC / SSDF | NIST SP 800-218 | Guideline | Only if you build software | ARCH |
| Backup standard | per Part A (3-2-1-1-0) | Technology | Ransomware antidote; tested restore | OPS, RISK |
| Audit logging | CIS Control 8 (IG1: 8.1 to 8.3) | Control | "Can't investigate what you didn't log" | OPS |
| NIST IR 7621 | Rev. 1 (2016); Rev. 2 in draft. In practice NIST's primary SME guidance is now the **CSF 2.0 Small Business Quick Start Guide (SP 1300, 2024)** | Guideline | Small-business infosec fundamentals | RISK, OPS, ARCH |
| ENISA SME guidance | Cybersecurity for SMEs / 12 steps | Guideline | EU SME baseline | RISK, OPS |
| NCSC Small Business Guide | UK | Guideline | SME baseline and IR | OPS |
| FAIR | Open FAIR (FAIR Institute) | Method | Quantitative risk, usually overkill for an SME | RISK |
| Cyber insurance | transfer control with control prerequisites | Treatment | Shifts financial impact; needs MFA/EDR/backups/IR plan | RISK |
| IIA Three Lines | 2020 | Model | 1st/2nd/3rd-line roles and independence | RISK, COMP, DPO |

---

## Part B2. Horizon scan (proposed, not yet law, verify before relying)

Do not treat these as in force. Surface them as "coming, watch it", never as a
current obligation or relief.

| Item | Status at 2026-07-11 [VERIFY] | Why it matters for an EU SME |
|---|---|---|
| GDPR "Omnibus IV" record-keeping relief | Provisional Parliament/Council agreement 9 Jun 2026; **not yet adopted**. Would extend the Art. 30(5) RoPA exemption to organisations under ~750 employees. | Do **not** tell an SME the RoPA duty is lifted; it is not, yet. |
| Digital Omnibus (broader GDPR + AI changes) | Proposed 19 Nov 2025; in committee. | May reshape several duties; horizon-scan only. |
| EU-US Data Privacy Framework | Adequacy Decision (EU) 2023/1795 **remains valid**; General Court dismissed Latombe (3 Sep 2025); **CJEU appeal pending** (no suspensive effect). | Keep an SCC fallback ready; note residual legal risk on US transfers. |
| ISO 31000 revision | ISO/CD 31000 under development; 2018 still current. | No action; expect a future refresh of risk vocabulary. |

---

## Part C. Obligation registry (conditional, config-driven)

Some duties are not opinions to be argued; they are **conditional obligations** that either apply or do not, and if they apply they have an owner, a clock, and a recipient. This registry lists them so the council **determines** each one explicitly before it deliberates, instead of hoping a persona happens to raise it. Every row is evaluated in the determination pass (see SKILL.md) and returns exactly one of two outcomes: **TRIGGERED** (a required action) or **NOT TRIGGERED** (recorded, with a one-line reason, in the explicit-negative ledger). A general EU-SME run returns mostly NOT TRIGGERED, which is the correct, auditable default.

The **determination owner** is the seat that evaluates the trigger, and is always a council seat. The **execution owner(s)** carry the action if it fires; these may be operational roles that sit outside the seven seats (for example Legal & Comms, mirrored by the incident team's legal-comms seat), which the Chairman routes the action to. Determination is a compliance judgement; execution is operational, and the split is deliberate so a cross-cutting duty like outbound reporting is never collapsed into one seat and then dropped.

Triggers reference the in-scope table (Part A) and the reference register (Part B); resolve them from there, never from memory. A row whose regime is not in scope returns NOT TRIGGERED by scope.

| id | Obligation | Trigger | Determination owner | Execution owner(s) | Clock | Recipient | Ref |
|---|---|---|---|---|---|---|---|
| `gdpr_breach_dpa` | Notify the supervisory authority of a personal-data breach | Personal-data breach likely to risk individuals' rights (GDPR in scope) | DPO | DPO | 72h from awareness | Autoriteit Persoonsgegevens (AP) | GDPR Art.33 |
| `gdpr_breach_subjects` | Notify affected individuals | Breach likely to result in **high** risk to individuals | DPO | DPO + CISO | Without undue delay | Affected data subjects | GDPR Art.34 |
| `nis2_early_warning` | Early warning of a significant incident | NIS2/Cbw in scope (essential/important entity) and a significant incident | Compliance | CISO (notifier) + Legal & Comms | 24h from awareness | CSIRT / NCSC (national) | NIS2 Art.23 / Cbw |
| `nis2_notification` | Incident notification | as above | Compliance | CISO (notifier) + Legal & Comms | 72h from awareness | CSIRT / NCSC | NIS2 Art.23 / Cbw |
| `nis2_final_report` | Final report | as above | Compliance | CISO (notifier) + Legal & Comms | 1 month after notification | CSIRT / NCSC | NIS2 Art.23 / Cbw |
| `ioc_sharing` | Share indicators / threat intel | A CERT/CSIRT affiliation exists (voluntary) | Compliance | Security Operations | ASAP (voluntary, not a statutory clock) | Sector CERT / CSIRT | NIS2 Art.29 |

**NIS2/Cbw dates are load-bearing.** The NL Cbw is in force **from 15 Aug 2026** [VERIFY] (see the in-scope table); before that date, and for an entity not in NIS2 scope, all four NIS2 rows return NOT TRIGGERED and the GDPR clock, not a perceived NIS2 deadline, governs the response. Check your own country's transposition, which can differ on scope, thresholds, and deadlines.

### Candidate registrations (register when ready; each is one row, no mechanism change)

| id | Obligation | Trigger | Determination owner | Execution owner(s) | Clock | Ref |
|---|---|---|---|---|---|---|
| `dpia_special_category` | Data-protection impact assessment | Special-category or large-scale monitoring data in scope | DPO | DPO + Security Architect | Before processing begins | GDPR Art.35 (Art.36 prior consultation on high residual risk) |
| `art28_processor_gate` | Processor terms before data leaves the estate | Personal data is handed to a processor (e.g. an external DFIR firm) | DPO / Compliance | Legal | Before the hand-off | GDPR Art.28 |
| `control_baseline_shift` | Re-level controls | A sector or regime change raises the required control baseline | Compliance | Security Architect + Security Operations | Per remediation plan | frameworks.md Part A (control baseline) |

To register a new obligation, add one row above and name a determination owner and execution owner(s); the determination pass evaluates it and the Chairman's obligation-omission gate enforces it automatically.

---

## Part D. How to maintain

- **Raise the security bar:** change **Control baseline** in Part A from `IG1` to `IG2`
  (or `IG3`). Every persona cites "the control baseline," so all seats re-level at once.
- **Bring a regime into scope:** flip its row in the in-scope table (e.g. NIS2/Cbw once
  the Dutch transposition is in force, or DORA if you become a financial entity). The
  Compliance seat and any affected seat will then treat it as live.
- **Register a new conditional obligation:** add one row to Part C (id, trigger,
  determination owner, execution owner(s), clock, recipient, ref). The determination pass
  evaluates it and the Chairman's obligation-omission gate enforces it; no code change is needed.
- **A standard version bumps** (e.g. PCI DSS v4.0.1 to the next): change it once in Part B.
- **Personas reference subjects by name** and inherit detail from here. Do not
  re-hardcode versions, IG levels, or regime scope inside persona files.

### Convention on inline detail (resolve the maintainability question once)

Personas may name their *signature* anchors inline for readability (e.g. SecOps naming
PICERL, the architect naming STRIDE). They must NOT carry the canonical **version, IG
level, article numbers, or in-scope status** inline. On any conflict between a persona
and this file, **this file wins**. Treat that as the rule when reviewing or editing a
persona.
