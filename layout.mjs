const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set();
const timing = { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

function positions() {
  const result = new Map();
  document.querySelectorAll('[data-layout], [data-person]').forEach(element => {
    const key = element.hasAttribute('data-person')
      ? `person:${element.dataset.person}`
      : element.dataset.layout;
    const rect = element.getBoundingClientRect();
    result.set(key, { element, x: rect.x + scrollX, y: rect.y + scrollY });
  });
  return result;
}

function animate(element, frames, options = timing) {
  if (!element.animate || motionPreference.matches || document.hidden) return;
  const animation = element.animate(frames, options);
  running.add(animation);
  const finish = () => running.delete(animation);
  animation.addEventListener('finish', finish, { once: true });
  animation.addEventListener('cancel', finish, { once: true });
}

export function stopLayoutMotion() {
  running.forEach(animation => animation.cancel());
  running.clear();
}

export function fadeIn(element) {
  animate(element, [{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: 180 });
}

// Animate only the current DOM. In particular, never retain an old secret in a
// cloned node, screenshot, or outgoing transition after the user presses Next.
export function updateLayout(update) {
  const before = positions();
  stopLayoutMotion();
  update();
  if (motionPreference.matches || document.hidden) return;
  positions().forEach(({ element, x, y }, key) => {
    const previous = before.get(key);
    if (previous) {
      const dx = previous.x - x;
      const dy = previous.y - y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        animate(element, [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' }
        ]);
      }
    }
    if ((element.dataset.layout === 'content' && (!previous || previous.element !== element)) ||
        (element.hasAttribute('data-person') && !previous)) {
      animate(element, [{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: 240 });
    }
  });
}

motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) stopLayoutMotion();
});
