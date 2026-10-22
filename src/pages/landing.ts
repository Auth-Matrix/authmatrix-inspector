import { h } from "../dom.ts";
import { recordedFor } from "../analysis.ts";
import { getBundle } from "../data.ts";
import { SITE } from "../site.ts";
import { RPC_HOST } from "../testnet.ts";
import type { Route } from "../router.ts";
import { codeBlock, ext, link, section } from "./ui.ts";

const EXAMPLE_ID = "v2-nested-relay-testnet";

function example(): HTMLElement {
  const b = getBundle();
  const v = b.vectors.vectors.find((x) => x.id === EXAMPLE_ID);
  if (!v) return h("p", {}, "The example vector is not in this build.");
  const rows: [string, string][] = [
    ["Vector", v.id],
    ["Credential type", "SOROBAN_CREDENTIALS_ADDRESS_V2 (CAP-71)"],
    ["Authorizing address", v.authorization.address],
    ["Root call", `${v.authorization.rootInvocation.functionName} on ${v.authorization.rootInvocation.contractId}`],
    ["Nested calls", String(v.authorization.rootInvocation.subInvocations.length)],
    ["Nonce / expiry ledger", `${v.authorization.nonce} / ${v.authorization.signatureExpirationLedger}`],
  ];
  const dl = h("dl", { class: "kv" });
  for (const [k, val] of rows) dl.append(h("dt", {}, k), h("dd", {}, h("code", { class: "wrap" }, val)));
  const rec = recordedFor({ vectorId: v.id, title: v.title, kind: "mutation:recipient", passphrase: v.authorization.networkPassphrase }, b).find((r) => r.environment === "testnet-simulate-enforce");
  const recorded = rec
    ? h("p", { class: "recorded-line" }, h("span", { class: "tag-recorded" }, "RECORDED"), ` Testnet simulateTransaction in enforce mode (protocol ${rec.protocolVersion ?? "unknown"}, ${rec.recordedAt.slice(0, 10)}): changing the recipient was ${rec.outcome}. Host text: `, h("code", { class: "wrap" }, rec.detail.slice(0, 200)))
    : null;
  return h("div", { class: "card" }, dl, recorded, h("p", {}, link(`/app?vector=${EXAMPLE_ID}`, "Open this entry in the inspector", "btn")));
}

