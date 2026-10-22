# Changelog

## 0.2.0

- Product site: landing page, `/app` (the existing inspector), `/vectors`, `/docs`, `/about`, `/privacy` and `/terms`, with a shared header and footer, a History API router and a 404 page. Vercel rewrites serve deep links.
- `/app?vector=<id>` opens a reviewed vector; ids are checked against the bundled list.
- Load from testnet: paste a transaction hash and the app calls Soroban RPC `getTransaction` at https://soroban-testnet.stellar.org after you press the button, unwraps fee-bump envelopes, lists every authorization entry and opens the chosen one. CSP `connect-src` now allows that one host in addition to `'self'`.
- Brand colours, logo mark, favicon, Open Graph image, robots.txt and sitemap.xml.
- Tests for the router, shell, legal pages, CSP and `vercel.json` agreement, and the testnet lookup with `fetch` mocked (135 tests).

## 0.1.1

- Re-paired with the published @anas.abubakar/authmatrix-core 0.1.1 tarball (vectors regenerated under the 0.1.1 stamp); the old-scope 0.1.0 tarball is removed.

## 0.1.0 (unreleased)

- Paste, upload or load a reviewed vector; shows authorizing address, network passphrase and id, credential type with payload rule, nonce, expiry, nested invocation tree, SEP-41 / SAC argument decoding with raw fallback, payload hash and local signature verification.
- Mutation view for recipient, amount, network, nonce, expiry, function and contract id, with differing fields highlighted and the original signature shown not to verify.
- Recorded host results (offline host, testnet protocol 29) from the paired core evidence, labelled RECORDED.
- Paired with authmatrix-core 0.1.0 by committed tarball, stamp and runtime compat check.
- Strict CSP without unsafe-eval; zod jitless; no innerHTML.
