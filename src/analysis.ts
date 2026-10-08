import {
  assembleEntry,
  decodeCall,
  decodeEntry,
  decodedToAuthorization,
  diffPaths,
  entryFromXdr,
  mutateAuthorization,
  networkIdHex,
  scValFromBase64,
  typedFromScVal,
  verifyEntry,
  type Authorization,
  type CallDecoding,
  type DecodedEntry,
  type DecodedInvocation,
  type EvidenceFile,
  type MutationField,
  type Typed,
  type VerifyResult,
  type VectorFile,
} from "@anas.abubakar/authmatrix-core";

export const MAX_INPUT_CHARS = 200_000;

export class AnalysisError extends Error {}

export interface TreeNode {
  kind: "contractFn" | "createContract";
  contractId?: string;
  functionName?: string;
  decoding?: CallDecoding;
  functionXdr?: string;
  children: TreeNode[];
}

export type VectorMatchKind = "signed" | "unsigned" | `mutation:${MutationField}` | `resigned:${MutationField}`;
export interface VectorMatch {
  vectorId: string;
  title: string;
  kind: VectorMatchKind;
  /** passphrase the matched variant is defined under */
  passphrase: string;
}

export interface Analysis {
  entryXdr: string;
  passphrase: string;
  networkIdHex: string;
  decoded: DecodedEntry;
  tree: TreeNode;
  /** null when the credential type has no address signature to verify here */
  verify: VerifyResult | null;
  verifyNote: string | null;
  authorization: Authorization | null;
  authorizationNote: string | null;
  matches: VectorMatch[];
}

export function normalizeInput(raw: string): string {
  const s = raw.replace(/\s+/g, "");
  if (s.length === 0) throw new AnalysisError("Paste a base64 SorobanAuthorizationEntry first.");
  if (s.length > MAX_INPUT_CHARS) throw new AnalysisError(`Input is larger than ${MAX_INPUT_CHARS} characters; refusing to parse it.`);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s) || s.length % 4 !== 0) throw new AnalysisError("That is not standard base64 (A-Z a-z 0-9 + / and = padding).");
  return s;
}

function toTree(d: DecodedInvocation): TreeNode {
  const children = d.subInvocations.map(toTree);
  if (d.kind === "contractFn") return { kind: "contractFn", contractId: d.contractId, functionName: d.functionName, decoding: decodeCall(d.functionName, d.args), children };
  return { kind: "createContract", functionXdr: d.functionXdr, children };
}

export function findMatches(entryXdr: string, vectors: VectorFile): VectorMatch[] {
  const out: VectorMatch[] = [];
  for (const v of vectors.vectors) {
    const base = { vectorId: v.id, title: v.title };
    if (v.expected.signedEntryXdr === entryXdr) out.push({ ...base, kind: "signed", passphrase: v.authorization.networkPassphrase });
    if (v.expected.unsignedEntryXdr === entryXdr) out.push({ ...base, kind: "unsigned", passphrase: v.authorization.networkPassphrase });
    for (const m of v.mutations) {
      if (m.expected.entryXdrWithOriginalSignature === entryXdr) out.push({ ...base, kind: `mutation:${m.field}`, passphrase: m.mutatedAuthorization.networkPassphrase });
      if (m.expected.resignedEntryXdr === entryXdr) out.push({ ...base, kind: `resigned:${m.field}`, passphrase: m.mutatedAuthorization.networkPassphrase });
    }
  }
  return out;
}

