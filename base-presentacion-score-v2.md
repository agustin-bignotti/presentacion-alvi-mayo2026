# Base — Presentación Web Score Energy · v2

Documento de contexto para construir nuevas presentaciones web interactivas para la marca **Score Energy Drink**. Describe arquitectura, motor, sistema visual, patrones de slide, animators reutilizables y lecciones aprendidas. Es **genérico**: no incluye contenido específico de ningún distribuidor ni cliente.

Este documento es v2 y supersede a `base-presentacion-score.md`. Lo nuevo respecto del v1:

- **Nuevos patrones de slide**: tabla de datos con highlight y mini-bars (§7.7), market share con barras mensuales + proyección + cards de claves (§7.8), waterfall/cascade chart (§7.9), variante multi-producto de innovación (§7.10).
- **Animators reutilizables documentados**: `animateCounter`, `animateSectionIntro`, `resetItemStage`/`stepItemStage`, `animateMarketShareSlide` (§9).
- **Fixes de layout**: `min-height` en KPI cards para evitar saltos verticales entre pasos, `justify-content: flex-start` + `padding-top` en listas reveal para anclar el título.
- **Utility classes de color por producto**: `.accent-radical`, `.accent-bubblegum`, etc.
- **Section intro con numbered chip**: variante con "01/02/03" + líneas decorativas para numerar capítulos del deck.
- **Cierre con variante lite**: el contador en vivo es opcional, no obligatorio.
- **Gotchas y convenciones**: scoped selectors, autoría de commits, handling de slide renumbering (§18).

---

## 1. Concepto general

Una presentación Score es un **sitio web estático que simula un PowerPoint premium animado**. Se ve y se navega como un slide deck, pero es HTML/CSS/JS puro desplegado en Vercel. Corre en pantalla grande para proyección, pero es responsive y funciona en móvil.

**Uso típico:** capacitaciones de fuerza de venta, presentaciones comerciales a distribuidores, kick-offs, lanzamientos. La audiencia suele ser equipos de venta de un distribuidor o cliente específico que comercializa Score.

**Tono visual:**
- Oscuro, premium, minimalista.
- Fondo casi negro (`#080808`) con acentos en amarillo neón Score (`#F4FF00`).
- Tipografía grande, mucho espacio negativo.
- Máximo 3–4 elementos visibles por slide. Imágenes protagonistas, texto reducido.
- Todo diseñado para que el presentador hable mientras la slide refuerza visualmente.

**Estructura típica (12–16 slides, agrupadas en 3 secciones con intros):**

1. Hero (portada con logo Score, año y marca del partner/cliente).
2. Objetivo (bajada del para qué).
3. **Resumen Score 2025 — KPIs transversales** (siempre presente).
4. Section intro 01 — Mercado.
5. Claves del mercado (lista numerada reveal).
6. Tabla de datos de mercado (cadenas / competidores / distribución).
7. Section intro 02 — Score en el cliente.
8. Market share cliente ($).
9. Market share cliente (unidades).
10. Section intro 03 — Oportunidades.
11. Lista de oportunidades (reveal).
12. Venta perdida operacional / waterfall chart.
13. Innovación 2026 — producto 1.
14. Innovación 2026 — producto 2 (opcional).
15. **Cierre** (transversal, con o sin contador en vivo).

La cantidad exacta y los patrones aplicados dependen del cliente. Los **dos únicos slides transversales obligatorios** son el Resumen Score 2025 (§7.2) y el Cierre (§7.12).

---

## 2. Stack tecnológico

- **HTML5 + CSS3 + JavaScript vanilla** — sin npm, sin frameworks, sin build tools.
- **GSAP 3.12** vía CDN (`cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`) — todas las animaciones.
- **Google Fonts** vía CDN — `Bebas Neue` (display/titulares) e `Inter` (300/400/500/600/700).
- **Servidor local:** Node.js con módulo `http` nativo (`server.js`, puerto 3000). Solo para desarrollo; no hay dependencias npm.
- **Deploy:** Vercel (`vercel.json` con `cleanUrls: true`, `trailingSlash: true`, cache de assets `max-age=31536000, immutable`). Detecta automáticamente el sitio estático y lo publica sin build step.
- **Sin backend.** Todo el contenido vive en HTML/CSS/JS del lado cliente.

---

## 3. Estructura de archivos

```
presentacion-score-[cliente]-[periodo]/
├── index.html                       ← Landing (logo Score + CTA al deck)
├── server.js                        ← Dev server Node.js nativo (puerto 3000)
├── vercel.json                      ← Config de deploy
├── .gitignore
├── CLAUDE.md                        ← Notas para Claude Code (convenciones locales)
├── shared/                          ← Motor reutilizable entre presentaciones
│   ├── css/base.css                 ← Reset, variables CSS, layout de slide, UI de nav
│   └── js/core.js                   ← Motor de navegación de slides (SlideEngine IIFE)
├── brands/score-[cliente]/          ← Contenido específico de la presentación
│   ├── index.html                   ← Todas las slides en un solo HTML
│   ├── css/theme.css                ← Estilos específicos de cada slide
│   └── js/main.js                   ← Animaciones GSAP por slide
├── assets/                          ← Recursos gráficos (ver §13)
│   ├── Logos e Isotipos/
│   ├── Imagenes Productos/
│   ├── Etiquetas Hero/
│   └── Tienda Perfecta/
└── base-presentacion-score-v2.md    ← Este documento (opcional en cada cliente)
```

**Orden de carga en `brands/score-[cliente]/index.html`:**

1. `<link>` a `../../shared/css/base.css` (reset + variables + layout + UI).
2. `<link>` a `css/theme.css` (estilos específicos).
3. `<script>` de GSAP (CDN).
4. `<script>` de `../../shared/js/core.js` (motor `SlideEngine`).
5. `<script>` de `js/main.js` (animations registry + bootstrapping).

---

## 4. Motor de navegación (`shared/js/core.js`)

Módulo IIFE llamado `SlideEngine` que expone `init()`, `goToSlide()` y `getCurrent()`.

### 4.1. Inicialización

- Al `DOMContentLoaded`, `main.js` llama `SlideEngine.init({ onEnterSlide, onEnterStep, onLeaveSlide })`.
- El motor recolecta todos los `<section class="slide">`, marca la primera como `.active`, actualiza la barra de progreso y dispara `onEnterSlide(0)`.

### 4.2. Inputs de navegación

- **Teclado:** `ArrowRight` o `Space` avanzan, `ArrowLeft` retrocede. `preventDefault()` sobre cada tecla.
- **Zonas de click invisibles:** `#click-prev` (30% izquierda) y `#click-next` (70% derecha), z-index 50.
- **Botones circulares:** `#nav-prev` y `#nav-next` en la esquina inferior izquierda, z-index 100.

### 4.3. Sub-steps dentro de una slide

Una slide puede declarar `data-steps="N"` en su `<section>`:
- El motor consume N avances como steps antes de saltar al siguiente slide.
- `onEnterStep(slideIndex, stepIndex)` se dispara con `stepIndex` 1-based.
- **Retroceder con sub-steps activos retrocede a la slide anterior completa** (no regresa step por step). Decisión de simplicidad intencional.

### 4.4. Transición entre slides

- 0.3s de salida + 0.3s de entrada (`power2.in` / `power2.out`), con `x: ±30` de desplazamiento horizontal.
- **Fix importante:** antes de fadear in la slide entrante, se dispara `onEnterSlide(index)` para que `main.js` ponga en estado "from" (opacity 0) a los elementos internos. Esto evita un flash de un frame.
- Durante la transición, `isTransitioning = true` bloquea nuevos avances en `advance()` / `retreat()` (no en `goToSlide()` directo).

### 4.5. UI persistente

- `#progress-bar` (3px superior, fill amarillo).
- `#slide-counter` (texto "N / TOTAL", esquina inferior derecha).
- `#nav-prev` / `#nav-next` (círculos de 40px).
- `#click-prev` / `#click-next` (zonas invisibles 30/70).
- `#global-logo` (isotipo Score en esquina superior izquierda, 36px, opacity 0.85).

### 4.6. Callbacks expuestos

```js
SlideEngine.init({
  onEnterSlide(i) { animations[i]?.enterSlide?.(); },
  onEnterStep(i, s) { animations[i]?.enterStep?.(s); },
  onLeaveSlide(i) { animations[i]?.leaveSlide?.(); },
});
```

---

## 5. Sistema visual base (`shared/css/base.css`)

### 5.1. Variables CSS globales

```css
:root {
  --bg: #080808;
  --surface: #111111;
  --border: rgba(255, 255, 255, 0.06);
  --accent: #F4FF00;              /* Amarillo Score */
  --text: #FFFFFF;
  --text-muted: #AAAAAA;

  /* Colores de producto — usar solo los aplicables al cliente */
  --gorilla:        #8B00FF;       /* Morado neón */
  --original:       #FFD700;       /* Dorado */
  --zero:           #1E90FF;       /* Azul */
  --radical-white:  #00CED1;       /* Turquesa */
  --bubblegum:      #FF1493;       /* Magenta */
}
```

### 5.2. Tipografía

- **Display/titulares:** `'Bebas Neue', cursive`, clase `.font-display`, `letter-spacing: 0.02em`, `line-height: 1`.
- **Cuerpo:** `'Inter', sans-serif`, pesos 300/400/500/600/700, `line-height: 1.5`.
- Todos los tamaños con `clamp(min, preferred, max)` para fluidez:
  - Título de slide: `clamp(36px, 5vw, 60px)` (o 48–80 para hero/section-intro).
  - Subtítulo: `clamp(14px, 1.6vw, 18px)`.
  - Número gigante de KPI: `clamp(80px, 10vw, 140px)`.
  - Body muted: `clamp(14px, 1.6vw, 18px)`.

### 5.3. Layout de slide

```css
#presentation { position: relative; width: 100vw; height: 100vh; overflow: hidden; }

.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 60px 80px;
  opacity: 0; visibility: hidden; pointer-events: none; z-index: 0;
}
.slide.active { opacity: 1; visibility: visible; pointer-events: auto; z-index: 1; }
```

### 5.4. Responsive

Breakpoint único: `@media (max-width: 768px)`. Ajustes típicos:
- Padding de slide baja a `48px 20px 70px`.
- Grids de 3–4 columnas colapsan a 1–2.
- Layouts split pasan a stack vertical.
- Tamaños tipográficos reducen (los clamps absorben parte del cambio).

### 5.5. Utility classes

