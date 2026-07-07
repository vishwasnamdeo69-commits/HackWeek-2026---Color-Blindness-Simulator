# VisionShift

A browser-based color blindness simulator. Upload any image and instantly preview it through protanopia, deuteranopia, tritanopia, and achromatopsia — no backend, no upload, no install.

Built for HackWeek 2026.

![status](https://img.shields.io/badge/status-complete-6fcf9a) ![stack](https://img.shields.io/badge/stack-vanilla%20JS-6c6ce5) ![license](https://img.shields.io/badge/license-MIT-9d7ce8)

---

## Overview

Around 300 million people worldwide experience some form of color vision deficiency. Designers and developers rarely have an easy way to check whether their interfaces, charts, or illustrations still communicate clearly to them. VisionShift closes that gap with a single-page tool: drop in an image, pick a vision mode, and drag a slider to compare the original against the simulated result — all computed live with the Canvas API, entirely on your device.

## Features

- **Drag & drop or click-to-upload** — accepts PNG, JPG, and WEBP
- **Five vision modes** — Original, Protanopia, Deuteranopia, Tritanopia, Achromatopsia
- **Instant mode switching** — every mode is pre-computed once at upload time and cached, so there's no recompute lag when flipping between them
- **Interactive before/after slider** — mouse, touch, and keyboard (arrow keys, Home/End) all supported
- **Full-resolution download** — exports the currently simulated mode as a PNG named e.g. `mountain-protanopia.png`
- **One-click reset** — clears state and returns to the empty upload state without a page reload
- **Premium, animated UI** — ambient ​ ​ hero visualization, scroll reveals, spring-based segmented control, and restrained micro-interactions throughout
- **Accessible by default** — semantic HTML, ARIA roles on the slider and tabs, visible focus rings, and full `prefers-reduced-motion` support

## Screenshots

> _Add screenshots to `/screenshots` and reference them here before publishing._

| Hero | Upload | Comparison |
|---|---|---|
| `screenshots/hero.png` | `screenshots/upload.png` | `screenshots/comparison.png` |

## Tech stack

Vanilla HTML5, CSS3, and JavaScript (ES Modules). No frameworks, no build step, no external runtime dependencies. The only external resource is the Inter / JetBrains Mono font pairing loaded from Google Fonts.

## How the simulation works

Each color vision deficiency is modeled as a 3×3 matrix applied to the RGB channels of every pixel:

```
[R']   [m00 m01 m02]   [R]
[G'] = [m10 m11 m12] × [G]
[B']   [m20 m21 m22]   [B]
```

- **Protanopia / Deuteranopia / Tritanopia** use established approximation matrices for red-, green-, and blue-cone dichromacy respectively.
- **Achromatopsia** collapses all channels to perceived luminance (`0.299R + 0.587G + 0.114B`), simulating total color blindness.

On upload, the image is drawn once into an off-screen full-resolution canvas. Each mode's transformed `ImageData` is computed lazily on first view and cached in memory, so switching modes afterward is just a `putImageData` call — no recomputation, no visible lag, even on large images.

## Project structure

```
VisionShift/
├── index.html
├── css/
│   ├── variables.css     — design tokens (color, type, spacing, radius, motion)
│   ├── base.css          — resets, base typography, focus states
│   ├── layout.css        — navbar, hero, section grid, footer
│   ├── components.css    — buttons, dropzone, workspace, slider, segmented control
│   ├── animations.css    — keyframes and scroll-reveal transitions
│   └── responsive.css    — tablet and mobile breakpoints
├── js/
│   ├── app.js            — bootstrap; wires modules together and owns DOM reactions
│   ├── uploader.js        — drag & drop / click-to-upload, file validation
│   ├── simulator.js       — pure pixel-matrix color transformation logic
│   ├── renderer.js        — canvas setup, drawing, per-mode caching
│   ├── comparison.js      — before/after slider drag logic
│   ├── download.js        — PNG export at full resolution
│   ├── state.js           — single source of truth + pub/sub
│   ├── utils.js           — debounce, clamp, formatting helpers
│   └── constants.js       — simulation matrices and mode definitions
├── assets/
│   ├── icons/
│   └── illustrations/
├── screenshots/
├── README.md
└── LICENSE
```

Each module owns exactly one responsibility, so the color science, the canvas plumbing, the drag interaction, and the DOM wiring can each be read (and changed) in isolation.

## Accessibility notes

- Semantic landmarks (`header`, `main`, `footer`) and a skip-to-content link
- The comparison handle is a real `role="slider"` with `aria-valuemin/max/now`, fully operable by keyboard (arrow keys, Shift for larger steps, Home/End for extremes)
- The mode switcher uses `role="tablist"` / `role="tab"` with `aria-selected` kept in sync
- Every interactive element has a visible focus ring independent of mouse hover state
- All animation — the ambient hero field, blob drift, entrance transitions, and micro-interactions — is disabled when the OS-level `prefers-reduced-motion` setting is on

## Setup & usage

No build step required.

```bash
git clone <this-repo>
cd VisionShift
```

Then simply open `index.html` in a modern browser, or serve the folder locally (recommended, since some browsers restrict ES Modules over `file://`):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Visit the printed local URL, upload an image, and start comparing.

## Future improvements

- Batch processing of multiple images at once
- Support for anomalous trichromacy (protanomaly, deuteranomaly) in addition to full dichromacy
- A shareable link that re-hydrates the current image + mode via URL state
- WebGL-based processing for very large images
- An in-page contrast checker overlay for flagging low-contrast regions per mode

## License

MIT — see [LICENSE](./LICENSE).
