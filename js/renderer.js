/**
 * renderer.js
 * Owns the canvases. Draws the source image at full resolution into an
 * offscreen buffer, and produces per-mode simulated canvases on demand,
 * caching results so switching modes back and forth is instant.
 */

import { applyMatrix } from './simulator.js';

let sourceCanvas, sourceCtx; // full-resolution, never mutated after first draw
let originalDisplayCanvas, originalDisplayCtx; // "before" layer shown to the user
let simulatedDisplayCanvas, simulatedDisplayCtx; // "after" layer shown to the user

const modeCache = new Map(); // modeId -> ImageData (full resolution)

export function initRenderer({ originalCanvas, simulatedCanvas }) {
  originalDisplayCanvas = originalCanvas;
  originalDisplayCtx = originalCanvas.getContext('2d');
  simulatedDisplayCanvas = simulatedCanvas;
  simulatedDisplayCtx = simulatedCanvas.getContext('2d');

  sourceCanvas = document.createElement('canvas');
  sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
}

/** Loads a freshly uploaded image into the full-res buffer and resets cache. */
export function loadImage(img) {
  modeCache.clear();

  const { naturalWidth: w, naturalHeight: h } = img;
  [sourceCanvas, originalDisplayCanvas, simulatedDisplayCanvas].forEach((canvas) => {
    canvas.width = w;
    canvas.height = h;
  });

  sourceCtx.drawImage(img, 0, 0, w, h);
  originalDisplayCtx.drawImage(img, 0, 0, w, h);

  // Cache the untouched original under 'original' so mode switching is uniform.
  modeCache.set('original', sourceCtx.getImageData(0, 0, w, h));
}

/** Returns a cached (or freshly computed) full-resolution ImageData for a mode. */
function getModeImageData(modeId) {
  if (modeCache.has(modeId)) return modeCache.get(modeId);

  const { width, height } = sourceCanvas;
  const fresh = sourceCtx.getImageData(0, 0, width, height);
  const transformed = applyMatrix(fresh, modeId);
  modeCache.set(modeId, transformed);
  return transformed;
}

/** Draws the given mode into the visible "simulated" canvas. */
export function renderMode(modeId) {
  const imageData = getModeImageData(modeId);
  simulatedDisplayCtx.putImageData(imageData, 0, 0);
}

/** Returns the full-resolution simulated canvas for a mode, for export use. */
export function getFullResolutionCanvas(modeId) {
  const imageData = getModeImageData(modeId);
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = imageData.width;
  exportCanvas.height = imageData.height;
  exportCanvas.getContext('2d').putImageData(imageData, 0, 0);
  return exportCanvas;
}
