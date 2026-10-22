import { h } from "../dom.ts";
import { SITE } from "../site.ts";
import { RPC_HOST } from "../testnet.ts";
import type { Route } from "../router.ts";
import { codeBlock, ext, link, pageTitle, section } from "./ui.ts";

export const docsRoute: Route = {
  path: "/docs",
  title: "Docs",
  description: "Getting started with AuthMatrix: what you need, how to run the core locally, how to load your own Soroban authorization entries into the inspector, and links to the full documentation.",
  render() {
    return h(
      "div",
      { class: "wrap page prose" },
      pageTitle("Docs", "Getting started on one page. The full documentation is on GitBook for both repositories."),
      section(
        "need",
        "What you need",
        h("ul", { class: "plain" }, h("li", {}, "Node 22 or newer and pnpm 11."), h("li", {}, "To run the Rust adapter and its tests: a stable Rust toolchain. The stellar CLI 28.1.0 is needed only to rebuild the fixture wasm."), h("li", {}, "A base64 SorobanAuthorizationEntry, or a transaction hash from testnet, or one of the reviewed vectors.")),
      ),
      section(
        "core",
        "Run the core locally",
        h("p", {}, "These are the commands from the authmatrix-core README."),
        codeBlock(
          "git clone https://github.com/Auth-Matrix/authmatrix-core && cd authmatrix-core\npnpm install --frozen-lockfile\nexport CARGO_TARGET_DIR=$HOME/.cache/stellar-cargo-target\n(cd adapters/rust && cargo build --release -j2 && cargo test -j2)   # Rust adapter + its own tests\npnpm test                                                           # 113 tests; fails if the Rust adapter is missing\npnpm run conformance                                                # both adapters, byte-for-byte\n(cd fixtures/nested-auth && cargo test -j2)                         # real-host tests over the committed vectors",
          "the core run commands",
        ),
        h("p", {}, "To use the package instead of a clone: "),
        codeBlock("npm install @anas.abubakar/authmatrix-core", "the install command"),
        h("p", {}, "Re-recording the testnet evidence needs network access and a funded testnet alias; it rewrites files, so read the core README before running it."),
      ),
      section(
        "app",
        "Run this app locally",
        codeBlock("git clone https://github.com/Auth-Matrix/authmatrix-inspector && cd authmatrix-inspector\npnpm install --frozen-lockfile\npnpm dev                       # development server\npnpm build && pnpm preview     # production build served with the strict CSP header\npnpm test", "the app run commands"),
      ),
      section(
        "load",
        "Load your own data",
        h(
          "ul",
          { class: "plain" },
          h("li", {}, h("strong", {}, "Paste."), " Put a base64 SorobanAuthorizationEntry in the Entry box in ", link("/app", "the app"), ", choose the network (or type a passphrase) and press Inspect. The passphrase matters: the signature payload binds its SHA-256."),
          h("li", {}, h("strong", {}, "Upload."), " A .txt, .xdr, .b64 or .json file holding base64 text, or raw XDR, up to 150,000 bytes. The file is read in your browser and not uploaded."),
          h("li", {}, h("strong", {}, "Reviewed vector."), " Pick one in the app, or open ", link("/vectors", "the vector list"), ". A link of the form /app?vector=<id> opens that vector."),
          h("li", {}, h("strong", {}, "Testnet transaction."), ` Paste a 64-character transaction hash and press Load from testnet. This sends the hash to ${RPC_HOST} (Soroban RPC getTransaction). The envelope is decoded in your browser, fee-bump envelopes are unwrapped, and every authorization entry of every InvokeHostFunction operation is listed. Choose one to open it.`),
        ),
        h("p", {}, "Only entries byte-identical to a reviewed vector get a recorded host result. For anything else the page says it does not run a host."),
      ),
      section("more", "Full documentation", h("ul", { class: "plain" }, h("li", {}, ext(SITE.coreDocs, "authmatrix-core documentation")), h("li", {}, ext(SITE.appDocs, "authmatrix-inspector documentation")), h("li", {}, ext(SITE.coreRepo + "/blob/main/SPEC.md", "Vector and evidence format specification")))),
    );
  },
};
