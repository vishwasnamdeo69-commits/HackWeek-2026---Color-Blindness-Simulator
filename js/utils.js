/**
 * utils.js
 * Small, pure, reusable helpers with no dependency on app state.
 */

/** Debounce: delay invoking fn until `wait` ms have passed since the last call. */
export function debounce(fn, wait = 150) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/** Clamp a number between min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Strip the extension from a filename, e.g. "mountain.png" -> "mountain". */
export function stripExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

/** Build a download filename like "mountain-protanopia.png". */
export function buildDownloadFilename(originalName, modeId, fallback) {
  const base = originalName ? stripExtension(originalName) : fallback;
  const safe = base.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').toLowerCase();
  return `${safe}-${modeId}.png`;
}

/** Format bytes into a human readable string, e.g. 2.4 MB. */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

/** Returns true if the user has requested reduced motion at the OS level. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** requestAnimationFrame-based throttle for drag/pointer handlers. */
export function rafThrottle(fn) {
  let scheduled = false;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      fn(...lastArgs);
      scheduled = false;
    });
  };
}
