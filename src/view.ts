import type { MutationField } from "@anasabubakar/authmatrix-core";
import { MUTATION_FIELDS } from "@anasabubakar/authmatrix-core";
import { fmtTyped, typeLabel, type Analysis, type MutationView, type RecordedResult, type TreeNode, type VectorMatch } from "./analysis.ts";
import { h } from "./dom.ts";

const CREDENTIAL_LABELS: Record<string, { name: string; payload: string }> = {
  address: { name: "SOROBAN_CREDENTIALS_ADDRESS (legacy)", payload: "ENVELOPE_TYPE_SOROBAN_AUTHORIZATION: network, nonce, expiry, invocation. Does not bind the address." },
  addressV2: { name: "SOROBAN_CREDENTIALS_ADDRESS_V2 (CAP-71, Protocol 27)", payload: "ENVELOPE_TYPE_SOROBAN_AUTHORIZATION_WITH_ADDRESS: also binds the authorizing address." },
  addressWithDelegates: { name: "SOROBAN_CREDENTIALS_ADDRESS_WITH_DELEGATES (CAP-71)", payload: "ENVELOPE_TYPE_SOROBAN_AUTHORIZATION_WITH_ADDRESS, bound to the top-level address and shared by every delegate signer." },
  sourceAccount: { name: "SOROBAN_CREDENTIALS_SOURCE_ACCOUNT", payload: "No payload of its own: covered by the transaction envelope signature." },
};

const code = (text: string, cls = "") => h("code", { class: `wrap ${cls}`.trim() }, text);

function kv(rows: [string, Node | string][]): HTMLElement {
  const dl = h("dl", { class: "kv" });
  for (const [k, v] of rows) {
    dl.append(h("dt", {}, k), h("dd", {}, typeof v === "string" ? code(v) : v));
  }
  return dl;
}

function badge(text: string, tone: "ok" | "bad" | "info" | "warn"): HTMLElement {
  return h("span", { class: `badge badge-${tone}` }, text);
}

export function renderAuthorization(a: Analysis): HTMLElement {
  const d = a.decoded;
  const cred = CREDENTIAL_LABELS[d.credentialType]!;
  const rows: [string, Node | string][] = [
    ["Credential type", h("span", {}, cred.name)],
    ["Signature payload", h("span", {}, cred.payload)],
  ];
  if (d.address !== null) rows.push(["Authorizing address", d.address]);
  if (d.nonce !== null) rows.push(["Nonce", d.nonce]);
  if (d.signatureExpirationLedger !== null) rows.push(["Signature expires at ledger", String(d.signatureExpirationLedger)]);
  rows.push(["Network passphrase", a.passphrase], ["Network id (SHA-256 of passphrase)", a.networkIdHex]);
  if (d.credentialType === "addressWithDelegates") rows.push(["Delegate nodes", String(d.delegateCount)]);
  return h("section", { class: "card", "aria-labelledby": "h-auth" }, h("h2", { id: "h-auth" }, "Authorization"), kv(rows));
}

function renderCall(n: TreeNode): HTMLElement {
  const li = h("li", { class: "node" });
  if (n.kind === "createContract") {
    li.append(h("div", { class: "call" }, badge("create contract", "info"), " host function, shown as opaque XDR"), h("details", {}, h("summary", {}, "XDR"), code(n.functionXdr ?? "")));
  } else {
    const dec = n.decoding!;
    li.append(h("div", { class: "call" }, code(n.functionName ?? "", "fn"), " on ", code(n.contractId ?? "")));
    if (dec.status === "mapped") {
      li.append(
        h("div", { class: "mapped" }, badge("token-shaped call", "info"), ` ${dec.mapping.summary} (${dec.mapping.source})`),
      );
      const ul = h("ul", { class: "args" });
      for (const arg of dec.args) {
        ul.append(h("li", {}, h("span", { class: "argname" }, arg.name), arg.role ? h("span", { class: "role" }, ` (${arg.role})`) : null, ": ", code(String(arg.value)), arg.kind === "i128" ? h("span", { class: "hint" }, " raw integer, token decimals are not in the entry") : null));
      }
      li.append(ul);
    } else {
      li.append(h("div", { class: "unmapped" }, badge("unmapped, shown raw", "warn"), ` ${dec.reason}.`));
      const ul = h("ul", { class: "args" });
      dec.args.forEach((arg, i) => {
        ul.append(h("li", {}, h("span", { class: "argname" }, `arg ${i}`), ": ", h("span", { class: "hint" }, typeLabel(arg.typed) + " "), code(fmtTyped(arg.typed)), h("details", {}, h("summary", {}, "XDR"), code(arg.xdr))));
      });
      li.append(ul);
    }
  }
  if (n.children.length > 0) {
    const ul = h("ul", { class: "tree" });
    for (const c of n.children) ul.append(renderCall(c));
    li.append(ul);
  }
  return li;
}

