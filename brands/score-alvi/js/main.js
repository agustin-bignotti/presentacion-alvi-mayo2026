/* Score × Alvi · Mayo 2026 — main.js (v2)
   11 slides. Registry de animaciones GSAP por slide.
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
  // Fix: clicks sobre <video> no deben disparar nav del deck.
  // Los click-zones #click-prev/next viven a nivel #presentation
  // con position: fixed y z-index: 50 — están SIEMPRE encima del
  // contenido del slide. Para que el video reciba play, en los
  // slides de video ocultamos esas zonas; el presentador navega
  // con teclado o con los botones circulares nav-prev/next.
  // ============================================================
  function disableClickZones() {
    const cp = document.getElementById('click-prev');
    const cn = document.getElementById('click-next');
    if (cp) cp.style.display = 'none';
    if (cn) cn.style.display = 'none';
  }
  function enableClickZones() {
    const cp = document.getElementById('click-prev');
    const cn = document.getElementById('click-next');
    if (cp) cp.style.display = '';
    if (cn) cn.style.display = '';
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
      tl.to('.hero-bg',
        { opacity: 0.08, duration: 0.4, ease: 'power2.out' });
      tl.fromTo('#hero-logo',
        { opacity: 0, scale: 1.3 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3');
      tl.fromTo('#hero-year',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
      tl.fromTo('#hero-subtitle',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25');
      tl.fromTo('#hero-partner',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2');

      // Glow ambient (no bloquea la cascada, corre en paralelo)
      gsap.to('#hero-logo', {
        filter: 'drop-shadow(0 0 60px rgba(244,255,0,0.55))',
        duration: 1.2, ease: 'sine.inOut', repeat: 1, yoyo: true, delay: 0.6
      });
    }
  };

  // --- SLIDE 2 — RESUMEN SCORE 2025 (§7.2) ---
  animations[1] = {
    enterSlide() {
      const cards = document.querySelectorAll('#slide-2 .kpi-card');
      cards.forEach((c) => {
        gsap.set(c, { opacity: 0, y: 30 });
        c.classList.remove('kpi-active', 'kpi-past');
        const valEl = c.querySelector('.kpi-value:not(.kpi-rank)');
        if (valEl) valEl.textContent = '0';
      });
      gsap.fromTo('#kpi-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo('#kpi-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
    },
    enterStep(step) {
      const cards = document.querySelectorAll('#slide-2 .kpi-card');
      const card = cards[step - 1];
      if (!card) return;

      cards.forEach((c, i) => {
        if (i < step - 1) {
          c.classList.remove('kpi-active');
          c.classList.add('kpi-past');
          gsap.to(c, { opacity: 0.4, duration: 0.3, ease: 'power2.out' });
        }
      });

      card.classList.add('kpi-active');
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

      const valEl = card.querySelector('.kpi-value:not(.kpi-rank)');
      if (!valEl) return;
      const countTo = parseFloat(valEl.dataset.count);
      const decimal = valEl.dataset.decimal ? parseInt(valEl.dataset.decimal) : 0;
      if (countTo && !isNaN(countTo)) animateCounter(valEl, countTo, 1.2, decimal);
    }
  };

  // --- SLIDE 3 — MERCADO ---
  animations[2] = {
    enterSlide() {
      const root = document.getElementById('slide-3');
      if (!root) return;

      const kpiCards = root.querySelectorAll('.market-kpi');
      const funnelSlices = root.querySelectorAll('.funnel-slice');
      const bars = root.querySelectorAll('.market-bar');
      const barFills = root.querySelectorAll('.market-bar-fill');
      const barValues = root.querySelectorAll('.market-bar-value, .market-bar-year');

      gsap.set(['#market-title', '#market-subtitle', '#market-insight',
                '#market-funnel .funnel-eyebrow',
                '#market-chart .market-chart-eyebrow',
                '#slide-3 .slide-source'], { opacity: 0 });
      gsap.set(kpiCards, { opacity: 0, y: 20 });
      gsap.set(funnelSlices, { opacity: 0, width: '0%' });
      gsap.set(barFills, { height: '0%' });
      gsap.set(barValues, { opacity: 0, y: 6 });

      // Reset KPI counters
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

      // Embudo
      tl.fromTo('#market-funnel .funnel-eyebrow',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.6');

      funnelSlices.forEach((slice, i) => {
        const target = slice.dataset.width + '%';
        tl.to(slice,
          { opacity: 1, width: target, duration: 0.55, ease: 'power3.out' },
          i === 0 ? '-=0.4' : '-=0.4');
      });

      tl.fromTo('#funnel-aside',
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }, '-=0.2');

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

        tl.to(fill, { height: heightPct + '%', duration: 0.5, ease: 'power3.out' },
              i === 0 ? '-=0.15' : '-=0.42');
        tl.to(inner, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04 },
              '-=0.32');
      });

      tl.fromTo('#slide-3 .slide-source',
        { opacity: 0 },
        { opacity: 0.6, duration: 0.3 }, '-=0.2');
    }
  };

  // --- Helper compartido para slides YTD ($ y UN) ---
  function animateYTDResult(slideId, titleId, subtitleId, heroId, clavesId, decimal) {
    const root = document.getElementById(slideId);
    if (!root) return;
    const claves = root.querySelectorAll('.result-clave');
    const amountEl = root.querySelector('.result-amount');

    gsap.set([`#${titleId}`, `#${subtitleId}`, `#${heroId}`,
              `#${slideId} .slide-source`], { opacity: 0 });
    gsap.set(claves, { opacity: 0, x: -20 });
    if (amountEl) amountEl.textContent = decimal ? '0,0' : '0';

    const tl = gsap.timeline();
    tl.fromTo(`#${titleId}`,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    tl.fromTo(`#${subtitleId}`,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    tl.fromTo(`#${heroId}`,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out',
        onStart() {
          if (amountEl && amountEl.dataset.count) {
            animateCounter(amountEl, parseFloat(amountEl.dataset.count), 1.6, decimal || 0);
          }
        }
      }, '-=0.2');
    tl.to(claves, {
      opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.12
    }, '-=0.3');
    tl.fromTo(`#${slideId} .slide-source`,
      { opacity: 0 },
      { opacity: 0.6, duration: 0.3 }, '-=0.2');
  }

  // --- SLIDE 4 — Resultados YTD ($) ---
  animations[3] = {
    enterSlide() {
      animateYTDResult('slide-4', 'ytd-pesos-title', 'ytd-pesos-subtitle',
                       'ytd-pesos-hero', 'ytd-pesos-claves', 0);
    }
  };

  // --- SLIDE 5 — Resultados YTD (UN) ---
  animations[4] = {
    enterSlide() {
      animateYTDResult('slide-5', 'ytd-un-title', 'ytd-un-subtitle',
                       'ytd-un-hero', 'ytd-un-claves', 0);
    }
  };

  // --- SLIDE 6 — Proyecciones 2026 ---
  animations[5] = {
    enterSlide() {
      const root = document.getElementById('slide-6');
      if (!root) return;
      const cards = root.querySelectorAll('.proj-card');
      const arrow = root.querySelector('#proj-arrow');
      const claves = root.querySelectorAll('.proj-clave');

      gsap.set(['#proj-title', '#proj-subtitle', arrow, claves,
                '#slide-6 .slide-source'], { opacity: 0 });
      gsap.set(cards, { opacity: 0, y: 30 });

      root.querySelectorAll('.proj-value').forEach((el) => { el.textContent = '0'; });

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

      tl.fromTo('#slide-6 .slide-source',
        { opacity: 0 },
        { opacity: 0.6, duration: 0.3 }, '-=0.2');
    }
  };

  // --- SLIDE 7 — Section intro ---
  animations[6] = { enterSlide() { animateSectionIntro('slide-7'); } };

  // --- SLIDE 8 — Video Polonia ---
  animations[7] = {
    enterSlide() {
      disableClickZones();

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
      enableClickZones();
      const v = document.getElementById('polonia-video');
      if (v && !v.paused) v.pause();
    }
  };

  // --- SLIDE 9 — CD Score (2 fotos) ---
  animations[8] = {
    enterSlide() {
      const root = document.getElementById('slide-9');
      if (!root) return;
      const photos = root.querySelectorAll('.cd-photo');

      gsap.set(['#cd-title', '#cd-subtitle', '#cd-caption'], { opacity: 0 });
      gsap.set(photos, { opacity: 0, scale: 0.95 });

      const tl = gsap.timeline();
      tl.fromTo('#cd-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      tl.fromTo('#cd-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      tl.to(photos,
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.2 },
        '-=0.2');
      tl.fromTo('#cd-caption',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    }
  };

  // --- SLIDE 10 — Dolor maquilado (split, ahora con video) ---
  animations[9] = {
    enterSlide() {
      disableClickZones();

      gsap.set(['#dolor-title', '#dolor-subtitle',
                '.slide-dolor .dolor-eyebrow',
                '#dolor-stat', '#dolor-cta', '#dolor-img'], { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('.slide-dolor .dolor-eyebrow',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      tl.fromTo('#dolor-title',
        { opacity: 0, y: 30, clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power2.inOut' },
        '-=0.1');
      tl.fromTo('#dolor-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#dolor-stat',
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }, '-=0.2');
      tl.fromTo('#dolor-cta',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');
      tl.fromTo('#dolor-img',
        { opacity: 0, scale: 0.95, x: 24 },
        { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=1.3');
    },
    leaveSlide() {
      enableClickZones();
      const v = document.getElementById('dolor-video');
      if (v && !v.paused) v.pause();
    }
  };

  // --- SLIDE 11 — Cierre lite ---
  animations[10] = {
    enterSlide() {
      gsap.set(['#cierre-logo', '#cierre-phrase', '#slide-11 .cierre-partner'], { opacity: 0 });

      const tl = gsap.timeline();
      tl.fromTo('#cierre-logo',
        { opacity: 0, scale: 1.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
      tl.fromTo('#cierre-phrase',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      tl.fromTo('#slide-11 .cierre-partner',
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
