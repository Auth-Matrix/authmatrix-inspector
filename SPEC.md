# authmatrix-inspector: specification

## 1. User and problem

A wallet, relayer or contract developer, or a reviewer, who is handed a base64 `SorobanAuthorizationEntry` and wants to see what it authorizes before trusting it, and who wants to see why changing any field invalidates the signature. Since Protocol 27 the signature payload depends on the credential type, which makes "just look at the XDR" harder.

## 2. Scope (version one)

Shows, for a pasted or uploaded entry or a loaded reviewed vector:

1. Authorizing address, network passphrase (and its SHA-256 network id), credential type with its payload rule, nonce, signature expiration ledger.
2. The nested invocation tree: contract id, function, arguments. Calls that match a reviewed SEP-41 or Stellar Asset Contract signature (name, arity, argument types) are decoded with named arguments and exact integer amounts; everything else is shown typed and raw with its XDR.
3. The signature payload (preimage type, preimage XDR, SHA-256) and whether the ed25519 signature verifies for the entered passphrase.
4. A mutation view: choose recipient, amount, network, nonce, expiry, function or contract id; the differing fields are listed original versus mutated, the payload hash is recomputed, and the original signature is shown not to verify.
5. Recorded host results for reviewed vectors, labelled RECORDED, with environment, protocol version and recording time. Never for entries that are not byte-identical to a reviewed vector.
6. A permanent statement that a preview is not a guarantee of contract safety or of all effects.

Non-goals: simulating a transaction, calling any network or RPC, running a Soroban host, contract-account (`C...`) signature verification, verifying delegate signatures, key handling or signing, predicting contract effects, any audit or safety score.

## 3. Data and interfaces

- Input: base64 text (whitespace tolerated, 200,000 character limit), or a file of at most 150,000 bytes holding base64 text or raw XDR. Passphrase: a preset (testnet, public, futurenet) or custom text.
- Data shipped with the app comes only from the paired core tarball (`vendor/anasabubakar-authmatrix-core-<version>.tgz`): `vectors/authmatrix-vectors.v1.json`, `evidence/native-host/results.json`, `evidence/testnet/summary.json`. They are validated with the core zod schemas on load.
- All decoding, verification and mutation computations call exported functions of the core library (`decodeEntry`, `verifyEntry`, `decodeCall`, `mutateAuthorization`, ...). The app implements no XDR parsing, hashing or cryptography of its own.

## 4. Pairing and compatibility

`vendor/pairing.json` stamps the tarball: package, version, sha256, the core git commit it was packed from, vector/evidence format versions and the SDK pin. `compat.json` records the tested pair. `pnpm build` runs `scripts/check-pairing.mjs` (stamp vs tarball hash vs `compat.json` vs the installed copy). At runtime `checkCompat` compares the loaded vector and evidence format versions with the core library's constants and the stamp; on mismatch the app shows a failure banner and hides reviewed data. To update: pack a new core, replace the tarball, `pnpm install`, `pnpm stamp -- --core-commit <sha>`, update `compat.json`, rerun tests.

## 5. Failure classes

| Class | Behavior |
|---|---|
| Empty, non-base64 or oversize input | Readable message, no result sections |
| Valid base64 that is not a `SorobanAuthorizationEntry` | "Not a valid SorobanAuthorizationEntry" with the decoder's message |
| Wrong passphrase | Signature reported as not verifying, with the reason |
| Unsupported credential kind for a check | A note says what was not checked (source account, delegates) |
| Tree with no recognized recipient/amount | Mutation view says why nothing was mutated; nothing is guessed |
| Unknown function or argument types | Shown typed/raw with XDR |
| Core data incompatible | Failure banner; reviewed vectors and recordings hidden |

## 6. Architecture

Vite + vanilla TypeScript, no framework. `src/analysis.ts` (pure analysis), `src/view.ts` (DOM builders using text nodes only), `src/main.ts` (wiring), `src/compat.ts`, `src/data.ts`. Strict CSP without `unsafe-eval` or `unsafe-inline`; zod runs in `jitless` mode; no `innerHTML`; no network access from app code.

## 7. Acceptance

1. `pnpm run typecheck`, `pnpm test`, `pnpm build` pass from a clean clone.
2. Every reviewed vector variant loads and shows its reviewed hash; every mutation shows "original signature no longer verifies".
3. At 375px, `main.scrollWidth` equals `main.clientWidth` for every loaded variant (recorded in `docs/evidence/browser-checks.json`).
4. The page makes no network requests and logs no CSP violations.
