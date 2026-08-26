export const optimizedAtlases: Record<string, { full: string; compact: string }> = {
  "/quiz/doors.png": { full: "/quiz/doors.webp", compact: "/quiz/doors-768.webp" },
  "/quiz/landscapes.png": { full: "/quiz/landscapes.webp", compact: "/quiz/landscapes-768.webp" },
  "/quiz/rooms.png": { full: "/quiz/rooms.webp", compact: "/quiz/rooms-768.webp" },
  "/quiz/symbols.png": { full: "/quiz/symbols.webp", compact: "/quiz/symbols-768.webp" },
};

export function preloadAtlas(path: string) {
  if (typeof window === "undefined") return;
  const optimized = optimizedAtlases[path];
  const image = new Image();
  image.decoding = "async";
  if (optimized) {
    image.srcset = `${optimized.compact} 768w, ${optimized.full} 1254w`;
    image.sizes = "(max-width: 640px) 360px, 600px";
    image.src = optimized.full;
  } else {
    image.src = path;
  }
  void image.decode().catch(() => undefined);
}
