# Council Frameworks & Baselines — single source of truth

This file is the council's shared reference for every regulation, standard,
guideline, and technology the personas rely on. Personas reference subjects **by
name** and inherit the canonical version / level / scope from here — so a change
made **once** here propagates to every persona that cites it.

The orchestrator (SKILL.md) loads this file and injects it into every member's
prompt before deliberation. Maintain catalog facts here; do **not** re-hardcode
versions, control-baseline levels, or regime scope inside the persona files.

---

## Part A — Council configuration (the tunable knobs)

Flip a value here and every persona inherits it.

| Knob | Current value | Options / notes |
|---|---|---|
| **Control baseline** | **CIS Controls IG1** | IG1 / IG2 / IG3 — raise as the company matures or data sensitivity grows. This is the one-line flip that re-levels the whole council. |
| Jurisdiction | EU / Netherlands | Supervisory authority: Autoriteit Persoonsgegevens (AP); EDPB |
| Company profile | SMB, SaaS-first, mostly buys not builds | Drives "right-sized, not enterprise" framing everywhere |
| Backup standard | 3-2-1-1-0 (immutable/offline + zero verified restore errors) | 3-2-1 is the floor |
| MFA standard | Phishing-resistant (FIDO2 / passkeys) preferred | Any MFA beats none |
| Default risk posture | Owner-set — elicit and make explicit | averse / neutral / seeking |
| Quantification depth | Qualitative / semi-quantitative | Promote to FAIR-style money-quant only past IG2 or on a regulatory driver |

### In-scope regulatory regimes (toggle as the business changes)

| Regime | In scope? | Trigger to flip "Yes" |
|---|---|---|
| GDPR / UK GDPR | **Yes** | Any processing of personal data |
| ePrivacy / cookies | **Yes** (if website/marketing) | Non-essential cookies / tracking |
| NIS2 / Cyberbeveiligingswet (Cbw) | **Where in scope** | Essential/important entity in a critical sector; binding on NL transposition (the Cbw) entering into force |
| DORA | No | You become a financial entity or an ICT provider to one |
| EU AI Act | If building/deploying AI | You build or deploy AI systems |
| Cyber Resilience Act (CRA) | If shipping products with digital elements | You ship hardware/software products |
| PCI DSS | If card data is handled | You store/process/transmit cardholder data |
| SOC 2 | Customer-driven | A (US/enterprise) buyer requires it — voluntary, not law |

---

## Part B — Reference register (subject → canonical detail → who cites it)

The **Personas** column is the cross-reference: it shows, per subject, which seats
rely on it. CISO=CISO, ARCH=Security Architect, OFF=Offensive Security, OPS=Security
Operations, COMP=Compliance, DPO=DPO, RISK=Risk Manager.

| Ref | Canonical name / current version | Category | One-line | Personas |
|---|---|---|---|---|
| CIS Controls | CIS Critical Security Controls **v8.1**; baseline = **IG1** (Part A) | Controls | Prioritized safeguards; IG1 = SMB baseline | ARCH, OPS, COMP, RISK, CISO |
| CIS Benchmarks | current | Hardening | Secure-config baselines per platform | ARCH, OPS |
| NIST CSF | **CSF 2.0** (2024); functions GV/ID/PR/DE/RS/RC | Framework | Outcome-based cyber-risk framework | CISO, OPS |
| NIST SP 800-61 | **Rev. 3** (2025), CSF 2.0-aligned | Guideline | Incident-response lifecycle | OPS |
| SANS PICERL | Prep/Identify/Contain/Eradicate/Recover/Lessons | Guideline | IR execution model | OPS |
| MITRE ATT&CK | current | Knowledge base | Adversary TTPs; detection-coverage map | OPS, OFF |
| ISO/IEC 27001 | **2022**; Annex A risk-selected via the SoA | Standard (certifiable) | ISMS certification | CISO, COMP |
| ISO/IEC 27002 | **2022**; 93 controls, 4 themes | Standard | Control catalogue | COMP, ARCH |
| ISO/IEC 27005 | **2022** | Guideline | Infosec risk process | RISK |
| ISO 31000 / 31073 | 2018 / 2022 | Standard / vocabulary | Risk-mgmt principles & terms (appetite, tolerance, attitude, treatment) | RISK |
| SOC 2 | AICPA **Trust Services Criteria**; Type I/II; CPA attestation | Attestation | Customer-driven trust report (not a certification) | COMP |
| PCI DSS | **v4.0.1** (future-dated reqs mandatory since 31 Mar 2025) | Standard | Cardholder-data security | COMP |
| Cyber Essentials | CE / CE Plus (UK) | Scheme | Baseline technical controls | CISO, COMP, ARCH |
| GDPR / UK GDPR | Reg. (EU) 2016/679 — Arts. 5, 6, 9, 25, 28, 30, 33–36, 44–49, 83 | Regulation | Data-protection law | DPO, COMP, RISK |
| ePrivacy | Dir. 2002/58/EC (NL: Telecommunicatiewet 11.7a) | Regulation | Cookies / consent | DPO |
| NIS2 / Cbw | Dir. (EU) 2022/2555; NL Cyberbeveiligingswet | Regulation | Cyber risk-mgmt + reporting duties | COMP, CISO |
| DORA | Reg. (EU) 2022/2554 (applies 17 Jan 2025) | Regulation | Financial-sector ICT resilience | COMP |
| EU AI Act | Reg. (EU) 2024/1689 (phased) | Regulation | AI governance | COMP, DPO |
| CRA | Reg. (EU) 2024/2847 | Regulation | Product cybersecurity | COMP, ARCH |
| EU-US DPF | adequacy Decision (EU) 2023/1795 (under CJEU appeal) | Transfer mechanism | Transfers to certified US importers | DPO |
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
| Audit logging | CIS Control 8 (IG1: 8.1–8.3) | Control | "Can't investigate what you didn't log" | OPS |
| NIST IR 7621 | Rev. 1 | Guideline | Small-business infosec fundamentals | RISK, OPS, ARCH |
| ENISA SME guidance | Cybersecurity for SMEs / 12 steps | Guideline | EU SME baseline | RISK, OPS |
| NCSC Small Business Guide | UK | Guideline | SMB baseline & IR | OPS |
| FAIR | Open FAIR (FAIR Institute) | Method | Quantitative risk — usually overkill for an SMB | RISK |
| Cyber insurance | transfer control with control prerequisites | Treatment | Shifts financial impact; needs MFA/EDR/backups/IR plan | RISK |
| IIA Three Lines | 2020 | Model | 1st/2nd/3rd-line roles & independence | RISK, COMP, DPO |

---

## Part C — How to maintain

- **Raise the security bar:** change **Control baseline** in Part A from `IG1` to `IG2`
  (or `IG3`). Every persona cites "the control baseline," so all seats re-level at once.
- **Bring a regime into scope:** flip its row in the in-scope table (e.g. NIS2/Cbw once
  the Dutch transposition is in force, or DORA if you become a financial entity). The
  Compliance seat and any affected seat will then treat it as live.
- **A standard version bumps** (e.g. PCI DSS v4.0.1 → next): change it once in Part B.
- **Personas reference subjects by name** and inherit detail from here — do not
  re-hardcode versions, IG levels, or regime scope inside persona files.