export function renderTree(a: Analysis): HTMLElement {
  return h("section", { class: "card", "aria-labelledby": "h-tree" }, h("h2", { id: "h-tree" }, "Authorized invocation tree"), h("p", { class: "hint" }, "The root call and the sub-invocations the signer authorizes. This is what the signature covers; it is not a prediction of what the contracts will do. A \"token-shaped call\" label means the function name, argument count and argument types match a reviewed SEP-41 or Stellar Asset Contract signature; the contract itself is not known to be a token."), h("ul", { class: "tree root" }, renderCall(a.tree)));
}

export function renderSignature(a: Analysis): HTMLElement {
  const sec = h("section", { class: "card", "aria-labelledby": "h-sig" }, h("h2", { id: "h-sig" }, "Payload and signature"));
  if (a.verify) {
    const v = a.verify;
    sec.append(
      kv([
        ["Preimage type", v.preimageType],
        ["Preimage XDR (base64)", v.preimageXdr],
        ["Payload hash (SHA-256 of preimage)", v.payloadHashHex],
        ["Signature present", a.decoded.signature.kind === "ed25519" ? "ed25519 signature found" : a.decoded.signature.kind === "none" ? "none" : "present but not a recognized ed25519 signature"],
        ...(a.decoded.signature.signatureHex ? ([["Signature (hex)", a.decoded.signature.signatureHex]] as [string, string][]) : []),
      ]),
      h("p", { class: "verdict" }, v.signatureValid ? badge("signature verifies", "ok") : badge("signature does not verify", "bad"), ` ${v.reason === "ok" ? "The signature is valid over this payload for the passphrase entered above." : v.reason}`),
      h("p", { class: "hint" }, "Computed in your browser with the paired core library (stellar-sdk helpers). A mismatch can mean a tampered entry or the wrong network passphrase."),
    );
  }
  if (a.verifyNote) sec.append(h("p", { class: "hint" }, a.verifyNote));
  return sec;
}

function shortId(s: string): string {
  return s.length > 14 ? `${s.slice(0, 6)}...${s.slice(-6)}` : s;
}

export function renderMutation(a: Analysis, views: MutationView[], selected: MutationField, onSelect: (f: MutationField) => void): HTMLElement {
  const sec = h("section", { class: "card", "aria-labelledby": "h-mut" }, h("h2", { id: "h-mut" }, "Mutation view"), h("p", { class: "hint" }, "Change one field, keep the original signature, and recompute the payload. A host rebuilds the payload from what it executes, so any change below makes the original signature invalid."));
  const row = h("div", { class: "chips", role: "group", "aria-label": "Field to mutate" });
  for (const f of MUTATION_FIELDS) {
    const b = h("button", { type: "button", class: f === selected ? "chip active" : "chip", "aria-pressed": f === selected ? "true" : "false", "data-field": f }, f);
    b.addEventListener("click", () => onSelect(f));
    row.append(b);
  }
  sec.append(row);
  const v = views.find((x) => x.field === selected);
  if (!v) return sec;
  if (!v.applicable) {
    sec.append(h("p", { class: "unmapped" }, v.reason ?? "Not applicable."));
    return sec;
  }
  const list = h("ul", { class: "diff" });
  for (const c of v.changes) {
    list.append(h("li", {}, h("div", { class: "path" }, c.path), h("div", { class: "before" }, h("span", { class: "tag" }, "original"), code(c.before)), h("div", { class: "after" }, h("span", { class: "tag" }, "mutated"), code(c.after))));
  }
  sec.append(
    h("h3", {}, "Differing fields"),
    list,
    kv([
      ["Original payload hash", v.originalHash],
      ["Mutated payload hash", v.mutatedHash],
    ]),
    h("p", { class: "verdict" }, v.hashChanged ? badge("payload hash changed", "info") : badge("payload hash unchanged", "bad"), " ", v.originalSignatureVerifies ? badge("original signature still verifies", "bad") : badge("original signature no longer verifies", "ok")),
    h("p", { class: "hint" }, `Verified under passphrase: ${v.mutatedPassphrase}. ${v.verifyReason}.`),
    h("p", { class: "hint" }, "Computed locally. Whether a host refuses the mutated entry is shown below only for reviewed vectors that have a recording."),
  );
  return sec;
}

