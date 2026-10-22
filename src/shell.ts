import { h, svg } from "./dom.ts";
import { SITE } from "./site.ts";
import { ext, link } from "./pages/ui.ts";

/** Logo mark: a 3x3 matrix of squares with one cell displaced, the mutation the tool is about. */
export function logoMark(size = 28): SVGElement {
  const cells: Element[] = [];
  const fills = ["#7a1f3d", "#7a1f3d", "#7a1f3d", "#7a1f3d", "#c43d6b", "#7a1f3d", "#7a1f3d", "#7a1f3d", "#7a1f3d"];
  fills.forEach((fill, i) => {
    const x = 4 + (i % 3) * 8 + (i === 4 ? 2 : 0);
    const y = 4 + Math.floor(i / 3) * 8 + (i === 4 ? -2 : 0);
    cells.push(svg("rect", { x: String(x), y: String(y), width: "6", height: "6", rx: "1", fill }));
  });
  return svg("svg", { viewBox: "0 0 32 32", width: String(size), height: String(size), "aria-hidden": "true", focusable: "false" }, svg("rect", { width: "32", height: "32", rx: "7", fill: "#fbeef2" }), ...cells);
}

const NAV: [string, string][] = [
  ["/", "Product"],
  ["/app", "App"],
  ["/docs", "Docs"],
  ["/about", "About"],
];

export interface Shell {
  root: DocumentFragment;
  main: HTMLElement;
  setCurrent(path: string): void;
}

export function buildShell(): Shell {
  const links = new Map<string, HTMLAnchorElement>();
  const list = h("ul", { class: "nav-list" });
  for (const [href, text] of NAV) {
    const a = link(href, text);
    links.set(href, a);
    list.append(h("li", {}, a));
  }
  list.append(h("li", {}, ext(SITE.appRepo, "GitHub", "nav-ext")));

  const toggle = h("button", { type: "button", class: "nav-toggle", "aria-expanded": "false", "aria-controls": "site-nav" }, "Menu");
  const nav = h("nav", { id: "site-nav", class: "nav", "aria-label": "Main" }, list);
  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  const brand = h("a", { href: "/", class: "brand" }, logoMark(), h("span", {}, SITE.name));
  const header = h("header", { class: "site-header" }, h("div", { class: "wrap bar" }, brand, toggle, nav));

  const main = h("main", { id: "main" });
  const col = (title: string, ...items: HTMLElement[]) => h("div", { class: "fcol" }, h("h2", {}, title), h("ul", {}, ...items.map((i) => h("li", {}, i))));
  const footer = h(
    "footer",
    { class: "site-footer" },
    h(
      "div",
      { class: "wrap" },
      h(
        "div",
        { class: "fgrid" },
        col("Product", link("/app", "App"), link("/vectors", "Reviewed vectors"), link("/docs", "Docs"), link("/about", "About")),
        col("Open source", ext(SITE.coreRepo, "authmatrix-core"), ext(SITE.appRepo, "authmatrix-inspector"), ext(SITE.issues, "Issues"), ext(SITE.discussions, "Discussions"), ext(SITE.npm, "Package on npm")),
        col("Documentation", ext(SITE.coreDocs, "Core docs (GitBook)"), ext(SITE.appDocs, "Inspector docs (GitBook)")),
        col("Legal", link("/privacy", "Privacy"), link("/terms", "Terms"), ext(SITE.license, "MIT License")),
      ),
      h("p", { class: "fbottom" }, `MIT licensed · v${SITE.version} · Built for the Stellar network`),
    ),
  );

  const skip = h("a", { class: "skip", href: "#main" }, "Skip to main content");
  skip.addEventListener("click", (e) => {
    e.preventDefault();
    main.setAttribute("tabindex", "-1");
    main.focus();
  });
  const frag = document.createDocumentFragment();
  frag.append(skip, header, main, footer);

  return {
    root: frag,
    main,
    setCurrent(path: string) {
      for (const [href, a] of links) {
        if (href === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      }
      setOpen(false);
    },
  };
}
