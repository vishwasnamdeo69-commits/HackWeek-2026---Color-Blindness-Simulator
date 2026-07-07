/**
 * state.js
 * Single source of truth for application state, with a minimal pub/sub
 * layer so modules can react to changes without polling each other.
 */

const listeners = new Set();

const state = {
  status: 'idle', // 'idle' | 'uploaded'
  originalImage: null, // HTMLImageElement
  originalFilename: null,
  originalFileSize: null,
  activeMode: 'original',
  sliderPosition: 50, // percentage 0-100
  naturalWidth: 0,
  naturalHeight: 0,
};

/** Subscribe to any state change. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(changedKeys) {
  listeners.forEach((listener) => listener(state, changedKeys));
}

/** Shallow-merge a patch into state and notify subscribers. */
export function setState(patch) {
  const changedKeys = Object.keys(patch);
  Object.assign(state, patch);
  notify(changedKeys);
}

/** Read-only snapshot accessor. */
export function getState() {
  return state;
}

export function resetState() {
  setState({
    status: 'idle',
    originalImage: null,
    originalFilename: null,
    originalFileSize: null,
    activeMode: 'original',
    sliderPosition: 50,
    naturalWidth: 0,
    naturalHeight: 0,
  });
}