- `.accent` → `color: var(--accent)` (amarillo).
- `.accent-radical` → `color: var(--radical-white)` (turquesa).
- `.accent-bubblegum` → `color: var(--bubblegum)` (magenta).
- *(Extender con `.accent-gorilla`, `.accent-zero`, etc. según productos aplicables.)*
- `.muted` → `color: var(--text-muted)`.
- `.font-display`, `.font-body` → cambian la fuente.
- `.sr-only` → oculta visualmente pero accesible para screen readers.

### 5.6. `.slide-source` (fuente de datos al pie)

Usado en slides con tablas/charts/datos externos. Se posiciona absoluto en la esquina inferior derecha, muy chico y sutil.

```css
.slide-source {
  position: absolute;
  bottom: 24px; right: 90px;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.6;
}
@media (max-width: 768px) {
  .slide-source { right: 20px; bottom: 58px; }
}
```

---

## 6. Patrón de animación (`brands/score-*/js/main.js`)

### 6.1. Estructura del archivo

```js
(function () {
  'use strict';

  // Utilitarios compartidos (ver §9)
  function animateCounter(...) { ... }
  function animateSectionIntro(slideId) { ... }
  function resetItemStage(slideId) { ... }
  function stepItemStage(slideId, step) { ... }
  function animateMarketShareSlide(slideId, ...) { ... }

  const animations = {};

  animations[0] = { enterSlide() { /* Hero */ } };
  animations[1] = { enterSlide() { /* Objetivo */ } };
  // ... uno por slide

  document.addEventListener('DOMContentLoaded', () => {
    SlideEngine.init({
      onEnterSlide(i) { animations[i]?.enterSlide?.(); },
      onEnterStep(i, s) { animations[i]?.enterStep?.(s); },
      onLeaveSlide(i) { animations[i]?.leaveSlide?.(); },
    });
  });
})();
```

### 6.2. Reglas de oro

1. **Siempre iniciar `enterSlide()` con `gsap.set([...], { opacity: 0 })`** para todos los elementos que se van a animar. Evita el flash de un frame al volver a la slide.
2. **Usar selectores scopeados por slide:** `#slide-6 .cadenas-row` en vez de solo `.cadenas-row`. Previene que un `gsap.set` afecte elementos con la misma clase en otras slides (ver §18.1).
3. **Preferir IDs para elementos principales** (`#hero-title`, `#cagr-value`, etc.) cuando hay uno solo por slide. Clases para repeticiones dentro de la misma slide.
4. **Usar `animateCounter` para números** que cuentan desde 0 al valor final. Leer `data-count` y `data-decimal` del DOM.
5. **Reset de `currentStep`** ya lo maneja el engine al cambiar de slide — no hace falta resetear classes manualmente en transiciones, pero SÍ al volver a la misma slide (en `enterSlide()` limpiar las classes `kpi-active`, `kpi-past`, `item-active`, etc.).
6. **Cleanup en `leaveSlide()`** si la animación usa `setInterval` o event listeners externos (ver §7.12 variant con contador).
7. **No mezclar CSS `transform` con GSAP sobre el mismo elemento.** Si GSAP anima `scale` o `x`, el CSS no debe declarar un `transform` estático sobre ese elemento.

### 6.3. Timelines y easings

- **Siempre usar `gsap.timeline()`** en vez de encadenar `setTimeout`s.
- Offsets negativos (`'-=0.3'`) para solapar parcialmente animaciones.
- Easings estándar:
  - `power2.out` → aparecer.
  - `power2.in` → desaparecer.
  - `power3.out` → llegada con más peso (latas que caen, logo de cierre).
  - `power2.inOut` → clip-path scan (títulos de section intro).

### 6.4. From states recurrentes

- Texto: `{ opacity: 0, y: 30 }` (o `20`, `15` para cascadas).
- Logo/imagen zoom-in: `{ opacity: 0, scale: 1.2–1.5 }`.
- Latas/productos: `{ opacity: 0, y: 80, rotation: ±5 }`.
- Barras (scaleY / scaleX): `{ scaleY: 0, transformOrigin: 'bottom center' }` o `scaleX: 0` con `'left center'`.
- Clip-path scan: `{ clipPath: 'inset(0 100% 0 0)' }` → `'inset(0 0% 0 0)'`.

---

## 7. Catálogo de patrones de slide

### 7.1. HERO (portada)

**Propósito:** presentar la marca Score, el año y el partner/cliente.

**HTML:**
```html
<section class="slide slide-hero" id="slide-1">
  <div class="hero-bg" style="background-image: url('../../assets/Etiquetas Hero/[etiqueta].jpg')"></div>
  <div class="hero-content">
    <img src="../../assets/Logos e Isotipos/Logo SCORE Extendido (sin fondo).png"
         alt="Score Energy Drink" class="hero-logo" id="hero-logo">
    <h1 class="hero-year font-display" id="hero-year">[AÑO]</h1>
    <p class="hero-subtitle" id="hero-subtitle">[Contexto / bajada corta]</p>
    <div class="hero-partner" id="hero-partner">
      <span class="partner-logo-text">[NOMBRE PARTNER]</span>
    </div>
  </div>
</section>
```

**CSS clave:**
- `.slide-hero { padding: 0; overflow: hidden; }`
- `.hero-bg` → fondo difuminado, `position: absolute; inset: -40px; background-size: cover; opacity: 0.08; filter: blur(60px) saturate(1.4);`.
- `.hero-logo` → `width: min(420px, 60vw)`, drop-shadow amarillo.
- `.hero-year` → `clamp(80px, 12vw, 160px)`, color `--accent`, text-shadow amarillo.
- `.hero-subtitle` → uppercase, `letter-spacing: 0.25em`, `--text-muted`.
- `.partner-logo-text` → uppercase, `letter-spacing: 0.25em`, 14px, peso 600, `--text-muted`.

**Animación:**
1. Fade in de `.hero-bg` (0.8s).
2. Logo entra con `scale: 1.5 → 1` + pulso de glow amarillo (yoyo).
3. Año, subtítulo y partner en cascada con `y: 30/20/15 → 0`, offsets negativos `-=0.8`, `-=0.4`, `-=0.3`.

---

### 7.2. RESUMEN SCORE 2025 — SLIDE TRANSVERSAL ⭐

**Obligatoria en toda presentación Score.** Muestra los cuatro KPIs duros de Score Chile 2025.

**Datos fijos (no tocar):**
- `113M` latas vendidas en Chile 2025.
- `3,6` latas vendidas por segundo.
- `#1` líderes en la categoría en unidades vendidas.
- `+15%` crecimiento vs año anterior.
- Subtítulo: "Score crece un 15% respecto al año anterior".
- Título: "Resumen Score 2025".

**HTML completo:**
```html
<section class="slide slide-kpis" id="slide-3" data-steps="4">
  <div class="kpi-bg-img">
    <img src="../../assets/Imagenes Productos/[lata hero].png" alt="" class="kpi-bg-can">
  </div>
  <h2 class="slide-title font-display" id="kpi-title">Resumen Score 2025</h2>
  <p class="slide-subtitle" id="kpi-subtitle">Score crece un 15% respecto al año anterior</p>
  <div class="kpi-stage" id="kpi-stage">

    <div class="kpi-card" data-step="1">
      <span class="kpi-value font-display" data-count="113">0</span>
      <span class="kpi-suffix font-display">M.</span>
      <p class="kpi-label">Latas vendidas en Chile 2025</p>
    </div>

    <div class="kpi-card" data-step="2">
      <span class="kpi-value font-display" data-count="3.6" data-decimal="1">0</span>
      <p class="kpi-label">Latas vendidas por segundo</p>
    </div>

    <div class="kpi-card" data-step="3">
      <span class="kpi-value font-display kpi-rank">#1</span>
      <p class="kpi-label">Líderes en la categoría en unidades vendidas</p>
    </div>

    <div class="kpi-card" data-step="4">
      <div class="kpi-value-row">
        <span class="kpi-prefix font-display">+</span>
        <span class="kpi-value font-display" data-count="15">0</span>
        <span class="kpi-suffix font-display">%</span>
      </div>
      <p class="kpi-label">Crecimiento vs año anterior</p>
    </div>

  </div>
</section>
```

**CSS clave (con fix de altura constante):**
```css
.slide-kpis {
  justify-content: center;
  gap: 32px;
  overflow: hidden;
}

.kpi-stage {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%; max-width: 1100px;
  align-items: center;
}

/* FIX v2: min-height constante impide que el stage colapse entre pasos */
.kpi-card {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  min-height: clamp(240px, 30vh, 320px);
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.kpi-value {
  font-size: clamp(80px, 10vw, 140px);
  color: var(--accent); line-height: 1;
  text-shadow: 0 0 40px rgba(244,255,0,0.25);
  transition: font-size 0.4s ease, text-shadow 0.4s ease;
}
.kpi-suffix, .kpi-prefix {
  font-size: clamp(50px, 6vw, 80px);
  color: var(--accent); line-height: 1;
  transition: font-size 0.4s ease;
}
.kpi-value-row { display: flex; align-items: baseline; gap: 0; }

.kpi-label {
  font-size: clamp(13px, 1.4vw, 16px);
  color: var(--text-muted);
  margin-top: 8px; max-width: 220px; line-height: 1.4;
  transition: font-size 0.4s ease, max-width 0.4s ease;
}

/* Estados */
.kpi-card.kpi-active .kpi-value,
.kpi-card.kpi-active .kpi-suffix,
.kpi-card.kpi-active .kpi-prefix { font-size: clamp(80px, 10vw, 140px); }

.kpi-card.kpi-past .kpi-value   { font-size: clamp(36px, 4vw, 52px); text-shadow: none; }
.kpi-card.kpi-past .kpi-suffix,
.kpi-card.kpi-past .kpi-prefix  { font-size: clamp(24px, 3vw, 36px); }
.kpi-card.kpi-past .kpi-label   { font-size: 12px; max-width: 160px; }

@media (max-width: 768px) {
  .kpi-stage { grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .kpi-bg-img { display: none; }
}
```

**⚠️ Sin `min-height` en `.kpi-card`**, el stage colapsa de alto cada vez que la card más alta (la del sufijo "M.") pasa a `kpi-past` — las labels saltan verticalmente entre pasos. Con `min-height` todas las cards reservan el mismo alto y el centro visual queda fijo.

