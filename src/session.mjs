import { initialGame } from "./game.mjs";

export const storageKey = "merry-little-draw-v1";

export function validSession(saved) {
  return (
    saved &&
    Array.isArray(saved.pending) &&
    saved.total >= 2 &&
    saved.total <= 50 &&
    Number.isFinite(saved.completed) &&
    saved.completed + saved.pending.length === saved.total &&
    Number.isFinite(saved.readyAt) &&
    saved.pending.every(
      (pair) =>
        typeof pair.giver === "string" &&
        typeof pair.recipient === "string" &&
        pair.giver.length <= 40 &&
        pair.recipient.length <= 40,
    )
  );
}

export function readInitialState(environment = globalThis) {
  let game = initialGame();
  let storageAvailable = true;
  try {
    const saved = JSON.parse(
      environment.sessionStorage.getItem(storageKey) || "null",
    );
    if (validSession(saved)) game = initialGame(saved);
    environment.sessionStorage.setItem("merry-test", "1");
    environment.sessionStorage.removeItem("merry-test");
  } catch {
    storageAvailable = false;
  }
  return { game, storageAvailable };
}

export function saveSession(session, environment = globalThis) {
  try {
    if (session)
      environment.sessionStorage.setItem(storageKey, JSON.stringify(session));
    else environment.sessionStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
