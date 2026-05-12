/* Score Presentation Engine — shared/js/core.js */
(function (window) {
  'use strict';

  const SlideEngine = (function () {
    let slides = [];
    let currentIndex = 0;
    let currentStep = 0;
    let isTransitioning = false;
    let callbacks = {};

    function init(cbs) {
      callbacks = cbs || {};
      slides = Array.from(document.querySelectorAll('.slide'));
      if (!slides.length) return;

      slides.forEach((s, i) => {
        s.classList.toggle('active', i === 0);
      });
      currentIndex = 0;
      currentStep = 0;

      updateProgress();
      updateCounter();

      document.addEventListener('keydown', onKeydown);
      const prevBtn = document.getElementById('nav-prev');
      const nextBtn = document.getElementById('nav-next');
      const prevZone = document.getElementById('click-prev');
      const nextZone = document.getElementById('click-next');
      if (prevBtn) prevBtn.addEventListener('click', retreat);
      if (nextBtn) nextBtn.addEventListener('click', advance);
      if (prevZone) prevZone.addEventListener('click', retreat);
      if (nextZone) nextZone.addEventListener('click', advance);

      callbacks.onEnterSlide?.(0);
    }

    function onKeydown(e) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        retreat();
      }
    }

    function totalSteps(idx) {
      const el = slides[idx];
      if (!el) return 0;
      const n = parseInt(el.dataset.steps, 10);
      return isNaN(n) ? 0 : n;
    }

    function advance() {
      if (isTransitioning) return;
      const steps = totalSteps(currentIndex);
      if (currentStep < steps) {
        currentStep += 1;
        callbacks.onEnterStep?.(currentIndex, currentStep);
        return;
      }
      if (currentIndex < slides.length - 1) {
        goToSlide(currentIndex + 1);
      }
    }

    function retreat() {
      if (isTransitioning) return;
      if (currentIndex > 0) {
        goToSlide(currentIndex - 1);
      }
    }

    function goToSlide(newIndex) {
      if (newIndex < 0 || newIndex >= slides.length) return;
      if (newIndex === currentIndex) return;
      isTransitioning = true;

      const leaving = slides[currentIndex];
      const entering = slides[newIndex];
      const dir = newIndex > currentIndex ? 1 : -1;

      callbacks.onLeaveSlide?.(currentIndex);

      if (window.gsap) {
        gsap.to(leaving, {
          opacity: 0, x: -30 * dir, duration: 0.3, ease: 'power2.in',
          onComplete() {
            leaving.classList.remove('active');
            gsap.set(leaving, { clearProps: 'all' });

            entering.classList.add('active');
            currentIndex = newIndex;
            currentStep = 0;
            updateProgress();
            updateCounter();

            callbacks.onEnterSlide?.(newIndex);

            gsap.fromTo(entering,
              { opacity: 0, x: 30 * dir },
              { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out',
                onComplete() {
                  gsap.set(entering, { clearProps: 'x' });
                  isTransitioning = false;
                }
              });
          }
        });
      } else {
        leaving.classList.remove('active');
        entering.classList.add('active');
        currentIndex = newIndex;
        currentStep = 0;
        updateProgress();
        updateCounter();
        callbacks.onEnterSlide?.(newIndex);
        isTransitioning = false;
      }
    }

    function updateProgress() {
      const bar = document.getElementById('progress-fill');
      if (!bar) return;
      const pct = ((currentIndex + 1) / slides.length) * 100;
      bar.style.width = pct + '%';
    }

    function updateCounter() {
      const el = document.getElementById('slide-counter');
      if (!el) return;
      el.textContent = (currentIndex + 1) + ' / ' + slides.length;
    }

    return {
      init,
      goToSlide,
      getCurrent() { return currentIndex; }
    };
  })();

  window.SlideEngine = SlideEngine;
})(window);
