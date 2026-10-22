import { h } from "../dom.ts";
import { getBundle } from "../data.ts";
import type { Route } from "../router.ts";
import { ext, link, pageTitle } from "./ui.ts";

const CRED: Record<string, string> = {
  address: "ADDRESS (legacy)",
  addressV2: "ADDRESS_V2 (CAP-71)",
};
const NETWORK: Record<string, string> = {
  "Test SDF Network ; September 2015": "Testnet",
  "Public Global Stellar Network ; September 2015": "Public network",
  "Test SDF Future Network ; October 2022": "Futurenet",
};

export const vectorsRoute: Route = {
  path: "/vectors",
  title: "Reviewed vectors",
  description: "The reviewed AuthMatrix authorization vectors bundled with this app: id, description, network and credential type. Each opens in the inspector.",
  render() {
    const b = getBundle();
    const list = h("ul", { class: "cards" });
    for (const v of b.vectors.vectors) {
      const a = v.authorization;
      list.append(
        h(
          "li",
          { class: "card vector" },
          h("h2", {}, h("code", {}, v.id)),
          h("p", {}, v.title),
          h("dl", { class: "kv compact" }, h("dt", {}, "Network"), h("dd", {}, NETWORK[a.networkPassphrase] ?? a.networkPassphrase), h("dt", {}, "Credential type"), h("dd", {}, CRED[a.credentialType] ?? a.credentialType), h("dt", {}, "Single-field mutations"), h("dd", {}, v.mutations.map((m) => m.field).join(", ")), h("dt", {}, "Labels"), h("dd", {}, v.labels.join(", "))),
          h("p", {}, link(`/app?vector=${encodeURIComponent(v.id)}`, "Open in the inspector", "btn")),
        ),
      );
    }
    return h(
      "div",
      { class: "wrap page" },
      pageTitle("Reviewed vectors", `${b.vectors.vectors.length} vectors ship inside the paired authmatrix-core package (vector format ${b.vectors.formatVersion}). Each opens its original signed entry in the inspector, where you can apply the mutations.`),
      list,
      h("p", { class: "hint" }, "Vectors without the label host-verifiable have no recorded Soroban host result. ", ext("https://github.com/Auth-Matrix/authmatrix-core/blob/main/docs/host-verification.md", "What the host checks establish"), "."),
    );
  },
};
