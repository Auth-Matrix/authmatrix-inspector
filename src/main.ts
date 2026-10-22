import "./style.css";
import "./site.css";
import { z } from "zod";
import { startRouter } from "./router.ts";
import { buildShell } from "./shell.ts";
import { SITE } from "./site.ts";
import { aboutRoute } from "./pages/about.ts";
import { appRoute } from "./pages/app.ts";
import { docsRoute } from "./pages/docs.ts";
import { landingRoute } from "./pages/landing.ts";
import { notFoundRoute } from "./pages/notfound.ts";
import { privacyRoute } from "./pages/privacy.ts";
import { termsRoute } from "./pages/terms.ts";
import { vectorsRoute } from "./pages/vectors.ts";

// The strict CSP forbids unsafe-eval, so zod must not try to JIT-compile validators with new Function.
z.config({ jitless: true });

export { entryFromFileBytes, mountApp } from "./inspector.ts";

export const ROUTES = [landingRoute, appRoute, vectorsRoute, docsRoute, aboutRoute, privacyRoute, termsRoute];

/** Build the shell into `host` and start the History API router. */
export function startSite(host: HTMLElement) {
  const shell = buildShell();
  host.replaceChildren(shell.root);
  return startRouter({ outlet: shell.main, routes: ROUTES, notFound: notFoundRoute, suffix: SITE.name, onRoute: (p) => shell.setCurrent(p) });
}

const host = document.getElementById("site");
if (host) startSite(host);