**Animación (`main.js`):**
```js
animations[2] = {
  enterSlide() {
    const cards = document.querySelectorAll('#slide-3 .kpi-card');
    cards.forEach(c => {
      gsap.set(c, { opacity: 0, y: 30 });
      c.classList.remove('kpi-active', 'kpi-past');
      const valEl = c.querySelector('.kpi-value:not(.kpi-rank)');
      if (valEl) valEl.textContent = '0';
    });
    gsap.fromTo('#kpi-title',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('#kpi-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
  },
  enterStep(step) {
    const cards = document.querySelectorAll('#slide-3 .kpi-card');
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
    gsap.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

    const valEl = card.querySelector('.kpi-value:not(.kpi-rank)');
    if (!valEl) return;
    const countTo = parseFloat(valEl.dataset.count);
    const decimal = valEl.dataset.decimal ? parseInt(valEl.dataset.decimal) : 0;
    if (countTo && !isNaN(countTo)) animateCounter(valEl, countTo, 1.2, decimal);
  }
};
```

---

### 7.3. SECTION INTRO (con numbered chip)

**Propósito:** marcar el comienzo de una sección del deck. Solo un título gigante centrado, opcionalmente con un número chico encima y líneas decorativas.

**HTML:**
```html
<section class="slide slide-section-intro" id="slide-N">
  <span class="section-number font-display">02</span>
  <h2 class="section-title font-display">[Título corto]</h2>
  <p class="section-subtitle">[Bajada]</p>
</section>
```

**CSS:**
```css
.slide-section-intro {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.section-number {
  font-size: clamp(16px, 1.8vw, 22px);
  color: var(--accent);
  letter-spacing: 0.25em;
  margin-bottom: 24px;
  position: relative;
  padding: 0 18px;
}
.section-number::before,
.section-number::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px; height: 1px;
  background: rgba(244,255,0,0.4);
}
.section-number::before { right: 100%; }
.section-number::after  { left: 100%; }

.section-title {
  font-size: clamp(60px, 8vw, 110px);
  color: var(--accent);
  text-shadow: 0 0 60px rgba(244,255,0,0.3);
  line-height: 1;
}

.section-subtitle {
  font-size: clamp(18px, 2.5vw, 26px);
  color: var(--text-muted);
  margin-top: 16px;
  max-width: 720px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .section-number::before,
  .section-number::after { width: 24px; }
}
```

**Animación:** usar el helper `animateSectionIntro(slideId)` (ver §9.2).

```js
animations[3] = { enterSlide() { animateSectionIntro('slide-4'); } };
```

---

### 7.4. LISTA NUMERADA REVEAL (item-stage)

**Propósito:** 3–6 ítems numerados (01, 02, 03…) que aparecen uno por uno con sub-steps.

**HTML:**
```html
<section class="slide slide-claves" id="slide-N" data-steps="4">
  <h2 class="slide-title font-display" id="claves-title">[Título]</h2>
  <p class="slide-subtitle" id="claves-subtitle">[Subtítulo]</p>

  <div class="item-stage">
    <div class="item-card" data-step="1">
      <span class="item-num font-display">01</span>
      <div class="item-body">
        <h3 class="item-title">[Título corto]</h3>
        <p class="item-desc">[Descripción 1-2 líneas]</p>
      </div>
    </div>
    <!-- 02, 03, 04, ... -->
  </div>
</section>
```

**CSS clave (con fix de posición de título):**
```css
/* FIX v2: flex-start + padding-top ancla el título, no salta al revelar */
.slide-claves,
.slide-oportunidades {
  justify-content: flex-start;
  padding-top: 90px;
}

.item-stage {
  display: flex; flex-direction: column;
  gap: 10px;
  width: 100%; max-width: 820px;
  margin-top: 32px;
}

.item-card {
  display: flex; align-items: center;
  gap: 24px;
  opacity: 0;
  padding: 16px 24px;
  border-radius: 12px;
  border-left: 3px solid transparent;
  transition: background 0.4s ease, border-color 0.4s ease, padding 0.4s ease, opacity 0.4s ease;
}

.item-card.item-active {
  background: rgba(244,255,0,0.04);
  border-left-color: var(--accent);
}
.item-card.item-past {
  opacity: 0.5;
  padding: 8px 24px;
}
.item-card.item-past .item-desc { display: none; }

.item-num {
  font-size: clamp(48px, 6vw, 72px);
  color: var(--accent);
  opacity: 0.55;
  line-height: 1;
  min-width: 90px;
  transition: font-size 0.4s ease, opacity 0.4s ease;
}
.item-card.item-active .item-num { opacity: 1; }
.item-card.item-past .item-num {
  font-size: clamp(28px, 3.2vw, 40px);
  min-width: 56px;
}

.item-body { flex: 1; }

.item-title {
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  transition: font-size 0.4s ease;
}
.item-card.item-past .item-title {
  font-size: clamp(14px, 1.6vw, 18px);
  font-weight: 500;
  color: var(--text-muted);
}

.item-desc {
  font-size: clamp(14px, 1.6vw, 18px);
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .item-stage { gap: 8px; margin-top: 22px; }
  .item-card  { gap: 14px; padding: 12px 16px; }
  .item-num   { min-width: 60px; }
}
```

**⚠️ Por qué `flex-start` en vez de `center`:** el layout por defecto `.slide` centra verticalmente. Con `center` y cards con `opacity: 0` que toman layout space, el título se posiciona según el alto total del stack — al revelar cards (que no cambian layout, solo clases), el título a veces salta. `flex-start` + `padding-top: 90px` fija la posición del título independiente del reveal.

**Animación:** usar los helpers `resetItemStage` + `stepItemStage` (ver §9.3).

```js
animations[4] = {
  enterSlide() {
    resetItemStage('slide-5');
    gsap.fromTo('#claves-title',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('#claves-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
  },
  enterStep(step) { stepItemStage('slide-5', step); }
};
```

---

### 7.5. SPLIT LAYOUT: LISTA + IMAGEN REACTIVA

Dos columnas: lista numerada reveal a la izquierda, imagen que cambia según el paso activo a la derecha. Útil para mostrar conceptos con prueba visual en paralelo.

**HTML (esqueleto):**
```html
<section class="slide slide-split" id="slide-N" data-steps="5">
  <h2 class="slide-title font-display">[Título]</h2>
  <div class="split-layout">
    <div class="split-list">
      <div class="split-card" data-step="1">…</div>
      <!-- ... -->
    </div>
    <div class="split-visual">
      <div class="split-img" id="split-img-1">…</div>
      <div class="split-img" id="split-img-2">…</div>
      <!-- ... -->
    </div>
  </div>
</section>
```

**CSS clave:**
- `.split-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; max-width: 1200px; }`.
- `.split-visual { position: relative; min-height: 380px; height: 50vh; max-height: 500px; overflow: hidden; }`.
- `.split-img { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; }`.
- La imagen activa: `.split-img-active { opacity: 1; pointer-events: auto; z-index: 2; }`.
- Móvil: grid de 1 columna, visual con altura más chica.

**Animación:**
- Lista: igual que §7.4.
- Imagen: al cambiar step, `gsap.killTweensOf(img)` + `opacity: 0` a todas, `fromTo({ opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.15 })` a la activa.

---

### 7.6. FOTO PROTAGONISTA

Una fotografía grande con título + subtítulo y, opcionalmente, elementos de data debajo (barra de distribución, leyenda, etc.).

**HTML:**
```html
<section class="slide slide-foto" id="slide-N">
  <h2 class="slide-title font-display" id="foto-title">[Título]</h2>
  <p class="slide-subtitle" id="foto-subtitle">[Subtítulo]</p>
  <div class="foto-wrap" id="foto-img">
    <img src="[ruta/foto.jpg]" alt="[alt]">
  </div>
</section>
```

**CSS:**
- `.foto-wrap { max-width: 600px; width: 100%; opacity: 0; }`.
- `.foto-wrap img { width: 100%; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06); }`.

**Animación:** título y subtítulo con `y: 30/20 → 0`, imagen con `scale: 0.95 → 1` en 0.6s.

**Variante stacked bar:** agregar `.dist-bar` (flex horizontal de segmentos %) debajo de la foto. Animar con `scaleX: 0 → 1, transformOrigin: 'left center'`.

---

### 7.7. TABLA DE DATOS CON HIGHLIGHT + MINI-BARS ⭐ NUEVO

**Propósito:** tabla comparativa con una fila destacada (el cliente/partner), columnas de ventas/delta/participación, y mini-bars horizontales en la última columna para dar lectura visual del share.

**HTML:**
```html
<section class="slide slide-cadenas" id="slide-N">
  <h2 class="slide-title font-display" id="cadenas-title">[Título]</h2>
  <p class="slide-subtitle" id="cadenas-subtitle">[Subtítulo]</p>

  <div class="cadenas-wrap">
    <div class="cadenas-header">
      <span class="cadenas-col-name">[Col 1]</span>
      <span class="cadenas-col-val">[Col 2]</span>
      <span class="cadenas-col-delta">[Col 3]</span>
      <span class="cadenas-col-ms">[Col 4]</span>
    </div>

    <div class="cadenas-row">
      <span class="cadenas-name">[Ítem 1]</span>
      <span class="cadenas-val">[valor]</span>
      <span class="cadenas-delta cadenas-delta-pos">+X%</span>
      <div class="cadenas-ms-col">
        <div class="cadenas-bar"><div class="cadenas-bar-fill" style="width: NN%"></div></div>
        <span class="cadenas-ms-num">NN%</span>
      </div>
    </div>

    <div class="cadenas-row cadenas-highlight">
      <!-- la fila destacada (el cliente) -->
    </div>

    <!-- más filas... -->

    <div class="cadenas-row cadenas-total">
      <!-- totales, estilo separador -->
    </div>
  </div>

  <div class="cadenas-insight" id="cadenas-insight">
    <span class="cadenas-insight-eyebrow">Insight</span>
    <p>[Lectura del dato clave de la tabla, una frase corta]</p>
  </div>

  <p class="slide-source">Fuente: [Fuente]</p>
</section>
```

