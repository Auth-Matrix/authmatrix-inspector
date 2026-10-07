import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const srcFiles = readdirSync("src").filter((f) => f.endsWith(".ts"));

describe("browser safety constraints", () => {
  for (const f of srcFiles) {
    it(`src/${f} avoids innerHTML, eval, Function constructors and document.write`, () => {
      const text = readFileSync(`src/${f}`, "utf8");
      expect(text).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/);
    });
  }
  it("index.html carries a CSP without unsafe-eval or unsafe-inline", () => {
    const html = readFileSync("index.html", "utf8");
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)![1]!;
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline/);
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).toMatch(/connect-src 'self'/);
  });
  it("vercel.json and the preview server send the same policy without unsafe-eval", () => {
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    const header = vercel.headers[0].headers.find((h: { key: string }) => h.key === "Content-Security-Policy").value as string;
    expect(header).not.toMatch(/unsafe-eval|unsafe-inline/);
    expect(readFileSync("vite.config.ts", "utf8")).toContain(header.replace(/; frame-ancestors 'none'$/, ""));
  });
  it("zod runs jitless because the CSP forbids eval", () => {
    expect(readFileSync("src/main.ts", "utf8")).toContain("z.config({ jitless: true })");
  });
  it("does not use the sparkle icon anywhere in markup or styles", () => {
    for (const f of ["index.html", "src/style.css", ...srcFiles.map((s) => `src/${s}`)]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/sparkle|twinkle|✨/i);
    }
  });
  it("does not fetch or contact any network from the app code", () => {
    for (const f of srcFiles) expect(readFileSync(`src/${f}`, "utf8")).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
  });
});
