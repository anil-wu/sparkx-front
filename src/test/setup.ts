import { JSDOM } from "jsdom";

if (typeof window === "undefined") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });

  // @ts-expect-error - attach jsdom globals
  globalThis.window = dom.window;
  // @ts-expect-error - attach jsdom globals
  globalThis.document = dom.window.document;
  // @ts-expect-error - attach jsdom globals
  globalThis.navigator = dom.window.navigator;
}
