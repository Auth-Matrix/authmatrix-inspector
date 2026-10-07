import "./style.css";
import { z } from "zod";
import { MUTATION_FIELDS, type MutationField } from "@anasabubakar/authmatrix-core";
import { AnalysisError, PRESET_NETWORKS, analyze, caseForMatch, computeMutation, normalizeInput, recordedFor, type Analysis, type MutationView, type RecordedResult, type VectorMatch } from "./analysis.ts";
import { checkCompat, type CompatReport } from "./compat.ts";
import { loadBundle, type Bundle } from "./data.ts";
import { clear, h } from "./dom.ts";
import { renderAuthorization, renderLimits, renderMutation, renderRecorded, renderSignature, renderTree, renderVectorMutations } from "./view.ts";

// The strict CSP forbids unsafe-eval, so zod must not try to JIT-compile validators with new Function.
z.config({ jitless: true });

const MAX_FILE_BYTES = 150_000;

/** Accept a text file containing base64 (any whitespace) or a raw XDR binary file. */
export function entryFromFileBytes(bytes: Uint8Array): string {
  if (bytes.length > MAX_FILE_BYTES) throw new AnalysisError(`File is larger than ${MAX_FILE_BYTES} bytes; refusing to read it.`);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (/^[A-Za-z0-9+/=\s]+$/.test(text) && text.trim().length > 0) return normalizeInput(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export interface AppHandle {
  load(entryXdr: string, passphrase: string): void;
  compat: CompatReport;
}

export function mountApp(root: HTMLElement, bundle: Bundle = loadBundle()): AppHandle {
  const compat = checkCompat(bundle.vectors, [bundle.native, bundle.testnet]);
  clear(root);

  const textarea = h("textarea", { id: "entry", rows: "7", spellcheck: "false", autocomplete: "off", placeholder: "AAAA... (base64 SorobanAuthorizationEntry XDR)" });
  const netSelect = h("select", { id: "net", "aria-label": "Network preset" });
  for (const n of PRESET_NETWORKS) netSelect.append(h("option", { value: n.passphrase }, n.label));
  netSelect.append(h("option", { value: "" }, "Custom"));
  const passphrase = h("input", { id: "passphrase", type: "text", value: PRESET_NETWORKS[0]!.passphrase, spellcheck: "false", autocomplete: "off" });
  const vectorSelect = h("select", { id: "vector", "aria-label": "Load a reviewed vector" }, h("option", { value: "" }, "Load a reviewed vector..."));
  for (const v of bundle.vectors.vectors) {
    const g = h("optgroup", { label: v.id });
    g.append(h("option", { value: `${v.id}|signed` }, "original (signed)"));
    for (const m of v.mutations) g.append(h("option", { value: `${v.id}|mutation:${m.field}` }, `mutation: ${m.field} (original signature kept)`));
    for (const m of v.mutations) g.append(h("option", { value: `${v.id}|resigned:${m.field}` }, `re-signed: ${m.field}`));
    vectorSelect.append(g);
  }
  const fileInput = h("input", { id: "file", type: "file", accept: ".txt,.xdr,.b64,.json,text/plain", "aria-label": "Load an entry from a file" });
  const inspectBtn = h("button", { type: "button", class: "primary", id: "inspect" }, "Inspect");
  const clearBtn = h("button", { type: "button", id: "clear" }, "Clear");
  const message = h("p", { class: "message", role: "status", id: "message" });
  const results = h("div", { id: "results", "aria-live": "polite" });
  let selectedField: MutationField = "recipient";
  let current: Analysis | null = null;

  const compatBanner = compat.ok
    ? h("p", { class: "compat ok", id: "compat" }, `Paired with ${compat.core.package} ${compat.core.version} (core commit ${compat.core.coreCommit.slice(0, 8)}, vector format ${compat.vectorFormatVersion}). Compatibility check passed.`)
    : h("p", { class: "compat bad", id: "compat", role: "alert" }, `Compatibility check failed: ${compat.problems.join("; ")}. Reviewed vectors and recordings are not shown.`);

  function render() {
    clear(results);
    if (!current || !compat.ok) return;
    const a = current;
    const views = new Map<MutationField, MutationView>();
    for (const f of MUTATION_FIELDS) views.set(f, computeMutation(a, f));
    const recorded = new Map<VectorMatch, RecordedResult[]>();
    for (const m of a.matches) recorded.set(m, recordedFor(m, bundle));
    const reviewed = bundle.vectors.vectors.flatMap((v) =>
      v.mutations.map((m) => ({
        vectorId: v.id,
        field: m.field,
        changedPaths: m.changedPaths,
        mutatedHash: m.expected.mutatedPayloadHashHex,
        recorded: [...recordedFor({ vectorId: v.id, title: v.title, kind: `mutation:${m.field}`, passphrase: m.mutatedAuthorization.networkPassphrase }, bundle)],
      })),
    );
    void caseForMatch;
    results.append(renderAuthorization(a), renderTree(a), renderSignature(a), renderMutation(a, [...views.values()], selectedField, (f) => {
      selectedField = f;
      render();
    }));
    const rv = renderVectorMutations(a, a.matches, reviewed);
    if (rv) results.append(rv);
    results.append(renderRecorded(a.matches, recorded), renderLimits());
  }

  function run() {
    message.textContent = "";
    try {
      current = analyze(textarea.value, passphrase.value, bundle.vectors);
      render();
    } catch (e) {
      current = null;
      clear(results);
      message.textContent = e instanceof AnalysisError ? e.message : `Could not analyze that input: ${e instanceof Error ? e.message : String(e)}`;
      results.append(renderLimits());
    }
  }

  function load(entryXdr: string, pass: string) {
    textarea.value = entryXdr;
    passphrase.value = pass;
    netSelect.value = PRESET_NETWORKS.some((n) => n.passphrase === pass) ? pass : "";
    run();
  }

  inspectBtn.addEventListener("click", run);
  clearBtn.addEventListener("click", () => {
    textarea.value = "";
    message.textContent = "";
    current = null;
    clear(results);
    results.append(renderLimits());
  });
  netSelect.addEventListener("change", () => {
    if (netSelect.value !== "") passphrase.value = netSelect.value;
    if (textarea.value.trim() !== "") run();
  });
  passphrase.addEventListener("input", () => {
    netSelect.value = PRESET_NETWORKS.some((n) => n.passphrase === passphrase.value) ? passphrase.value : "";
  });
  passphrase.addEventListener("change", () => textarea.value.trim() !== "" && run());
  vectorSelect.addEventListener("change", () => {
    const [id, kind] = vectorSelect.value.split("|");
    const v = bundle.vectors.vectors.find((x) => x.id === id);
    if (!v || !kind) return;
    if (kind === "signed") return load(v.expected.signedEntryXdr, v.authorization.networkPassphrase);
    const [type, field] = kind.split(":");
    const m = v.mutations.find((x) => x.field === field);
    if (!m) return;
    load(type === "mutation" ? m.expected.entryXdrWithOriginalSignature : m.expected.resignedEntryXdr, m.mutatedAuthorization.networkPassphrase);
  });
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      message.textContent = `File is larger than ${MAX_FILE_BYTES} bytes; refusing to read it.`;
      return;
    }
    void f.arrayBuffer().then((buf) => {
      try {
        textarea.value = entryFromFileBytes(new Uint8Array(buf));
        run();
      } catch (e) {
        message.textContent = e instanceof Error ? e.message : String(e);
      }
    });
  });

  root.append(
    h("header", { class: "top" }, h("h1", {}, "AuthMatrix Inspector"), h("p", { class: "lead" }, "Paste a Soroban authorization entry. See who authorizes what, on which network, with which credential type, and whether the signature verifies. Change one field and watch the original signature stop verifying."), h("p", { class: "notice" }, "A preview is not a guarantee of contract safety or of everything a transaction will do. Everything runs in this page; nothing is sent anywhere."), compatBanner),
    h(
      "section",
      { class: "card input", "aria-labelledby": "h-in" },
      h("h2", { id: "h-in" }, "Entry"),
      h("label", { for: "entry" }, "SorobanAuthorizationEntry (base64 XDR)"),
      textarea,
      h("div", { class: "row" }, h("label", { for: "net" }, "Network"), netSelect),
      h("label", { for: "passphrase" }, "Network passphrase (the payload binds its SHA-256)"),
      passphrase,
      h("div", { class: "row actions" }, inspectBtn, clearBtn),
      h("div", { class: "row stack" }, h("label", { for: "vector" }, "Or load a reviewed vector"), vectorSelect),
      h("div", { class: "row stack" }, h("label", { for: "file" }, "Or load a .txt / .xdr file (base64 text or raw XDR)"), fileInput),
      message,
    ),
    results,
  );
  results.append(renderLimits());
  return { load, compat };
}

const root = document.getElementById("app");
if (root) mountApp(root);
