import test, { after, afterEach, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

let server, App, createRoot, dom, root;
let frames = new Map(),
  animations = [],
  frameId = 0;
const media = {
  matches: false,
  addEventListener() {},
  removeEventListener() {},
};
const setGlobal = (name, value) =>
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });

beforeEach(async () => {
  dom = new JSDOM(
    '<!doctype html><html lang="en"><body><div id="root"></div></body></html>',
    { url: "http://localhost/" },
  );
  for (const name of [
    "window",
    "document",
    "navigator",
    "localStorage",
    "sessionStorage",
    "HTMLElement",
    "HTMLInputElement",
    "Event",
  ])
    setGlobal(name, dom.window[name]);
  for (const [name, value] of Object.entries({
    IS_REACT_ACT_ENVIRONMENT: true,
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
    scrollX: 0,
    scrollY: 0,
  }))
    setGlobal(name, value);
  setGlobal("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
  setGlobal("matchMedia", () => media);
  media.matches = false;
  frames = new Map();
  animations = [];
  setGlobal("requestAnimationFrame", (callback) => {
    const id = ++frameId;
    frames.set(id, callback);
    return id;
  });
  setGlobal("cancelAnimationFrame", (id) => frames.delete(id));
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {},
    setTransform() {},
    save() {},
    translate() {},
    rotate() {},
    fillRect() {},
    restore() {},
  });
  dom.window.HTMLElement.prototype.animate = function (keyframes, timing) {
    const listeners = {};
    const animation = {
      keyframes,
      timing,
      cancelled: false,
      addEventListener: (type, listener) => {
        listeners[type] = listener;
      },
      cancel() {
        this.cancelled = true;
        listeners.cancel?.();
      },
    };
    animations.push(animation);
    return animation;
  };
  if (!server) {
    server = await createServer({
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
      appType: "custom",
    });
    ({ default: App } = await server.ssrLoadModule("/src/App.jsx"));
    ({ createRoot } = await import("react-dom/client"));
  }
  mock.timers.enable({
    apis: ["Date", "setInterval", "setTimeout"],
    now: 100000,
  });
  root = createRoot(document.querySelector("#root"));
  await act(async () => root.render(createElement(App)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  mock.timers.reset();
  dom.window.close();
});
after(async () => {
  await server?.close();
});

const get = (selector) => document.querySelector(selector);
async function click(selector) {
  await act(async () => get(selector).click());
}
async function type(value) {
  await act(async () => {
    const input = get("#name-input");
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () =>
    get("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
}
async function add(value) {
  await type(value);
  await submit();
}
async function tick(milliseconds) {
  await act(async () => mock.timers.tick(milliseconds));
}
const saved = () => JSON.parse(sessionStorage.getItem("merry-little-draw-v1"));

async function startTwoPeople() {
  await add("Anna, Kuba");
  await click("#start");
}

test("React owns the page while preserving markup, translations and name editing", async () => {
  assert.equal(get("#start").disabled, true);
  assert.equal(get(".panel-title").textContent, "Who’s joining the fun?");
  assert.equal(get(".illustration svg").getAttribute("viewBox"), "0 0 440 300");
  await add("Anna; Kuba, Ola");
  assert.equal(document.querySelectorAll(".person").length, 3);
  assert.equal(get("#start").disabled, false);
  await type("Anna");
  await submit();
  assert.match(get("#error").textContent, /already on the list/);
  await click('[data-remove="1"]');
  assert.deepEqual(
    [...document.querySelectorAll(".person-name")].map(
      (node) => node.textContent,
    ),
    ["Anna", "Ola"],
  );
  assert.equal(document.activeElement.getAttribute("data-remove"), "1");
  await type("New Name");
  await click('[data-lang="pl"]');
  assert.equal(document.documentElement.lang, "pl");
  assert.equal(document.title, "Merry Little Draw · Mikołajki");
  assert.equal(get("#name-input").value, "New Name");
  assert.equal(get("#error").textContent, "");
  assert.equal(get(".panel-title").textContent, "Kto dołącza do zabawy?");
  assert.equal(localStorage.getItem("merry-language"), "pl");
});

test("full React flow preserves cooldown, private reveal, confetti, completion and reset", async () => {
  await startTwoPeople();
  assert.equal(get(".recipient-name").textContent, "Anna");
  assert.equal(get("#reveal").disabled, true);
  assert.equal(get(".countdown-pill").textContent, "5");
  await click("#reveal");
  assert.equal(get(".secret"), null);
  await tick(4999);
  assert.equal(get("#reveal").disabled, true);
  await tick(151);
  assert.equal(get("#reveal").disabled, false);
  await click("#reveal");
  assert.equal(get(".secret .recipient-name").textContent, "Kuba");
  assert.deepEqual(saved().pending, [{ giver: "Kuba", recipient: "Anna" }]);
  assert.ok(frames.size > 0, "Confetti starts on reveal");
  await click("#next");
  assert.equal(get(".secret"), null);
  assert.equal(document.querySelectorAll(".stage").length, 1);
  assert.equal(frames.size, 0, "Confetti clears on Next");
  assert.equal(get("#reveal").disabled, true);
  assert.equal(get(".recipient-name").textContent, "Kuba");
  await tick(5000);
  await click("#reveal");
  assert.equal(get(".recipient-name").textContent, "Anna");
  await click("#next");
  assert.equal(get(".panel-title").textContent, "Let the gifting begin.");
  assert.deepEqual(saved().pending, []);
  assert.equal(get(".secret"), null);
  await click("#again");
  assert.equal(get("#name-input").value, "");
  assert.equal(get("#start").disabled, true);
  assert.equal(sessionStorage.getItem("merry-little-draw-v1"), null);
  assert.equal(document.activeElement.id, "name-input");
});

test("leaving a revealed page flushes the secret before cache and resumes forward", async () => {
  await startTwoPeople();
  await tick(5000);
  await click("#reveal");
  await act(async () => window.dispatchEvent(new Event("pagehide")));
  assert.equal(get(".secret"), null, "Outgoing DOM contains no private reveal");
  assert.equal(get(".recipient-name").textContent, "Kuba");
  assert.ok(document.body.classList.contains("page-hidden"));
  assert.equal(saved().completed, 1);
  await act(async () => {
    const event = new Event("pageshow");
    Object.defineProperty(event, "persisted", { value: true });
    window.dispatchEvent(event);
  });
  assert.equal(get(".secret"), null);
  assert.equal(get(".recipient-name").textContent, "Kuba");
  assert.equal(document.body.classList.contains("page-hidden"), false);
});

test("refreshing mounts only the future session, never the consumed reveal", async () => {
  await startTwoPeople();
  await tick(5000);
  await click("#reveal");
  await act(async () => root.unmount());
  root = createRoot(get("#root"));
  await act(async () => root.render(createElement(App)));
  assert.equal(get(".secret"), null);
  assert.equal(get(".recipient-name").textContent, "Kuba");
  assert.match(get(".privacy-note").textContent, /Welcome back/);
});

test("language changes during a handoff keep the original deadline", async () => {
  await startTwoPeople();
  await tick(2000);
  await click('[data-lang="pl"]');
  assert.equal(get(".countdown-pill").textContent, "3");
  assert.equal(get("#reveal").disabled, true);
  await tick(3000);
  assert.equal(get("#reveal").disabled, false);
  assert.equal(get(".button-label").textContent, "To ja. Pokaż moje losowanie");
});

test("reduced motion suppresses confetti and content animations", async () => {
  media.matches = true;
  animations.length = 0;
  await startTwoPeople();
  await tick(5000);
  await click("#reveal");
  assert.equal(frames.size, 0);
  assert.equal(animations.length, 0);
  assert.equal(get(".recipient-name").textContent, "Kuba");
});

test("participant names are escaped by React and never interpreted as markup", async () => {
  await add("<img src=x onerror=alert(1)>, Kuba");
  assert.equal(get(".person-name").textContent, "<img src=x onerror=alert(1)>");
  assert.equal(get(".participants img"), null);
});


test("localized markup and accessibility labels stay intact across language switches", async () => {
  assert.equal(get("#headline em").textContent, "joy.");
  assert.equal(get("#headline").querySelectorAll("br").length, 1);
  assert.equal(get(".intro-copy").querySelectorAll("br").length, 1);
  await add("<b>Anna</b>, Kuba");
  assert.equal(get('[data-remove="0"]').getAttribute("aria-label"), "Remove <b>Anna</b>");
  assert.equal(get(".person-name b"), null);
  await click('[data-lang="pl"]');
  assert.equal(get("#headline em").textContent, "radości.");
  assert.equal(get(".round-badge").textContent, "2 osoby");
  assert.equal(get('[data-remove="0"]').getAttribute("aria-label"), "Usuń: <b>Anna</b>");
  assert.equal(get('[data-lang="pl"]').getAttribute("aria-pressed"), "true");
  await click("#start");
  await tick(5000);
  assert.equal(get("#reveal").getAttribute("aria-label"), "To ja. Pokaż moje losowanie (<b>Anna</b>)");
  assert.equal(get(".stage-description").querySelectorAll("br").length, 1);
  await click("#reveal");
  const beforeSwitch = saved();
  await click('[data-lang="en"]');
  assert.deepEqual(saved(), beforeSwitch, "Switching language does not consume a pairing");
  assert.equal(get(".recipient-name").textContent, "Kuba");
  assert.equal(get(".stage-description").querySelectorAll("br").length, 1);
  await click("#next");
  assert.equal(get(".secret"), null);
});

test("remount restores the saved language independently of the draw", async () => {
  await click('[data-lang="pl"]');
  await act(async () => root.unmount());
  root = createRoot(get("#root"));
  await act(async () => root.render(createElement(App)));
  assert.equal(document.documentElement.lang, "pl");
  assert.equal(get(".panel-title").textContent, "Kto dołącza do zabawy?");
  assert.equal(get("#start").disabled, true);
});
