# Limitations

- Signature verification covers address credentials with a classic (`G...`) ed25519 signer. Delegate signatures, contract-account signers and custom `__check_auth` are not verified; source-account credentials have nothing to verify.
- Token decoding is by function name, arity and argument types only; a match means "token-shaped call", not "this contract is a token". Decimals are not in an entry and are not assumed.
- Recorded host results exist only for the fixture-contract vectors and are recordings, not something this page executes.
- Mutations need address / addressV2 credentials and contract-function invocations; recipient and amount mutations apply only to recognized calls.
- Browser checks covered one engine (the Browser MCP pane), not other browsers or screen readers. Live on Vercel; CI green.
- No audit, no endorsement, no wallet or SDK maintainer review.

MIT licensed. See [SPEC.md](https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/SPEC.md), [docs/adr/](https://github.com/Auth-Matrix/authmatrix-inspector/tree/main/docs/adr), [SECURITY.md](https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/SECURITY.md).
