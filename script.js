(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shell = document.querySelector('.nav-shell');
  const glow = document.querySelector('.cursor-glow');

  const onScroll = () => {
    if (shell) shell.classList.toggle('scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (glow && !reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  const canvas = document.getElementById('riskField');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let ratio = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(32, Math.floor((width * height) / 11000));
    nodes = Array.from({ length: count }, (_, i) => {
      const ring = i % 5;
      const angle = (i / count) * Math.PI * 2 + ring * 0.41;
      const radius = 90 + (i % 11) * 16 + ring * 8;
      return {
        x: width * 0.5 + Math.cos(angle) * radius,
        y: height * 0.48 + Math.sin(angle) * radius * 0.72,
        ox: width * 0.5 + Math.cos(angle) * radius,
        oy: height * 0.48 + Math.sin(angle) * radius * 0.72,
        vx: Math.cos(angle + 1.7) * 0.07,
        vy: Math.sin(angle + 1.7) * 0.05,
        r: i % 9 === 0 ? 2.2 : 1.15
      };
    });
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (!reduceMotion) {
        a.x += a.vx;
        a.y += a.vy;
        if (Math.abs(a.x - a.ox) > 12) a.vx *= -1;
        if (Math.abs(a.y - a.oy) > 12) a.vy *= -1;

        const dx = mouse.x - a.x;
        const dy = mouse.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          a.x -= dx * 0.0007;
          a.y -= dy * 0.0007;
        }
      }

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 88) {
          const alpha = (1 - d / 88) * 0.17;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(110, 209, 226, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n, i) => {
      const pulse = reduceMotion ? 1 : 0.82 + Math.sin(time * 0.0015 + i) * 0.18;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = i % 9 === 0 ? 'rgba(185,255,74,.82)' : 'rgba(191,224,231,.45)';
      ctx.fill();
    });

    const g = ctx.createRadialGradient(width * .52, height * .48, 8, width * .52, height * .48, 190);
    g.addColorStop(0, 'rgba(185,255,74,.035)');
    g.addColorStop(.55, 'rgba(88,231,255,.025)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  canvas.addEventListener('pointerleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  draw();

  const countTargets = [...document.querySelectorAll('[data-count]')];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count || 0);
        const start = performance.now();
        const duration = 700;
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.max(1, Math.round(target * eased)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: .7 });
    countTargets.forEach((el) => countIO.observe(el));
  }
})();
