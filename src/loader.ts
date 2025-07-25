import { useQueries } from "@tanstack/react-query";
import * as PIXI from "pixi.js";
import { ClipSchema } from "./type";
import z from "zod";

export const PlayableVisualClipSchema = ClipSchema.extend({
  type: z.enum(["image", "video"]),
  src: z.string(),
});
export type PlayableVisualClip = z.infer<typeof PlayableVisualClipSchema>;

/**
 * 
 * {
      clip: clips[idx],
      video,
      texture,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
    }
 */

export const LoadedVisualClipSchema = PlayableVisualClipSchema.extend({
  video: z.instanceof(HTMLVideoElement).nullable(),
  // image: z.instanceof(HTMLImageElement).nullable(),
  texture: z.instanceof(PIXI.Texture).nullable(),
  isLoading: z.boolean(),
  isError: z.boolean(),
  error: z.any().nullable(),
});
export type LoadedVisualClip = z.infer<typeof LoadedVisualClipSchema>;

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    console.log("loading video", src);
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.preload = "auto";

    const onCanPlayThrough = () => {
      cleanup();
      resolve(video);
    };
    const onError = (e: any) => {
      cleanup();
      reject(e);
    };

    function cleanup() {
      video.removeEventListener("canplaythrough", onCanPlayThrough);
      video.removeEventListener("error", onError);
    }

    video.addEventListener("canplaythrough", onCanPlayThrough);
    video.addEventListener("error", onError);

    video.load();
  });
}

// function loadImageElement(src: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const image = document.createElement('img');
//     image.src = src;
//     image.crossOrigin = 'anonymous';
//   });
// }

export interface LoadedVisuals {
  loadedVisuals: LoadedVisualClip[];
  allLoaded: boolean;
}

export function useVisualLoader(clips: PlayableVisualClip[]): LoadedVisuals {
  const results = useQueries({
    queries: clips.map((clip, idx) => ({
      queryKey: ["video", clip.src, idx],
      queryFn: async () => loadVideoElement(clip.src),
      staleTime: Infinity,
      cacheTime: Infinity,
    })),
  });

  const loadedVisuals = results.map((result, idx) => {
    const video = result.data ?? null;
    const texture = video ? PIXI.Texture.from(video) : null;
    const clip: PlayableVisualClip = clips[idx];

    return {
      ...clip,
      video,
      texture,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
    };
  });

  const allLoaded = loadedVisuals.every(
    (entry) => entry.texture !== null && !entry.isLoading && !entry.isError
  );

  return { loadedVisuals, allLoaded };
}
