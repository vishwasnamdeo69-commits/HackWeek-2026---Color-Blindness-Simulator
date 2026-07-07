/**
 * download.js
 * Handles exporting the currently simulated image at full resolution.
 */

import { getFullResolutionCanvas } from './renderer.js';
import { buildDownloadFilename } from './utils.js';
import { DOWNLOAD_FILENAME_FALLBACK } from './constants.js';
import { getState } from './state.js';

export function downloadCurrentSimulation({ onComplete } = {}) {
  const { activeMode, originalFilename } = getState();
  const canvas = getFullResolutionCanvas(activeMode);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildDownloadFilename(originalFilename, activeMode, DOWNLOAD_FILENAME_FALLBACK);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onComplete?.();
  }, 'image/png');
}
