import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const list = (dir: string, ext: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? list(`${dir}/${e.name}`, ext) : e.name.endsWith(ext) ? [`${dir}/${e.name}`] : []));
const srcFiles = list("src", ".ts");

const ALLOWED_HOST = "https://soroban-testnet.stellar.org";
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const header = vercel.headers[0].headers.find((h: { key: string }) => h.key === "Content-Security-Policy").value as string;
const metaCsp = readFileSync("index.html", "utf8").match(/Content-Security-Policy" content="([^"]+)"/)![1]!;

describe("browser safety constraints", () => {
  for (const f of srcFiles) {
    it(`${f} avoids innerHTML, eval, Function constructors and document.write`, () => {
      expect(readFileSync(f, "utf8")).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/);
    });
  }
  it("index.html carries a CSP without unsafe-eval or unsafe-inline", () => {
    expect(metaCsp).not.toMatch(/unsafe-eval|unsafe-inline/);
    expect(metaCsp).toMatch(/script-src 'self'/);
  });
  it("connect-src allows the app's own origin and exactly one testnet RPC host", () => {
    for (const csp of [metaCsp, header]) {
      expect(csp.match(/connect-src ([^;]+)/)![1]).toBe(`'self' ${ALLOWED_HOST}`);
    }
  });
  it("the meta CSP and the vercel.json header are the same policy (the header adds frame-ancestors)", () => {
    expect(header.replace(/; frame-ancestors 'none'$/, "")).toBe(metaCsp);
  });
  it("vercel.json and the preview server send the same policy without unsafe-eval", () => {
    expect(header).not.toMatch(/unsafe-eval|unsafe-inline/);
    expect(readFileSync("vite.config.ts", "utf8")).toContain(header.replace(/; frame-ancestors 'none'$/, ""));
  });
  it("vercel.json has the SPA fallback rewrite", () => {
    expect(vercel.rewrites[0].destination).toBe("/index.html");
  });
  it("zod runs jitless because the CSP forbids eval", () => {
    expect(readFileSync("src/main.ts", "utf8")).toContain("z.config({ jitless: true })");
  });
  it("does not use the sparkle icon anywhere in markup, styles or assets", () => {
    for (const f of ["index.html", "src/style.css", "src/site.css", "public/favicon.svg", "public/og-image.svg", ...srcFiles]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/sparkle|twinkle|✨/i);
    }
  });
  it("only src/testnet.ts touches the network, and only through the allowed host", () => {
    for (const f of srcFiles) {
      const text = readFileSync(f, "utf8");
      if (f === "src/testnet.ts") {
        expect(text.match(/\bfetch\(/g)).toHaveLength(1);
        expect(text).toContain(`export const RPC_HOST = "${ALLOWED_HOST}"`);
        expect(text).not.toMatch(/XMLHttpRequest|WebSocket|sendBeacon/);
      } else expect(text).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/);
    }
  });
  it("uses no browser storage and no external resources", () => {
    for (const f of [...srcFiles, "src/style.css", "src/site.css"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|@import|url\(\s*["']?https?:/);
    }
  });
});
