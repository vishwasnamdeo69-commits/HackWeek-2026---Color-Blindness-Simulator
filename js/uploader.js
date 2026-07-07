/**
 * uploader.js
 * Owns everything related to getting an image file from the user into
 * an HTMLImageElement: drag & drop, click-to-upload, and validation.
 * Emits state changes; does not touch the canvas or DOM beyond the drop zone.
 */

import { ACCEPTED_MIME_TYPES } from './constants.js';
import { setState } from './state.js';

let dropZoneEl, fileInputEl, onErrorCallback;

function isAcceptedFile(file) {
  return file && ACCEPTED_MIME_TYPES.includes(file.type);
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image file.'));
    img.src = url;
  });
}

async function handleFile(file) {
  if (!isAcceptedFile(file)) {
    onErrorCallback?.('Please upload a PNG, JPG, or WEBP image.');
    return;
  }
  try {
    dropZoneEl.classList.add('is-loading');
    const img = await readFileAsImage(file);
    setState({
      status: 'uploaded',
      originalImage: img,
      originalFilename: file.name,
      originalFileSize: file.size,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      activeMode: 'original',
      sliderPosition: 50,
    });
  } catch (err) {
    onErrorCallback?.(err.message);
  } finally {
    dropZoneEl.classList.remove('is-loading');
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

export function initUploader({ dropZone, fileInput, onError }) {
  dropZoneEl = dropZone;
  fileInputEl = fileInput;
  onErrorCallback = onError;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZoneEl.addEventListener(eventName, preventDefaults);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZoneEl.addEventListener(eventName, () => dropZoneEl.classList.add('is-dragging'));
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZoneEl.addEventListener(eventName, () => dropZoneEl.classList.remove('is-dragging'));
  });

  dropZoneEl.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });

  dropZoneEl.addEventListener('click', () => fileInputEl.click());

  dropZoneEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputEl.click();
    }
  });

  fileInputEl.addEventListener('change', () => {
    const file = fileInputEl.files?.[0];
    if (file) handleFile(file);
    fileInputEl.value = ''; // allow re-selecting the same file
  });
}
