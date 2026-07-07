/**
 * simulator.js
 * Pure color-transformation logic. Takes ImageData in, returns ImageData out.
 * Contains no DOM/canvas setup — that lives in renderer.js.
 */

import { SIMULATION_MATRICES } from './constants.js';

/**
 * Applies a 3x3 color transformation matrix to every pixel of an ImageData.
 * Mutates and returns a new ImageData-shaped Uint8ClampedArray for clarity;
 * operates in place on a copy to avoid touching the canvas source data.
 */
export function applyMatrix(imageData, modeId) {
  const matrix = SIMULATION_MATRICES[modeId];
  if (!matrix) {
    // 'original' or unknown mode: no transformation needed.
    return imageData;
  }

  const data = imageData.data;
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = matrix;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // alpha (data[i + 3]) passes through untouched

    data[i] = clampChannel(m00 * r + m01 * g + m02 * b);
    data[i + 1] = clampChannel(m10 * r + m11 * g + m12 * b);
    data[i + 2] = clampChannel(m20 * r + m21 * g + m22 * b);
  }

  return imageData;
}

function clampChannel(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}
