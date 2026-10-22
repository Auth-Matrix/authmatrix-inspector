import { h } from "../dom.ts";
import { SITE } from "../site.ts";
import { RPC_HOST } from "../testnet.ts";
import type { Route } from "../router.ts";
import { ext, pageTitle, section } from "./ui.ts";

export const termsRoute: Route = {
  path: "/terms",
  title: "Terms",
  description: "Terms of use for the AuthMatrix inspector: open source license, no warranty, and what the tool is and is not.",
  render() {
    return h(
      "div",
      { class: "wrap page prose" },
      pageTitle("Terms of use", `Last updated ${SITE.date}.`),
      section("license", "License", h("p", {}, "The software is open source under the MIT License. See ", ext(SITE.license, "LICENSE"), ".")),
      section("warranty", "No warranty", h("p", {}, "It is provided as is, without warranty of any kind, as the license states.")),
      section("not", "What it is not", h("p", {}, "AuthMatrix is an engineering and diagnostic tool. It is not financial, legal, investment, compliance or security advice. It is not an audit, and its results are not a guarantee of anything about a contract, anchor, payment or network.")),
      section("data", "Recorded and sample data", h("p", {}, "Recorded and sample data are labelled as such. Testnet results say nothing about mainnet.")),
      section("you", "Your responsibility", h("p", {}, `You are responsible for what you load, and for complying with the terms of any network endpoint you choose to query. The only endpoint this app can query is ${RPC_HOST}, and only when you press Load from testnet.`)),
      section("accounts", "Accounts and fees", h("p", {}, "There are no accounts and no fees.")),
      section("contact", "Contact", h("p", {}, "Through the ", ext(SITE.issues, "GitHub repository"), ".")),
    );
  },
};
