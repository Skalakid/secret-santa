import test from "node:test";
import assert from "node:assert/strict";
import { createDraw } from "../src/draw.mjs";
import {
  initialGame,
  nextGame,
  restoreGame,
  revealGame,
  startGame,
  validateNames,
} from "../src/game.mjs";
import { readInitialState, saveSession, storageKey } from "../src/session.mjs";
import { translate } from "../src/i18n.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function environment(language = "en") {
  return {
    navigator: { language },
    localStorage: storage(),
    sessionStorage: storage(),
  };
}

test("each participant gets one unique recipient and never themselves", () => {
  for (let size = 2; size <= 50; size++) {
    const names = Array.from({ length: size }, (_, index) => `Person ${index}`);
    for (let trial = 0; trial < 20; trial++) {
      const pairs = createDraw(names);
      assert.deepEqual(
        pairs.map((pair) => pair.giver),
        names,
      );
      assert.equal(new Set(pairs.map((pair) => pair.recipient)).size, size);
      assert.ok(pairs.every((pair) => pair.giver !== pair.recipient));
    }
  }
});

test("two-person draws always swap recipients", () => {
  assert.deepEqual(createDraw(["Anna", "Kuba"]), [
    { giver: "Anna", recipient: "Kuba" },
    { giver: "Kuba", recipient: "Anna" },
  ]);
});

test("handoff enforces five seconds, including the exact boundary", () => {
  const game = startGame(["Anna", "Kuba"], 1000);
  assert.equal(game.session.readyAt, 6000);
  assert.equal(revealGame(game, 5999), null);
  assert.equal(revealGame(game, 6000).stage, "reveal");
});

test("reveals consume the pair before persistence; reload cannot restore it", () => {
  const env = environment();
  const game = startGame(["Anna", "Kuba", "Ola"], 0);
  const reveal = revealGame(game, 5000);
  assert.equal(reveal.session.completed, 1);
  assert.equal(reveal.session.pending.length, 2);
  assert.ok(
    !reveal.session.pending.some(
      (pair) => pair.giver === reveal.revealed.giver,
    ),
  );
  assert.equal(saveSession(reveal.session, env), true);
  assert.ok(
    !env.sessionStorage
      .getItem(storageKey)
      .includes(JSON.stringify(reveal.revealed)),
  );
  const restored = readInitialState(env).game;
  assert.equal(restored.stage, "handoff");
  assert.equal(restored.revealed, null);
  assert.equal(restored.session.completed, 1);
  assert.equal(restored.resumed, true);
});

test("Next starts a new five-second pause and clears the current reveal", () => {
  const reveal = revealGame(startGame(["Anna", "Kuba"], 0), 5000);
  const next = nextGame(reveal, 8000);
  assert.equal(next.session.readyAt, 13000);
  assert.equal(next.revealed, null);
  assert.equal(next.stage, "handoff");
  assert.equal(revealGame(next, 12999), null);
  assert.equal(revealGame(next, 13000).stage, "reveal");
});

test("completion has no remaining pairings or recoverable reveal", () => {
  let game = startGame(["Anna", "Kuba"], 0);
  game = nextGame(revealGame(game, 5000), 6000);
  game = nextGame(revealGame(game, 11000), 12000);
  assert.equal(game.stage, "done");
  assert.equal(game.revealed, null);
  assert.deepEqual(game.session.pending, []);
  assert.equal(restoreGame(game).stage, "done");
  assert.equal(revealGame(game, 20000), null);
  assert.equal(nextGame(game, 20000), null);
});

test("cached-page restore always clears an on-screen reveal and advances", () => {
  const game = revealGame(startGame(["Anna", "Kuba"], 0), 5000);
  const restored = restoreGame(game);
  assert.equal(restored.revealed, null);
  assert.equal(restored.stage, "handoff");
  assert.equal(restored.session.pending[0].giver, "Kuba");
});

test("reset clears the persisted session", () => {
  const env = environment();
  saveSession(startGame(["Anna", "Kuba"], 0).session, env);
  saveSession(null, env);
  assert.equal(env.sessionStorage.getItem(storageKey), null);
  assert.deepEqual(readInitialState(env).game, initialGame());
});

test("browser language and explicit language preference keep the original behavior", () => {
  const env = environment("pl-PL");
  assert.equal(readInitialState(env).language, "pl");
  env.localStorage.setItem("merry-language", "en");
  assert.equal(readInitialState(env).language, "en");
  env.localStorage.setItem("merry-language", "unknown");
  assert.equal(readInitialState(env).language, "pl");
  assert.equal(translate("pl", "people", 22), "22 osoby");
  assert.equal(translate("pl", "people", 12), "12 osób");
});

test("malformed storage and unavailable storage do not crash the draw", () => {
  const env = environment();
  env.sessionStorage.setItem(storageKey, "{invalid");
  assert.equal(readInitialState(env).storageAvailable, false);
  assert.equal(readInitialState(env).game.stage, "setup");
  env.sessionStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(readInitialState(env).storageAvailable, false);
  assert.equal(saveSession(startGame(["Anna", "Kuba"], 0).session, env), false);
});

test("incomplete saved session is ignored", () => {
  const env = environment();
  env.sessionStorage.setItem(
    storageKey,
    JSON.stringify({ pending: [], total: 3, completed: 1, readyAt: 5000 }),
  );
  assert.equal(readInitialState(env).game.stage, "setup");
});

test("name parsing keeps comma, semicolon, newline and whitespace behavior", () => {
  assert.deepEqual(validateNames("  Anna  Maria ; Kuba,\nOla ", [], "pl"), {
    entries: ["Anna Maria", "Kuba", "Ola"],
  });
  assert.deepEqual(validateNames(" , ;\n ", [], "en"), { issue: "emptyError" });
});

test("duplicate validation is case-insensitive and Unicode-normalized", () => {
  assert.deepEqual(validateNames("anna", ["Anna"], "en"), {
    issue: "duplicate",
  });
  assert.deepEqual(validateNames("Anna, ANNA", [], "en"), {
    issue: "duplicate",
  });
  assert.deepEqual(validateNames("A\u030Angstrom", ["Ångstrom"], "en"), {
    issue: "duplicate",
  });
});

test("name and group limits retain the original validation priority", () => {
  assert.deepEqual(validateNames("A".repeat(41), [], "en"), {
    issue: "tooLong",
  });
  assert.deepEqual(validateNames("A".repeat(40), [], "en"), {
    entries: ["A".repeat(40)],
  });
  const names = Array.from({ length: 50 }, (_, index) => `Person ${index}`);
  assert.deepEqual(validateNames("Person 0", names, "en"), { issue: "max" });
});
