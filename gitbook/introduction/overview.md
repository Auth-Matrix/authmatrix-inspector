# Overview

Hosted demo: https://authmatrix-inspector-anasamasama.vercel.app

Paste a Soroban authorization entry and see what it authorizes, then change one field and watch the signature stop verifying.

A static browser app (Vite + vanilla TypeScript). Everything runs in the page; nothing is sent anywhere. It is the UI for authmatrix-core (a separate repo) and contains no protocol logic of its own: decoding, hashing, signature verification, mutation and token mappings all call the paired core library.

**A preview is not a guarantee of contract safety or of everything a transaction will do.** It shows what a signature covers at the XDR level.

Source: [authmatrix-inspector on GitHub](https://github.com/Auth-Matrix/authmatrix-inspector). Releases: [GitHub releases](https://github.com/Auth-Matrix/authmatrix-inspector/releases).
