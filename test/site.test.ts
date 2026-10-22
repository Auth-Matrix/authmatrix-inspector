import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES, startSite } from "../src/main.ts";
import { getBundle } from "../src/data.ts";

let host: HTMLElement;
const h1 = () => document.querySelector("main h1")?.textContent;

function boot(path: string) {
  history.replaceState({}, "", path);
  document.body.innerHTML = '<div id="site"></div>';
  host = document.getElementById("site")!;
  return startSite(host);
}
beforeEach(() => {
  window.scrollTo = vi.fn();
});

describe("router", () => {
  const expected: [string, string][] = [
    ["/", "AuthMatrix"],
    ["/app", "AuthMatrix Inspector"],
    ["/vectors", "Reviewed vectors"],
    ["/docs", "Docs"],
    ["/about", "About"],
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of use"],
  ];
  for (const [path, title] of expected) {
    it(`${path} renders its h1 and sets the document title`, () => {
      boot(path);
      expect(h1()).toBe(title);
      expect(document.querySelectorAll("main h1")).toHaveLength(1);
      expect(document.title).toMatch(path === "/" ? /^AuthMatrix$/ : / · AuthMatrix$/);
      expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")?.length).toBeGreaterThan(20);
    });
  }

  it("covers every required route", () => {
    expect(ROUTES.map((r) => r.path).sort()).toEqual(["/", "/about", "/app", "/docs", "/privacy", "/terms", "/vectors"]);
  });

  it("renders a 404 page inside the shell for unknown paths", () => {
    boot("/nope/at/all");
    expect(h1()).toBe("Page not found");
    expect(document.querySelector("header nav")).not.toBeNull();
    expect(document.querySelector('main a[href="/"]')).not.toBeNull();
    expect(document.querySelector('main a[href="/app"]')).not.toBeNull();
    expect(document.querySelector('[aria-current="page"]')).toBeNull();
  });

  it("sets aria-current on the current nav link and updates it on navigation", () => {
    boot("/docs");
    expect(document.querySelector('nav [aria-current="page"]')?.textContent).toBe("Docs");
    document.querySelector<HTMLAnchorElement>('nav a[href="/about"]')!.click();
    expect(location.pathname).toBe("/about");
    expect(document.querySelectorAll('nav [aria-current="page"]')).toHaveLength(1);
    expect(document.querySelector('nav [aria-current="page"]')?.textContent).toBe("About");
  });

  it("intercepts internal link clicks (no reload), moves focus to the h1 and scrolls to top", () => {
    boot("/");
    const marker = document.createElement("i");
    document.body.append(marker);
    const link = document.querySelector<HTMLAnchorElement>('nav a[href="/app"]')!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.body.contains(marker)).toBe(true);
    expect(location.pathname).toBe("/app");
    expect(document.activeElement).toBe(document.querySelector("main h1"));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("does not intercept external links or modified clicks", () => {
    boot("/");
    const ext = document.querySelector<HTMLAnchorElement>('a[href^="https://github.com"]')!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    ext.addEventListener("click", (e) => e.preventDefault(), { once: true });
    ext.dispatchEvent(ev);
    expect(location.pathname).toBe("/");
    const mod = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
    document.querySelector<HTMLAnchorElement>('nav a[href="/docs"]')!.dispatchEvent(mod);
    expect(mod.defaultPrevented).toBe(false);
  });

  it("supports back and forward", () => {
    boot("/");
    document.querySelector<HTMLAnchorElement>('nav a[href="/docs"]')!.click();
    expect(h1()).toBe("Docs");
    history.back();
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(location.pathname).toBe("/");
        expect(h1()).toBe("AuthMatrix");
        resolve();
      }, 30),
    );
  });
});

describe("/app?vector=", () => {
  it("opens a reviewed vector by id", () => {
    const id = getBundle().vectors.vectors[0]!.id;
    boot(`/app?vector=${id}`);
    expect(document.querySelector<HTMLTextAreaElement>("#entry")!.value).toBe(getBundle().vectors.vectors[0]!.expected.signedEntryXdr);
    expect(document.querySelector("#results")!.textContent).toMatch(/Authorization/);
  });
  it("rejects an id that is not in the bundled list and loads nothing", () => {
    boot("/app?vector=../../etc/passwd");
    expect(document.querySelector<HTMLTextAreaElement>("#entry")!.value).toBe("");
    expect(document.querySelector("#message")!.textContent).toMatch(/not a reviewed vector id/);
  });
});

describe("/vectors", () => {
  it("lists every bundled vector with a link to the app", () => {
    boot("/vectors");
    const vs = getBundle().vectors.vectors;
    const links = [...document.querySelectorAll<HTMLAnchorElement>("main a.btn")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(vs.map((v) => `/app?vector=${v.id}`));
    for (const v of vs) expect(document.querySelector("main")!.textContent).toContain(v.title);
  });
});

describe("shell", () => {
  it("has landmarks, a skip link and a footer with legal links", () => {
    boot("/");
    expect(document.querySelector("header")).not.toBeNull();
    expect(document.querySelector("nav")).not.toBeNull();
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelector("footer")).not.toBeNull();
    expect(document.querySelector('a.skip[href="#main"]')).not.toBeNull();
    for (const p of ["/privacy", "/terms"]) expect(document.querySelector(`footer a[href="${p}"]`)).not.toBeNull();
    expect(document.querySelector("footer")!.textContent).toMatch(/MIT licensed · v0\.2\.0 · Built for the Stellar network/);
  });

  it("the mobile menu button toggles aria-expanded and closes on Escape", () => {
    boot("/");
    const btn = document.querySelector<HTMLButtonElement>("button.nav-toggle")!;
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    btn.click();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("site-nav")!.classList.contains("open")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    btn.click();
    btn.click();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("legal pages", () => {
  it("privacy carries the dated heading, names the one host and the Vercel policy", () => {
    boot("/privacy");
    const t = document.querySelector("main")!.textContent!;
    expect(t).toContain("Last updated 22 October 2026");
    expect(t).toContain("https://soroban-testnet.stellar.org");
    expect(document.querySelector('a[href="https://vercel.com/legal/privacy-policy"]')).not.toBeNull();
  });
  it("terms carries the dated heading and the no-advice statement", () => {
    boot("/terms");
    const t = document.querySelector("main")!.textContent!;
    expect(t).toContain("Last updated 22 October 2026");
    expect(t).toMatch(/not financial, legal, investment, compliance or security advice/);
  });
});

describe("landing", () => {
  it("has the required sections in order, a copy button, and none of the banned words", () => {
    boot("/");
    const ids = [...document.querySelectorAll("main section h2")].map((e) => e.textContent);
    expect(ids).toEqual(["The problem", "How it works", "What you get", "A real entry, from the bundled data", "Built on Stellar", "Use it in your stack", "What it does not do", "Open source"]);
    expect(document.querySelector('button.copy[aria-label="Copy the install command"]')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/\b(seamless|seamlessly|robust|powerful|revolutionize|cutting-edge|leverage|unlock|empower|game-changer|next-generation|world-class|best-in-class|secure|audited|guaranteed|trustless)\b/i);
  });
});