function recordedRow(r: RecordedResult): HTMLElement {
  const env = r.environment === "testnet-simulate-enforce" ? "Stellar testnet simulateTransaction, enforce mode" : "soroban-sdk testutils set_auths (offline host)";
  return h("li", {}, h("div", {}, badge("RECORDED", "info"), " ", badge(r.outcome, r.outcome === "accepted" ? "ok" : "bad"), " ", env, r.protocolVersion !== undefined ? `, protocol ${r.protocolVersion}` : ""), h("div", { class: "hint" }, `Recorded ${r.recordedAt || "(time not stored)"}; source ${r.evidencePath}; case "${r.case}"; expected ${r.expectation}.`), h("div", {}, code(r.detail)));
}

export function renderRecorded(matches: VectorMatch[], recorded: Map<VectorMatch, RecordedResult[]>): HTMLElement {
  const sec = h("section", { class: "card", "aria-labelledby": "h-rec" }, h("h2", { id: "h-rec" }, "Recorded host results"));
  if (matches.length === 0) {
    sec.append(h("p", {}, "This entry is not byte-identical to any reviewed vector, so there is no recorded host result for it. This page does not run a Soroban host and cannot tell you whether a host would accept it."));
    return sec;
  }
  sec.append(h("p", { class: "hint" }, "These results were recorded earlier by authmatrix-core against the real Soroban host. This page did not run them; it only shows the stored recording."));
  for (const m of matches) {
    const rs = recorded.get(m) ?? [];
    sec.append(h("h3", {}, `${m.vectorId}: ${m.kind}`), h("p", { class: "hint" }, m.title));
    if (rs.length === 0) sec.append(h("p", {}, "No recording exists for this variant."));
    else {
      const ul = h("ul", { class: "recorded" });
      rs.forEach((r) => ul.append(recordedRow(r)));
      sec.append(ul);
    }
  }
  return sec;
}

export function renderVectorMutations(a: Analysis, matches: VectorMatch[], reviewed: { vectorId: string; field: MutationField; changedPaths: string[]; mutatedHash: string; recorded: RecordedResult[] }[]): HTMLElement | null {
  const mine = matches.filter((m) => m.kind === "signed");
  if (mine.length === 0) return null;
  const sec = h("section", { class: "card", "aria-labelledby": "h-rv" }, h("h2", { id: "h-rv" }, "Reviewed mutation vectors for this entry"), h("p", { class: "hint" }, "Stored in the paired core vectors file. Each keeps the original signature; hashes are the reviewed values, results are recordings."));
  const ul = h("ul", { class: "recorded" });
  for (const r of reviewed.filter((x) => mine.some((m) => m.vectorId === x.vectorId))) {
    ul.append(
      h("li", {}, h("div", {}, h("strong", {}, r.field), " ", ...r.recorded.map((x) => h("span", {}, badge(x.environment === "testnet-simulate-enforce" ? `testnet ${x.outcome}` : `offline host ${x.outcome}`, x.outcome === "rejected" ? "ok" : "bad"), " "))), h("div", { class: "hint" }, `changed: ${r.changedPaths.join(", ")}`), h("div", {}, "hash ", code(shortId(r.mutatedHash)))),
    );
  }
  sec.append(ul, h("p", { class: "hint" }, `Original payload hash ${a.verify ? shortId(a.verify.payloadHashHex) : "n/a"}.`));
  return sec;
}

export function renderLimits(): HTMLElement {
  return h(
    "section",
    { class: "card limits", "aria-labelledby": "h-lim" },
    h("h2", { id: "h-lim" }, "What this preview is not"),
    h(
      "ul",
      {},
      h("li", {}, "It is not a guarantee of contract safety, and it does not predict everything a transaction will do. It shows what the signature covers."),
      h("li", {}, "Token decoding is by function name, arity and argument types from a reviewed SEP-41 / Stellar Asset Contract table. It does not know the contract is a token. Unknown functions and values are shown raw."),
      h("li", {}, "Signature checks run locally and cover address credentials with a classic (G...) ed25519 signer. Contract-account signers, custom __check_auth and delegate signatures are not verified."),
      h("li", {}, "Recorded host results come from the fixture contracts only, were produced earlier, and are labelled RECORDED. Nothing is sent to any network by this page."),
      h("li", {}, "No audit, endorsement or wallet review is implied."),
    ),
  );
}
