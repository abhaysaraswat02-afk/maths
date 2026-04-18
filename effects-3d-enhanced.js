/**
 * Era of MathAntics — Enhanced 3D Effects Engine
 * Particles, cursor, scroll, tilt, parallax, reveal
 */

(function () {
  'use strict';

  // ─── Scroll Progress Bar ─────────────────────────────────
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / max * 100) + '%';
    }, { passive: true });
  }

  // ─── Scroll-to-top Button ─────────────────────────────────
  function initScrollTopBtn() {
    const btn = document.createElement('button');
    btn.id = 'scroll-top-btn';
    btn.title = 'Back to top';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ─── Custom Cursor (Desktop only) ────────────────────────
  function initCursor() {
    if (window.innerWidth < 769) return;
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });
    function animRing() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    }
    animRing();

    // Expand cursor on interactive elements
    document.querySelectorAll('a, button, input, select, textarea, [role=button]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width  = '16px';
        dot.style.height = '16px';
        ring.style.width  = '52px';
        ring.style.height = '52px';
        ring.style.borderColor = 'rgba(59,130,246,0.6)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width  = '8px';
        dot.style.height = '8px';
        ring.style.width  = '36px';
        ring.style.height = '36px';
        ring.style.borderColor = 'rgba(59,130,246,0.4)';
      });
    });
  }

  // ─── Floating Particles Canvas ───────────────────────────
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b'];
    const count = window.innerWidth < 769 ? 30 : 60;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      // Draw connecting lines between nearby particles
      ctx.globalAlpha = 1;
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ─── Floating Math Symbols ───────────────────────────────
  function initMathSymbols() {
    const hero = document.querySelector('#home') || document.querySelector('section');
    if (!hero) return;
    const syms = ['∑','∫','π','√','∞','÷','×','²','³','Δ','θ','φ','≈','≠','≤','≥'];
    syms.forEach((s, i) => {
      const el = document.createElement('span');
      el.className = 'math-symbol';
      el.textContent = s;
      el.style.setProperty('--dur', (10 + Math.random() * 10) + 's');
      el.style.setProperty('--del', (Math.random() * 8) + 's');
      el.style.left  = (Math.random() * 90 + 5) + '%';
      el.style.top   = (Math.random() * 80 + 10) + '%';
      hero.style.position = hero.style.position || 'relative';
      hero.style.overflow  = hero.style.overflow  || 'hidden';
      hero.appendChild(el);
    });
  }

  // ─── Hero Depth Orbs ─────────────────────────────────────
  function initHeroOrbs() {
    const hero = document.querySelector('#home, .hero-section');
    if (!hero) return;
    hero.style.position = 'relative';
    hero.style.overflow = 'hidden';
    ['hero-orb-1','hero-orb-2','hero-orb-3'].forEach(cls => {
      const orb = document.createElement('div');
      orb.className = 'hero-orb ' + cls;
      hero.insertBefore(orb, hero.firstChild);
    });
  }

  // ─── 3D Tilt on Cards ────────────────────────────────────
  function initTilt() {
    const selector = '.tilt-card, .tilt-card-3d, .team-card-3d, .stat-3d, .step-card-3d, .video-card-3d, .achiever-card-3d, .resource-card-3d';
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx   = rect.width / 2;
        const cy   = rect.height / 2;
        const mx   = e.clientX - rect.left - cx;
        const my   = e.clientY - rect.top  - cy;
        const rx   = (my / cy) * 10;
        const ry   = (mx / cx) * -10;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.03)`;
        card.style.boxShadow = `${-mx/8}px ${-my/8}px 40px rgba(59,130,246,0.2), 0 20px 60px rgba(0,0,0,0.12)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.boxShadow  = '';
      });
    });
  }

  // ─── Reveal-3D on Scroll ─────────────────────────────────
  function initReveal() {
    const els = document.querySelectorAll('.reveal-3d, .reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    els.forEach(el => io.observe(el));
  }

  // ─── Parallax on Hero ────────────────────────────────────
  function initParallax() {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        el.style.transform = `translateY(${y * speed}px)`;
      });
    }, { passive: true });
  }

  // ─── Stagger children on visible ─────────────────────────
  function initStagger() {
    const containers = document.querySelectorAll('.badge-container, .grid');
    containers.forEach(cont => {
      const children = Array.from(cont.children);
      children.forEach((child, i) => {
        child.style.transitionDelay = (i * 0.06) + 's';
      });
    });
  }

  // ─── Number Counter Animate ──────────────────────────────
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      let current = 0;
      const step = Math.ceil(target / 80);
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current >= target) clearInterval(interval);
      }, 20);
    });
  }

  // ─── Button Ripple Effect ────────────────────────────────
  function initRipple() {
    document.querySelectorAll('button, .btn-neon-blue, a.bg-blue-600').forEach(btn => {
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
          position:absolute;
          width:${size}px; height:${size}px;
          left:${e.clientX - rect.left - size/2}px;
          top:${e.clientY - rect.top  - size/2}px;
          background:rgba(255,255,255,0.25);
          border-radius:50%;
          transform:scale(0);
          animation: ripple-anim 0.5s ease-out forwards;
          pointer-events:none;
        `;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });

    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `@keyframes ripple-anim { to { transform:scale(2.5); opacity:0; } }`;
      document.head.appendChild(style);
    }
  }

  // ─── Smooth Section Entrance ─────────────────────────────
  function markRevealTargets() {
    document.querySelectorAll('section, .reveal').forEach(el => {
      if (!el.classList.contains('reveal-3d')) {
        el.classList.add('reveal-3d');
      }
    });
  }

  // ─── Init All ────────────────────────────────────────────
  function initAll() {
    try { initScrollProgress(); } catch(e) {}
    try { initScrollTopBtn();   } catch(e) {}
    try { initParticles();      } catch(e) {}
    try { initMathSymbols();    } catch(e) {}
    try { initHeroOrbs();       } catch(e) {}
    try { markRevealTargets();  } catch(e) {}
    try { initReveal();         } catch(e) {}
    try { initTilt();           } catch(e) {}
    try { initParallax();       } catch(e) {}
    try { initStagger();        } catch(e) {}
    try { initRipple();         } catch(e) {}

    if (window.innerWidth >= 769) {
      try { initCursor(); } catch(e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-run tilt for dynamically added elements
  window.MathAntics3D = {
    refreshTilt: initTilt,
    refreshReveal: initReveal,
    animateCounters: animateCounters,
  };
})();
