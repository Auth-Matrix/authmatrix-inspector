import { h } from "../dom.ts";
import type { Route } from "../router.ts";
import { link, pageTitle } from "./ui.ts";

export const notFoundRoute: Route = {
  path: "",
  title: "Page not found",
  description: "This page does not exist.",
  render() {
    return h("div", { class: "wrap page" }, pageTitle("Page not found", "There is nothing at this address."), h("p", {}, link("/", "Go to the home page", "btn"), " ", link("/app", "Open the app", "btn secondary")));
  },
};
