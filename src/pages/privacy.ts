import { h } from "../dom.ts";
import { SITE } from "../site.ts";
import { RPC_HOST } from "../testnet.ts";
import type { Route } from "../router.ts";
import { ext, pageTitle, section } from "./ui.ts";

export const privacyRoute: Route = {
  path: "/privacy",
  title: "Privacy",
  description: "Privacy policy for the AuthMatrix inspector: what runs in your browser, the one optional network request, and hosting.",
  render() {
    return h(
      "div",
      { class: "wrap page prose" },
      pageTitle("Privacy policy", `Last updated ${SITE.date}.`),
      section("who", "Who runs this", h("p", {}, "The AuthMatrix project maintainers named on the ", ext(SITE.appRepo + "#maintainers", "repository README"), ". Contact is through the ", ext(SITE.issues, "repository's issues"), ". Security reports follow ", ext(SITE.security, "SECURITY.md"), ". There is no contact email.")),
      section("data", "What the app does with your data", h("p", {}, "Text you paste and files you load are processed in your browser. The app does not upload them. There are no accounts, no cookies, no analytics and no advertising. The app does not store anything in your browser (no cookies, no local or session storage), so nothing is kept after you close the tab.")),
      section(
        "network",
        "Network requests",
        h("p", {}, "By default the page requests only its own files from its own origin. It loads no fonts, scripts or embeds from other sites."),
        h("p", {}, `There is one opt-in feature. If you type a transaction hash and press Load from testnet, the page sends a single Soroban RPC getTransaction request to ${RPC_HOST}. The request contains that transaction hash and your browser's usual request metadata (such as your IP address). It happens only when you press the button. The operator of that endpoint applies its own policies to the request.`),
      ),
      section("host", "Hosting", h("p", {}, "The site is served by Vercel. Vercel may process standard request data such as IP address and user agent in its server logs under ", ext("https://vercel.com/legal/privacy-policy", "its own privacy policy"), ".")),
      section("chain", "Public blockchain data", h("p", {}, "Anything read from Stellar is public ledger data.")),
      section("changes", "Changes", h("p", {}, "Changes to this policy are made through the public repository, and its history is the record.")),
    );
  },
};
