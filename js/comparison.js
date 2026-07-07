/**
 * comparison.js
 * Drives the interactive before/after slider: pointer dragging (mouse +
 * touch, unified via the Pointer Events API), keyboard control, and
 * translating a 0-100 position into the clip-path that reveals the
 * simulated layer.
 */

import { clamp, rafThrottle } from './utils.js';
import { setState, getState } from './state.js';

let trackEl, handleEl, simulatedLayerEl;
let isDragging = false;

function positionToClipPath(position) {
  return `inset(0 0 0 ${position}%)`;
}

function applyVisualPosition(position) {
  simulatedLayerEl.style.clipPath = positionToClipPath(position);
  handleEl.style.left = `${position}%`;
}

function positionFromClientX(clientX) {
  const rect = trackEl.getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  return clamp(ratio * 100, 0, 100);
}

const throttledApply = rafThrottle((position) => {
  applyVisualPosition(position);
  setState({ sliderPosition: position });
});

function onPointerMove(e) {
  if (!isDragging) return;
  const position = positionFromClientX(e.clientX);
  throttledApply(position);
}

function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;
  handleEl.releasePointerCapture?.(e.pointerId);
  handleEl.classList.remove('is-dragging');
}

function onPointerDown(e) {
  isDragging = true;
  handleEl.setPointerCapture?.(e.pointerId);
  handleEl.classList.add('is-dragging');
  const position = positionFromClientX(e.clientX);
  throttledApply(position);
}

function onTrackClick(e) {
  if (e.target === handleEl || isDragging) return;
  const position = positionFromClientX(e.clientX);
  applyVisualPosition(position);
  setState({ sliderPosition: position });
}

function onKeyDown(e) {
  const state = getState();
  const step = e.shiftKey ? 10 : 3;
  let next = state.sliderPosition;

  if (e.key === 'ArrowLeft') next = clamp(next - step, 0, 100);
  else if (e.key === 'ArrowRight') next = clamp(next + step, 0, 100);
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = 100;
  else return;

  e.preventDefault();
  applyVisualPosition(next);
  setState({ sliderPosition: next });
}

export function initComparison({ track, handle, simulatedLayer }) {
  trackEl = track;
  handleEl = handle;
  simulatedLayerEl = simulatedLayer;

  handleEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  trackEl.addEventListener('click', onTrackClick);
  handleEl.addEventListener('keydown', onKeyDown);

  applyVisualPosition(getState().sliderPosition);
}

/** Called externally (e.g. on resize or mode change) to reassert the current position. */
export function refreshComparisonVisual() {
  applyVisualPosition(getState().sliderPosition);
}
