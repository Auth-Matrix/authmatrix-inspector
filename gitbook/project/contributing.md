# Contributing

```bash
pnpm install --frozen-lockfile
pnpm run typecheck && pnpm test && pnpm build
pnpm preview --port <free port>      # serves dist/ with the strict CSP header
```

Rules:

- All protocol logic (XDR, hashing, signing, mutation, token mappings) belongs in authmatrix-core. Do not add cryptography or XDR parsing here.
- Never use `innerHTML`, `eval`, `new Function`, inline `style` attributes or network calls; `test/security.test.ts` enforces most of this.
- Anything displayed as "recorded" must come from the paired core evidence files. Anything displayed as computed must come from executed core code. Synthetic examples must be labelled synthetic.
- Check narrow screens for real: load every vector variant at 375px and compare `main.scrollWidth` with `main.clientWidth`.
- Updating core: replace `vendor/*.tgz` with a fresh `pnpm pack` of core, `pnpm install`, `pnpm stamp -- --core-commit <40-hex sha>`, update `compat.json`, run the tests.
- Commits: one logical change each, conventional prefixes, no co-author trailers crediting tools.