**CSS clave:**
```css
.slide-cadenas {
  justify-content: flex-start;
  padding-top: 80px;
}

.cadenas-wrap {
  width: 100%; max-width: 1080px;
  margin-top: 28px;
  display: flex; flex-direction: column; gap: 2px;
}

.cadenas-header,
.cadenas-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 1.3fr;
  align-items: center;
  gap: 24px;
  padding: 14px 22px;
}

.cadenas-header {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px; padding-top: 0;
}
.cadenas-col-val,
.cadenas-col-delta,
.cadenas-col-ms { text-align: right; }
.cadenas-col-ms { text-align: left; padding-left: 4px; }

.cadenas-row {
  background: rgba(255,255,255,0.015);
  border-left: 2px solid transparent;
  border-radius: 4px;
  transition: background 0.3s ease;
}
.cadenas-row:hover { background: rgba(255,255,255,0.035); }

.cadenas-highlight {
  background: rgba(244,255,0,0.06) !important;
  border-left-color: var(--accent);
}

.cadenas-total {
  margin-top: 6px; padding-top: 16px;
  border-top: 1px solid var(--border);
  background: transparent;
  font-family: 'Bebas Neue', cursive;
  letter-spacing: 0.04em;
}

.cadenas-name {
  font-size: clamp(14px, 1.7vw, 18px);
  font-weight: 600; color: var(--text);
}
.cadenas-highlight .cadenas-name { color: var(--accent); }

.cadenas-val {
  font-size: clamp(14px, 1.6vw, 17px);
  color: var(--text); font-variant-numeric: tabular-nums;
  text-align: right;
}

.cadenas-delta {
  font-size: clamp(13px, 1.5vw, 16px);
  font-weight: 600; font-variant-numeric: tabular-nums;
  text-align: right;
}
.cadenas-delta-pos { color: #6ed78a; }
.cadenas-delta-neg { color: #e07a6a; }

.cadenas-total .cadenas-name,
.cadenas-total .cadenas-val,
.cadenas-total .cadenas-delta,
.cadenas-total .cadenas-ms-num {
  font-size: clamp(18px, 2vw, 22px);
  color: var(--text);
}
.cadenas-total .cadenas-delta-pos { color: #6ed78a; }

/* Mini-bar horizontal de participación */
.cadenas-ms-col { display: flex; align-items: center; gap: 10px; }

.cadenas-bar {
  flex: 1; height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
}
.cadenas-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(244,255,0,0.5), var(--accent));
  border-radius: 3px;
}
.cadenas-highlight .cadenas-bar-fill {
  box-shadow: 0 0 16px rgba(244,255,0,0.5);
}

.cadenas-ms-num {
  font-family: 'Bebas Neue', cursive;
  font-size: clamp(14px, 1.5vw, 17px);
  color: var(--text);
  min-width: 38px; text-align: right;
}

/* Callout de insight */
.cadenas-insight {
  width: 100%; max-width: 1080px;
  margin-top: 24px;
  padding: 16px 22px;
  border-left: 2px solid var(--accent);
  background: rgba(244,255,0,0.04);
  border-radius: 0 8px 8px 0;
}
.cadenas-insight-eyebrow {
  display: block; font-size: 11px;
  font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--accent);
  margin-bottom: 6px;
}
.cadenas-insight p {
  font-size: clamp(14px, 1.55vw, 17px);
  color: var(--text); line-height: 1.45;
}

@media (max-width: 768px) {
  .slide-cadenas { padding-top: 56px; }
  .cadenas-header,
  .cadenas-row   { grid-template-columns: 1.3fr 1fr 0.9fr; gap: 10px; padding: 10px 12px; font-size: 12px; }
  .cadenas-col-ms,
  .cadenas-ms-col { display: none; }
  .cadenas-insight { padding: 12px 14px; }
}
```

**Animación:**
```js
animations[i] = {
  enterSlide() {
    const rows = document.querySelectorAll('#slide-N .cadenas-row');
    const bars = document.querySelectorAll('#slide-N .cadenas-bar-fill');

    gsap.set(['#cadenas-title', '#cadenas-subtitle', '.cadenas-header', '#cadenas-insight', '#slide-N .slide-source'], { opacity: 0 });
    gsap.set(rows, { opacity: 0, x: -20 });
    gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });

    const tl = gsap.timeline();
    tl.fromTo('#cadenas-title',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    tl.fromTo('#cadenas-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
    tl.fromTo('.cadenas-header',   { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    tl.to(rows,  { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out', stagger: 0.14 }, '-=0.1');
    tl.to(bars,  { scaleX: 1, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.9');
    tl.fromTo('#cadenas-insight',  { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
    tl.fromTo('#slide-N .slide-source', { opacity: 0 }, { opacity: 0.6, duration: 0.3 }, '-=0.2');
  }
};
```

---

### 7.8. MARKET SHARE: BARRAS MENSUALES + PROYECCIÓN + 3 CARDS DE CLAVES ⭐ NUEVO

**Propósito:** mostrar evolución mensual de participación como bar chart vertical + un bloque grande de proyección (`+NNN%`) con animación de contador + 3 cards horizontales con las claves estratégicas.

**HTML:**
```html
<section class="slide slide-ms slide-ms-pesos" id="slide-N">
  <h2 class="slide-title font-display" id="ms-pesos-title">[Título]</h2>
  <p class="slide-subtitle" id="ms-pesos-subtitle">[Subtítulo]</p>

  <div class="ms-layout">

    <!-- Columna izquierda: evolución mensual -->
    <div class="ms-evolution">
      <span class="ms-eyebrow">[Label arriba]</span>
      <div class="ms-bars">
        <div class="ms-bar" data-ms="3"><div class="ms-bar-fill"></div>
          <span class="ms-bar-value font-display">3%</span>
          <span class="ms-bar-month">Ene</span>
          <span class="ms-bar-amount">[valor]</span>
        </div>
        <!-- Feb, Mar... -->
        <div class="ms-bar ms-bar-ytd" data-ms="4"><div class="ms-bar-fill"></div>
          <span class="ms-bar-value font-display">4%</span>
          <span class="ms-bar-month">YTD</span>
          <span class="ms-bar-amount">[valor]</span>
        </div>
      </div>
    </div>

    <!-- Columna derecha: proyección -->
    <div class="ms-projection" id="ms-pesos-proj">
      <span class="ms-eyebrow">Proyección [año]</span>
      <div class="ms-proj-value-row">
        <span class="ms-proj-prefix font-display">+</span>
        <span class="ms-proj-value font-display" id="ms-pesos-value" data-count="198">0</span>
        <span class="ms-proj-suffix font-display">%</span>
      </div>
      <p class="ms-proj-amount"><span class="accent">[monto proyectado]</span> · vs año anterior.</p>
    </div>

  </div>

  <!-- 3 cards de claves debajo -->
  <div class="ms-claves-grid">
    <div class="ms-clave-card">
      <span class="ms-clave-num font-display">01</span>
      <div class="ms-clave-body">
        <h3 class="ms-clave-title">[Clave 1]</h3>
        <p class="ms-clave-desc">[Descripción 1-2 líneas]</p>
      </div>
    </div>
    <!-- 02, 03 (o .ms-clave-highlight en la destacada) -->
  </div>

  <p class="slide-source">Fuente: [Fuente]</p>
</section>
```

**Variante con solo 2 claves:** agregar `.ms-claves-grid-2` al grid → pasa a 2 columnas centradas.

**CSS clave:**
```css
.slide-ms {
  justify-content: flex-start;
  padding-top: 64px;
}

.ms-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(40px, 6vw, 80px);
  width: 100%; max-width: 1200px;
  margin-top: 24px;
  align-items: center;
}

.ms-eyebrow {
  display: block;
  font-size: 12px; font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

/* Barras mensuales — scaleY desde 0 */
.ms-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  align-items: end;
  height: 280px;
  padding-top: 20px;
}
.ms-bar {
  position: relative;
  display: flex; flex-direction: column;
  justify-content: flex-end; align-items: center;
  height: 100%; text-align: center;
}
.ms-bar-fill {
  width: 100%;
  background: linear-gradient(to top, rgba(244,255,0,0.7) 0%, var(--accent) 100%);
  border-radius: 4px 4px 0 0;
  height: 0%;
  box-shadow: 0 0 24px rgba(244,255,0,0.25);
  transform-origin: bottom;
}
.ms-bar-ytd .ms-bar-fill {
  background: linear-gradient(to top, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.5) 100%);
  box-shadow: none;
}
.ms-bar-value {
  position: absolute; top: -30px;
  font-size: clamp(24px, 2.6vw, 32px);
  color: var(--accent); line-height: 1;
}
.ms-bar-ytd .ms-bar-value { color: var(--text); }
.ms-bar-month {
  font-size: 12px; font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.18em; text-transform: uppercase;
  margin-top: 8px;
}
.ms-bar-ytd .ms-bar-month { color: var(--text); }
.ms-bar-amount {
  font-size: 11px; color: var(--text-muted);
  margin-top: 2px; opacity: 0.8;
}

/* Proyección grande */
.ms-projection { display: flex; flex-direction: column; align-items: flex-start; }

.ms-proj-value-row {
  display: flex; align-items: baseline; gap: 0; line-height: 1;
}
.ms-proj-prefix,
.ms-proj-suffix {
  font-size: clamp(40px, 5vw, 70px);
  color: var(--accent); line-height: 1;
}
.ms-proj-value {
  font-size: clamp(80px, 10vw, 130px);
  color: var(--accent); line-height: 0.95;
  text-shadow: 0 0 60px rgba(244,255,0,0.35);
}
.ms-proj-amount {
  font-size: clamp(14px, 1.5vw, 17px);
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 12px;
}

/* 3 cards de claves */
.ms-claves-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  width: 100%; max-width: 1200px;
  margin-top: 28px;
}
.ms-claves-grid.ms-claves-grid-2 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 860px;
  margin-left: auto; margin-right: auto;
}
.ms-clave-card {
  display: flex; gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  background: rgba(255,255,255,0.025);
  border-left: 2px solid var(--border);
  border-radius: 0 8px 8px 0;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.ms-clave-card:hover,
.ms-clave-card.ms-clave-highlight {
  border-left-color: var(--accent);
  background: rgba(244,255,0,0.06);
}
.ms-clave-num {
  font-size: clamp(26px, 2.8vw, 34px);
  color: var(--accent); opacity: 0.75;
  line-height: 1; min-width: 36px;
}
.ms-clave-highlight .ms-clave-num { opacity: 1; }
.ms-clave-body { flex: 1; }
.ms-clave-title {
  font-size: clamp(15px, 1.6vw, 19px);
  font-weight: 700; color: var(--text);
  line-height: 1.2; margin-bottom: 4px;
}
.ms-clave-desc {
  font-size: clamp(12px, 1.3vw, 14px);
  color: var(--text-muted); line-height: 1.5;
}

@media (max-width: 768px) {
  .slide-ms { justify-content: center; padding-top: 56px; }
  .ms-layout      { grid-template-columns: 1fr; gap: 40px; }
  .ms-bars        { height: 200px; gap: 10px; }
  .ms-bar-value   { top: -24px; }
  .ms-claves-grid { grid-template-columns: 1fr; gap: 8px; margin-top: 20px; }
}
```

**Animación:** usar el helper `animateMarketShareSlide` (ver §9.4).

