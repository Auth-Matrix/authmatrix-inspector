# ADR 0002: Static app, strict CSP, and tarball pairing with core

Status: accepted, 2026-10-07.

## Decisions

- **Static Vite + vanilla TypeScript app.** Everything runs in the page; the app contains no `fetch`, XHR or WebSocket (a test scans for them).
- **Strict CSP without `unsafe-eval` or `unsafe-inline`**, delivered by `<meta http-equiv>` and by `vercel.json` headers, and by the preview server so a local `pnpm build && pnpm preview` exercises the same policy. zod runs with `z.config({ jitless: true })` so it never calls `new Function`. All DOM is built from text nodes (no `innerHTML`); styles live in a stylesheet (no inline `style`).
- **Core pairing by committed tarball.** The app depends on `file:vendor/anas.abubakar-authmatrix-core-<version>.tgz`, stamped in `vendor/pairing.json` with its sha256 and the core commit it was packed from. This gives a clean independent clone with no sibling paths. The reviewed vectors and evidence ship inside the tarball and are validated on load.
- **Runtime compat check** on format major versions, in addition to the build-time pairing check.

## Consequences

- Updating core is an explicit, reviewable step (new tarball, stamp, compat entry, tests).
- The SDK is bundled (about 115 kB gzipped); `@stellar/stellar-sdk/base` is used to avoid RPC/Horizon clients.
- Real-browser checks (375px overflow, console) are recorded in `docs/evidence/browser-checks.json`; they cover one browser engine.