export const landingRoute: Route = {
  path: "/",
  title: "",
  description: "AuthMatrix: read Soroban authorization entries the same way in every SDK. Reviewed vectors, two adapters that agree byte for byte, and an in-browser inspector with signature verification and a mutation view.",
  render() {
    const hero = h(
      "section",
      { class: "hero", "aria-labelledby": "hero-h" },
      h("div", { class: "wrap" }, h("h1", { id: "hero-h", tabindex: "-1" }, "AuthMatrix"), h("p", { class: "value" }, SITE.value), h("p", { class: "lead" }, "AuthMatrix is a set of reviewed, language-neutral authorization vectors, two independent adapters (TypeScript and Rust) that must agree byte for byte, and recorded checks against the real Soroban host. This inspector is its browser app."), h("p", { class: "lead" }, "Paste a SorobanAuthorizationEntry, see what it authorizes and whether its signature verifies, then change one field and watch the signature stop verifying."), h("p", { class: "cta" }, link("/app", "Open the app", "btn"), " ", link("/docs", "Read the docs", "btn secondary")), h("p", { class: "runson" }, "Runs on: Soroban authorization entries (CAP-71) · optional testnet lookup through Soroban RPC")),
    );

    const problem = section(
      "problem",
      "The problem",
      h("p", {}, "Protocol 27 (CAP-71) added two credential types, ADDRESS_V2 and ADDRESS_WITH_DELEGATES, whose signature payload also binds the signer's address. The legacy ADDRESS payload is still valid. Wallets, SDKs and tools now have to build and read these payloads in the same way."),
      h("p", {}, "If two implementations differ by one byte of the payload, a signature made by one is refused by the host. A signed entry is also opaque base64, so it is hard to see who authorizes which call, on which network, before it is relayed."),
      h("p", {}, "Changing the recipient, amount, network, nonce, expiry, function or contract id changes the payload hash. The original signature then no longer verifies. People should be able to see that for themselves."),
    );

    const steps: [string, string][] = [
      ["Reviewed vectors.", "Four vectors and 27 single-field mutations, in a language-neutral JSON format (authmatrix-vectors 1.0.0)."],
      ["Two adapters.", "A TypeScript adapter on @stellar/stellar-sdk 17.2.1 and a Rust adapter on stellar-xdr compute each payload. They agree on 74 operation results byte for byte."],
      ["The real host.", "Original entries are accepted and mutated entries refused, recorded offline with soroban-sdk testutils (34 cases) and on testnet with simulateTransaction in enforce mode (28 cases)."],
      ["This inspector.", "It loads the same vectors from the core package, decodes any entry you paste, verifies the ed25519 signature locally and shows the mutations."],
    ];
    const how = section("how", "How it works", h("ol", { class: "steps" }, ...steps.map(([a, b]) => h("li", {}, h("strong", {}, a), " ", b))));

    const caps: [string, string][] = [
      ["Credential decoding", "Legacy ADDRESS, ADDRESS_V2, ADDRESS_WITH_DELEGATES and source-account credentials, with the payload rule each uses."],
      ["Network id", "The network passphrase and its SHA-256 network id, which the signature payload binds."],
      ["Invocation tree", "Nested calls decoded; SEP-41 and Stellar Asset Contract calls get named arguments and exact integer amounts. Anything else stays raw."],
      ["Local signature check", "Verifies the ed25519 signature of a classic (G...) signer in your browser."],
      ["Mutation view", "Pick recipient, amount, network, nonce, expiry, function or contract id and see the payload hash change."],
      ["Load from testnet", "Paste a transaction hash, list its authorization entries and open one in the inspector."],
    ];
    const grid = section("gives", "What you get", h("ul", { class: "cards" }, ...caps.map(([t, d]) => h("li", { class: "card" }, h("h3", {}, t), h("p", {}, d)))));

    const live = section("example", "A real entry, from the bundled data", example());

    const stellar = section(
      "stellar",
      "Built on Stellar",
      h(
        "ul",
        { class: "plain" },
        h("li", {}, h("strong", {}, "SorobanAuthorizationEntry and CAP-71 address credentials."), " The thing being decoded and checked."),
        h("li", {}, h("strong", {}, "Signature payload and network id."), " The preimage type, its XDR and SHA-256 hash, bound to the SHA-256 of the network passphrase."),
        h("li", {}, h("strong", {}, "Soroban host verification."), " Recorded results from the offline host (protocol 28) are shown next to matching vectors."),
        h("li", {}, h("strong", {}, "Testnet simulateTransaction in enforce mode."), " Recorded results (protocol 29), labelled RECORDED."),
        h("li", {}, h("strong", {}, "Soroban RPC getTransaction."), ` Only when you press Load from testnet; the one host contacted is ${RPC_HOST}.`),
      ),
    );

    const stack = section(
      "stack",
      "Use it in your stack",
      h("p", {}, "The vectors, schemas and decoding live in the core package."),
      codeBlock("npm install @anas.abubakar/authmatrix-core", "the install command"),
      h("p", {}, "From a clone of the core repository, the README runs the checks like this:"),
      codeBlock("pnpm install --frozen-lockfile\npnpm test          # 113 tests; fails if the Rust adapter is missing\npnpm run conformance   # both adapters, byte-for-byte", "the core README commands"),
      h("p", {}, ext(SITE.npm, "Package on npm"), " · ", ext(SITE.coreRepo, "Core repository")),
    );

    const limits = section(
      "limits",
      "What it does not do",
      h(
        "ul",
        { class: "plain" },
        h("li", {}, "It does not say a contract is safe. A decoded authorization is not a statement about what contracts do with it."),
        h("li", {}, "Signature checks cover address credentials with a classic (G...) ed25519 signer. Delegate signatures, contract-account signers and custom __check_auth are not verified."),
        h("li", {}, "Recorded host results exist only for the fixture-contract vectors. They are recordings, not something this page runs."),
        h("li", {}, "Testnet recordings are simulations. Nothing was submitted. Neither testnet nor the offline host is mainnet, which the project never contacts."),
        h("li", {}, "Token decoding is by function name, arity and argument types. A match means token-shaped call, not that the contract is a token."),
        h("li", {}, "No audit, and no wallet or SDK maintainer has reviewed it."),
      ),
    );

    const open = section(
      "open",
      "Open source",
      h("p", {}, "MIT licensed. Issues are scoped so one person can finish one in a single cycle. Say you are taking one before you start."),
      h("p", {}, ext(SITE.coreRepo, "authmatrix-core"), " · ", ext(SITE.appRepo, "authmatrix-inspector"), " · ", ext(SITE.goodFirst, "good first issue"), " · ", ext(SITE.contributing, "CONTRIBUTING.md"), " · ", ext(SITE.discussions, "Discussions")),
    );

    return h("div", { class: "landing" }, hero, h("div", { class: "wrap page" }, problem, how, grid, live, stellar, stack, limits, open));
  },
};
