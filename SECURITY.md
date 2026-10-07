# Security policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"). Do not open a public issue for a suspected vulnerability.

## Scope

The inspector is a static page that parses untrusted base64 XDR locally. Relevant reports include: a way to make the page execute script or load a remote resource from entry content, a parser input that hangs or crashes the tab, and a display that presents an unverified or recorded value as verified or computed.

Out of scope: the behavior of Soroban, `@stellar/stellar-sdk` or `stellar-xdr` themselves (report upstream), and whether an authorization is safe to sign. The page states that a preview is not a safety guarantee. This is a personal project without a service-level commitment.