/** Decode, verify and describe an entry. Throws AnalysisError with a readable message on bad input. */
export function analyze(rawInput: string, passphrase: string, vectors: VectorFile): Analysis {
  const entryXdr = normalizeInput(rawInput);
  if (passphrase.trim() === "") throw new AnalysisError("Enter a network passphrase; the signature payload binds it.");
  let decoded: DecodedEntry;
  try {
    decoded = decodeEntry(entryFromXdr(entryXdr));
  } catch (e) {
    throw new AnalysisError(`Not a valid SorobanAuthorizationEntry: ${e instanceof Error ? e.message : String(e)}`);
  }
  let verify: VerifyResult | null = null;
  let verifyNote: string | null = null;
  if (decoded.credentialType === "sourceAccount") {
    verifyNote = "Source-account credentials carry no signature of their own; they are authorized by the transaction source account's signature on the transaction. Nothing to verify here.";
  } else {
    try {
      verify = verifyEntry(entryXdr, passphrase);
      if (decoded.credentialType === "addressWithDelegates") {
        verifyNote = `Delegated credentials: only the top-level address signature is checked here (${decoded.delegateCount} delegate node${decoded.delegateCount === 1 ? "" : "s"} are not verified). Every signer signs the same payload, bound to the top-level address.`;
      }
    } catch (e) {
      verifyNote = `Signature check could not run: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  let authorization: Authorization | null = null;
  let authorizationNote: string | null = null;
  try {
    authorization = decodedToAuthorization(decoded, passphrase);
  } catch (e) {
    authorizationNote = e instanceof Error ? e.message : String(e);
  }
  return { entryXdr, passphrase, networkIdHex: networkIdHex(passphrase), decoded, tree: toTree(decoded.rootInvocation), verify, verifyNote, authorization, authorizationNote, matches: findMatches(entryXdr, vectors) };
}

/* ---------- value formatting ---------- */

export function fmtTyped(t: Typed): string {
  switch (t.type) {
    case "void":
      return "void";
    case "bool":
      return String(t.value);
    case "bytes":
      return `0x${t.hex}`;
    case "vec":
      return t.items === null ? "vec(none)" : `[${t.items.map((i) => fmtTyped(i.typed)).join(", ")}]`;
    case "map":
      return t.entries === null ? "map(none)" : `{${t.entries.map((e) => `${fmtTyped(e.key.typed)}: ${fmtTyped(e.val.typed)}`).join(", ")}}`;
    case "raw":
      return `(unrecognized ${t.scvType}; see XDR)`;
    case "string":
      return JSON.stringify(t.value);
    default:
      return `${t.value}`;
  }
}

export function typeLabel(t: Typed): string {
  return t.type === "address" ? `address (${t.addressType})` : t.type;
}

/* ---------- mutation view ---------- */

export interface MutationView {
  field: MutationField;
  applicable: boolean;
  reason?: string;
  changes: { path: string; before: string; after: string }[];
  originalHash: string;
  mutatedHash: string;
  hashChanged: boolean;
  originalSignatureVerifies: boolean;
  mutatedPassphrase: string;
  verifyReason: string;
}

function getPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function describeAt(path: string, value: unknown): string {
  if (typeof value === "string" && /\.args\[\d+\]$/.test(path)) {
    try {
      const t = typedFromScVal(scValFromBase64(value));
      return `${typeLabel(t.typed)} ${fmtTyped(t.typed)}`;
    } catch {
      return value;
    }
  }
  return String(value);
}

export function computeMutation(a: Analysis, field: MutationField): MutationView {
  const base = { field, changes: [], originalHash: a.verify?.payloadHashHex ?? "", mutatedHash: "", hashChanged: false, originalSignatureVerifies: false, mutatedPassphrase: a.passphrase, verifyReason: "" };
  if (!a.authorization || !a.verify) return { ...base, applicable: false, reason: a.authorizationNote ?? a.verifyNote ?? "This entry cannot be converted to the mutation model (address and addressV2 credentials with contract-function invocations only)." };
  const mutated = mutateAuthorization(a.authorization, field);
  if (!mutated) return { ...base, applicable: false, reason: field === "recipient" || field === "amount" ? `No call in this tree is recognized as carrying a ${field} (only SEP-41 / Stellar Asset Contract shaped calls and the fixture are mapped), so there is nothing to mutate. Unknown arguments are never guessed.` : "Not applicable." };
  const sigRaw = a.decoded.signature.rawXdr;
  const mutatedEntry = assembleEntry(mutated, sigRaw).toXdr("base64");
  const r = verifyEntry(mutatedEntry, mutated.networkPassphrase);
  const changes = diffPaths(a.authorization, mutated).map((path) => ({ path, before: describeAt(path, getPath(a.authorization, path)), after: describeAt(path, getPath(mutated, path)) }));
  return {
    field,
    applicable: true,
    changes,
    originalHash: a.verify.payloadHashHex,
    mutatedHash: r.payloadHashHex,
    hashChanged: r.payloadHashHex !== a.verify.payloadHashHex,
    originalSignatureVerifies: r.signatureValid,
    mutatedPassphrase: mutated.networkPassphrase,
    verifyReason: r.reason,
  };
}

/* ---------- recorded host results ---------- */

export interface RecordedResult {
  environment: "native-testutils" | "testnet-simulate-enforce";
  protocolVersion: number | undefined;
  recordedAt: string;
  case: string;
  expectation: "accept" | "reject";
  outcome: "accepted" | "rejected";
  detail: string;
  evidencePath: string;
}

export function caseForMatch(kind: VectorMatchKind): string | null {
  if (kind === "signed") return "original";
  if (kind === "unsigned") return "control-unsigned";
  if (kind.startsWith("mutation:")) return kind.slice("mutation:".length);
  if (kind.startsWith("resigned:")) return `${kind.slice("resigned:".length)}-resigned`;
  return null;
}

export function recordedFor(match: VectorMatch, files: { native: EvidenceFile; testnet: EvidenceFile }): RecordedResult[] {
  const c = caseForMatch(match.kind);
  if (!c) return [];
  const out: RecordedResult[] = [];
  for (const [ev, path] of [[files.native, "evidence/native-host/results.json"], [files.testnet, "evidence/testnet/summary.json"]] as const) {
    for (const r of ev.results) {
      if (r.vectorId !== match.vectorId || r.case !== c) continue;
      const pv = ev.environment["protocolVersion"];
      out.push({ environment: ev.kind, protocolVersion: typeof pv === "number" ? pv : undefined, recordedAt: ev.recordedAt, case: r.case, expectation: r.expectation, outcome: r.outcome, detail: r.detail, evidencePath: path });
    }
  }
  return out;
}

export const PRESET_NETWORKS: { label: string; passphrase: string }[] = [
  { label: "Testnet", passphrase: "Test SDF Network ; September 2015" },
  { label: "Public network", passphrase: "Public Global Stellar Network ; September 2015" },
  { label: "Futurenet", passphrase: "Test SDF Future Network ; October 2022" },
];
