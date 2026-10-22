export interface Route {
  path: string;
  /** Page name; the document title becomes "<title> · AuthMatrix". Empty for the landing page. */
  title: string;
  description: string;
  render(params: URLSearchParams): HTMLElement;
}

export interface RouterOptions {
  outlet: HTMLElement;
  routes: Route[];
  notFound: Route;
  suffix: string;
  /** Called after every render with the matched path ("" for the 404 page). */
  onRoute?(path: string): void;
}

let active: Router | null = null;

export class Router {
  private ac = new AbortController();
  constructor(private o: RouterOptions) {}

  private find(pathname: string): Route | null {
    const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    return this.o.routes.find((r) => r.path === p) ?? null;
  }

  render(first = false): void {
    const route = this.find(location.pathname);
    const r = route ?? this.o.notFound;
    const page = r.render(new URLSearchParams(location.search));
    this.o.outlet.replaceChildren(page);
    document.title = r.title ? `${r.title} · ${this.o.suffix}` : this.o.suffix;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = r.description;
    this.o.onRoute?.(route ? route.path : "");
    if (!first) {
      window.scrollTo(0, 0);
      const h1 = page.querySelector<HTMLElement>("h1");
      if (h1) {
        if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
    }
  }

  stop(): void {
    this.ac.abort();
  }

  go(url: string): void {
    const u = new URL(url, location.href);
    if (u.origin !== location.origin) {
      location.assign(u.href);
      return;
    }
    if (u.pathname + u.search === location.pathname + location.search) {
      this.render();
      return;
    }
    history.pushState({}, "", u.pathname + u.search + u.hash);
    this.render();
    if (u.hash) document.getElementById(u.hash.slice(1))?.scrollIntoView();
  }

  start(): void {
    const signal = this.ac.signal;
    window.addEventListener("popstate", () => this.render(), { signal });
    document.addEventListener("click", (ev) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      ev.preventDefault();
      this.go(href);
    }, { signal });
    this.render(true);
  }
}

export function startRouter(o: RouterOptions): Router {
  active?.stop();
  active = new Router(o);
  active.start();
  return active;
}

export function navigate(url: string): void {
  active?.go(url);
}
