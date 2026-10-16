import { createDraw, consumeReveal } from "./draw.mjs";

export function initialGame(session = null) {
  return {
    session,
    stage: session ? (session.pending.length ? "handoff" : "done") : "setup",
    revealed: null,
    resumed: Boolean(session),
  };
}

export function startGame(names, now = Date.now()) {
  return {
    session: {
      pending: createDraw(names),
      total: names.length,
      completed: 0,
      readyAt: now + 5000,
    },
    stage: "handoff",
    revealed: null,
    resumed: false,
  };
}

export function revealGame(game, now = Date.now()) {
  if (game.stage !== "handoff") return null;
  const session = { ...game.session, pending: [...game.session.pending] };
  const revealed = consumeReveal(session, now);
  if (!revealed) return null;
  return { ...game, session, revealed, resumed: false, stage: "reveal" };
}

export function nextGame(game, now = Date.now()) {
  if (game.stage !== "reveal") return null;
  const session = { ...game.session, readyAt: now + 5000 };
  return {
    ...game,
    session,
    revealed: null,
    stage: session.pending.length ? "handoff" : "done",
  };
}

export function restoreGame(game) {
  return {
    ...game,
    revealed: null,
    stage: game.session
      ? game.session.pending.length
        ? "handoff"
        : "done"
      : "setup",
  };
}

export function validateNames(value, names, language) {
  const entries = value
    .split(/[,;\n]+/)
    .map((name) => name.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (!entries.length) return { issue: "emptyError" };
  const known = new Set(
    names.map((name) => name.normalize("NFC").toLocaleLowerCase(language)),
  );
  let issue = null;
  for (const name of entries) {
    const key = name.normalize("NFC").toLocaleLowerCase(language);
    if (known.has(key)) {
      issue = "duplicate";
      break;
    }
    if (name.length > 40) {
      issue = "tooLong";
      break;
    }
    known.add(key);
  }
  if (names.length + entries.length > 50) issue = "max";
  return issue ? { issue } : { entries };
}
