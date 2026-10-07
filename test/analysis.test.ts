import { describe, expect, it } from "vitest";
import { AnalysisError, analyze, computeMutation, findMatches, normalizeInput, recordedFor } from "../src/analysis.ts";
import { loadBundle } from "../src/data.ts";
import { MUTATION_FIELDS } from "@anasabubakar/authmatrix-core";

const bundle = loadBundle();
const TESTNET = "Test SDF Network ; September 2015";

describe("analyze reviewed vectors (every value comes from executed core code)", () => {
  for (const v of bundle.vectors.vectors) {
    it(`${v.id}: decodes and verifies the signed entry`, () => {
      const a = analyze(v.expected.signedEntryXdr, v.authorization.networkPassphrase, bundle.vectors);
      expect(a.decoded.credentialType).toBe(v.authorization.credentialType);
      expect(a.decoded.address).toBe(v.authorization.address);
      expect(a.decoded.nonce).toBe(v.authorization.nonce);
      expect(a.decoded.signatureExpirationLedger).toBe(v.authorization.signatureExpirationLedger);
      expect(a.verify?.signatureValid).toBe(true);
      expect(a.verify?.payloadHashHex).toBe(v.expected.payloadHashHex);
      expect(a.verify?.preimageXdr).toBe(v.expected.preimageXdr);
      expect(a.matches.some((m) => m.vectorId === v.id && m.kind === "signed")).toBe(true);
    });
    it(`${v.id}: the same entry under the wrong passphrase does not verify`, () => {
      const wrong = v.authorization.networkPassphrase === TESTNET ? "Public Global Stellar Network ; September 2015" : TESTNET;
      expect(analyze(v.expected.signedEntryXdr, wrong, bundle.vectors).verify?.signatureValid).toBe(false);
    });
    for (const m of v.mutations) {
      it(`${v.id}: reviewed mutation ${m.field} entry is shown as not verifying with the reviewed hash`, () => {
        const a = analyze(m.expected.entryXdrWithOriginalSignature, m.mutatedAuthorization.networkPassphrase, bundle.vectors);
        expect(a.verify?.signatureValid).toBe(false);
        expect(a.verify?.payloadHashHex).toBe(m.expected.mutatedPayloadHashHex);
        expect(a.matches.some((x) => x.kind === `mutation:${m.field}`)).toBe(true);
        const r = analyze(m.expected.resignedEntryXdr, m.mutatedAuthorization.networkPassphrase, bundle.vectors);
        expect(r.verify?.signatureValid).toBe(true);
      });
    }
  }
});

describe("invocation tree decoding", () => {
  const ops = bundle.vectors.vectors.find((v) => v.id === "v2-token-ops-synthetic")!;
  const a = analyze(ops.expected.signedEntryXdr, TESTNET, bundle.vectors);
  it("maps SEP-41 and SAC calls and labels the source of each mapping", () => {
    const names = a.tree.children.map((c) => (c.decoding?.status === "mapped" ? `${c.functionName}:${c.decoding.mapping.source}` : `${c.functionName}:unmapped`));
    expect(a.tree.decoding?.status).toBe("mapped");
    expect(names).toEqual([
      "transfer:SEP-41 v0.5.2",
      "mint:Stellar Asset Contract (soroban-sdk 28.0.0 StellarAssetInterface; not in SEP-41)",
      "burn_from:SEP-41 v0.5.2",
      "settle:unmapped",
    ]);
  });
  it("keeps unknown contract calls raw with XDR and typed values", () => {
    const settle = a.tree.children[3]!;
    expect(settle.decoding?.status).toBe("unmapped");
    if (settle.decoding?.status !== "unmapped") return;
    expect(settle.decoding.args[0]!.typed.type).toBe("map");
    expect(settle.decoding.args[0]!.xdr.length).toBeGreaterThan(10);
  });
  it("shows exact integer amounts", () => {
    const t = a.tree.children[0]!.decoding;
    expect(t?.status === "mapped" && t.args.find((x) => x.name === "amount")?.value).toBe("12500000000");
  });
});

describe("mutation view", () => {
  const v = bundle.vectors.vectors[0]!;
  const a = analyze(v.expected.signedEntryXdr, v.authorization.networkPassphrase, bundle.vectors);
  for (const f of MUTATION_FIELDS) {
    it(`${f}: payload hash changes, original signature no longer verifies, differing path listed`, () => {
      const m = computeMutation(a, f);
      expect(m.applicable).toBe(true);
      expect(m.hashChanged).toBe(true);
      expect(m.originalSignatureVerifies).toBe(false);
      expect(m.changes.length).toBeGreaterThan(0);
      expect(m.mutatedHash).not.toBe(m.originalHash);
    });
  }
  it("recipient mutation shows both the before and the after address", () => {
    const m = computeMutation(a, "recipient");
    expect(m.changes[0]!.before).toMatch(/^address \(.*\) G/);
    expect(m.changes[0]!.after).not.toBe(m.changes[0]!.before);
  });
});

describe("recorded results", () => {
  it("are looked up only for byte-identical vector entries and carry their environment and protocol", () => {
    const v = bundle.vectors.vectors[0]!;
    const matches = findMatches(v.expected.signedEntryXdr, bundle.vectors);
    const rec = recordedFor(matches[0]!, bundle);
    expect(rec.map((r) => r.environment).sort()).toEqual(["native-testutils", "testnet-simulate-enforce"]);
    expect(rec.find((r) => r.environment === "testnet-simulate-enforce")?.protocolVersion).toBe(29);
    expect(rec.every((r) => r.outcome === "accepted")).toBe(true);
  });
  it("are empty for synthetic vectors with no host run", () => {
    const v = bundle.vectors.vectors.find((x) => x.id === "v2-token-ops-synthetic")!;
    const m = findMatches(v.expected.signedEntryXdr, bundle.vectors)[0]!;
    expect(recordedFor(m, bundle)).toEqual([]);
  });
  it("an arbitrary entry has no match", () => {
    const v = bundle.vectors.vectors[0]!;
    const s = v.expected.unsignedEntryXdr;
    const changed = s.slice(0, 20) + (s[20] === "B" ? "C" : "B") + s.slice(21);
    expect(findMatches(changed, bundle.vectors)).toEqual([]);
    expect(findMatches(s, bundle.vectors).length).toBe(1);
  });
});

describe("input handling", () => {
  it("rejects empty, non-base64, oversize and non-XDR input with readable errors", () => {
    expect(() => normalizeInput("   ")).toThrow(AnalysisError);
    expect(() => normalizeInput("not base64!")).toThrow(/standard base64/);
    expect(() => normalizeInput("A".repeat(300000))).toThrow(/refusing/);
    expect(() => analyze("AAAA", TESTNET, bundle.vectors)).toThrow(/Not a valid SorobanAuthorizationEntry/);
    expect(() => analyze(bundle.vectors.vectors[0]!.expected.signedEntryXdr, "  ", bundle.vectors)).toThrow(/passphrase/);
  });
  it("tolerates whitespace and line breaks inside pasted base64", () => {
    const s = bundle.vectors.vectors[0]!.expected.signedEntryXdr;
    const spaced = s.replace(/(.{40})/g, "$1\n  ");
    expect(analyze(spaced, TESTNET, bundle.vectors).verify?.signatureValid).toBe(true);
  });
});
