# Part A, the blue-team starting point (what the team knows at T0)

> Hand this to the responding team. This is all they get at the start. Release
> Part B facts only as injects, when their own actions would realistically
> surface them. See `README.md`.

## Setting

You are the on-call IT / security team of a large, decentralized research
university. The Windows estate sits in a **single, largely flat Active Directory
domain** (~1,600 servers, ~7,300 workstations). There is **no 24/7 SOC and no
central SIEM**; alerts land in different places across autonomous faculties. It
is the run-up to a public holiday and most staff are already leaving for the
break: thin coverage, slow escalation.

## T0, what you can actually observe

Three things are happening at once, and you do not yet know they are the same
event:

1. **The mail server is unreachable and silent.** Email is down. You cannot send
   or receive, and, critically, **email is your normal way to coordinate an
   incident.** You have no automated word from the mail platform about why. Is it
   a crash, a network fault, or something worse?
2. **A phishing incident is on record.** Earlier, staff reported a suspicious
   phishing email (a link, an Excel attachment). It was logged at the service
   desk. Whether anyone acted on it, and whether it is connected to today, is
   **unknown to you right now.**
3. **Files are being found encrypted.** Users and admins report documents and
   shares they can no longer open; file names/extensions look altered and a
   ransom note may be present. The spread and scope are **not yet established.**

## What you do NOT know yet (the fog)

- Whether the phishing report from weeks ago is the root cause or a coincidence.
- How the attacker got from "one clicked email" to encrypting servers, or whether
  they still have access **right now**.
- Whether this is spreading live, or already finished.
- Whether data was **stolen** as well as encrypted.
- How many systems are hit, which are business-critical, and whether **backups
  are also affected**.
- Whether your **communication and identity systems** (email, AD, VoIP) can be
  trusted at all.

## The first decisions the team faces

- Is this one incident or three unrelated problems? (Working assumption should
  be: **treat as one active intrusion until proven otherwise.**)
- How do we **communicate** when email is dead and AD may be compromised?
  (Out-of-band: phone tree, personal devices, SMS, physical whiteboard, a
  pre-agreed messaging channel.)
- Do we **isolate/disconnect** now and accept the outage, or investigate first
  and risk more encryption?
- Who do we call, DFIR firm, national CERT, law enforcement, insurer, DPO,
  executive board, and in what order?
- How do we preserve **evidence** while containing?

*This is the exercise starting point. The team must run the response with this
much information and no more.*
