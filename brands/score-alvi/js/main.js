/* Score × Alvi · Mayo 2026 — main.js
   Registry de animaciones GSAP por slide. Sigue las convenciones de base-v2.
*/
(function () {
  'use strict';

  // ============================================================
  // Helpers
  // ============================================================

  function animateCounter(el, target, duration, decimal) {
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: duration || 1.2,
      ease: 'power2.out',
      onUpdate() {
        if (decimal) {
          el.textContent = obj.val.toFixed(decimal).replace('.', ',');
        } else {
          el.textContent = Math.round(obj.val).toLocaleString('es-CL');
        }
      }
    });
  }

  function animateSectionIntro(slideId) {
    const root = document.getElementById(slideId);
    if (!root) return;
    const num = root.querySelector('.section-number');
    const title = root.querySelector('.section-title');
    const subtitle = root.querySelector('.section-subtitle');

    gsap.set([num, title, subtitle], { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo(num,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    tl.fromTo(title,
      { opacity: 0, y: 20, clipPath: 'inset(0 100% 0 0)' },
      { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.85, ease: 'power2.inOut' },
      '-=0.1');
    tl.fromTo(subtitle,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3');
  }

  // ============================================================
  // Animations registry (0-based; HTML IDs son 1-based)
  // ============================================================
  const animations = {};

  // --- SLIDE 1 — HERO ---
  animations[0] = {
    enterSlide() {
      gsap.set(['#hero-logo', '#hero-year', '#hero-subtitle', '#hero-partner', '.hero-bg'],
               { opacity: 0 });

      const tl = gsap.timeline();
      tl.to('.hero-bg', { opacity: 0.08, duration: 0.8, ease: 'power2.out' });
      tl.fromTo('#hero-logo',
        { opacity: 0, scale: 1.5 },
        { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' }, '-=0.6');
      tl.to('#hero-logo', {
        filter: 'drop-shadow(0 0 60px rgba(244,255,0,0.55))',
        duration: 1.4, ease: 'sine.inOut', repeat: 1, yoyo: true
      }, '-=0.3');
      tl.fromTo('#hero-year',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=1.6');
      tl.fromTo('#hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=1.2');
      tl.fromTo('#hero-partner',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.9');
    }
  };

  // --- SLIDE 2 — MERCADO: TOTAL CHILE ---
  animations[1] = {
    enterSlide() {
      const root = document.getElementById('slide-2');
      if (!root) return;

      const kpiCards = root.querySelectorAll('.market-kpi');
      const shareRows = root.querySelectorAll('.share-row');
      const shareFills = root.querySelectorAll('.share-bar-fill');
      const bars = root.querySelectorAll('.market-bar');
      const barFills = root.querySelectorAll('.market-bar-fill');
      const barValues = root.querySelectorAll('.market-bar-value, .market-bar-year');

      gsap.set(['#market-title', '#market-subtitle', '#market-insight',
                '#market-shares .market-shares-eyebrow',
                '#market-chart .market-chart-eyebrow',
                '#slide-2 .slide-source'], { opacity: 0 });
      gsap.set(kpiCards, { opacity: 0, y: 20 });
      gsap.set(shareRows, { opacity: 0, x: -16 });

      // reset bar widths para repetir animación al volver
      shareFills.forEach((f) => {
        const width = f.style.width;
        f.dataset.targetWidth = width;
        f.style.width = '0%';
      });

      gsap.set(barFills, { height: '0%' });
      gsap.set(barValues, { opacity: 0, y: 6 });

      // Reset KPI counters to 0
      root.querySelectorAll('.market-kpi-value').forEach((el) => {
        const dec = el.dataset.decimal ? parseInt(el.dataset.decimal) : 0;
        el.textContent = dec ? '0,0' : '0';
      });

      const tl = gsap.timeline();
      tl.fromTo('#market-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#market-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

      // KPIs
      tl.to(kpiCards, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.15,
        onStart() {
          root.querySelectorAll('.market-kpi-value').forEach((el) => {
            const target = parseFloat(el.dataset.count);
            const dec = el.dataset.decimal ? parseInt(el.dataset.decimal) : 0;
            if (!isNaN(target)) animateCounter(el, target, 1.4, dec);
          });
        }
      }, '-=0.1');

      tl.fromTo('#market-insight',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

      // Brand Shares
      tl.fromTo('#market-shares .market-shares-eyebrow',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.6');

      shareRows.forEach((row, i) => {
        const fill = row.querySelector('.share-bar-fill');
        const target = fill.dataset.targetWidth || (fill.style.width || '0%');
        tl.to(row, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, i === 0 ? '-=0.4' : '-=0.25');
        tl.to(fill, { width: target, duration: 0.7, ease: 'power3.out' }, '-=0.35');
      });

      // Bar chart
      tl.fromTo('#market-chart .market-chart-eyebrow',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3');

      const maxVal = 192.8;
      bars.forEach((bar, i) => {
        const val = parseFloat(bar.dataset.val);
        const heightPct = (val / maxVal) * 100;
        const fill = bar.querySelector('.market-bar-fill');
        const inner = bar.querySelectorAll('.market-bar-value, .market-bar-year');

        tl.to(fill, { height: heightPct + '%', duration: 0.55, ease: 'power3.out' },
              i === 0 ? '-=0.15' : '-=0.45');
        tl.to(inner, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04 },
              '-=0.35');
      });

      tl.fromTo('#slide-2 .slide-source',
        { opacity: 0 },
        { opacity: 0.6, duration: 0.3 }, '-=0.2');
    }
  };

  // --- Helper compartido para slides 3 y 4 (§7.7) ---
  function animateCadenas(slideId, titleId, subtitleId, insightId) {
    const root = document.getElementById(slideId);
    if (!root) return;
    const rows = root.querySelectorAll('.cadenas-row');

    gsap.set([`#${titleId}`, `#${subtitleId}`, `#${insightId}`,
              `#${slideId} .cadenas-header`,
              `#${slideId} .slide-source`], { opacity: 0 });
    gsap.set(rows, { opacity: 0, x: -20 });

    const tl = gsap.timeline();
    tl.fromTo(`#${titleId}`,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    tl.fromTo(`#${subtitleId}`,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    tl.fromTo(`#${slideId} .cadenas-header`,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    tl.to(rows,
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.18 }, '-=0.1');
    tl.fromTo(`#${insightId}`,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
    tl.fromTo(`#${slideId} .slide-source`,
      { opacity: 0 },
      { opacity: 0.6, duration: 0.3 }, '-=0.2');
  }

  // --- SLIDE 3 — Resultados YTD ($) ---
  animations[2] = {
    enterSlide() {
      animateCadenas('slide-3', 'ytd-pesos-title', 'ytd-pesos-subtitle', 'ytd-pesos-insight');
    }
  };

  // --- SLIDE 4 — Resultados YTD (UN) ---
  animations[3] = {
    enterSlide() {
      animateCadenas('slide-4', 'ytd-un-title', 'ytd-un-subtitle', 'ytd-un-insight');
    }
  };

  // --- SLIDE 5 — Proyecciones 2026 ---
  animations[4] = {
    enterSlide() {
      const root = document.getElementById('slide-5');
      if (!root) return;
      const cards = root.querySelectorAll('.proj-card');
      const arrow = root.querySelector('#proj-arrow');
      const claves = root.querySelectorAll('.proj-clave');

      gsap.set(['#proj-title', '#proj-subtitle', arrow, claves,
                '#slide-5 .slide-source'], { opacity: 0 });
      gsap.set(cards, { opacity: 0, y: 30 });

      // Reset values to 0
      root.querySelectorAll('.proj-value').forEach((el) => {
        el.textContent = '0';
      });

      const tl = gsap.timeline();
      tl.fromTo('#proj-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#proj-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

      tl.to(cards[0], {
        opacity: 1, y: 0, duration: 0.55, ease: 'power2.out',
        onStart() {
          const el = cards[0].querySelector('.proj-value');
          if (el) animateCounter(el, parseInt(el.dataset.count), 1.4, 0);
        }
      }, '-=0.1');

      tl.fromTo(arrow,
        { opacity: 0, scale: 0.5 },
        { opacity: 0.6, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.2');

      tl.to(cards[1], {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        onStart() {
          const el = cards[1].querySelector('.proj-value');
          if (el) animateCounter(el, parseInt(el.dataset.count), 1.5, 0);
        }
      }, '-=0.15');

      tl.to(claves, {
        opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.15
      }, '-=0.4');

      tl.fromTo('#slide-5 .slide-source',
        { opacity: 0 },
        { opacity: 0.6, duration: 0.3 }, '-=0.2');
    }
  };

  // --- SLIDE 6 — Section intro ---
  animations[5] = {
    enterSlide() {
      animateSectionIntro('slide-6');
    }
  };

  // --- SLIDE 7 — Video Polonia → Chile ---
  animations[6] = {
    enterSlide() {
      gsap.set(['#polonia-title', '#polonia-subtitle', '#polonia-video-wrap', '#polonia-caption'],
               { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('#polonia-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#polonia-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#polonia-video-wrap',
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.2');
      tl.fromTo('#polonia-caption',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    },
    leaveSlide() {
      const v = document.getElementById('polonia-video');
      if (v && !v.paused) v.pause();
    }
  };

  // --- SLIDE 8 — Video CD Score ---
  animations[7] = {
    enterSlide() {
      gsap.set(['#cd-title', '#cd-subtitle', '#cd-video-wrap', '#cd-caption'],
               { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('#cd-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#cd-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#cd-video-wrap',
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.2');
      tl.fromTo('#cd-caption',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    },
    leaveSlide() {
      const v = document.getElementById('cd-video');
      if (v && !v.paused) v.pause();
    }
  };

  // --- SLIDE 9 — Dolor maquilado ---
  animations[8] = {
    enterSlide() {
      gsap.set(['#dolor-title', '#dolor-subtitle', '#dolor-img', '#dolor-caption'],
               { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('#dolor-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#dolor-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#dolor-img',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.2');
      tl.fromTo('#dolor-caption',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    }
  };

  // --- SLIDE 10 — Cierre lite ---
  animations[9] = {
    enterSlide() {
      gsap.set(['#cierre-logo', '#cierre-phrase', '#slide-10 .cierre-partner'], { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('#cierre-logo',
        { opacity: 0, scale: 1.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
      tl.fromTo('#cierre-phrase',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#slide-10 .cierre-partner',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.1');
    }
  };

  // ============================================================
  // Bootstrap
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    SlideEngine.init({
      onEnterSlide(i) { animations[i]?.enterSlide?.(); },
      onEnterStep(i, s) { animations[i]?.enterStep?.(s); },
      onLeaveSlide(i) { animations[i]?.leaveSlide?.(); },
    });
  });
})();
