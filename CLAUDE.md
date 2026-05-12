# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Web presentation for **Score Energy Drink × Alvi (April 2026)**. Target output: a static HTML/CSS/JS site (no build tools, no npm) that behaves like an animated slide deck, served locally with Node's native `http` module and deployed to Vercel.

**Current state: bootstrap.** Only source material exists — the `.pptx` brief, brand assets, and the spec. The site scaffolding (`shared/`, `brands/score-alvi/`, landing `index.html`, `server.js`, `vercel.json`) has not been created yet. First task is usually to scaffold from the spec following §16 of the base doc.

## Read this first — always

**`base-presentacion-score-v2.md`** is the authoritative spec (2180 lines) for every Score presentation. Do not re-derive its conventions from memory; open it and search the relevant `§N` section.

Quick index for the most-referenced sections:

- §3 — File structure (`shared/` engine vs `brands/score-[cliente]/` content).
- §4 — `SlideEngine` (`shared/js/core.js`): navigation, `data-steps`, `onEnterSlide/onEnterStep/onLeaveSlide` callbacks.
- §5 — Visual system: CSS variables (`--bg #080808`, `--accent #F4FF00`), typography (Bebas Neue + Inter), layout.
- §6 — Animation pattern in `brands/score-*/js/main.js` (animations registry keyed by 0-based slide index).
- §7 — Slide pattern catalog (Hero, KPIs, Section Intro, Reveal list, Market Share, Waterfall, Innovation, Cierre, …).
- §9 — Reusable animators: `animateCounter`, `animateSectionIntro`, `resetItemStage`/`stepItemStage`, `animateMarketShareSlide`.
- §10 — Hard transversal Score data (113M latas, 3,6/seg, #1, +15%). **Do not change.**
- §16 — Checklist for bootstrapping a new client presentation.
- §18 — Gotchas (see "Critical gotchas" below).

**Two slides are mandatory and transversal** across every Score deck:
- §7.2 — **Resumen Score 2025** (the four KPIs — copy and numbers are fixed).
- §7.12 — **Cierre** (closing slide, variant A with live counter or variant B lite).

## Commands

Once the site is scaffolded:

```bash
node server.js          # Dev server on http://localhost:3000 (zero dependencies)
```

Deploy is hands-off: Vercel detects the static site from `vercel.json` (`cleanUrls: true`, `trailingSlash: true`, asset cache `max-age=31536000, immutable`) — no build step.

## Assets available in this repo

- `assets/Logos e Isotipos/` — Score logos. Use `Logo SCORE Extendido (sin fondo).png` for hero/cierre/landing and `Isotipo.png` for `#global-logo` + favicon. `.ai`/`.pdf` are print-only.
- `assets/Imagenes Productos/` — 2000×2000 PNG renders on transparent background (Bubble Gum, Fruit Punch, Gorilla, Mango, Mojito, Original, Radical White, Zero Gorilla).
- `assets/Etiquetas Hero/` — 1000×1000 JPG labels for the blurred hero background (blur + opacity 0.08 per §7.1).
- `Presentación Alvi-Score.pptx` — source brief from the client; read it to extract the specific data, slides, and editorial content for this deck.

Note: the base spec references an `assets/Tienda Perfecta/` folder (§7.6, §11.4) — it does not exist in this repo yet. If a "foto protagonista" slide is needed, those photos have to be added first.

## Critical gotchas (§18)

These are the mistakes that recur. Internalize them before editing `main.js`:

1. **Scope every GSAP selector to its slide.** `gsap.set('.slide-source', …)` hits every slide's source line; use `gsap.set('#slide-N .slide-source', …)` instead. Applies to all reused classes (`.item-card`, `.ms-bar`, `.cadenas-row`, `.cascade-bar`, etc.). IDs are unique and safe.
2. **Always `gsap.set(..., { opacity: 0 })` for animated elements at the top of `enterSlide()`** to kill the 1-frame flash when re-entering a slide.
3. **Slide numbering is dual:** HTML IDs `#slide-N` are 1-based, `animations[i]` is 0-based. When inserting/removing slides, renumber both — descending order when inserting, ascending when deleting (§18.5).
4. **`min-height` on KPI/card grids** whose cards shrink between sub-steps (prevents vertical jumps, §18.2). Reveal lists use `justify-content: flex-start` + `padding-top` to anchor the title (§18.3).
5. **Don't mix CSS `transform` with GSAP `scale`/`x`** on the same element — GSAP overwrites the CSS transform and the element jumps.
6. **Cierre variant A uses `setInterval`** — clean it up in `leaveSlide()` or it keeps ticking in memory (§18.8).
7. **Git authorship:** if this repo is hosted under a work GitHub account but your global git email is personal, commits get misattributed. Before the first commit set `git config --local user.email` to the privacy noreply email of the target account (§18.4).

## Conventions that aren't obvious from code

- **One HTML per deck** — every slide is a `<section class="slide" id="slide-N">` in `brands/score-alvi/index.html`. No routing.
- **`data-steps="N"`** on a slide declares sub-steps; `data-step="N"` on children marks which step each element belongs to.
- **`data-count="N"` + optional `data-decimal="N"`** on counter elements, consumed by `animateCounter`.
- **Animations live only in `animations[index]`** — never inline on elements.
- **Comma as decimal separator (es-CL)** — `3,6` not `3.6` in copy; the JS counter formats accordingly.
- **No JS fallback, no analytics, no backend.** Accessibility is basic (aria-labels, alt text, `lang="es"`) — context is presencial/projected, not public web.

## Scope boundary

This repo is the Alvi/April 2026 deck only. Each client gets its own repo and Vercel deploy (§13.2) so URLs don't cross-leak data between clients. The `shared/` engine and visual system should stay aligned with the spec; if you invent a genuinely new slide pattern, document it as a new `§7.x` entry in `base-presentacion-score-v2.md` following the HTML → CSS → animation → usage format (§19).
