# Changelog

## 0.1.0 (unreleased)

- Paste, upload or load a reviewed vector; shows authorizing address, network passphrase and id, credential type with payload rule, nonce, expiry, nested invocation tree, SEP-41 / SAC argument decoding with raw fallback, payload hash and local signature verification.
- Mutation view for recipient, amount, network, nonce, expiry, function and contract id, with differing fields highlighted and the original signature shown not to verify.
- Recorded host results (offline host, testnet protocol 29) from the paired core evidence, labelled RECORDED.
- Paired with authmatrix-core 0.1.0 by committed tarball, stamp and runtime compat check.
- Strict CSP without unsafe-eval; zod jitless; no innerHTML.