```js
animations[i] = {
  enterSlide() {
    animateMarketShareSlide(
      'slide-N',           // slide ID
      'ms-pesos-title',    // title ID
      'ms-pesos-subtitle', // subtitle ID
      'ms-pesos-proj',     // projection container ID
      'ms-pesos-value',    // big number element ID
      6                    // max MS% en el trimestre (para escalar barras)
    );
  }
};
```

---

### 7.9. WATERFALL / CASCADE CHART ⭐ NUEVO

**Propósito:** mostrar un total que se descompone en varios motivos que se van apilando (waterfall). Clásico para venta perdida operacional, descomposición de costos, análisis de varianza.

**HTML:**
```html
<section class="slide slide-vp" id="slide-N">
  <h2 class="slide-title font-display" id="vp-title">[Título]</h2>
  <p class="slide-subtitle" id="vp-subtitle">[Subtítulo]</p>

  <div class="vp-layout">

    <!-- Izquierda: stat gigante -->
    <div class="vp-stat" id="vp-stat">
      <span class="vp-eyebrow">[Eyebrow]</span>
      <div class="vp-main-row">
        <span class="vp-main-value font-display" id="vp-main-value" data-count="20.8" data-decimal="1">0,0</span>
        <span class="vp-main-suffix font-display">%</span>
      </div>
      <p class="vp-main-amount">
        <span class="accent">[monto total]</span> [descripción del total].
      </p>
      <p class="vp-main-hint muted">[hint opcional al pie del stat]</p>
    </div>

    <!-- Derecha: cascada -->
    <div class="cascade-chart-wrap">
      <span class="vp-eyebrow">[Label de la cascada]</span>
      <div class="cascade-chart">

        <div class="cascade-col">
          <div class="cascade-col-inner">
            <div class="cascade-bar" style="bottom: 0%; height: 4.46%;">
              <span class="cascade-value">[monto]</span>
            </div>
          </div>
          <span class="cascade-col-label"><strong class="font-display">0,9%</strong>[Motivo 1]</span>
        </div>

        <div class="cascade-col">
          <div class="cascade-col-inner">
            <div class="cascade-bar" style="bottom: 4.46%; height: 30.39%;">
              <span class="cascade-value">[monto]</span>
            </div>
          </div>
          <span class="cascade-col-label"><strong class="font-display">6,3%</strong>[Motivo 2]</span>
        </div>

        <!-- ... más motivos apilándose ... -->

        <!-- Columna total (arranca de 0, altura 100%) -->
        <div class="cascade-col cascade-col-total">
          <div class="cascade-col-inner">
            <div class="cascade-bar cascade-bar-total" style="bottom: 0%; height: 100%;">
              <span class="cascade-value cascade-value-total">[total]</span>
            </div>
          </div>
          <span class="cascade-col-label"><strong class="font-display">20,8%</strong>Total</span>
        </div>

      </div>
    </div>
  </div>

  <div class="vp-legend" id="vp-legend">
    <p>[Lectura / llamada a la acción sobre el total]</p>
  </div>

  <p class="slide-source">Fuente: [Fuente]</p>
</section>
```

**Cálculo de los `bottom` y `height`:** cada barra parte donde terminó la anterior (acumulado). Convertir los valores absolutos a porcentajes del total. Ejemplo con total $15.171.261:

| Motivo | Valor | % del total | `bottom` | `height` |
|---|---:|---:|---:|---:|
| Motivo A | $676.695 | 4,46% | 0% | 4,46% |
| Motivo B | $4.611.220 | 30,39% | 4,46% | 30,39% |
| Motivo C | $3.269.764 | 21,55% | 34,85% | 21,55% |
| Motivo D | $1.539.440 | 10,15% | 56,40% | 10,15% |
| Motivo E | $5.074.142 | 33,44% | 66,55% | 33,44% |
| **Total** | $15.171.261 | 100% | 0% | 100% |

**CSS clave:**
```css
.slide-vp {
  justify-content: flex-start;
  padding-top: 64px;
}

.vp-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.4fr;
  gap: clamp(40px, 5vw, 70px);
  width: 100%; max-width: 1220px;
  margin-top: 24px; align-items: center;
}

.vp-stat { display: flex; flex-direction: column; }

.vp-eyebrow {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.24em; text-transform: uppercase;
  margin-bottom: 14px;
}

.vp-main-row { display: flex; align-items: baseline; }
.vp-main-value {
  font-size: clamp(90px, 11vw, 150px);
  color: var(--accent); line-height: 0.95;
  text-shadow: 0 0 60px rgba(244,255,0,0.3);
}
.vp-main-suffix {
  font-size: clamp(44px, 5.5vw, 74px);
  color: var(--accent); line-height: 1;
}
.vp-main-amount {
  font-size: clamp(14px, 1.5vw, 17px);
  color: var(--text-muted);
  line-height: 1.5; margin-top: 14px;
  max-width: 320px;
}
.vp-main-hint {
  font-size: clamp(12px, 1.3vw, 14px);
  color: var(--text-muted); line-height: 1.5;
  margin-top: 10px; max-width: 320px;
  opacity: 0.75;
}

/* Cascade chart */
.cascade-chart-wrap { display: flex; flex-direction: column; width: 100%; }

.cascade-chart {
  display: grid;
  grid-template-columns: repeat(N, 1fr);  /* N = cantidad de columnas (motivos + total) */
  gap: 10px;
  height: 280px;
  margin-top: 8px;
  padding-top: 26px; padding-bottom: 0;
  border-bottom: 1px solid var(--border);
}

.cascade-col {
  display: flex; flex-direction: column;
  position: relative; height: 100%;
}
.cascade-col-inner {
  flex: 1; width: 100%; position: relative;
}
.cascade-bar {
  position: absolute;
  left: 10%; width: 80%;
  background: linear-gradient(to top, rgba(244,255,0,0.55), rgba(244,255,0,0.95));
  border-radius: 3px 3px 0 0;
  box-shadow: 0 0 14px rgba(244,255,0,0.25);
}
.cascade-bar-total {
  background: linear-gradient(to top, rgba(224,122,106,0.55), rgba(224,122,106,0.95));
  box-shadow: 0 0 14px rgba(224,122,106,0.3);
}

.cascade-value {
  position: absolute; top: -20px;
  left: 50%; transform: translateX(-50%);
  font-size: 10.5px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap; opacity: 0.9;
}
.cascade-value-total { font-weight: 600; }

.cascade-col-label {
  font-size: 10.5px;
  color: var(--text-muted); text-align: center;
  margin-top: 10px;
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  line-height: 1.25;
}
.cascade-col-label strong {
  font-size: clamp(16px, 1.8vw, 20px);
  color: var(--accent);
  font-weight: 400;
  letter-spacing: 0.02em;
}
.cascade-col-total .cascade-col-label strong { color: #e07a6a; }

/* Legend callout */
.vp-legend {
  width: 100%; max-width: 1220px;
  margin-top: 22px;
  padding: 14px 20px;
  border-left: 2px solid var(--accent);
  background: rgba(244,255,0,0.04);
  border-radius: 0 8px 8px 0;
}
.vp-legend p {
  font-size: clamp(13px, 1.45vw, 16px);
  color: var(--text); line-height: 1.5;
}

@media (max-width: 768px) {
  .slide-vp    { justify-content: center; padding-top: 56px; }
  .vp-layout   { grid-template-columns: 1fr; gap: 28px; }
  .cascade-chart { height: 200px; gap: 4px; padding-top: 20px; }
  .cascade-value { font-size: 9px; top: -16px; }
  .cascade-col-label { font-size: 9.5px; }
  .cascade-col-label strong { font-size: 14px; }
  .vp-legend   { padding: 10px 14px; }
}
```

**Animación (cascada secuencial):**
```js
animations[i] = {
  enterSlide() {
    const bars   = document.querySelectorAll('#slide-N .cascade-bar');
    const labels = document.querySelectorAll('#slide-N .cascade-col-label');
    const values = document.querySelectorAll('#slide-N .cascade-value');
    const valEl  = document.getElementById('vp-main-value');

    gsap.set(['#vp-title', '#vp-subtitle', '#vp-stat', '#vp-legend', '#slide-N .slide-source'], { opacity: 0 });
    gsap.set(bars,            { scaleY: 0, transformOrigin: 'bottom center', opacity: 0 });
    gsap.set([labels, values],{ opacity: 0, y: 6 });
    if (valEl) valEl.textContent = '0,0';

    const tl = gsap.timeline();
    tl.fromTo('#vp-title',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    tl.fromTo('#vp-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

    tl.fromTo('#vp-stat',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out',
        onComplete() {
          animateCounter(valEl, parseFloat(valEl.dataset.count), 1.3, parseInt(valEl.dataset.decimal || '0'));
        }
      }, '-=0.2');

    bars.forEach((bar, i) => {
      tl.to(bar,         { opacity: 1, scaleY: 1, duration: 0.5, ease: 'power3.out' }, i === 0 ? '-=0.1' : '-=0.25');
      if (labels[i]) tl.to(labels[i], { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.25');
      if (values[i]) tl.to(values[i], { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.2');
    });

    tl.fromTo('#vp-legend', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
    tl.fromTo('#slide-N .slide-source', { opacity: 0 }, { opacity: 0.6, duration: 0.3 }, '-=0.2');
  }
};
```

---

### 7.10. PRODUCTO + TEXTO (innovación) — con variantes multi-producto

**Propósito:** slide de lanzamiento/innovación con imagen del producto a un lado y texto al otro. Se puede repetir con múltiples productos, cada uno con su color de identidad.

**HTML:**
```html
<section class="slide slide-innovation slide-[producto]" id="slide-N">
  <div class="inno-layout">
    <div class="inno-can" id="[producto]-can">
      <img src="../../assets/Imagenes Productos/[producto] 2000x2000.png" alt="[Nombre]">
    </div>
    <div class="inno-text">
      <span class="inno-label" id="[producto]-label">Innovación [año]</span>
      <h2 class="inno-name font-display" id="[producto]-name">[Nombre<br>del producto]</h2>
      <p class="inno-desc" id="[producto]-desc">
        [Descripción corta del producto, 1-2 líneas]
      </p>
    </div>
  </div>
</section>
```

