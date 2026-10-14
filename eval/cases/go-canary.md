# Case: passkeys for the four admin accounts

Fictional organisation, for the council eval.

**Kroon Logistiek Advies B.V.**, Tilburg. 27 staff, logistics consultancy, Microsoft 365
Business Premium, Entra ID P1 included. An MSP administers the tenant.

There are four global-admin accounts: two MSP engineers, the managing director, and a
break-glass account kept in a sealed envelope in the office safe. All four currently use
push-notification MFA. Secure Score flags them as the top recommendation.

The MSP proposes to register FIDO2 security keys (two per person, EUR 50 each, already
bought) or device-bound passkeys for the three named admins, enforce a phishing-resistant
authentication strength for the admin roles through conditional access, and keep the
break-glass account excluded but monitored with an alert on any sign-in. Estimated effort:
two hours. Rollback is one policy toggle.

No incident, no deadline. The managing director asks whether to do it this month or wait
for a broader security project planned for next year.

The decision: do we enforce passkeys on the admin accounts this month?
