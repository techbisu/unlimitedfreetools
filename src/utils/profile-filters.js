import { clamp } from "./browser-media.js";
import { applySketchEffect } from "./sketch.js";

export function applyProfessionalTone(imageData) {
  const { data } = imageData;
  const next = new Uint8ClampedArray(data.length);

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;

    next[index] = clamp(luminance * 0.08 + r * 1.08 + 8, 0, 255);
    next[index + 1] = clamp(luminance * 0.06 + g * 1.03 + 4, 0, 255);
    next[index + 2] = clamp(luminance * 0.12 + b * 0.94 + 12, 0, 255);
    next[index + 3] = data[index + 3];
  }

  return new ImageData(next, imageData.width, imageData.height);
}

export function applyCartoonTone(imageData) {
  const { data } = imageData;
  const next = new Uint8ClampedArray(data.length);

  for (let index = 0; index < data.length; index += 4) {
    next[index] = Math.round(data[index] / 32) * 32;
    next[index + 1] = Math.round(data[index + 1] / 32) * 32;
    next[index + 2] = Math.round(data[index + 2] / 32) * 32;
    next[index + 3] = data[index + 3];
  }

  return new ImageData(next, imageData.width, imageData.height);
}

export function applyLiteProfileFilter(imageData, style) {
  if (style === "sketch") {
    return applySketchEffect(imageData, {
      blurRadius: 4,
      edgeStrength: 0.72,
      contrast: 1.1
    });
  }

  if (style === "professional") {
    return applyProfessionalTone(imageData);
  }

  return applyCartoonTone(imageData);
}
