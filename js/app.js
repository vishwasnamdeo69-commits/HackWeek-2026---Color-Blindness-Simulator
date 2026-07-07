/**
 * app.js
 * Application bootstrap. Wires DOM elements to the feature modules and
 * reacts to state changes. This is the only file that knows about all
 * the other modules — each of them stays focused on one job.
 */

import { SIMULATION_MODES } from './constants.js';
import { getState, setState, subscribe, resetState } from './state.js';
import { initUploader } from './uploader.js';
import { initRenderer, loadImage, renderMode } from './renderer.js';
import { initComparison, refreshComparisonVisual } from './comparison.js';
import { downloadCurrentSimulation } from './download.js';
import { formatBytes, prefersReducedMotion, debounce } from './utils.js';

// ---------- DOM refs ----------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadError = document.getElementById('uploadError');
const dropzoneUploaded = document.getElementById('dropzoneUploaded');
const dropzoneFilename = document.getElementById('dropzoneFilename');
const dropzoneMeta = document.getElementById('dropzoneMeta');

const workspaceEmpty = document.getElementById('workspaceEmpty');
const comparisonEl = document.getElementById('comparison');
const comparisonTrack = document.getElementById('comparisonTrack');
const comparisonHandle = document.getElementById('comparisonHandle');
const simulatedLayer = document.getElementById('simulatedLayer');
const originalCanvas = document.getElementById('originalCanvas');
const simulatedCanvas = document.getElementById('simulatedCanvas');
const simTag = document.getElementById('simTag');

const segmentedControl = document.getElementById('segmentedControl');
const segmentedIndicator = document.getElementById('segmentedIndicator');

const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadSuccess = document.getElementById('downloadSuccess');

// ---------- Segmented control ----------
function buildSegmentedControl() {
  SIMULATION_MODES.forEach((mode, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segmented__btn';
    btn.dataset.mode = mode.id;
    btn.textContent = mode.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => setState({ activeMode: mode.id }));
    segmentedControl.appendChild(btn);
  });
}

function moveIndicatorTo(button) {
  if (!button) return;
  segmentedIndicator.style.width = `${button.offsetWidth}px`;
  segmentedIndicator.style.transform = `translateX(${button.offsetLeft}px)`;
}

