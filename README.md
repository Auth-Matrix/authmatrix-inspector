<p align="center"><img src="docs/assets/banner.svg" alt="authmatrix-inspector" width="100%"></p>

# authmatrix-inspector

[![CI](https://github.com/Auth-Matrix/authmatrix-inspector/actions/workflows/ci.yml/badge.svg)](https://github.com/Auth-Matrix/authmatrix-inspector/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Release](https://img.shields.io/github/v/release/Auth-Matrix/authmatrix-inspector)](https://github.com/Auth-Matrix/authmatrix-inspector/releases)

[Documentation](https://stellar-developer-tools.gitbook.io/authmatrix-inspector/) · [Live demo](https://authmatrix-inspector-anasamasama.vercel.app) · [Core repository](https://github.com/Auth-Matrix/authmatrix-core) · [Issues](https://github.com/Auth-Matrix/authmatrix-inspector/issues) · [Discussions](https://github.com/Auth-Matrix/authmatrix-inspector/discussions)


Hosted demo: https://authmatrix-inspector-anasamasama.vercel.app

Paste a Soroban authorization entry and see what it authorizes, then change one field and watch the signature stop verifying.

A static browser app (Vite + vanilla TypeScript). Everything runs in the page; nothing is sent anywhere. It is the UI for authmatrix-core (a separate repo) and contains no protocol logic of its own: decoding, hashing, signature verification, mutation and token mappings all call the paired core library.

**A preview is not a guarantee of contract safety or of everything a transaction will do.** It shows what a signature covers at the XDR level.

## What it shows

For a pasted or uploaded base64 `SorobanAuthorizationEntry`, or a reviewed vector loaded from the list:

- authorizing address, network passphrase and its SHA-256 network id, credential type (legacy `ADDRESS`, CAP-71 `ADDRESS_V2`, `ADDRESS_WITH_DELEGATES`, source account) with the payload rule each uses, nonce, signature expiration ledger;
- the nested invocation tree. Calls matching a reviewed SEP-41 or Stellar Asset Contract signature are decoded with named arguments and exact integer amounts. Anything else, including unknown contracts and unknown ScVals, stays typed and raw with its XDR;
- the signature payload (preimage type, XDR, SHA-256) and whether the ed25519 signature verifies for the passphrase entered;
- a **mutation view**: pick recipient, amount, network, nonce, expiry, function or contract id. The differing fields are listed original versus mutated, the payload hash is recomputed, and the original signature is shown not to verify;
- **recorded host results** for reviewed vectors (offline Soroban host, protocol 28; Stellar testnet `simulateTransaction` in enforce mode, protocol 29), each labelled RECORDED with its environment, protocol and recording time. An entry that is not byte-identical to a reviewed vector gets no recorded result, and the page says it does not run a host.

## Run it

Not hosted yet. From a clone (Node >= 22, pnpm 11):

```bash
pnpm install --frozen-lockfile
pnpm dev                       # development server
pnpm build && pnpm preview     # production build served with the strict CSP header
pnpm test                      # 83 tests (vitest + jsdom)
```

Pick "Load a reviewed vector..." to try it immediately, for example `v2-nested-relay-testnet`, original (signed), then the amount chip in the mutation view.

## Pairing with core

The app pins one core build: `vendor/anas.abubakar-authmatrix-core-0.1.1.tgz`, stamped in `vendor/pairing.json` (sha256 and the core commit it was packed from) and listed in `compat.json`. `pnpm build` runs a pairing check; at runtime the loaded vector and evidence format versions are checked against the core library and the stamp, and a mismatch hides reviewed data behind a failure banner. The vectors and recordings shown are the ones inside that tarball, validated with core's schemas on load. Update steps are in [CONTRIBUTING.md](CONTRIBUTING.md).

| Inspector | Core | Vector format | Status |
|---|---|---|---|
| 0.1.1 | @anas.abubakar/authmatrix-core 0.1.1 | authmatrix-vectors 1.x | tested |

## Browser safety

Strict CSP (`script-src 'self'`, no `unsafe-eval`, no `unsafe-inline`, `connect-src 'self'`), zod in `jitless` mode, DOM built from text nodes only, no network calls from app code. `docs/evidence/browser-checks.json` records a real-browser run of the built page under that CSP: no console messages, and at a 375px viewport `main.scrollWidth` equals `main.clientWidth` in all 406 loaded states, in light and dark.

## Limitations

- Signature verification covers address credentials with a classic (`G...`) ed25519 signer. Delegate signatures, contract-account signers and custom `__check_auth` are not verified; source-account credentials have nothing to verify.
- Token decoding is by function name, arity and argument types only; a match means "token-shaped call", not "this contract is a token". Decimals are not in an entry and are not assumed.
- Recorded host results exist only for the fixture-contract vectors and are recordings, not something this page executes.
- Mutations need address / addressV2 credentials and contract-function invocations; recipient and amount mutations apply only to recognized calls.
- Browser checks covered one engine (the Browser MCP pane), not other browsers or screen readers. Live on Vercel; CI green.
- No audit, no endorsement, no wallet or SDK maintainer review.

MIT licensed. See [SPEC.md](SPEC.md), [docs/adr/](docs/adr), [SECURITY.md](SECURITY.md).

## Repository layout

- `docs/`: decision records (ADRs), evidence and assets
- `gitbook/`: source of the GitBook documentation
- `scripts/`: build, generation and recording scripts
- `src/`: source
- `test/`: tests
- `vendor/`: pinned artifacts from the paired core repository

## Documentation

The full documentation is at https://stellar-developer-tools.gitbook.io/authmatrix-inspector/. It is built from the `gitbook/` folder of this repository and synced from `main`, so a fix to a page is a pull request here.

## Contributing

Open issues are scoped so one person can finish one in a single cycle, and each lists acceptance criteria. Read [CONTRIBUTING.md](CONTRIBUTING.md), pick an issue from the [issue list](https://github.com/Auth-Matrix/authmatrix-inspector/issues), and say you are taking it before you start. Security reports go through [SECURITY.md](SECURITY.md), not public issues.

## Maintainers

| Maintainer | Role | GitHub |
|---|---|---|
| Anas Abubakar | Lead maintainer | [@Anasabubakar](https://github.com/Anasabubakar) |
| Abdulbasit Fazazi | Co-maintainer | [@fazaziishola-coder](https://github.com/fazaziishola-coder) |

## Community

Questions and design discussion go in [GitHub Discussions](https://github.com/Auth-Matrix/authmatrix-inspector/discussions). Bugs and scoped work go in [Issues](https://github.com/Auth-Matrix/authmatrix-inspector/issues).

## License

MIT. See [LICENSE](LICENSE).

## Contributors

Thanks to all the contributors who have made this project possible.

<a href="https://github.com/Auth-Matrix/authmatrix-inspector/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Auth-Matrix/authmatrix-inspector" alt="Contributors to authmatrix-inspector" />
</a>
