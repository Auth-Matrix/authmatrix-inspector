// The only network code in this app. It runs only when the user presses "Load from testnet".
import { xdr } from "@stellar/stellar-sdk";
import { decodeEntry, entryFromXdr } from "@anas.abubakar/authmatrix-core";

/** The one host this app may contact. Keep in sync with connect-src in index.html and vercel.json. */
export const RPC_HOST = "https://soroban-testnet.stellar.org";
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const MAX_RESPONSE_CHARS = 3_000_000;
const TIMEOUT_MS = 15_000;

export class TestnetError extends Error {}

export interface FoundEntry {
  /** 1-based position among all entries found in the transaction */
  index: number;
  operationIndex: number;
  entryXdr: string;
  credentialType: string;
  address: string | null;
  rootCall: string;
}

export interface TransactionLookup {
  hash: string;
  status: "SUCCESS" | "FAILED";
  feeBump: boolean;
  entries: FoundEntry[];
}

export function normalizeHash(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(s)) throw new TestnetError("A transaction hash is 64 hexadecimal characters (0-9, a-f).");
  return s;
}

/** Decode a transaction envelope (unwrapping a fee bump) and collect every SorobanAuthorizationEntry. */
export function collectAuthEntries(envelopeXdr: string): { entries: FoundEntry[]; feeBump: boolean } {
  let env: xdr.TransactionEnvelope;
  try {
    env = xdr.TransactionEnvelope.fromXDR(envelopeXdr, "base64");
  } catch {
    throw new TestnetError("The RPC returned an envelope that could not be decoded as transaction XDR.");
  }
  let feeBump = false;
  let operations: xdr.Operation[];
  if (env.type === "envelopeTypeTxFeeBump") {
    feeBump = true;
    operations = env.feeBump.tx.innerTx.v1.tx.operations;
  } else if (env.type === "envelopeTypeTx") operations = env.v1.tx.operations;
  else if (env.type === "envelopeTypeTxV0") operations = env.v0.tx.operations;
  else throw new TestnetError("Unsupported transaction envelope type.");
  const entries: FoundEntry[] = [];
  operations.forEach((op, operationIndex) => {
    if (op.body.type !== "invokeHostFunction") return;
    for (const e of op.body.invokeHostFunctionOp.auth) {
      const entryXdr = e.toXDR("base64");
      const d = decodeEntry(entryFromXdr(entryXdr));
      const root = d.rootInvocation;
      entries.push({
        index: entries.length + 1,
        operationIndex,
        entryXdr,
        credentialType: d.credentialType,
        address: d.address,
        rootCall: root.kind === "contractFn" ? `${root.functionName} on ${root.contractId}` : "create contract",
      });
    }
  });
  return { entries, feeBump };
}

/** Call Soroban RPC getTransaction at RPC_HOST. Throws TestnetError with a user-facing message otherwise. */
export async function lookupTransaction(rawHash: string): Promise<TransactionLookup> {
  const hash = normalizeHash(rawHash);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let text: string;
  try {
    const res = await fetch(RPC_HOST, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash } }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: ctl.signal,
    });
    if (!res.ok) throw new TestnetError(`The RPC answered HTTP ${res.status}. Nothing was loaded.`);
    text = await res.text();
  } catch (e) {
    if (e instanceof TestnetError) throw e;
    const why = e instanceof DOMException && e.name === "AbortError" ? "the request timed out" : e instanceof Error ? e.message : String(e);
    throw new TestnetError(`Could not reach ${RPC_HOST}: ${why}. Nothing was loaded; this is not a result.`);
  } finally {
    clearTimeout(timer);
  }
  if (text.length > MAX_RESPONSE_CHARS) throw new TestnetError("The RPC response is larger than this page will read. Nothing was loaded.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new TestnetError("The RPC did not return JSON. Nothing was loaded.");
  }
  const obj = body as { error?: { message?: unknown }; result?: { status?: unknown; envelopeXdr?: unknown } };
  if (obj.error) throw new TestnetError(`The RPC returned an error: ${typeof obj.error.message === "string" ? obj.error.message : "unknown error"}.`);
  const status = obj.result?.status;
  if (status === "NOT_FOUND") throw new TestnetError("Transaction not found on testnet. Check the hash, or it may be outside the RPC retention window or on another network.");
  if ((status !== "SUCCESS" && status !== "FAILED") || typeof obj.result?.envelopeXdr !== "string") throw new TestnetError("The RPC response had no transaction envelope. Nothing was loaded.");
  const { entries, feeBump } = collectAuthEntries(obj.result.envelopeXdr);
  return { hash, status, feeBump, entries };
}
