import { clamp, fitWithin, loadImage } from "./browser-media.js";

export async function detectFaceLocally(dataUrl) {
  const image = await loadImage(dataUrl);

  if ("FaceDetector" in window) {
    const detector = new window.FaceDetector({
      fastMode: true,
      maxDetectedFaces: 1
    });
    const faces = await detector.detect(image);
    const face = faces[0];

    if (face?.boundingBox) {
      return {
        image,
        box: face.boundingBox,
        mode: "detector"
      };
    }
  }

  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, 420);
  return {
    image,
    box: {
      x: width * 0.22,
      y: height * 0.12,
      width: width * 0.56,
      height: height * 0.68
    },
    mode: "fallback"
  };
}

export function calculateFunFaceScores(image, box) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.width));
  canvas.height = Math.max(1, Math.round(box.height));
  const context = canvas.getContext("2d");
  context.drawImage(
    image,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let upperBrightness = 0;
  let lowerBrightness = 0;
  let centerWarmth = 0;
  let pixelCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const brightness = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
      const warmth = data[offset] - data[offset + 2];

      if (y < height * 0.45) {
        upperBrightness += brightness;
      } else {
        lowerBrightness += brightness;
      }

      if (x > width * 0.25 && x < width * 0.75) {
        centerWarmth += warmth;
      }

      pixelCount += 1;
    }
  }

  const upperAvg = upperBrightness / Math.max(1, pixelCount * 0.45);
  const lowerAvg = lowerBrightness / Math.max(1, pixelCount * 0.55);
  const warmthAvg = centerWarmth / Math.max(1, pixelCount * 0.5);
  const smileScore = Math.round(clamp(48 + (lowerAvg - upperAvg) * 0.22 + warmthAvg * 0.08, 12, 98));
  const confidence = Math.round(clamp(54 + Math.abs(warmthAvg) * 0.12 + Math.abs(lowerAvg - upperAvg) * 0.18, 30, 97));
  const funRating = Math.round(clamp((smileScore * 0.45 + confidence * 0.4 + 18), 20, 99));

  return {
    smileScore,
    confidence,
    funRating
  };
}
