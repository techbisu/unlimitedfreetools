import { compressWithCompressor, getOutputFileName, getSmartSettings } from "./toolkit.js";

export { getSmartSettings };

export async function compressImage(file, userOptions = {}) {
  const smartSettings = getSmartSettings(file);
  const settings = {
    ...smartSettings,
    ...(typeof userOptions.quality === "number" ? { quality: userOptions.quality } : {})
  };
  const attemptQualities = getAttemptQualities(file.type, settings.quality, userOptions.manualQuality);
  let bestResult = null;

  for (const quality of attemptQualities) {
    const candidate = await compressWithCompressor(file, {
      quality,
      maxWidth: settings.maxWidth,
      mimeType: file.type,
      strict: false,
      checkOrientation: file.size <= 10 * 1024 * 1024
    });

    if (!bestResult || candidate.size < bestResult.size) {
      bestResult = candidate;
    }

    if (candidate.size < file.size) {
      bestResult = candidate;
      break;
    }
  }

  const didReduce = bestResult && bestResult.size < file.size;
  const outputBlob = didReduce ? bestResult : file;
  const fallbackNotice = didReduce
    ? ""
    : "This image could not be reduced without changing format, so the original file is kept.";

  return {
    blob: outputBlob,
    mimeType: outputBlob.type || file.type,
    fileName: getOutputFileName(outputBlob.type || file.type, file.name),
    settings,
    fallbackNotice
  };
}

function getAttemptQualities(mimeType, baseQuality, manualQuality = false) {
  if (mimeType === "image/png") {
    return [baseQuality];
  }

  if (manualQuality) {
    return [baseQuality];
  }

  return Array.from(new Set([baseQuality, 0.65, 0.5, 0.4, 0.3])).filter((quality) => quality <= baseQuality);
}
