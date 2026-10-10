(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const halo = document.querySelector('.cursor-halo');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (halo && !reduced) {
    window.addEventListener('pointermove', (event) => {
      halo.style.left = event.clientX + 'px';
      halo.style.top = event.clientY + 'px';
    }, { passive: true });
  }

  const nodes = [...document.querySelectorAll('.reveal')];
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -28px 0px' });
    nodes.forEach((node) => observer.observe(node));
  } else {
    nodes.forEach((node) => node.classList.add('visible'));
  }

  const canvas = document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, dpr = 1;
  let points = [];
  let pointer = { x: -9999, y: -9999 };

  function setup() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(30, Math.floor((width * height) / 12000));
    points = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (i % 5) * .24;
      const shell = 88 + (i % 11) * 15;
      const x = width * .51 + Math.cos(angle) * shell;
      const y = height * .50 + Math.sin(angle) * shell * .72;
      return {
        x, y, homeX:x, homeY:y,
        vx:Math.cos(angle + 1.15) * .05,
        vy:Math.sin(angle + 1.15) * .042,
        hot:i % 9 === 0,
        r:i % 9 === 0 ? 1.9 : 1.0
      };
    });
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      if (!reduced) {
        a.x += a.vx; a.y += a.vy;
        if (Math.abs(a.x - a.homeX) > 10) a.vx *= -1;
        if (Math.abs(a.y - a.homeY) > 10) a.vy *= -1;
        const dx = pointer.x - a.x, dy = pointer.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d < 120) { a.x -= dx * .00055; a.y -= dy * .00055; }
      }
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 86) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(116, 149, 214, ${(1-d/86)*.16})`;
        ctx.lineWidth = .65; ctx.stroke();
      }
    }
    points.forEach((p, i) => {
      const pulse = reduced ? 1 : .88 + Math.sin(time*.0013+i*.6)*.12;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2);
      ctx.fillStyle = p.hot ? 'rgba(145,172,224,.82)' : 'rgba(164,184,219,.38)';
      ctx.fill();
    });
    if (!reduced) requestAnimationFrame(draw);
  }

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
  }, { passive:true });
  canvas.addEventListener('pointerleave', () => { pointer = {x:-9999,y:-9999}; });
  if ('ResizeObserver' in window) new ResizeObserver(setup).observe(canvas);
  else window.addEventListener('resize', setup, { passive:true });

  setup(); draw();
})();
