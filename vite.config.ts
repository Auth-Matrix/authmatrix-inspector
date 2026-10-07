import { defineConfig } from "vite";

const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export default defineConfig({
  build: { target: "es2023", sourcemap: true, chunkSizeWarningLimit: 900 },
  // The preview server sends the same strict CSP the deployment config sends, so a local
  // `pnpm build && pnpm preview` exercises exactly the policy (no unsafe-eval, no unsafe-inline).
  preview: { headers: { "Content-Security-Policy": csp, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } },
});
