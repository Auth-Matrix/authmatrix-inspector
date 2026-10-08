import { authorizationToUnsignedEntry, toBase64 } from "@anas.abubakar/authmatrix-core";
import { beforeEach, describe, expect, it } from "vitest";
import { entryFromFileBytes, mountApp } from "../src/main.ts";
import { loadBundle } from "../src/data.ts";

const bundle = loadBundle();
let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "";
  root = document.createElement("main");
  document.body.append(root);
});

const select = (value: string) => {
  const sel = root.querySelector<HTMLSelectElement>("#vector")!;
  sel.value = value;
  sel.dispatchEvent(new Event("change"));
};
const headings = () => [...root.querySelectorAll("section h2")].map((e) => e.textContent);

describe("inspector app", () => {
  it("renders the input panel, the compat banner and the limits statement before any input", () => {
    mountApp(root, bundle);
    expect(root.querySelector("#compat")?.textContent).toMatch(/Compatibility check passed/);
    expect(root.textContent).toMatch(/not a guarantee of contract safety/);
    expect(headings()).toContain("What this preview is not");
    expect(headings()).not.toContain("Authorization");
  });

  it("loading a vector shows every section: authorization, tree, signature, mutation, recorded, limits", () => {
    mountApp(root, bundle);
    select("v2-nested-relay-testnet|signed");
    expect(headings()).toEqual(["Entry", "Authorization", "Authorized invocation tree", "Payload and signature", "Mutation view", "Reviewed mutation vectors for this entry", "Recorded host results", "What this preview is not"]);
    expect(root.textContent).toMatch(/SOROBAN_CREDENTIALS_ADDRESS_V2/);
    expect(root.textContent).toMatch(/signature verifies/);
    expect(root.textContent).toMatch(/Nonce/);
    expect(root.textContent).toMatch(/Signature expires at ledger/);
    expect(root.textContent).toMatch(/Network passphrase/);
  });

  it("labels recorded host results as RECORDED and never as run by the page", () => {
    mountApp(root, bundle);
    select("v2-nested-relay-testnet|signed");
    const rec = [...root.querySelectorAll("ul.recorded li")].map((li) => li.textContent ?? "");
    expect(rec.some((t) => t.includes("RECORDED") && t.includes("protocol 29"))).toBe(true);
    expect(root.textContent).toMatch(/did not run them/);
  });

  it("an entry that is not byte-identical to a reviewed vector gets no recorded result and an explicit statement", () => {
    mountApp(root, bundle);
    const v = bundle.vectors.vectors[0]!;
    const entry = authorizationToUnsignedEntry({ ...v.authorization, nonce: "42" });
    root.querySelector<HTMLTextAreaElement>("#entry")!.value = toBase64(entry.toXdr());
    root.querySelector<HTMLButtonElement>("#inspect")!.click();
    expect(headings()).toContain("Recorded host results");
    expect(root.textContent).toMatch(/not byte-identical to any reviewed vector/);
    expect(root.textContent).toMatch(/does not run a Soroban host/);
    expect(root.querySelector("ul.recorded")).toBeNull();
  });

  it("mutation chips switch the highlighted differing field", () => {
    mountApp(root, bundle);
    select("v2-nested-relay-testnet|signed");
    root.querySelector<HTMLButtonElement>('[data-field="nonce"]')!.click();
    expect(root.querySelector(".diff .path")?.textContent).toBe("nonce");
    expect(root.textContent).toMatch(/original signature no longer verifies/);
    root.querySelector<HTMLButtonElement>('[data-field="amount"]')!.click();
    expect(root.querySelector(".diff .path")?.textContent).toBe("rootInvocation.args[3]");
  });

  it("bad input produces a readable message and no results", () => {
    mountApp(root, bundle);
    root.querySelector<HTMLTextAreaElement>("#entry")!.value = "definitely not base64 !!!";
    root.querySelector<HTMLButtonElement>("#inspect")!.click();
    expect(root.querySelector("#message")?.textContent).toMatch(/standard base64/);
    expect(headings()).not.toContain("Authorization");
  });

  it("hostile entry text is rendered as text, never as markup", () => {
    mountApp(root, bundle);
    root.querySelector<HTMLTextAreaElement>("#entry")!.value = "<img src=x onerror=alert(1)>";
    root.querySelector<HTMLButtonElement>("#inspect")!.click();
    expect(root.querySelector("img")).toBeNull();
  });

  it("an incompatible bundle hides reviewed data and says so", () => {
    mountApp(root, { ...bundle, vectors: { ...bundle.vectors, formatVersion: "2.0.0" } });
    expect(root.querySelector("#compat")?.textContent).toMatch(/Compatibility check failed/);
    select("v2-nested-relay-testnet|signed");
    expect(headings()).not.toContain("Authorization");
  });

  it("clear resets results", () => {
    mountApp(root, bundle);
    select("v2-nested-relay-testnet|signed");
    root.querySelector<HTMLButtonElement>("#clear")!.click();
    expect(headings()).not.toContain("Authorization");
    expect(root.querySelector<HTMLTextAreaElement>("#entry")!.value).toBe("");
  });
});

describe("file loading", () => {
  const entry = bundle.vectors.vectors[0]!.expected.signedEntryXdr;
  it("reads base64 text files, with line breaks", () => {
    const text = new TextEncoder().encode(entry.replace(/(.{60})/g, "$1\n"));
    expect(entryFromFileBytes(text)).toBe(entry);
  });
  it("reads raw XDR binary files", () => {
    const bin = Uint8Array.from(atob(entry), (c) => c.charCodeAt(0));
    expect(entryFromFileBytes(bin)).toBe(entry);
  });
  it("refuses oversized files", () => {
    expect(() => entryFromFileBytes(new Uint8Array(200_000))).toThrow(/refusing/);
  });
});
