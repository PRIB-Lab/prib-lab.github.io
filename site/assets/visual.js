(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animationFrame = 0;
  const canvas = document.querySelector('#protein-field');

  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let w = 0, h = 0, dpr = 1;
    let nodes = [];

    const colors = {
      line: 'rgba(214, 222, 220, 0.15)',
      lineStrong: 'rgba(164, 219, 211, 0.34)',
      point: 'rgba(225, 229, 226, 0.72)',
      pointAccent: 'rgba(146, 215, 207, 0.92)',
      haze: 'rgba(145, 171, 217, 0.06)'
    };

    function seedNodes() {
      const count = w < 500 ? 28 : 42;
      nodes = Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        const helix = t * Math.PI * 5.2;
        const r = Math.min(w, h) * (0.19 + 0.045 * Math.sin(t * Math.PI * 3));
        return {
          t,
          phase: helix,
          baseX: w * 0.5 + Math.cos(helix) * r * (0.62 + 0.2 * Math.sin(t * 5.1)),
          baseY: h * (0.15 + t * 0.7) + Math.sin(helix * 0.52) * h * 0.055,
          depth: Math.sin(helix),
          size: 0.8 + (i % 5) * 0.2
        };
      });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function transformed(node, time) {
      const breathe = reduced ? 0 : Math.sin(time * 0.00034 + node.t * 7.5) * 4.2;
      const depthShift = node.depth * 9 + breathe;
      return {
        x: node.baseX + depthShift + pointer.x * (4 + node.depth * 2.4),
        y: node.baseY + Math.cos(node.phase + time * 0.00018) * (reduced ? 0 : 2.6) + pointer.y * (3 + node.depth * 1.6),
        z: node.depth
      };
    }

    function draw(time = 0) {
      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w * 0.53, h * 0.48, 0, w * 0.53, h * 0.48, Math.min(w, h) * 0.48);
      grad.addColorStop(0, colors.haze);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const pts = nodes.map(n => transformed(n, time));
      ctx.lineCap = 'round';

      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const mx = (a.x + b.x) / 2 + Math.sin(i * 1.7 + time * 0.00012) * (reduced ? 0 : 4);
        const my = (a.y + b.y) / 2;
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle = i % 7 === 0 ? colors.lineStrong : colors.line;
        ctx.lineWidth = i % 7 === 0 ? 1.25 : 0.8;
        ctx.stroke();
      }

      for (let i = 0; i < pts.length; i += 4) {
        for (let j = i + 5; j < Math.min(pts.length, i + 12); j += 3) {
          const a = pts[i], b = pts[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const limit = Math.min(w, h) * 0.26;
          if (dist < limit) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(146, 215, 207, ${0.055 * (1 - dist / limit)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      pts.forEach((p, i) => {
        const node = nodes[i];
        const r = node.size + (p.z + 1) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 9 === 0 ? colors.pointAccent : colors.point;
        ctx.fill();
        if (i % 9 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 4.2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(146,215,207,.14)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      if (!reduced) animationFrame = requestAnimationFrame(draw);
    }

    resize();
    draw(0);
    if (!reduced) {
      window.addEventListener('resize', resize, { passive: true });
      canvas.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }, { passive: true });
      canvas.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
    }
  }

  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const revealEls = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => observer.observe(el));
  }

  window.addEventListener('pagehide', () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  }, { once: true });
})();
