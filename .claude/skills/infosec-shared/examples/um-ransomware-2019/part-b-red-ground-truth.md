# Part B, ground truth for the red team (adversary emulation)

> **Facilitator only. Do not give this to the blue team at the start.**
> Everything below is what really produced the situation in Part A. A red team
> emulating this against a UM-like range should reproduce these techniques and
> generate these signals; a white cell should reveal these facts as injects when
> the blue team's actions "discover" them. All indicators are from the publicly
> documented 2019 incident and are safe to use for authorized emulation only.

## Adversary being emulated

**TA505** (a.k.a. Grace, SectorJ04, "Gold Tahoe"), a financially-motivated,
Eastern-European criminal group. **Objective: financial** (ransom), via
**enterprise-wide Clop deployment**. Style: patient, hands-on-keyboard "big game"
intrusion with a long, quiet dwell time and heavy use of **legitimate/dual-use
tooling** to blend in. Not a hacktivist smash-and-grab.

## The core fact the blue team must discover

The "three problems" in Part A are **one intrusion that is ~69 days old**. The
phishing report from weeks earlier *is* patient zero. The encrypted files are the
final payload. The dead mail server is a **symptom**: the mail/Exchange servers
are among the Windows systems the ransomware just encrypted, which is why email
went silent. **This is not a fresh infection to clean; it is the endgame of a
long-running compromise where the attacker held full domain admin.**

## Full attack chain (emulation script + ATT&CK)

| Phase | What the attacker did | ATT&CK (illustrative) |
|---|---|---|
| **Initial access** | Two phishing emails; user follows a link to attacker infrastructure, downloads a **macro-enabled Excel**, enables macros, **SDBBot** RAT installed. Second user hit next day. | T1566.002 (spearphishing link), T1204.002 (user execution), T1059.005 (macro/VBA) |
| **C2 foothold** | SDBBot beacons out roughly **every 15 minutes** when the host is online; **Meterpreter** added for interactive access. | T1071 (app-layer C2), T1105 (ingress tool transfer) |
| **Escalation / movement** | Exploit **unpatched Windows servers**; reporting points to **EternalBlue / MS17-010** (a patch already ~2 years old). | T1210 (exploit remote services), T1068 (privilege escalation) |
| **Discovery / AD recon** | **PowerSploit** (PowerShell recon), **PingCastle** (AD weakness mapping), **AdFind** (directory enumeration) to find privileged accounts and the path to Domain Admin. | T1087 (account discovery), T1482 (domain trust discovery), T1018 (remote system discovery) |
| **Credential access** | **Mimikatz** to dump credentials from memory, full **Domain Administrator** rights. | T1003 (OS credential dumping) |
| **C2 backbone** | **Cobalt Strike** planted on **domain controllers** as the control layer for the whole environment. | T1071 / T1572, staging on DCs |
| **Defense evasion** | Using stolen admin rights, **disable endpoint AV** (McAfee / Windows Defender) on target servers before firing. | T1562.001 (impair defenses) |
| **Impact** | Deploy **Clop** ransomware (`sage.exe` / `swaqp.exe`) to **267 Windows domain-joined servers**, including **reachable online backups**; encryption completes in ~30 minutes. | T1486 (data encrypted for impact), T1490 (inhibit recovery) |

**Key escalation date to mirror:** full domain admin was reached ~5 weeks
*before* detonation. The attacker sat on complete control and chose when to fire.

## Tooling to emulate

SDBBot (loader/RAT), Meterpreter, EternalBlue/MS17-010, PowerSploit, PingCastle,
AdFind, Mimikatz, Cobalt Strike, and the Clop deployment binaries (`sage.exe`,
`swaqp.exe`). Note how much of this is **off-the-shelf and dual-use**: that is
the point, signature AV alone will not stop it, and much of the traffic looks
"administrative."

## Indicators of Compromise (for injects / detection tuning)

| Type | Value / detail |
|---|---|
| Phishing lure emails | Subjects like **"Documents"** and **"CL meeting schedule.xls"** with a link + macro-Excel |
| Attacker domains | `windows-en-us-update.com`, `windows-afx-update.com` (spoofing "update" hostnames) |
| Attacker IPs | `185.225.17.99`, `185.212.128.146` |
| RAT behavior | SDBBot C2 **beacon ≈ every 15 min** when online |
| Ransomware binaries | `sage.exe`, `swaqp.exe`; Clop encrypts with **RC4 (files) + RSA (keys)** |
| Scope of impact | **267 Windows servers** encrypted; Unix/macOS untouched (Windows-domain-scoped) |
| Data exfiltration | Forensics found **no proof of research/personal data exfil**, but could **not fully exclude** it. (2019-era Clop = encryption-first, pre-"double extortion.") |

## The environment weaknesses the red team is meant to exploit (the attack surface)

These are the conditions that made the chain trivial. A red-team range should
reproduce them so the exercise is realistic:

- **Macros from the internet allowed** (front door for initial access).
- **Unpatched servers**, including missing MS17-010, no enforced patch SLA.
- **Over-broad admin rights**; routine work done with domain-admin-capable
  accounts, one foothold reaches everything.
- **Flat AD domain / limited segmentation**, unimpeded lateral movement to 267
  servers.
- **No MFA** on privileged/remote access, stolen credentials are fully usable.
- **Online backups reachable from the production domain**, recovery option
  destroyed with everything else.
- **No SOC / SIEM / central alerting**; signals scattered across a decentralized
  org.
- **No tamper-protection** on endpoint AV; it can simply be switched off.
- **No CMDB / asset map**, defenders cannot quickly scope what's hit.

## Detection opportunities the red team WILL generate (score the blue team on these)

An honest emulation is noisy in specific places. These are the moments the blue
team *could* have caught it; the exercise should test whether they do:

- The **staff phishing report** at initial access (was it triaged and acted on?).
- **Macro execution** spawning outbound connections to newly-registered "update"
  domains.
- **SDBBot's regular 15-minute beacon**, textbook C2 periodicity.
- **Mimikatz / LSASS access** and sudden **new Domain Admin** activity (~21 Nov
  equivalent).
- An **AV/EDR alert around escalation that went unnoticed** in the real event,
  replicate it and see if it is actioned.
- **Cobalt Strike on domain controllers** (anomalous processes/beaconing on DCs).
- **Mass AV-disable across many servers at once** immediately before detonation,
  a screaming pre-ransomware signal.

## Exercise objectives / "flags" for the red team

1. Obtain initial execution via macro (phish click).
2. Establish persistent C2 and survive a reboot.
3. Escalate to local admin on an unpatched host.
4. Reach **Domain Admin** and prove control of a domain controller.
5. Enumerate and reach the **backup infrastructure**.
6. Stage (do **not** actually detonate in a live-adjacent range) a domain-wide
   deployment mechanism and demonstrate the AV-disable step.
7. Demonstrate the **loss of the comms channel** (mail/Exchange in scope) as part
   of impact.

## Rules of engagement (for a real authorized exercise)

Scope, authorization, and a signed RoE are mandatory before any of this is run.
Emulation should use **documented TTPs and detection tests** (e.g., Atomic Red
Team / caldera-style) against an **isolated range or a controlled, authorized
segment**, never live production ransomware. The deliverable is *detection and
response evidence*, not damage. Keep a deconfliction line open so blue-team
responders can tell a drill from a real intrusion.
