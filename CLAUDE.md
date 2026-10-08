# authmatrix-inspector: working notes

Commands: `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm run typecheck`, `pnpm test`, `pnpm build` (typecheck + pairing check + vite build), `pnpm preview --port <free port>` (ports 4173 etc. may be taken by other projects), `pnpm stamp -- --core-commit <sha>` after replacing vendor/*.tgz.
Constraints: no protocol logic or crypto here (core owns it); zod jitless; strict CSP without unsafe-eval or unsafe-inline; text nodes only; no network calls; narrow-screen overflow measured as main.scrollWidth vs clientWidth in a real browser at 375px; never use a sparkle icon; no AI co-author trailers.
Pairing: vendor/anas.abubakar-authmatrix-core-0.1.1.tgz + vendor/pairing.json + compat.json.
Unfinished: checks in other browsers and screen readers, verification of delegate signatures and contract-account signers.