function syncSegmentedControl(activeMode) {
  const buttons = [...segmentedControl.querySelectorAll('.segmented__btn')];
  buttons.forEach((btn) => {
    const isActive = btn.dataset.mode === activeMode;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  const activeBtn = buttons.find((btn) => btn.dataset.mode === activeMode);
  moveIndicatorTo(activeBtn);
}

// ---------- Upload UI reactions ----------
function showUploadError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
  setTimeout(() => { uploadError.hidden = true; }, 4000);
}

function reflectUploadedFile() {
  const { originalFilename, originalFileSize, naturalWidth, naturalHeight } = getState();
  dropzoneUploaded.hidden = false;
  dropZone.querySelector('.dropzone__idle').hidden = true;
  dropzoneFilename.textContent = originalFilename;
  dropzoneMeta.textContent = `${naturalWidth} × ${naturalHeight} · ${formatBytes(originalFileSize)}`;
  dropZone.classList.add('is-uploaded');
}

function resetUploadUI() {
  dropzoneUploaded.hidden = true;
  dropZone.querySelector('.dropzone__idle').hidden = false;
  dropZone.classList.remove('is-uploaded');
}

// ---------- Workspace reactions ----------
function revealWorkspace() {
  workspaceEmpty.hidden = true;
  comparisonEl.hidden = false;
}

function hideWorkspace() {
  workspaceEmpty.hidden = false;
  comparisonEl.hidden = true;
}

// ---------- State subscription: single reactive core ----------
subscribe((state, changedKeys) => {
  if (changedKeys.includes('status')) {
    if (state.status === 'uploaded') {
      loadImage(state.originalImage);
      revealWorkspace();
      reflectUploadedFile();
      renderMode(state.activeMode);
      refreshComparisonVisual();
      downloadBtn.disabled = false;
      dropZone.classList.add('just-uploaded');
      setTimeout(() => dropZone.classList.remove('just-uploaded'), 700);
    } else {
      hideWorkspace();
      resetUploadUI();
      downloadBtn.disabled = true;
    }
  }

  if (changedKeys.includes('activeMode') && state.status === 'uploaded') {
    renderMode(state.activeMode);
    syncSegmentedControl(state.activeMode);
    const modeMeta = SIMULATION_MODES.find((m) => m.id === state.activeMode);
    simTag.textContent = modeMeta.label;
  }

  if (changedKeys.includes('sliderPosition')) {
    comparisonHandle.setAttribute('aria-valuenow', String(Math.round(state.sliderPosition)));
  }
});

// ---------- Reset / Download ----------
resetBtn.addEventListener('click', () => {
  resetState();
  syncSegmentedControl('original');
});

downloadBtn.addEventListener('click', () => {
  downloadCurrentSimulation({
    onComplete: () => {
      downloadSuccess.textContent = 'Downloaded ✓';
      downloadBtn.classList.add('pulse-success');
      setTimeout(() => {
        downloadSuccess.textContent = '';
        downloadBtn.classList.remove('pulse-success');
      }, 2200);
    },
  });
});

// ---------- Scroll reveal ----------
function initScrollReveal() {
  if (prefersReducedMotion()) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}

// ---------- Hero ambient spectrum field (signature element) ----------
// Renders a horizontal spectrum strip and continuously cycles it through
// each simulation mode, echoing the exact matrices used on real uploads.
function initHeroField() {
  const canvas = document.getElementById('heroField');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const modes = ['original', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
  let frame = 0;
  let running = !prefersReducedMotion();
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  function baseSpectrum(w, h) {
    const data = new ImageData(w, h);
    for (let x = 0; x < w; x += 1) {
      const hue = (x / w) * 300; // violet -> red arc, avoids harsh neon wrap
      const [r, g, b] = hslToRgb(hue / 360, 0.55, 0.5);
      for (let y = 0; y < h; y += 1) {
        const i = (y * w + x) * 4;
        data.data[i] = r;
        data.data[i + 1] = g;
        data.data[i + 2] = b;
        data.data[i + 3] = 255;
      }
    }
    return data;
  }

  function hslToRgb(h, s, l) {
    const k = (n) => (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  let spectrumData = null;
  let importedApplyMatrix = null;

  async function ensureMatrixFn() {
    if (!importedApplyMatrix) {
      const mod = await import('./simulator.js');
      importedApplyMatrix = mod.applyMatrix;
    }
    return importedApplyMatrix;
  }

  async function draw() {
    if (!canvas.width || !canvas.height) resize();
    if (!spectrumData || spectrumData.width !== canvas.width) {
      spectrumData = baseSpectrum(canvas.width, Math.max(1, Math.round(canvas.height / 6)));
    }
    const applyMatrix = await ensureMatrixFn();

    const cycleLength = 260; // frames per mode
    const modeIndex = Math.floor(frame / cycleLength) % modes.length;
    const mode = modes[modeIndex];

    // Clone so applyMatrix (which mutates) never corrupts the base spectrum.
    const clone = new ImageData(
      new Uint8ClampedArray(spectrumData.data),
      spectrumData.width,
      spectrumData.height
    );
    const transformed = applyMatrix(clone, mode);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bandHeight = transformed.height;
    const gap = 14 * dpr;
    const totalBands = 5;
    const startY = (canvas.height - (bandHeight * totalBands + gap * (totalBands - 1))) / 2;

    for (let b = 0; b < totalBands; b += 1) {
      const y = startY + b * (bandHeight + gap);
      ctx.globalAlpha = b === modeIndex % totalBands ? 0.9 : 0.16;
      ctx.putImageData(transformed, 0, Math.max(0, y));
    }
    ctx.globalAlpha = 1;

    frame += 1;
    if (running) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', debounce(() => {
    resize();
    spectrumData = null;
  }, 200));

  resize();
  requestAnimationFrame(draw);
}

// ---------- Init ----------
function init() {
  buildSegmentedControl();
  syncSegmentedControl('original');

  initRenderer({ originalCanvas, simulatedCanvas });
  initUploader({ dropZone, fileInput, onError: showUploadError });
  initComparison({ track: comparisonTrack, handle: comparisonHandle, simulatedLayer });
  initScrollReveal();
  initHeroField();

  window.addEventListener('resize', debounce(() => {
    if (getState().status === 'uploaded') refreshComparisonVisual();
  }, 150));
}

document.addEventListener('DOMContentLoaded', init);
