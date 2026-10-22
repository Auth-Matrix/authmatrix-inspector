import { Account, Address, Keypair, Operation, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { entryFromXdr } from "@anas.abubakar/authmatrix-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "../src/main.ts";
import { loadBundle } from "../src/data.ts";
import { RPC_HOST, TestnetError, collectAuthEntries, lookupTransaction, normalizeHash } from "../src/testnet.ts";

const bundle = loadBundle();
const signed = bundle.vectors.vectors[0]!.expected.signedEntryXdr;
const legacy = bundle.vectors.vectors[1]!.expected.signedEntryXdr;
const HASH = "ab".repeat(32);
const PASS = "Test SDF Network ; September 2015";

function invoke(auth: string[]) {
  const args = new xdr.InvokeContractArgs({ contractAddress: new Address("CBB6ZGAOBKSY4X5DCPJTFARFMUKGBLQQWWRF3Q3PXJUBSNEYLHMY2DFR").toScAddress(), functionName: "relay", args: [] });
  return Operation.invokeHostFunction({ func: xdr.HostFunction.hostFunctionTypeInvokeContract(args), auth: auth.map(entryFromXdr) });
}
function envelope(auth: string[], opts: { feeBump?: boolean; ops?: number } = {}): string {
  const src = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 7));
  const b = new TransactionBuilder(new Account(src.publicKey(), "1"), { fee: "100", networkPassphrase: PASS });
  for (let i = 0; i < (opts.ops ?? 1); i++) b.addOperation(invoke(i === 0 ? auth : []));
  const tx = b.setTimeout(30).build();
  if (!opts.feeBump) return tx.toEnvelope().toXDR("base64");
  return TransactionBuilder.buildFeeBumpTransaction(src, "200", tx, PASS).toEnvelope().toXDR("base64");
}
const rpcReply = (result: object, init: { status?: number } = {}) => new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: init.status ?? 200 });

describe("testnet transaction import", () => {
  it("validates the hash before anything else", () => {
    expect(() => normalizeHash("xyz")).toThrow(TestnetError);
    expect(normalizeHash(` ${HASH.toUpperCase()} `)).toBe(HASH);
  });

  it("collects every entry from every InvokeHostFunction operation", () => {
    const r = collectAuthEntries(envelope([signed, legacy]));
    expect(r.feeBump).toBe(false);
    expect(r.entries.map((e) => e.credentialType)).toEqual(["addressV2", "address"]);
    expect(r.entries[0]!.entryXdr).toBe(signed);
    expect(r.entries[0]!.rootCall).toMatch(/^relay on C/);
  });

  it("unwraps a fee-bump envelope", () => {
    const r = collectAuthEntries(envelope([signed], { feeBump: true }));
    expect(r.feeBump).toBe(true);
    expect(r.entries).toHaveLength(1);
  });

  it("returns no entries for a transaction without authorization", () => {
    expect(collectAuthEntries(envelope([])).entries).toEqual([]);
  });

  it("rejects an envelope that is not transaction XDR", () => {
    expect(() => collectAuthEntries("AAAA")).toThrow(TestnetError);
  });

  describe("with fetch mocked", () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
      fetchMock.mockReset();
      vi.stubGlobal("fetch", fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it("makes no request for an invalid hash", async () => {
      await expect(lookupTransaction("nope")).rejects.toThrow(/64 hexadecimal/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("sends one getTransaction POST to the allowed host only", async () => {
      fetchMock.mockResolvedValue(rpcReply({ status: "SUCCESS", envelopeXdr: envelope([signed]) }));
      const r = await lookupTransaction(HASH);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe(RPC_HOST);
      expect(JSON.parse(init.body)).toEqual({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash: HASH } });
      expect(init.credentials).toBe("omit");
      expect(r.entries).toHaveLength(1);
    });

    it("reports NOT_FOUND clearly", async () => {
      fetchMock.mockResolvedValue(rpcReply({ status: "NOT_FOUND" }));
      await expect(lookupTransaction(HASH)).rejects.toThrow(/not found on testnet/);
    });

    it("reports a failed transaction as FAILED, still listing its entries", async () => {
      fetchMock.mockResolvedValue(rpcReply({ status: "FAILED", envelopeXdr: envelope([signed]) }));
      const r = await lookupTransaction(HASH);
      expect(r.status).toBe("FAILED");
      expect(r.entries).toHaveLength(1);
    });

    it("turns network errors, HTTP errors and RPC errors into errors, never a result", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(lookupTransaction(HASH)).rejects.toThrow(/Could not reach .*Nothing was loaded/);
      fetchMock.mockResolvedValueOnce(new Response("x", { status: 503 }));
      await expect(lookupTransaction(HASH)).rejects.toThrow(/HTTP 503/);
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "bad" } })));
      await expect(lookupTransaction(HASH)).rejects.toThrow(/bad/);
    });

    describe("in the app", () => {
      let root: HTMLElement;
      beforeEach(() => {
        document.body.innerHTML = "";
        root = document.createElement("div");
        document.body.append(root);
      });
      const flush = () => new Promise((r) => setTimeout(r, 0));

      it("does nothing until the button is pressed, then lists entries and opens the chosen one", async () => {
        fetchMock.mockResolvedValue(rpcReply({ status: "SUCCESS", envelopeXdr: envelope([signed, legacy]) }));
        mountApp(root, bundle);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(root.textContent).toContain(RPC_HOST);
        root.querySelector<HTMLInputElement>("#txhash")!.value = HASH;
        root.querySelector<HTMLButtonElement>("#txload")!.click();
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const items = root.querySelectorAll("#txentries li");
        expect(items).toHaveLength(2);
        items[1]!.querySelector("button")!.click();
        expect(root.querySelector<HTMLTextAreaElement>("#entry")!.value).toBe(legacy);
        expect(root.textContent).toMatch(/SOROBAN_CREDENTIALS_ADDRESS \(legacy\)/);
      });

      it("shows an error message when the lookup fails and lists nothing", async () => {
        fetchMock.mockRejectedValue(new TypeError("offline"));
        mountApp(root, bundle);
        root.querySelector<HTMLInputElement>("#txhash")!.value = HASH;
        root.querySelector<HTMLButtonElement>("#txload")!.click();
        await flush();
        expect(root.querySelector("#txmessage")!.textContent).toMatch(/Could not reach/);
        expect(root.querySelectorAll("#txentries li")).toHaveLength(0);
        expect(root.querySelector("#results")!.textContent).not.toMatch(/signature verifies/);
      });

      it("says so when the transaction has no authorization entries", async () => {
        fetchMock.mockResolvedValue(rpcReply({ status: "SUCCESS", envelopeXdr: envelope([]) }));
        mountApp(root, bundle);
        root.querySelector<HTMLInputElement>("#txhash")!.value = HASH;
        root.querySelector<HTMLButtonElement>("#txload")!.click();
        await flush();
        expect(root.querySelector("#txmessage")!.textContent).toMatch(/no Soroban authorization entries/);
      });
    });
  });
});
