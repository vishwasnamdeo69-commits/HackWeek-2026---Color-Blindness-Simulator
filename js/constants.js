/**
 * constants.js
 * Static configuration: simulation definitions and color transformation matrices.
 * No logic lives here — only data.
 */

// Row-major 3x3 matrices applied to linear-ish sRGB [0-255] channel values.
// These are the widely-used approximation matrices for dichromacy simulation
// (Protanopia / Deuteranopia / Tritanopia) plus a luminance-based grayscale
// transform for Achromatopsia (total color blindness).
export const SIMULATION_MATRICES = {
  original: null, // no transform
  protanopia: [
    0.567, 0.433, 0.0,
    0.558, 0.442, 0.0,
    0.0,   0.242, 0.758,
  ],
  deuteranopia: [
    0.625, 0.375, 0.0,
    0.7,   0.3,   0.0,
    0.0,   0.3,   0.7,
  ],
  tritanopia: [
    0.95, 0.05,  0.0,
    0.0,  0.433, 0.567,
    0.0,  0.475, 0.525,
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
  ],
};

// Ordered list drives both the segmented control UI and iteration order.
export const SIMULATION_MODES = [
  { id: 'original', label: 'Original', short: 'ORIG' },
  { id: 'protanopia', label: 'Protanopia', short: 'PROT' },
  { id: 'deuteranopia', label: 'Deuteranopia', short: 'DEUT' },
  { id: 'tritanopia', label: 'Tritanopia', short: 'TRIT' },
  { id: 'achromatopsia', label: 'Achromatopsia', short: 'ACHR' },
];

export const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const MAX_IMAGE_DIMENSION = 4096; // safety ceiling for canvas processing

export const DOWNLOAD_FILENAME_FALLBACK = 'image';
