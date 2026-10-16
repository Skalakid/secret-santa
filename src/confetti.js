export function createConfetti(canvas) {
  let confettiFrame = null;
  function stopConfetti() {
    cancelAnimationFrame(confettiFrame);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
  function celebrate() {
    stopConfetti();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    const w = innerWidth,
      h = innerHeight,
      dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#efb1a0", "#315f4d", "#d6b36b", "#96b599", "#cec1db"];
    const particles = Array.from({ length: 135 }, () => ({
      x: w / 2,
      y: h * 0.48,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 16 - 4,
      spin: Math.random() * 0.2 - 0.1,
      angle: Math.random() * Math.PI,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const startTime = performance.now();
    let prev = startTime;
    const frame = (now) => {
      const delta = Math.min((now - prev) / 16.67, 2);
      prev = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, (3800 - (now - startTime)) / 700);
      for (const p of particles) {
        p.vy += 0.18 * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vx *= Math.pow(0.992, delta);
        p.angle += p.spin * delta;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (now - startTime < 3800) confettiFrame = requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    };
    confettiFrame = requestAnimationFrame(frame);
  }
  return { stop: stopConfetti, celebrate };
}