**CSS base (común a todos los productos):**
```css
.slide-innovation { padding: 60px 80px; }

.inno-layout {
  display: flex;
  align-items: center; justify-content: center;
  gap: clamp(40px, 6vw, 100px);
  width: 100%; max-width: 1100px;
}

.inno-can {
  flex-shrink: 0;
  width: clamp(240px, 35vw, 450px);
}
.inno-can img { width: 100%; height: auto; }

.inno-text {
  display: flex; flex-direction: column;
  align-items: flex-start;
  max-width: 520px;
}

.inno-label {
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.24em; text-transform: uppercase;
  margin-bottom: 14px;
}
.inno-name {
  font-size: clamp(60px, 8vw, 100px);
  line-height: 0.95; margin-bottom: 20px;
}
.inno-desc {
  font-size: clamp(16px, 1.8vw, 20px);
  color: var(--text-muted); line-height: 1.55;
}

@media (max-width: 768px) {
  .slide-innovation { padding: 48px 22px 70px; }
  .inno-layout { flex-direction: column; gap: 24px; }
  .inno-text   { align-items: center; text-align: center; }
  .inno-can    { width: 180px; }
}
```

**CSS override por producto (magenta, turquesa, etc.):**
```css
/* Ejemplo: Radical White (turquesa) */
.slide-radical .inno-label { color: var(--radical-white); }
.slide-radical .inno-name  {
  color: var(--radical-white);
  text-shadow: 0 0 50px rgba(0,206,209,0.4);
}
.slide-radical .inno-can     { filter: drop-shadow(0 30px 60px rgba(0,206,209,0.25)); }
.slide-radical .inno-can img { filter: drop-shadow(0 0 40px rgba(0,206,209,0.25)); }

/* Ejemplo: Bubble Gum (magenta) */
.slide-bubblegum .inno-label { color: var(--bubblegum); }
.slide-bubblegum .inno-name  {
  color: var(--bubblegum);
  text-shadow: 0 0 50px rgba(255,20,147,0.4);
}
.slide-bubblegum .inno-can     { filter: drop-shadow(0 30px 60px rgba(255,20,147,0.25)); }
.slide-bubblegum .inno-can img { filter: drop-shadow(0 0 40px rgba(255,20,147,0.25)); }

/* Seguir el patrón para cualquier otro producto con su var() de color */
```

**Animación (por producto):**
```js
animations[i] = {
  enterSlide() {
    gsap.set(['#[producto]-can', '#[producto]-label', '#[producto]-name', '#[producto]-desc'], { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo('#[producto]-can',
      { opacity: 0, y: 80, rotation: -5 },   // o rotation: +5 para alternar dirección
      { opacity: 1, y: 0, rotation: 0, duration: 0.8, ease: 'power3.out' });
    tl.fromTo('#[producto]-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.4');
    tl.fromTo('#[producto]-name',  { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    tl.fromTo('#[producto]-desc',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
  }
};
```

---

### 7.11. CHECKLIST

Lista vertical de preguntas/ítems con icono SVG de check circular a la izquierda. Cada ítem aparece con un sub-step y el check se dibuja.

**HTML:**
```html
<section class="slide slide-checklist" id="slide-N" data-steps="6">
  <h2 class="slide-title font-display">[Título]</h2>
  <div class="check-list">
    <div class="check-item" data-step="1">
      <svg class="check-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11"/>
        <polyline points="7 13 10 16 17 9"/>
      </svg>
      <span>[Pregunta/ítem]</span>
    </div>
    <!-- ... -->
  </div>
</section>
```

**CSS clave:**
- `.check-item { display: flex; align-items: center; gap: 20px; opacity: 0; font-size: clamp(18px, 2.2vw, 24px); }`.
- `.check-icon circle`, `.check-icon polyline` → `stroke: var(--accent); fill: none`.
- `.check-icon polyline` arranca con `stroke-dasharray: 20; stroke-dashoffset: 20`. Al revelar, el ítem recibe `.revealed` y el tick se dibuja solo vía `transition: stroke-dashoffset 0.4s ease 0.1s`.

**Animación:**
```js
enterStep(step) {
  const items = document.querySelectorAll('.check-item');
  const item  = items[step - 1];
  if (!item) return;
  gsap.fromTo(item,
    { opacity: 0, x: 30 },
    { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out',
      onComplete() { item.classList.add('revealed'); } }
  );
}
```

---

### 7.12. CIERRE — TRANSVERSAL ⭐ (con variante lite)

**Obligatoria en toda presentación Score.** Cierre narrativo: logo Score grande + frase motivacional + bloque de partner. Opcionalmente, un contador en vivo.

**Dos variantes:**

#### Variante A — Completa (con contador en vivo)

Incrementa en vivo mientras la slide está visible (refuerzo del "3,6 latas/segundo" del Resumen).

```html
<section class="slide slide-cierre" id="slide-N">
  <div class="cierre-content">
    <img src="../../assets/Logos e Isotipos/Logo SCORE Extendido (sin fondo).png"
         alt="Score Energy Drink" class="cierre-logo" id="cierre-logo">

    <h2 class="cierre-phrase font-display" id="cierre-phrase">[FRASE CIERRE]</h2>

    <div class="cierre-counter" id="cierre-counter">
      <span class="cierre-num font-display" id="cierre-live-count">0</span>
      <p class="cierre-label">latas vendidas mientras ves esta slide</p>
    </div>

    <p class="cierre-dato" id="cierre-dato">3,6 latas por segundo. Cada venta cuenta.</p>

    <div class="cierre-partner">
      <span class="partner-logo-text">[NOMBRE PARTNER]</span>
    </div>
  </div>
</section>
```

Animación (con `setInterval` y cleanup en `leaveSlide`):
```js
let cierreInterval = null;

animations[i] = {
  enterSlide() {
    gsap.set(['#cierre-logo', '#cierre-phrase', '.cierre-counter', '#cierre-dato', '.cierre-partner'], { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo('#cierre-logo',   { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    tl.fromTo('#cierre-phrase', { opacity: 0, y: 30 },       { opacity: 1, y: 0,    duration: 0.5, ease: 'power2.out' }, '-=0.3');
    tl.fromTo('.cierre-counter',{ opacity: 0, y: 20 },       { opacity: 1, y: 0,    duration: 0.5, ease: 'power2.out' }, '-=0.2');
    tl.fromTo('#cierre-dato',   { opacity: 0 },              { opacity: 1,          duration: 0.4, ease: 'power2.out' }, '-=0.1');
    tl.fromTo('.cierre-partner',{ opacity: 0 },              { opacity: 1,          duration: 0.4, ease: 'power2.out' }, '-=0.1');

    // +0.36 cada 100ms = 3,6 latas/segundo
    let count = 0;
    const counterEl = document.getElementById('cierre-live-count');
    if (cierreInterval) clearInterval(cierreInterval);
    counterEl.textContent = '0';
    cierreInterval = setInterval(() => {
      count += 0.36;
      counterEl.textContent = Math.floor(count).toLocaleString('es-CL');
    }, 100);
  },

  leaveSlide() {
    if (cierreInterval) { clearInterval(cierreInterval); cierreInterval = null; }
  }
};
```

#### Variante B — Lite (sin contador)

Si el contador resulta redundante o hay preferencia estética, se omite completamente.

```html
<section class="slide slide-cierre" id="slide-N">
  <div class="cierre-content">
    <img src="../../assets/Logos e Isotipos/Logo SCORE Extendido (sin fondo).png"
         alt="Score Energy Drink" class="cierre-logo" id="cierre-logo">

    <h2 class="cierre-phrase font-display" id="cierre-phrase">[FRASE CIERRE]</h2>

    <div class="cierre-partner">
      <span class="partner-logo-text">[NOMBRE PARTNER]</span>
    </div>
  </div>
</section>
```

Animación (sin interval ni `leaveSlide`):
```js
animations[i] = {
  enterSlide() {
    gsap.set(['#cierre-logo', '#cierre-phrase', '.cierre-partner'], { opacity: 0 });

    const tl = gsap.timeline();
    tl.fromTo('#cierre-logo',   { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    tl.fromTo('#cierre-phrase', { opacity: 0, y: 30 },       { opacity: 1, y: 0,    duration: 0.5, ease: 'power2.out' }, '-=0.3');
    tl.fromTo('.cierre-partner',{ opacity: 0 },              { opacity: 1,          duration: 0.4, ease: 'power2.out' }, '-=0.1');
  }
};
```

**Frase de cierre (`#cierre-phrase`) — único elemento que cambia entre presentaciones.** Es el CTA/mensaje final elegido para esa audiencia. Ejemplos: `"Crezcamos juntos [año]"`, `"Score × [Partner]. Cada venta cuenta."`, `"Acelerá con Score."`.

**CSS (común a las dos variantes):**
```css
.slide-cierre { text-align: center; }

.cierre-content {
  display: flex; flex-direction: column;
  align-items: center; gap: 20px;
}

.cierre-logo {
  width: min(350px, 50vw);
  opacity: 0;
  filter: drop-shadow(0 0 30px rgba(244,255,0,0.2));
}

.cierre-phrase {
  font-size: clamp(40px, 6vw, 80px);
  color: var(--accent);
  text-shadow: 0 0 50px rgba(244,255,0,0.3);
  opacity: 0;
  max-width: 900px;
  line-height: 1;
}

/* Solo variante A */
.cierre-counter { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; }
.cierre-num     { font-size: clamp(60px, 9vw, 120px); color: var(--text); line-height: 1; font-variant-numeric: tabular-nums; }
.cierre-label   { font-size: 16px; color: var(--text-muted); }
.cierre-dato    { font-size: clamp(16px, 2vw, 20px); color: var(--text-muted); opacity: 0; }

.cierre-partner {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  min-width: 260px;
  opacity: 0;
}
```

---

## 8. Identidad de marca Score

### 8.1. Colores

- **Acento principal:** `#F4FF00` (amarillo Score). Usar en títulos destacados, números de KPI, glows, fill de progress bar, clase `.accent`. **Máximo un elemento amarillo gigante por slide** (salvo hero/cierre).
- **Fondo:** `#080808` (casi negro, no negro puro — para que las sombras se noten).
- **Superficie elevada:** `#111111` (paneles, cards).
- **Bordes:** `rgba(255,255,255,0.06)` — sutiles, casi invisibles.
- **Texto primario:** `#FFFFFF`.
- **Texto muted:** `#AAAAAA` (labels, bajadas, descripciones secundarias).
- **Deltas (barras / tablas):** verde `#6ed78a`, rojo `#e07a6a`, naranja-terracota para total de waterfall.
- **Colores de producto Score:**
  - Gorilla: `#8B00FF` (morado).
  - Original: `#FFD700` (dorado).
  - Gorilla Zero / Zero: `#1E90FF` (azul).
  - Radical White: `#00CED1` (turquesa).
  - Bubble Gum: `#FF1493` (magenta).
  - Usar solo los aplicables al portafolio del cliente. Agregar/quitar `var()`s en `base.css` según corresponda.

