import { useQueries, UseQueryResult } from "@tanstack/react-query";
import * as PIXI from "pixi.js";
import { LoadedClip, PlayableClip } from "../types/loader";
import { useCallback } from "react";

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    console.log("loading video", src);
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = false;
    video.autoplay = false;
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

function loadAudioElement(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.src = src;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const onCanPlayThrough = () => {
        cleanup();
        resolve(audio);
      };
      const onError = (e: any) => {
        cleanup();
        reject(e);
      };
  
      function cleanup() {
        audio.removeEventListener("canplaythrough", onCanPlayThrough);
        audio.removeEventListener("error", onError);
      }
  
      audio.addEventListener("canplaythrough", onCanPlayThrough);
      audio.addEventListener("error", onError);
  
      audio.load();
  });
}

export interface LoadedClips {
  loadedPlayables: UseQueryResult<LoadedClip | undefined>[];
  allLoaded: boolean;
  getLoadedClipAtTime: (timeMs: number) => LoadedClip | undefined;
}

// TODO: SEPARATE CLIP SETTING LOGIC FROM LOADING LOGIC
// THIS IS PREVENTING THE CLIPS FROM BEING UPDATED WHEN THE CLIP PARAMS CHANGES
export function usePlayableLoader(clips: PlayableClip[]): LoadedClips {
  const results = useQueries({
    queries: clips.map((clip) => ({
      queryKey: ["playable", clip.id, clip.src],
      queryFn: async (): Promise<LoadedClip | undefined> => {
        if (clip.type === "video") {
          const video = await loadVideoElement(clip.src);
          const texture = PIXI.Texture.from(video);
          return {
            ...clip,
            video,
            image: null,
            texture,
          };
        } else if (clip.type === "audio") {
          const audio = await loadAudioElement(clip.src);
          return {
            ...clip,
            audio,
          };
        } else if (clip.type === "image")  {
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
    (entry) => !entry.isLoading && !entry.isError
  );

  const getLoadedClipAtTime = useCallback((
      timeMs: number
  ): LoadedClip | undefined => {
      return results.find(
          (clip) =>
              clip?.data?.start_ms! <= timeMs &&
              clip?.data?.start_ms! + clip?.data?.duration_ms! > timeMs
      )?.data;
  }, [results]);

  return { loadedPlayables: results, allLoaded, getLoadedClipAtTime };
}
