import test, { after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html>", { url: "http://localhost/" });
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator, configurable: true,
});
const { createAppI18n, resources, supportedLanguages } = await import("../src/i18n.js");
after(() => dom.window.close());

function setup({ preference, languages = ["en-US"] } = {}) {
  dom.window.localStorage.clear();
  if (preference) dom.window.localStorage.setItem("merry-language", preference);
  Object.defineProperty(navigator, "languages", { value: languages, configurable: true });
  Object.defineProperty(navigator, "language", { value: languages[0], configurable: true });
  return createAppI18n();
}

test("detects browser locales, respects saved preference, and falls back to English", () => {
  for (const [options, expected] of [
    [{ languages: ["pl-PL"] }, "pl"],
    [{ languages: ["pl-PL"], preference: "en" }, "en"],
    [{ languages: ["en-US"], preference: "pl" }, "pl"],
    [{ languages: ["pl-PL"], preference: "unknown" }, "pl"],
    [{ languages: ["fr-FR", "pl-PL"] }, "pl"],
    [{ languages: ["fr-FR"] }, "en"],
  ]) {
    const i18n = setup(options);
    assert.equal(i18n.isInitialized, true, "Translations are ready before rendering");
    assert.equal(i18n.resolvedLanguage, expected);
    assert.equal(i18n.t("setupTitle"), resources[expected].translation.setupTitle);
  }
});

test("persists language switches using the existing preference key", async () => {
  const i18n = setup();
  await i18n.changeLanguage("pl");
  assert.equal(dom.window.localStorage.getItem("merry-language"), "pl");
  assert.equal(createAppI18n().resolvedLanguage, "pl");
  await i18n.changeLanguage("en");
  assert.equal(dom.window.localStorage.getItem("merry-language"), "en");
});

test("blocked preference storage does not prevent detection or switching", async () => {
  setup(); // The detector has already checked that storage is available.
  const descriptor = Object.getOwnPropertyDescriptor(dom.window, "localStorage");
  Object.defineProperty(dom.window, "localStorage", {
    configurable: true,
    get() { throw new Error("Storage blocked"); },
  });
  try {
    const i18n = createAppI18n();
    assert.equal(i18n.resolvedLanguage, "en");
    await i18n.changeLanguage("pl");
    assert.equal(i18n.t("add"), "Dodaj +");
  } finally {
    Object.defineProperty(dom.window, "localStorage", descriptor);
  }
});

test("English and Polish use standard count-based plural forms", async () => {
  const i18n = setup();
  assert.equal(i18n.t("people", { count: 0 }), "0 people");
  assert.equal(i18n.t("people", { count: 1 }), "1 person");
  assert.equal(i18n.t("people", { count: 2 }), "2 people");
  assert.equal(i18n.t("added", { count: 1 }), "1 person added.");
  assert.equal(i18n.t("added", { count: 2 }), "2 people added.");
  await i18n.changeLanguage("pl");
  for (const [count, noun] of [
    [0, "osób"], [1, "osoba"], [2, "osoby"], [4, "osoby"], [5, "osób"],
    [12, "osób"], [14, "osób"], [21, "osób"], [22, "osoby"], [24, "osoby"],
    [25, "osób"], [101, "osób"], [102, "osoby"], [112, "osób"],
  ]) assert.equal(i18n.t("people", { count }), `${count} ${noun}`);
  assert.equal(i18n.t("added", { count: 3 }), "Dodano: 3.");
});

test("interpolation preserves names as text, including angle brackets and braces", async () => {
  const i18n = setup();
  const name = '<img src=x> & {{count}}';
  assert.equal(i18n.t("remove", { name }), `Remove ${name}`);
  assert.equal(i18n.t("turn", { current: 2, total: 10 }), "2 of 10");
  await i18n.changeLanguage("pl");
  assert.equal(i18n.t("remove", { name }), `Usuń: ${name}`);
  assert.equal(i18n.t("turn", { current: 2, total: 10 }), "2 z 10");
});

test("all registered dictionaries cover the same messages and interpolation values", () => {
  const baseKey = (key) => key.replace(/_(zero|one|two|few|many|other)$/, "");
  const keys = (dictionary) => [...new Set(Object.keys(dictionary).map(baseKey))].sort();
  const variables = (value) => [...new Set([...value.matchAll(/{{(\w+)}}/g)].map((match) => match[1]))].sort();
  const english = resources.en.translation;
  for (const language of supportedLanguages) {
    const dictionary = resources[language].translation;
    assert.deepEqual(keys(dictionary), keys(english), `${language} message coverage`);
    for (const [key, value] of Object.entries(dictionary)) {
      assert.equal(typeof value, "string");
      assert.ok(value.length > 0, `${language}.${key} is not empty`);
      const englishValue = english[key] ?? english[baseKey(key)] ?? english[`${baseKey(key)}_other`];
      assert.deepEqual(variables(value), variables(englishValue), `${language}.${key} variables`);
    }
    const forms = new Intl.PluralRules(language).resolvedOptions().pluralCategories;
    for (const key of keys(dictionary)) {
      if (!Object.hasOwn(dictionary, `${key}_other`)) continue;
      for (const form of forms) assert.ok(Object.hasOwn(dictionary, `${key}_${form}`), `${language}.${key}_${form}`);
    }
  }
});
