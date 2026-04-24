import { clamp } from "./browser-media.js";

function boxBlur(values, width, height, radius) {
  if (radius <= 0) {
    return values.slice();
  }

  const horizontal = new Float32Array(values.length);
  const output = new Float32Array(values.length);

  for (let y = 0; y < height; y += 1) {
    let sum = 0;

    for (let offset = -radius; offset <= radius; offset += 1) {
      const sampleX = clamp(offset, 0, width - 1);
      sum += values[y * width + sampleX];
    }

    for (let x = 0; x < width; x += 1) {
      horizontal[y * width + x] = sum / (radius * 2 + 1);
      const removeX = clamp(x - radius, 0, width - 1);
      const addX = clamp(x + radius + 1, 0, width - 1);
      sum += values[y * width + addX] - values[y * width + removeX];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;

    for (let offset = -radius; offset <= radius; offset += 1) {
      const sampleY = clamp(offset, 0, height - 1);
      sum += horizontal[sampleY * width + x];
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / (radius * 2 + 1);
      const removeY = clamp(y - radius, 0, height - 1);
      const addY = clamp(y + radius + 1, 0, height - 1);
      sum += horizontal[addY * width + x] - horizontal[removeY * width + x];
    }
  }

  return output;
}

function sobelEdges(values, width, height) {
  const edges = new Float32Array(values.length);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = values[(y - 1) * width + (x - 1)];
      const top = values[(y - 1) * width + x];
      const topRight = values[(y - 1) * width + (x + 1)];
      const left = values[y * width + (x - 1)];
      const right = values[y * width + (x + 1)];
      const bottomLeft = values[(y + 1) * width + (x - 1)];
      const bottom = values[(y + 1) * width + x];
      const bottomRight = values[(y + 1) * width + (x + 1)];

      const gx = -topLeft + topRight - (left * 2) + right * 2 - bottomLeft + bottomRight;
      const gy = -topLeft - top * 2 - topRight + bottomLeft + bottom * 2 + bottomRight;

      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}

export function applySketchEffect(imageData, { blurRadius = 5, edgeStrength = 0.6, contrast = 1.05 } = {}) {
  const { data, width, height } = imageData;
  const grayscale = new Float32Array(width * height);

  for (let index = 0; index < grayscale.length; index += 1) {
    const offset = index * 4;
    grayscale[index] = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }

  const inverted = grayscale.map((value) => 255 - value);
  const blurred = boxBlur(inverted, width, height, blurRadius);
  const edges = sobelEdges(grayscale, width, height);
  const nextPixels = new Uint8ClampedArray(data.length);

  for (let index = 0; index < grayscale.length; index += 1) {
    const dodge = clamp((grayscale[index] * 255) / (255 - blurred[index] + 1), 0, 255);
    const edgeDarkening = clamp((edges[index] / 255) * edgeStrength * 255, 0, 255);
    const contrasted = clamp((dodge - 128) * contrast + 128, 0, 255);
    const finalValue = clamp(contrasted - edgeDarkening, 0, 255);
    const offset = index * 4;

    nextPixels[offset] = finalValue;
    nextPixels[offset + 1] = finalValue;
    nextPixels[offset + 2] = finalValue;
    nextPixels[offset + 3] = data[offset + 3];
  }

  return new ImageData(nextPixels, width, height);
}
