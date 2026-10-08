# Browser safety

Strict CSP (`script-src 'self'`, no `unsafe-eval`, no `unsafe-inline`, `connect-src 'self'`), zod in `jitless` mode, DOM built from text nodes only, no network calls from app code. `docs/evidence/browser-checks.json` records a real-browser run of the built page under that CSP: no console messages, and at a 375px viewport `main.scrollWidth` equals `main.clientWidth` in all 406 loaded states, in light and dark.
