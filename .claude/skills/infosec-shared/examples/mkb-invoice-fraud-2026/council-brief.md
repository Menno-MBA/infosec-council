# Case: invoice fraud through a compromised accounting platform (NL MKB, 2026)

A council brief. This is a **decision** case, not an incident-response exercise: the facts are
stabilised and what remains are contested business calls. If you want the operational response
(triage, containment, evidence, clocks), give the same facts to `infosec-incidentteam` instead
and let it escalate the hard calls back here.

Fictional organisation, realistic pattern. Modelled on the June 2026 Flemish/Walloon hotel
campaign, where roughly 100 hotels had guests defrauded through convincing messages built from
**real reservation data**. The hotels were never breached themselves; an infostealer took booking
platform credentials, the attacker logged in legitimately, exported the guest lists, and the
accuracy of the data is what made the fraud work. The lesson carried over here is chain risk:
the damage lands on the business whose name is on the invoice, not on the platform that leaked.

---

## The organisation

**Van Elst Bedrijfsdiensten B.V.**, Nieuwegein. Facility and light technical services: cleaning,
building maintenance, small installation work.

| | |
|---|---|
| Staff | 62 (so above the 50-employee line) |
| Turnover | approx. EUR 11.4M |
| Clients | approx. 850 business clients, almost all Dutch SMEs |
| Billing | monthly, on contract, invoices go out on the 2nd working day |
| Accounting | a Dutch cloud accounting platform (SaaS), used for ledger, invoicing and client records |
| IT | no in-house IT or security staff; a regional IT supplier on a break-fix contract |
| Certification | none. No ISO 27001, no NIS2 supply-chain certificate |
| Cyber insurance | yes, EUR 250k, taken out 2024, never tested |

**Scope note that matters:** the organisation itself is very probably **out** of NIS2/Cbw scope.
But roughly 40 of its 850 clients are in scope, including two regional hospitals, a drinking-water
utility contractor and several energy-sector suppliers. Those clients have supply-chain
obligations under Cbw Art. 21, and the Cbw enters into force on **15 August 2026**.

---

## What is observed

**Day 1 (Tuesday).** A finance employee at a client forwards an invoice to her usual contact:
*"Is dit correct? Het rekeningnummer klopt niet met wat ik in ons systeem heb staan."*

The invoice is **accurate in every respect except the IBAN**:

- correct client name and postal address
- correct contact person, the one who normally receives the invoice
- correct contract reference
- correct monthly amount, to the cent, including the March index adjustment
- invoice number in the correct sequence, consistent with the real one issued the same week
- correct VAT number, correct payment term
- the layout is a close but not exact copy of the real template

The sender domain is `vanelst-bedrijfsdiensten.nl`. The real domain is
`vanelstbedrijfsdiensten.nl`. One hyphen.

**Day 1 to Day 4.** Nine more clients report the same thing. Three of them report it only after
being asked. Two say they nearly paid.

**Day 5.** Three clients confirm they **have** paid. Total known loss so far EUR 23,900. All three
paid within the normal payment term without querying it, because nothing about the invoice looked
wrong. One of the three is a hospital.

**Day 6.** The accounting platform vendor is contacted. Their first written response:
*"Wij hebben geen aanwijzingen voor een datalek aan onze zijde."* No log extract offered. No
mention of whether the account was accessed from an unusual location.

**Day 7.** While reviewing, the office manager finds that an endpoint alert was raised on the
bookkeeper's laptop **six weeks ago**, flagged as an infostealer detection, marked "cleaned" by
the IT supplier and closed. Nobody rotated any passwords at the time. The bookkeeper's account on
the accounting platform is a full-access account, shared informally with one colleague, and has
**no MFA**.

**Day 8 (today).** The board wants decisions. Nothing has been communicated to the other ~840
clients. The lookalike domain is still live.

---

## What is NOT known

State these plainly; the panel should not paper over them.

- **Where the invoice data came from.** Three live hypotheses, and nobody has ruled any out:
  (a) credentials stolen by the infostealer on the bookkeeper's laptop, then a legitimate login to
  the platform; (b) a breach at the platform vendor affecting multiple customers; (c) a
  compromise on one client's side, since some clients receive invoices from many suppliers.
