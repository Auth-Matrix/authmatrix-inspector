# Pairing with core

The app pins one core build: `vendor/anas.abubakar-authmatrix-core-0.1.1.tgz`, stamped in `vendor/pairing.json` (sha256 and the core commit it was packed from) and listed in `compat.json`. `pnpm build` runs a pairing check; at runtime the loaded vector and evidence format versions are checked against the core library and the stamp, and a mismatch hides reviewed data behind a failure banner. The vectors and recordings shown are the ones inside that tarball, validated with core's schemas on load. Update steps are in [CONTRIBUTING.md](https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/CONTRIBUTING.md).

| Inspector | Core | Vector format | Status |
|---|---|---|---|
| 0.1.1 | @anas.abubakar/authmatrix-core 0.1.1 | authmatrix-vectors 1.x | tested |
