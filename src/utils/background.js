import { preload, removeBackground } from "@imgly/background-removal";

let preloadPromise;

export async function preloadBackgroundRemoval(onProgress) {
  if (!preloadPromise) {
    preloadPromise = preload({
      progress: (_key, current, total) => {
        if (!onProgress) {
          return;
        }

        const ratio = total ? current / total : 0;
        onProgress(Math.max(5, Math.round(ratio * 35)));
      }
    });
  }

  await preloadPromise;
}

export async function removeImageBackground(file, onProgress) {
  await preloadBackgroundRemoval(onProgress);

  const blob = await removeBackground(file, {
    progress: (_key, current, total) => {
      if (!onProgress) {
        return;
      }

      const ratio = total ? current / total : 0;
      onProgress(Math.max(40, Math.round(40 + ratio * 60)));
    }
  });

  return {
    blob,
    originalSize: file.size,
    convertedSize: blob.size,
    previewUrl: URL.createObjectURL(blob)
  };
}
