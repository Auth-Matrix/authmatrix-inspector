# ADR 0001: What the inspector adds over existing tools

Status: accepted, 2026-10-07. Evidence below is what was read on that date. No tool was executed and this is not a survey.

## Existing tools and docs read

- **Stellar Lab** (`stellar/laboratory` README). An interactive toolkit for building, signing, simulating and submitting transactions, converting XDR to JSON, and exploring contracts. Its README does not describe a view dedicated to a single authorization entry with signature verification and field mutation; I did not run Lab, so I make no claim about what its XDR viewer shows for an auth entry.
- **Freighter** (`stellar/freighter` README and `docs/docs/guide/signXdr.md`). Its signing review has Summary, Operation Details ("optionally walks through the invocation chain and highlights authorizations") and Raw XDR tabs for a transaction. That is a pre-signing review inside a wallet; I did not run it.
- **js-stellar-sdk** (installed 17.2.1 declarations and `auth.js`). `inspectAuthEntry` and `checkAuthEntryReadiness` return credential type, address, nonce, expiry, signers and invocation as data. They are a library API, not a user interface, and they do not decode token arguments or recompute payloads under mutation. The inspector uses them through authmatrix-core.
- **"Crucible"**. I could not identify a Stellar or Soroban tool with that name (a search found a Solana fuzzing framework only, from search-result summaries). No statement is made.
- **authmatrix-core** (this project's paired repo) supplies the vectors, adapters and host evidence the inspector displays.

## Gap

A small static page where a pasted entry shows who authorizes what and on which network, with the Protocol 27 credential rule explained, a token-aware (SEP-41 / SAC) decoding that never guesses, a local signature check, and a mutation view that makes the "any change invalidates the signature" property visible, together with host results that are labelled as recordings.

## Decision

Build a thin UI over the core library; keep all protocol logic and cryptography in core. If Lab or a wallet adds an equivalent authorization-entry view, prefer contributing the mutation and vector ideas there.

## Consequences

- A preview describes what a signature covers at the XDR level. It is not a guarantee of contract safety or of all execution effects, and the app says so on every screen.
- The app is only as correct as core; there is no second implementation in the browser.
- No wallet, SDK or Lab maintainer has reviewed this, and no endorsement is implied.
