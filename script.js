(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = document.querySelector('.site-header');
  const pointer = document.querySelector('.pointer-light');

  const updateHeader = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (pointer && !reduced) {
    window.addEventListener('pointermove', (event) => {
      pointer.style.left = event.clientX + 'px';
      pointer.style.top = event.clientY + 'px';
    }, { passive: true });
  }

  const revealNodes = [...document.querySelectorAll('.reveal')];
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -28px 0px' });
    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('visible'));
  }

  const canvas = document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let points = [];
  let cursor = { x: -10000, y: -10000 };

  function setup() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(34, Math.floor((width * height) / 10500));
    points = Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + (index % 6) * 0.21;
      const shell = 78 + (index % 13) * 13;
      const x = width * 0.51 + Math.cos(angle) * shell;
      const y = height * 0.50 + Math.sin(angle) * shell * 0.73;
      return {
        x, y, homeX: x, homeY: y,
        vx: Math.cos(angle + 1.25) * 0.055,
        vy: Math.sin(angle + 1.25) * 0.045,
        radius: index % 11 === 0 ? 2.1 : 1.05,
        hot: index % 11 === 0
      };
    });
  }

  function render(time = 0) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      if (!reduced) {
        point.x += point.vx;
        point.y += point.vy;
        if (Math.abs(point.x - point.homeX) > 11) point.vx *= -1;
        if (Math.abs(point.y - point.homeY) > 11) point.vy *= -1;

        const dx = cursor.x - point.x;
        const dy = cursor.y - point.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 125) {
          point.x -= dx * 0.00065;
          point.y -= dy * 0.00065;
        }
      }

      for (let j = i + 1; j < points.length; j++) {
        const other = points[j];
        const dx = point.x - other.x;
        const dy = point.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 86) continue;

        const alpha = (1 - distance / 86) * 0.14;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `rgba(150, 214, 220, ${alpha})`;
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
    }

    points.forEach((point, index) => {
      const pulse = reduced ? 1 : 0.86 + Math.sin(time * 0.00135 + index * 0.61) * 0.14;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = point.hot ? 'rgba(186,248,74,.82)' : 'rgba(196,218,222,.42)';
      ctx.fill();
    });

    const glow = ctx.createRadialGradient(width * .51, height * .50, 6, width * .51, height * .50, 210);
    glow.addColorStop(0, 'rgba(186,248,74,.026)');
    glow.addColorStop(.48, 'rgba(142,231,242,.022)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (!reduced) requestAnimationFrame(render);
  }

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    cursor.x = event.clientX - rect.left;
    cursor.y = event.clientY - rect.top;
  }, { passive: true });

  canvas.addEventListener('pointerleave', () => {
    cursor.x = -10000;
    cursor.y = -10000;
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(setup).observe(canvas);
  } else {
    window.addEventListener('resize', setup, { passive: true });
  }

  setup();
  render();
})();
