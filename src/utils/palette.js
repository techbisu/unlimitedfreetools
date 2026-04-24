import { clamp } from "./browser-media.js";

function distance(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function extractPaletteFromImage(image, { colorCount = 6, sampleStep = 12 } = {}) {
  const canvas = document.createElement("canvas");
  const maxSide = 220;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const samples = [];

  for (let index = 0; index < data.length; index += sampleStep * 4) {
    const alpha = data[index + 3];
    if (alpha < 180) {
      continue;
    }

    const rgb = [data[index], data[index + 1], data[index + 2]];
    const spread = Math.max(...rgb) - Math.min(...rgb);
    if (spread < 8) {
      continue;
    }

    samples.push(rgb);
  }

  if (!samples.length) {
    return ["#111827", "#475569", "#94a3b8"];
  }

  const clusters = samples.slice(0, colorCount).map((sample) => [...sample]);

  while (clusters.length < colorCount) {
    clusters.push([...samples[clusters.length % samples.length]]);
  }

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const buckets = Array.from({ length: colorCount }, () => []);

    samples.forEach((sample) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      clusters.forEach((cluster, index) => {
        const nextDistance = distance(sample, cluster);
        if (nextDistance < bestDistance) {
          bestDistance = nextDistance;
          bestIndex = index;
        }
      });

      buckets[bestIndex].push(sample);
    });

    buckets.forEach((bucket, index) => {
      if (!bucket.length) {
        return;
      }

      clusters[index] = [
        Math.round(bucket.reduce((sum, color) => sum + color[0], 0) / bucket.length),
        Math.round(bucket.reduce((sum, color) => sum + color[1], 0) / bucket.length),
        Math.round(bucket.reduce((sum, color) => sum + color[2], 0) / bucket.length)
      ];
    });
  }

  return clusters
    .map((cluster) => cluster.map((value) => clamp(value, 0, 255)))
    .sort((a, b) => (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]))
    .map((cluster) => toHex(cluster))
    .filter((value, index, values) => values.indexOf(value) === index);
}
