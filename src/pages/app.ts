import { h } from "../dom.ts";
import { mountApp } from "../inspector.ts";
import { getBundle } from "../data.ts";
import type { Route } from "../router.ts";

export const appRoute: Route = {
  path: "/app",
  title: "Inspector",
  description: "Decode a Soroban authorization entry in your browser: authorizing address, network, credential type, nonce, expiry, nested invocations and signature verification. A preview is not a safety guarantee.",
  render(params) {
    const bundle = getBundle();
    const root = h("div", { class: "tool wrap" });
    const handle = mountApp(root, bundle);
    const id = params.get("vector");
    if (id !== null) {
      const v = bundle.vectors.vectors.find((x) => x.id === id);
      if (v && handle.compat.ok) handle.load(v.expected.signedEntryXdr, v.authorization.networkPassphrase);
      else if (!v) handle.setMessage(`"${id.slice(0, 80)}" is not a reviewed vector id. Pick one from the list below, or see the vectors page.`);
    }
    return root;
  },
};
