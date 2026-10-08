# What it shows

For a pasted or uploaded base64 `SorobanAuthorizationEntry`, or a reviewed vector loaded from the list:

- authorizing address, network passphrase and its SHA-256 network id, credential type (legacy `ADDRESS`, CAP-71 `ADDRESS_V2`, `ADDRESS_WITH_DELEGATES`, source account) with the payload rule each uses, nonce, signature expiration ledger;
- the nested invocation tree. Calls matching a reviewed SEP-41 or Stellar Asset Contract signature are decoded with named arguments and exact integer amounts. Anything else, including unknown contracts and unknown ScVals, stays typed and raw with its XDR;
- the signature payload (preimage type, XDR, SHA-256) and whether the ed25519 signature verifies for the passphrase entered;
- a **mutation view**: pick recipient, amount, network, nonce, expiry, function or contract id. The differing fields are listed original versus mutated, the payload hash is recomputed, and the original signature is shown not to verify;
- **recorded host results** for reviewed vectors (offline Soroban host, protocol 28; Stellar testnet `simulateTransaction` in enforce mode, protocol 29), each labelled RECORDED with its environment, protocol and recording time. An entry that is not byte-identical to a reviewed vector gets no recorded result, and the page says it does not run a host.
