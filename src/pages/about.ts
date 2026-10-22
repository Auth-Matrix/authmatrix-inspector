import { h } from "../dom.ts";
import { SITE } from "../site.ts";
import type { Route } from "../router.ts";
import { ext, link, pageTitle, section } from "./ui.ts";

export const aboutRoute: Route = {
  path: "/about",
  title: "About",
  description: "What AuthMatrix is, why it exists, how the core and the inspector fit together, who maintains it, its license and how to contribute.",
  render() {
    return h(
      "div",
      { class: "wrap page prose" },
      pageTitle("About", "AuthMatrix checks that Soroban authorization entries are read the same way everywhere."),
      section(
        "what",
        "What it is",
        h("p", {}, "AuthMatrix is a language-neutral set of reviewed authorization vectors with single-field mutation vectors, two independent adapters (TypeScript and Rust), a conformance runner, nested fixture contracts, and recorded Soroban host evidence. This site is the browser inspector built on top of it."),
      ),
      section("why", "Why it exists", h("p", {}, "Soroban authorization entries changed in Protocol 27. Several SDKs now have to compute the same signature payload for the same entry, and a one-byte difference makes the host refuse the signature. Decoding an entry by hand from base64 is slow and easy to get wrong. AuthMatrix gives implementers shared test data and gives readers a tool to see an entry in plain terms.")),
      section(
        "fit",
        "How the core and the app fit together",
        h("p", {}, "authmatrix-core holds the vectors, the adapters, the decoding and signature logic, and the recorded evidence. It is published as @anas.abubakar/authmatrix-core. This app contains no protocol logic of its own. It pins one core build as a committed tarball, stamps its checksum and commit, and checks the vector and evidence format versions at runtime."),
        h("p", {}, "This site pairs with core 0.1.1. ", ext(SITE.coreRepo, "Core repository"), " · ", ext(SITE.appRepo, "App repository")),
      ),
      section(
        "maint",
        "Maintainers",
        h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Maintainer"), h("th", { scope: "col" }, "Role"), h("th", { scope: "col" }, "GitHub"))), h("tbody", {}, h("tr", {}, h("td", {}, "Anas Abubakar"), h("td", {}, "Lead maintainer"), h("td", {}, ext("https://github.com/Anasabubakar", "@Anasabubakar"))), h("tr", {}, h("td", {}, "Abdulbasit Fazazi"), h("td", {}, "Co-maintainer"), h("td", {}, ext("https://github.com/fazaziishola-coder", "@fazaziishola-coder"))))),
      ),
      section("license", "License", h("p", {}, "MIT. See ", ext(SITE.license, "LICENSE"), ".")),
      section(
        "contribute",
        "How to contribute",
        h("p", {}, "Open issues are scoped so one person can finish one in a single cycle, and each lists acceptance criteria. Read ", ext(SITE.contributing, "CONTRIBUTING.md"), ", pick an ", ext(SITE.issues, "issue"), " and say you are taking it before you start. Questions and design talk go in ", ext(SITE.discussions, "Discussions"), ". Security reports go through ", ext(SITE.security, "SECURITY.md"), ", not public issues."),
      ),
      section("release", "Current release", h("p", {}, `Inspector version ${SITE.version}. See the `, ext(SITE.changelog, "changelog"), " and the ", ext(SITE.releases, "releases"), ". Privacy and terms: ", link("/privacy", "privacy"), ", ", link("/terms", "terms"), ".")),
    );
  },
};
