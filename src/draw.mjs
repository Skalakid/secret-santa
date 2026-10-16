// Rejection sampling a Fisher–Yates shuffle gives each valid derangement
// the same probability. The random integers also avoid modulo bias.
export function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % max;
}
export function createDraw(names) {
  if (names.length < 2 || names.length > 50 || new Set(names).size !== names.length) throw new Error('Invalid participants');
  let order;
  do {
    order = names.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order.some((value, i) => value === i));
  return names.map((giver, i) => ({ giver, recipient: names[order[i]] }));
}
// The consumed pair is removed before the new state is persisted or displayed.
export function consumeReveal(state, now = Date.now()) {
  if (!state.pending.length || now < state.readyAt) return null;
  const pair = state.pending.shift();
  state.completed++;
  state.readyAt = now + 5000;
  return pair;
}
