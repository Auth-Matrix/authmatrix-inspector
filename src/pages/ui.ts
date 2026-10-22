import { h } from "../dom.ts";
import { navigate } from "../router.ts";

/** Internal link handled by the router (the router also intercepts plain clicks globally). */
export function link(href: string, text: string, cls = ""): HTMLAnchorElement {
  return h("a", { href, ...(cls ? { class: cls } : {}) }, text);
}

/** External link. */
export function ext(href: string, text: string, cls = ""): HTMLAnchorElement {
  return h("a", { href, rel: "noopener noreferrer", ...(cls ? { class: cls } : {}) }, text);
}

export function section(id: string, title: string, ...children: (Node | string | null)[]): HTMLElement {
  return h("section", { class: "block", "aria-labelledby": id }, h("h2", { id }, title), ...children);
}

export function pageTitle(text: string, lead?: string): HTMLElement {
  const head = h("header", { class: "page-head" }, h("h1", { tabindex: "-1" }, text));
  if (lead) head.append(h("p", { class: "lead" }, lead));
  return head;
}

/** Code block with a copy button. Clipboard failure is reported, never ignored silently. */
export function codeBlock(text: string, label: string): HTMLElement {
  const status = h("span", { class: "copy-status", role: "status" });
  const btn = h("button", { type: "button", class: "copy" }, "Copy");
  btn.setAttribute("aria-label", `Copy ${label}`);
  btn.addEventListener("click", () => {
    const done = (msg: string) => {
      status.textContent = msg;
      setTimeout(() => (status.textContent = ""), 2500);
    };
    if (!navigator.clipboard) return done("Copy is not available here; select the text instead.");
    navigator.clipboard.writeText(text).then(() => done("Copied"), () => done("Copy was blocked; select the text instead."));
  });
  return h("div", { class: "codeblock" }, h("div", { class: "codebar" }, h("span", { class: "codelabel" }, label), h("span", {}, status, btn)), h("pre", { tabindex: "0" }, h("code", {}, text)));
}

export { navigate };
