const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeVideoId(input) {
  const value = input.trim();

  if (!value) {
    throw new Error("Paste a YouTube URL or a valid video ID.");
  }

  if (ID_PATTERN.test(value)) {
    return value;
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid YouTube link.");
  }

  if (url.hostname.includes("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];

    if (ID_PATTERN.test(id)) {
      return id;
    }
  }

  if (url.searchParams.get("v") && ID_PATTERN.test(url.searchParams.get("v"))) {
    return url.searchParams.get("v");
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const candidate = pathSegments[pathSegments.length - 1];

  if (["embed", "shorts", "live", "v"].includes(pathSegments[0]) && ID_PATTERN.test(candidate)) {
    return candidate;
  }

  throw new Error("The YouTube URL format is not supported.");
}

export function getYoutubeThumbnailOptions(videoId) {
  return [
    {
      key: "maxresdefault",
      label: "Max resolution",
      url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    },
    {
      key: "hqdefault",
      label: "HQ thumbnail",
      url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    }
  ];
}
