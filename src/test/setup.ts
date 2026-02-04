import { JSDOM } from "jsdom";
import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";

if (
  typeof window === "undefined" ||
  typeof document === "undefined" ||
  !document.body
) {
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

afterEach(() => {
  cleanup();
});
