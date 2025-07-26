import { useQueries, UseQueryResult } from "@tanstack/react-query";
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
  video: z.instanceof(HTMLVideoElement).nullable().optional(),
  image: z.instanceof(HTMLImageElement).nullable().optional(),
  texture: z.instanceof(PIXI.Texture).nullable(),
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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.src = src;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (e) => {
      reject(e);
    };
  });
}

export interface LoadedVisuals {
  loadedVisuals: UseQueryResult<LoadedVisualClip>[];
  allLoaded: boolean;
}

export function useVisualLoader(clips: PlayableVisualClip[]): LoadedVisuals {
  const results = useQueries({
    queries: clips.map((clip, idx) => ({
      queryKey: ["visual", clip.src, idx],
      queryFn: async (): Promise<LoadedVisualClip> => {
        if (clip.type === "video") {
          const video = await loadVideoElement(clip.src);
          const texture = PIXI.Texture.from(video);
          return {
            ...clip,
            video,
            image: null,
            texture,
          };
        } else {
          const image = await loadImageElement(clip.src);
          const texture = PIXI.Texture.from(image);
          return {
            ...clip,
            video: null,
            image,
            texture,
          };
        }
      },
      staleTime: Infinity,
      cacheTime: Infinity,
    })),
  });

  const allLoaded = results.every(
    (entry) => entry.data?.texture !== null && !entry.isLoading && !entry.isError
  );

  return { loadedVisuals: results, allLoaded };
}
