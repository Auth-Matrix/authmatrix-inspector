import { describe, expect, it } from "vitest";
import { Keypair, authorizeEntry, buildWithDelegatesEntry, hash, xdr } from "@stellar/stellar-sdk/base";
import { authorizationToUnsignedEntry, toBase64, type Authorization } from "@anas.abubakar/authmatrix-core";
import { analyze, computeMutation } from "../src/analysis.ts";
import { loadBundle } from "../src/data.ts";

const bundle = loadBundle();
const TESTNET = "Test SDF Network ; September 2015";
const v = bundle.vectors.vectors[0]!;

describe("credential types without a vector", () => {
  it("source-account credentials are described, with nothing to verify", () => {
    const unsigned = authorizationToUnsignedEntry(v.authorization);
    const entry = new xdr.SorobanAuthorizationEntry({ credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(), rootInvocation: unsigned.rootInvocation });
    const a = analyze(toBase64(entry.toXdr()), TESTNET, bundle.vectors);
    expect(a.decoded.credentialType).toBe("sourceAccount");
    expect(a.verify).toBeNull();
    expect(a.verifyNote).toMatch(/transaction source account/);
    expect(computeMutation(a, "nonce").applicable).toBe(false);
  });

  it("delegated credentials decode, check only the top-level signature, and say so", async () => {
    const d1 = Keypair.fromRawEd25519Seed(hash("inspector delegate 1"));
    const d2 = Keypair.fromRawEd25519Seed(hash("inspector delegate 2"));
    const entry = buildWithDelegatesEntry({ entry: authorizationToUnsignedEntry(v.authorization), validUntilLedgerSeq: 900, delegates: [{ address: d1.publicKey() }, { address: d2.publicKey() }] });
    const signed = await authorizeEntry(entry, d1, 900, TESTNET, d1.publicKey());
    const a = analyze(toBase64(signed.toXdr()), TESTNET, bundle.vectors);
    expect(a.decoded.credentialType).toBe("addressWithDelegates");
    expect(a.decoded.delegateCount).toBe(2);
    expect(a.verifyNote).toMatch(/only the top-level address signature/);
    expect(a.verify?.preimageType).toBe("envelopeTypeSorobanAuthorizationWithAddress");
  });

  it("an unrecognized tree has nothing to mutate for recipient or amount, and says why", () => {
    const auth: Authorization = { ...v.authorization, rootInvocation: { ...v.authorization.rootInvocation, functionName: "unknown_fn", subInvocations: [] } };
    const a = analyze(toBase64(authorizationToUnsignedEntry(auth).toXdr()), TESTNET, bundle.vectors);
    const m = computeMutation(a, "recipient");
    expect(m.applicable).toBe(false);
    expect(m.reason).toMatch(/never guessed/);
    expect(computeMutation(a, "nonce").applicable).toBe(true);
  });

  it("an unsigned entry is reported as having no signature, not as valid", () => {
    const a = analyze(v.expected.unsignedEntryXdr, TESTNET, bundle.vectors);
    expect(a.decoded.signature.kind).toBe("none");
    expect(a.verify?.signatureValid).toBe(false);
  });
});
