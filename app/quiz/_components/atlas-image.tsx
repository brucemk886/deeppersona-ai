"use client";

import { useCallback, useState } from "react";
import { optimizedAtlases } from "@/app/quiz/_lib/atlases";

type AtlasImageProps = {
  path: string;
  index: number;
  className?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  sizes?: string;
};

export function AtlasImage({
  path,
  index,
  className = "",
  loading = "lazy",
  priority = false,
  sizes = "(max-width: 640px) 360px, 600px",
}: AtlasImageProps) {
  const [loadedPath, setLoadedPath] = useState("");
  const optimized = optimizedAtlases[path];
  const loaded = loadedPath === path;
  const markLoaded = useCallback(() => setLoadedPath(path), [path]);
  const registerImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth > 0) markLoaded();
    },
    [markLoaded],
  );

  return (
    <span className={`atlas-image atlas-${index} ${loaded ? "is-loaded" : "is-loading"} ${className}`.trim()} aria-hidden="true">
      <picture>
        {optimized ? <source sizes={sizes} srcSet={`${optimized.compact} 768w, ${optimized.full} 1254w`} type="image/webp" /> : null}
        <img
          alt=""
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height="1254"
          loading={loading}
          onLoad={markLoaded}
          ref={registerImage}
          sizes={sizes}
          src={path}
          width="1254"
        />
      </picture>
    </span>
  );
}