### 8.2. Tipografía

- **Display (Bebas Neue):** condensada, alta, naturalmente uppercase. **No usar para texto corrido.** Ideal para títulos gigantes y números.
- **Cuerpo (Inter):** pesos 300–700. Letter-spacing `0.15em–0.25em` en uppercase para subtítulos y labels chicos.

### 8.3. Logos e isotipo

- **Logo extendido** (horizontal con wordmark): hero, cierre, landing.
- **Isotipo** (cuadrado, solo ícono): `#global-logo` persistente en esquina superior izquierda durante toda la presentación; también para favicon.
- Los archivos `.ai` y `.pdf` son de print; para web usar `Logo SCORE Extendido (sin fondo).png` e `Isotipo.png`.

### 8.4. Voz y tono

- Directo, motivacional, cercano al vendedor.
- Usa "tú" y no "usted".
- Frases cortas. Un dato contundente por slide.
- "Cada venta cuenta." "Score es el #1." "Crezcamos juntos."
- Español de Chile si aplica: `$` con puntos de miles (`$1.500`), coma decimal (`3,6`), "peak" antes que "pico" en contexto retail.

### 8.5. Principios de diseño

- **Menos es más.** Máximo 3–4 elementos visibles por slide.
- **Tipografía grande** — se proyecta en pantalla.
- **Mucho espacio negativo.** `padding: 60px 80px` en `.slide`.
- **Imágenes protagonistas.**
- **Amarillo como señal, no como decoración.** Apunta a lo que importa.
- **Transiciones rápidas pero con peso.** 0.3–0.7s. Nunca instantáneas, nunca lentas.

---

## 9. Animators reutilizables (documentación)

Todos viven en `brands/score-*/js/main.js`, dentro del IIFE. Los incluyo antes del registry `animations` y los uso desde cada slide que los necesita.

### 9.1. `animateCounter(el, target, duration, decimal)`

Anima un contador numérico desde 0 hasta `target`. Si `decimal > 0` formatea con coma decimal (es-CL).

```js
function animateCounter(el, target, duration, decimal) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration: duration || 1.2,
    ease: 'power2.out',
    onUpdate() {
      if (decimal) el.textContent = obj.val.toFixed(decimal).replace('.', ',');
      else         el.textContent = Math.round(obj.val);
    }
  });
}
```

**Uso:** para cualquier `.kpi-value` / `.ms-proj-value` / `.vp-main-value` con `data-count` y opcional `data-decimal` en el HTML.

### 9.2. `animateSectionIntro(slideId)`

Anima las section-intros del §7.3. Cada slide de intro registra solo `enterSlide() { animateSectionIntro('slide-X'); }`.

```js
function animateSectionIntro(slideId) {
  const root = document.getElementById(slideId);
  if (!root) return;
  const num      = root.querySelector('.section-number');
  const title    = root.querySelector('.section-title');
  const subtitle = root.querySelector('.section-subtitle');

  gsap.set([num, title, subtitle], { opacity: 0 });

  const tl = gsap.timeline();
  tl.fromTo(num,      { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  tl.fromTo(title,
    { opacity: 0, y: 20, clipPath: 'inset(0 100% 0 0)' },
    { opacity: 1, y: 0,  clipPath: 'inset(0 0% 0 0)', duration: 0.85, ease: 'power2.inOut' }, '-=0.1');
  tl.fromTo(subtitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
}
```

### 9.3. `resetItemStage(slideId)` + `stepItemStage(slideId, step)`

Para listas numeradas reveal (§7.4) y cualquier otro patrón que use `.item-card` con estados `.item-active` y `.item-past`.

```js
function resetItemStage(slideId) {
  const cards = document.querySelectorAll(`#${slideId} .item-card`);
  cards.forEach(c => {
    gsap.set(c, { opacity: 0, x: 0 });
    c.classList.remove('item-active', 'item-past');
  });
}