- **How many clients were targeted.** Only the ones who spoke up are known. Reporting is
  self-selected, and the three who paid did not report, they were found.
- **What else was taken.** If the platform account was accessed, the attacker had the client
  ledger: contact names, email addresses, phone numbers, bank details, contract values, payment
  history.
- **Whether it is still happening.** The next invoice run is in 11 days.
- **Whether the platform vendor is telling the truth**, or has simply not looked.

---

## The decisions the council is asked to make

Five, and they conflict with each other. That is the point.

**1. Who gets told, and what are they told?**
Only the affected clients, or all 850? Saying "we may have been breached" when the source is
undetermined risks being wrong in public and damaging a supplier relationship. Saying nothing
risks a client paying a fake invoice next week and asking why they were not warned. There is a
third option nobody likes: warn everyone without attributing cause.

**2. Is this a reportable personal data breach, and whose is it?**
The organisation is the controller of its client contact data. The platform is its **processor**.
If the platform leaked, the processor must inform the controller and the controller notifies the
AP. If the infostealer on the bookkeeper's laptop is the source, it is squarely the
organisation's own breach. The awareness clock is running on an unresolved question, and the
answer changes who is at fault, not whether anyone is.

**3. Do the three clients who paid get compensated?**
There is no obvious legal duty; they paid a fraudulent invoice on a domain that was not the
organisation's. But one of them is a hospital, all three are long-standing, and the amount is
EUR 23,900 against EUR 11.4M turnover. Paying sets a precedent and may prejudice the insurer.
Not paying is defensible and may cost more in lost contracts than the sum in question.

**4. What is said to the ~40 clients who fall under the Cbw from 15 August?**
They will have supply-chain obligations and will start asking suppliers to demonstrate control.
This incident is either the worst possible timing or the strongest possible reason to get
certified. It is fifteen days away.

**5. Do they stay on the platform?**
Switching an accounting system mid-year, with 850 clients and no in-house IT, is a serious
undertaking. Staying means depending on a vendor who answered a breach question in one sentence
with no evidence.

---

## Deliberately contested ground

Seats should be expected to disagree on these, and the disagreement is the product:

- **Warn broadly versus warn narrowly.** Reputation and duty of care point in opposite directions
  from legal exposure.
- **Notify the AP now on an unresolved source, or investigate first.** The 72-hour clock does not
  wait for certainty, but notifying a breach you may not have had is not free either.
- **Where the real control failure sits.** The invoice was fake but the *payment* is what caused
  loss. An argument exists that no supplier-side control would have prevented this, and that the
  answer is a bank-detail verification habit at the client. That is a frame challenge: it may be
  the right answer to a question nobody asked.
- **Whether the six-week-old infostealer alert makes this negligent.** It was detected, "cleaned",
  and no credentials were rotated. That is a very common MKB failure and it is going to look bad
  in hindsight.
- **Certification as theatre or as leverage.** With 40 clients about to demand supply-chain
  assurance, is a certificate a control or a sales document?

---

## Useful ground truth for a facilitator

Withhold this from the panel; release as injects if the deliberation would realistically surface it.

- The infostealer on the bookkeeper's laptop **is** the source. Credentials for the accounting
  platform were in the stolen browser vault. The platform vendor was never breached and their
  statement, though unhelpfully brief, is true.
- The attacker logged in from a residential IP in the Netherlands, twice, at 23:40 and 02:15, six
  and five weeks ago respectively. The platform does keep these logs and will provide them on
  request, but nobody has asked.
- The client export was taken in one session. 850 records.
- 61 clients were targeted, not 10. The rest either ignored the invoice, filed it for later, or
  have not reached their payment date.
- The lookalike domain was registered eight days before the first invoice went out, with privacy
  protection, at a registrar that responds to abuse reports within about 72 hours.
- A fourth client paid on Day 7 and has not yet noticed. EUR 8,400.

---

## Suggested invocation

```
ask the infosec-council -deep: <paste everything above the ground-truth section>
```

Run it at `-deep`: five interacting decisions, an unresolved source, a live regulatory deadline
and a genuine frame challenge is exactly the shape that warrants the decision-science pass and
the synthesis audit.
