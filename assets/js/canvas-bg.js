// Simple particle background for hero section only
(function () {
  const heroCanvas = document.getElementById('hero-canvas');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function createCtx(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    resize(canvas);
    return ctx;
  }

  function resize(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.height * DPR);
  }

  const heroCtx = createCtx(heroCanvas);

  const state = {
    particles: [],
    lastT: 0,
  };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initHero() {
    if (!heroCtx || !heroCanvas) return;
    const rect = heroCanvas.getBoundingClientRect();
    const count = Math.floor((rect.width * rect.height) / 26000);
    state.particles = Array.from({ length: count }, () => ({
      x: rand(0, heroCanvas.width),
      y: rand(0, heroCanvas.height),
      vx: rand(-0.15, 0.15) * DPR,
      vy: rand(-0.15, 0.15) * DPR,
      r: rand(1.2, 2.2) * DPR,
    }));
  }

  function drawHero(dt) {
    if (!heroCtx || !heroCanvas) return;
    heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    // glow background grid
    heroCtx.save();
    heroCtx.globalAlpha = 0.08;
    heroCtx.strokeStyle = '#1b2b5a';
    const grid = 48 * DPR;
    for (let x = 0; x < heroCanvas.width; x += grid) {
      heroCtx.beginPath(); heroCtx.moveTo(x, 0); heroCtx.lineTo(x, heroCanvas.height); heroCtx.stroke();
    }
    for (let y = 0; y < heroCanvas.height; y += grid) {
      heroCtx.beginPath(); heroCtx.moveTo(0, y); heroCtx.lineTo(heroCanvas.width, y); heroCtx.stroke();
    }
    heroCtx.restore();

    // particles
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > heroCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > heroCanvas.height) p.vy *= -1;

      heroCtx.beginPath();
      const grad = heroCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, 'rgba(0, 123, 255, 0.9)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      heroCtx.fillStyle = grad;
      heroCtx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      heroCtx.fill();
    }

    // connecting lines
    heroCtx.lineWidth = 1 * DPR;
    for (let i = 0; i < state.particles.length; i++) {
      for (let j = i + 1; j < state.particles.length; j++) {
        const a = state.particles[i];
        const b = state.particles[j];
        const dx = a.x - b.x; const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        const maxDist = 160 * DPR;
        if (dist2 < maxDist * maxDist) {
          const alpha = 1 - Math.sqrt(dist2) / (maxDist);
          heroCtx.strokeStyle = `rgba(0, 123, 255, ${0.25 * alpha})`;
          heroCtx.beginPath(); heroCtx.moveTo(a.x, a.y); heroCtx.lineTo(b.x, b.y); heroCtx.stroke();
        }
      }
    }
  }

  let rafId = 0;
  function frame(t) {
    const dt = state.lastT ? Math.min(32, t - state.lastT) : 16;
    state.lastT = t;
    drawHero(dt);
    rafId = requestAnimationFrame(frame);
  }

  function onResize() {
    if (heroCanvas) resize(heroCanvas);
    initHero();
  }

  window.addEventListener('resize', () => {
    onResize();
  });

  onResize();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
})();