function stepItemStage(slideId, step) {
  const cards = document.querySelectorAll(`#${slideId} .item-card`);
  const card  = cards[step - 1];
  if (!card) return;

  cards.forEach((c, i) => {
    if (i < step - 1) {
      c.classList.remove('item-active');
      c.classList.add('item-past');
    }
  });

  card.classList.add('item-active');
  gsap.fromTo(card,
    { opacity: 0, x: 30 },
    { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' });
}
```

**Uso:**
```js
animations[i] = {
  enterSlide() {
    resetItemStage('slide-5');
    /* animar título + subtítulo */
  },
  enterStep(step) { stepItemStage('slide-5', step); }
};
```

### 9.4. `animateMarketShareSlide(slideId, titleId, subtitleId, projId, valueId, maxMs)`

Anima la slide de market share (§7.8). Recibe los IDs específicos de la slide y el MS% máximo del trimestre (para escalar las barras).

```js
function animateMarketShareSlide(slideId, titleId, subtitleId, projId, valueId, maxMs) {
  const root = document.getElementById(slideId);
  if (!root) return;

  const bars       = root.querySelectorAll('.ms-bar');
  const fills      = root.querySelectorAll('.ms-bar-fill');
  const valueEls   = root.querySelectorAll('.ms-bar-value, .ms-bar-month, .ms-bar-amount');
  const proj       = document.getElementById(projId);
  const valueEl    = document.getElementById(valueId);
  const claveCards = root.querySelectorAll('.ms-clave-card');
  const source     = root.querySelector('.slide-source');

  gsap.set([`#${titleId}`, `#${subtitleId}`, proj, source, claveCards], { opacity: 0 });
  gsap.set(fills, { height: '0%' });
  gsap.set(valueEls, { opacity: 0, y: 8 });
  if (valueEl) valueEl.textContent = '0';

  const tl = gsap.timeline();
  tl.fromTo(`#${titleId}`,    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  tl.fromTo(`#${subtitleId}`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

  bars.forEach((bar, i) => {
    const ms = parseFloat(bar.dataset.ms);
    const heightPct = (ms / maxMs) * 100;
    const fill = bar.querySelector('.ms-bar-fill');
    const inner = bar.querySelectorAll('.ms-bar-value, .ms-bar-month, .ms-bar-amount');

    tl.to(fill,  { height: heightPct + '%', duration: 0.6, ease: 'power3.out' }, i === 0 ? '-=0.1' : '-=0.45');
    tl.to(inner, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.05 }, '-=0.3');
  });

  tl.fromTo(proj,
    { opacity: 0, x: 30 },
    { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out',
      onComplete() {
        const countTo = parseFloat(valueEl.dataset.count);
        const decimal = parseInt(valueEl.dataset.decimal || '0');
        animateCounter(valueEl, countTo, 1.3, decimal);
      }
    }, '-=0.4');

  tl.fromTo(claveCards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.12 }, '-=0.3');
  tl.fromTo(source,     { opacity: 0 },        { opacity: 0.6, duration: 0.3 }, '-=0.2');
}
```

---

## 10. Datos duros transversales Score

Se usan idénticos en todas las presentaciones Score (salvo que explícitamente se actualicen):

| Métrica | Valor | Observación |
|---|---|---|
| Latas vendidas en Chile | **113 millones** | Sin decimal. Slide: `113` + suffix `M.` |
| Latas vendidas por segundo | **3,6** | Un decimal, coma es-CL. Alimenta el contador del cierre (variante A). |
| Posición en la categoría | **#1** | En unidades vendidas. Sin cifra de participación, solo ranking. |
| Crecimiento vs año anterior | **+15%** | Slide: prefix `+` + `15` + suffix `%`. |

**Subtítulo del Resumen:** "Score crece un 15% respecto al año anterior."

**Info general del producto (reutilizable):** "Lata de aluminio · 473ml · Vida útil 720 días · Conservar en lugar fresco."

---

## 11. Assets disponibles

### 11.1. `assets/Logos e Isotipos/`
- `Logo SCORE Extendido (sin fondo).png` — hero, cierre, landing.
- `Isotipo.png` — `#global-logo` persistente y favicon.
- `Logo_SCORE_alta.webp` — optimizada para web.
- Archivos `.ai` / `.pdf` — de print (no usar en web).

### 11.2. `assets/Imagenes Productos/`
Renders 2000×2000 PNG sobre fondo transparente (Gorilla, Zero, Original, Radical White, Bubble Gum, Mango, Mojito, Fruit Punch).

### 11.3. `assets/Etiquetas Hero/`
JPG 1000×1000 de etiquetas para el fondo difuminado del Hero (blur + opacity 0.08).

### 11.4. `assets/Tienda Perfecta/`
Fotografías horizontales de ejecución en punto de venta, para slides de §7.6 (foto protagonista).

---

## 12. Landing page (`/index.html`)

Landing simplísima: logo Score + botón CTA al deck. Fin: tener una URL limpia de entrada.

**Estructura:**
- Fondo `#080808`, centrado vertical y horizontal.
- Logo extendido 420px con drop-shadow amarillo.
- CTA "Iniciar Presentación →" fondo `#F4FF00`, texto negro, border-radius 8px, padding 16px/40px, hover con `translateY(-2px)` + glow.
- Bajada: "[Nombre del partner] · [Contexto breve]" en gris.
- Favicon: `assets/Logos e Isotipos/Isotipo.png`.
- Tipografías: `Inter` + `Bebas Neue` (si hay H1).
- Responsive con breakpoint a 768px.

El `href` del botón apunta a `brands/score-[cliente]/` (con trailing slash — Vercel sirve el `index.html` de esa carpeta vía `trailingSlash: true`).

---

## 13. Dev workflow y deploy

### 13.1. Desarrollo local

```bash
node server.js
# Sirve en http://localhost:3000
```

El servidor es nativo de Node (`http` + `fs`), sin dependencias. Resuelve directorios a su `index.html`, mapea MIME types básicos y sirve todo desde la raíz del proyecto.

### 13.2. Deploy en Vercel

- `vercel.json` con `cleanUrls: true`, `trailingSlash: true`, cache de `/assets/*` `max-age=31536000, immutable`.
- Sin build step: Vercel publica los archivos estáticos tal cual.
- **Cada presentación (cada cliente) es un repo y un deploy independientes**, para que las URLs no revelen info cruzada entre clientes.
- Flujo típico: `main` siempre deployable; cambios viven en branches `feature/...` que se mergean vía PR.

### 13.3. `.gitignore`

Por convención ignora:
```
.DS_Store
.vscode/
.idea/
.claude/
*.log
.netlify/
node_modules/

# Office lock files (Word/PowerPoint)
~$*
```

### 13.4. Autoría de commits — ⚠️ cuidado

Si se trabaja con la cuenta privada/de empresa de GitHub (no la personal), asegurarse de que `git config user.email` apunte al email asociado a esa cuenta (o al privacy email `{id}+{login}@users.noreply.github.com`). Si no, GitHub atribuye los commits a otra cuenta aunque el push haya ido a la correcta. Ver §18.4.

---

## 14. Convenciones y decisiones de diseño

1. **Un solo HTML para toda la presentación.** Todas las slides en `brands/score-*/index.html` como `<section class="slide">` consecutivos. Sin routing entre slides; el motor solo muestra/oculta con `.active`.
2. **IDs `slide-N` 1-based en markup, 0-based en `animations[]`.** Si insertás o borrás slides, renumerá ambos. Ver §18.5.
3. **`data-steps="N"`** en slides con sub-animación.
4. **`data-step="N"`** en hijos marca a qué paso corresponde cada card.
5. **`data-count="N"` + `data-decimal="N"`** en elementos que cuentan.
6. **Prefijo de clase por tipo de slide:** `.slide-hero`, `.slide-kpis`, `.slide-cadenas`, `.slide-ms`, `.slide-vp`, `.slide-innovation`, `.slide-cierre`, etc.
7. **Animaciones siempre en el objeto `animations[index]`**, nunca inline.
8. **`gsap.set(..., { opacity: 0 })` al inicio de cada `enterSlide()`** para todos los elementos animados. Evita el flash.
9. **Selectores scopeados en `main.js`:** `#slide-N .foo` para elementos que pueden aparecer en varias slides (ver §18.1).
10. **Sin fallback sin JavaScript.** La presentación no funciona sin JS — asumido, porque es una presentación, no una web pública con SEO.
11. **Accesibilidad básica:** `aria-label` en botones de nav, `alt` en imágenes, `lang="es"` en el HTML. Pero no es prioridad; el contexto es presencial/proyectado.
12. **Sin analytics ni tracking** por defecto. Si se agregan, ponerlos en la landing `/index.html`, no dentro del flujo de slides.

---

## 15. Qué cambia y qué no entre presentaciones

### Cambia (contenido específico)
- Nombre del partner/cliente (hero, cierre, landing).
- Año/período (hero, section intros).
- Frase de cierre (`#cierre-phrase`).
- Variante de cierre (completa / lite).
- Contenido editorial: estructura de slides, listas numeradas, checklists, fotos, innovaciones destacadas.
- Productos del portafolio aplicables (y sus colores en utility classes).
- Datos propios de venta / participación / proyecciones.
- Fuentes citadas en `.slide-source`.
- Texto del insight en tabla de cadenas, legend de waterfall, claves de market share.

### No cambia (base reutilizable)
- Stack técnico y motor (`shared/`).
- Sistema visual base (variables CSS, tipografía, layout, UI de navegación).
- Slide **Resumen Score 2025** (§7.2) — copy exacto, números intactos.
- Slide **Cierre** (§7.12) — estructura, variante A o B según cliente.
- Identidad de marca: amarillo `#F4FF00`, negro `#080808`, Bebas Neue + Inter, isotipo en esquina, barra de progreso amarilla.
- Animators reutilizables (§9).
- Convenciones de código (IDs, `data-steps`, gsap.set al inicio).
- Landing `/index.html` — estructura y estilos idénticos; cambia el texto.
- Configuración de Vercel y dev server.

---

## 16. Arranque de nueva presentación — checklist

Para construir una presentación nueva para el cliente `X`:

1. **Crear repo nuevo** `presentacion-score-[X]-[periodo]` (privado).
2. **Copiar la estructura base** (`shared/`, `assets/`, `index.html` landing, `server.js`, `vercel.json`, `.gitignore`).
3. **Renombrar** `brands/score-unimarc/` → `brands/score-[X]/` (o como corresponda).
4. **Ajustar** el CTA de la landing para que apunte a `brands/score-[X]/`.
5. **Armar el índice de slides** del cliente (qué patrones aplicás, de qué catálogo).
6. **Construir slide por slide** (orden display: hero → cierre). Cada slide: HTML, CSS, `animations[i]`. Verificar contra §7.
7. **Registrar autoría correcta** en git (§18.4) ANTES del primer commit.
8. **Deploy en Vercel**: conectar el repo, Vercel detecta el sitio estático y publica.
9. **QA final**: recorrer todas las slides con teclado + click + sub-steps, revisar consola sin errores, probar responsive en 768px.

---

## 17. Convenciones de branching / PR

- `main` siempre es deployable. Cada push a `main` dispara un deploy Vercel productivo.
- Trabajo nuevo va en branches `feature/<nombre-corto>` (ej: `feature/slide-refinements`, `feature/add-bubble-gum`).
- Branches → PR contra `main` → merge commit (conserva los commits de la feature en la historia).
- Tras merge, borrar la feature branch remota (auto-delete en GitHub) y la local (`git branch -d`).
- Commits directos a `main` solo para tweaks triviales (una línea, un typo) donde el overhead de PR no se justifica.

---

## 18. Gotchas y lecciones aprendidas

### 18.1. Selectores scopeados — **crítico**

Los selectores en `gsap.set(...)` y `gsap.to(...)` afectan a **todos** los elementos del DOM que matcheen. Si usás un selector genérico como `.slide-source`, vas a setear a opacity 0 el `.slide-source` de TODAS las slides, no solo la actual.

**Malo:**
```js
gsap.set('.slide-source', { opacity: 0 });         // toca todas las slides
```

**Bueno:**
```js
gsap.set('#slide-N .slide-source', { opacity: 0 }); // scopeado a la slide actual
```

Esto es especialmente importante para clases reutilizadas (`.cadenas-row`, `.item-card`, `.ms-bar`, `.cascade-bar`, `.driver-card`, `.slide-source`, etc.). IDs únicos (`#cagr-title`, `#kpi-title`) no tienen el problema — solo son uno.

### 18.2. `min-height` en cards con contenido variable

Cuando un grid de cards cambia el contenido de alguna card entre pasos (ej: KPI que pasa de "active" a "past" con fuente más chica), el alto de la fila del grid colapsa a la card más alta actual. Esto mueve verticalmente las labels.

**Fix:** dar a cada card un `min-height` constante + `justify-content: center` para que el contenido se centre dentro de una caja de alto fijo:

```css
.kpi-card {
  min-height: clamp(240px, 30vh, 320px);
  justify-content: center;
  /* ... */
}
```

### 18.3. `flex-start` + `padding-top` en listas reveal

Slides con `.item-stage` (§7.4) cuyo contenido se revela con sub-steps: usar `justify-content: center` hace que el título se reposicione a medida que las cards cambian de alto (activa vs past). Usar `justify-content: flex-start` con un `padding-top` fijo (ej: `90px`) ancla el título.

```css
.slide-claves,
.slide-oportunidades {
  justify-content: flex-start;
  padding-top: 90px;
}
```

### 18.4. Autoría de commits en cuentas múltiples

Si el repo está en una cuenta GitHub (ej: `empresa-login`) pero el git config local usa el email de otra cuenta (ej: `personal@gmail.com`), los commits se atribuyen a la cuenta del email, no a la que hizo el push.

**Fix:** configurar local del repo con el privacy email de la cuenta destino:

```bash
# Obtener el user ID de la cuenta GitHub destino
gh api users/<LOGIN> --jq '.id'
# Resultado: 106108744

# Config local (no global, para no romper otros repos)
git config --local user.name  "<LOGIN>"
git config --local user.email "106108744+<LOGIN>@users.noreply.github.com"
```

Si ya hay commits con autoría equivocada en el repo, se pueden reescribir:

```bash
# En cada branch afectada:
git rebase --root --exec 'git commit --amend --reset-author --no-edit'
git push --force-with-lease origin <branch>
```

Es destructivo — solo en repos privados con un único colaborador o avisando al equipo.

### 18.5. Renumerar slides cuando se inserta/elimina

Los IDs `slide-N` son 1-based en HTML, pero `animations[i]` es 0-based. Si insertás una slide nueva en la posición 6:

1. Todos los `slide-N` desde la posición 6 hacia abajo necesitan `+1`. Hacé los renames en **orden descendente** para evitar colisiones (slide-14 → slide-15, luego slide-13 → slide-14, …).
2. Todos los `animations[N]` desde la posición 5 hacia abajo necesitan `+1`. Mismo criterio descendente.
3. Actualizar cualquier selector scopeado `#slide-N` dentro de `main.js`.
4. Revisar comentarios tipo `/* SLIDE 7 - CAGR */` en el código.

Inverso si eliminás una slide: shift `-1` en orden ascendente desde la posición afectada.

### 18.6. No mezclar CSS `transform` con GSAP `scale`/`x`

Si un elemento tiene `transform: translate(...)` en CSS, y GSAP anima su `scale`, GSAP va a pisar el transform y el elemento salta a la nueva posición. Definir TODO el `transform` vía GSAP (incluido `translateX/Y`) o vía CSS, no mezclar.

### 18.7. El preview de Claude / browsers en background throttlean RAF

Si testeás la presentación dentro de un preview embedido o una tab en background, GSAP puede correr "a cámara lenta" porque `requestAnimationFrame` se throttlea. No es un bug del código — al traer la pestaña al frente vuelve a correr bien. Para QA en vivo, usar una ventana de browser al frente.

### 18.8. `setInterval` en el cierre — cleanup obligatorio

Si usás la variante A del cierre con contador en vivo, es mandatorio limpiar el `setInterval` en `leaveSlide()`. Si no, el contador sigue corriendo en memoria cuando el usuario avanza o retrocede.

```js
leaveSlide() {
  if (cierreInterval) { clearInterval(cierreInterval); cierreInterval = null; }
}
```

### 18.9. `clearProps: 'all'` en transiciones

El motor hace `gsap.set(leaving, { clearProps: 'all' })` en el `onComplete` de la animación de salida. Esto limpia los inline styles que GSAP pudo haber puesto en el wrapper de la slide. Si agregás un estilo propio al wrapper con GSAP dentro de `enterSlide`, ese estilo también se va a limpiar al salir — es intencional, NO ponés estilos permanentes en el wrapper.

---

## 19. Siguiente paso

Para arrancar una presentación nueva: copiá este doc al root del repo nuevo, seguí el checklist §16, y adaptá los slides del cliente eligiendo patrones del catálogo §7.

Si aparece un patrón nuevo que no está en §7, documentalo en una versión siguiente (§7.13, §7.14, …) con el mismo formato: HTML → CSS → animación → ejemplo de uso.
