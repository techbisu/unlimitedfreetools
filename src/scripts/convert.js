import {
  canEncodeMimeType,
  blobToImageData,
  compressWithCompressor,
  getOutputFileName,
  getSmartSettings,
  resolveConversionMime
} from "./toolkit.js";

export async function convertImage(file, requestedMimeType = "image/webp", userOptions = {}) {
  const smartSettings = getSmartSettings(file);
  const settings = {
    ...smartSettings,
    losslessAvif: Boolean(userOptions.losslessAvif),
    ...(typeof userOptions.quality === "number" ? { quality: userOptions.quality } : {})
  };
  const resolvedMimeType = await resolveConversionMime(requestedMimeType);
  const fallbackNotice =
    requestedMimeType === "image/avif" && resolvedMimeType !== "image/avif"
      ? `AVIF export is not available in this environment. Downloading ${resolvedMimeType === "image/webp" ? "WebP" : "JPG"} instead.`
      : "";

  if (resolvedMimeType === "image/avif") {
    if (settings.losslessAvif) {
      try {
        const imageData = await blobToImageData(file, file.type === "image/jpeg" ? "#ffffff" : null);
        const { encode } = await import("@jsquash/avif");
        const avifBuffer = await encode(imageData, {
          lossless: true,
          speed: 8
        });
        const avifBlob = new Blob([avifBuffer], { type: "image/avif" });

        return {
          blob: avifBlob,
          mimeType: "image/avif",
          fileName: getOutputFileName("image/avif", file.name),
          settings,
          fallbackNotice,
          summaryLabel: "AVIF lossless - original dimensions preserved"
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown AVIF encoder error.";
        throw new Error(`AVIF lossless export failed. ${message}`);
      }
    }

    const stagingMimeType = (await canEncodeMimeType("image/webp")) ? "image/webp" : "image/jpeg";
    const staged = await compressWithCompressor(file, {
      quality: settings.quality,
      maxWidth: settings.maxWidth,
      mimeType: stagingMimeType,
      strict: false,
      checkOrientation: file.size <= 10 * 1024 * 1024
    });

    try {
      const imageData = await blobToImageData(staged, stagingMimeType === "image/jpeg" ? "#ffffff" : null);
      const { encode } = await import("@jsquash/avif");
      const avifBuffer = await encode(imageData, {
        quality: Math.round(settings.quality * 100),
        lossless: false,
        speed: 6
      });
      const avifBlob = new Blob([avifBuffer], { type: "image/avif" });

      return {
        blob: avifBlob,
        mimeType: "image/avif",
        fileName: getOutputFileName("image/avif", file.name),
        settings,
        fallbackNotice,
        summaryLabel: `AVIF - max width ${settings.maxWidth}px - quality ${settings.quality}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AVIF encoder error.";
      throw new Error(`AVIF export failed. ${message}`);
    }
  }

  const result = await compressWithCompressor(file, {
    ...(resolvedMimeType === "image/png" ? {} : { quality: settings.quality }),
    maxWidth: settings.maxWidth,
    mimeType: resolvedMimeType,
    strict: false,
    checkOrientation: file.size <= 10 * 1024 * 1024
  });

  return {
    blob: result,
    mimeType: result.type || resolvedMimeType,
    fileName: getOutputFileName(result.type || resolvedMimeType, file.name),
    settings,
    fallbackNotice,
    summaryLabel: ""
  };
}
