import { useQueries, UseQueryResult } from "@tanstack/react-query";
import * as PIXI from "pixi.js";
import { LoadedClip, PlayableClip, PlayableMedia } from "../types/loader";
import { useCallback, useMemo } from "react";

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    // console.log("loading video", src);
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
  loadedPlayables: LoadedClip[];
  allLoaded: boolean;
  getLoadedClipAtTime: (timeMs: number) => LoadedClip | undefined;
}

// TODO: SEPARATE CLIP SETTING LOGIC FROM LOADING LOGIC
// THIS IS PREVENTING THE CLIPS FROM BEING UPDATED WHEN THE CLIP PARAMS CHANGES
export function usePlayableLoader(clips: PlayableClip[]): LoadedClips {
  // console.log("usePlayableLoader", clips);
  const results = useQueries({
    queries: clips.map((clip) => ({
      queryKey: ["playable", clip.id, clip.src],
      queryFn: async (): Promise<PlayableMedia | undefined> => {
        if (clip.type === "video") {
          const video = await loadVideoElement(clip.src);
          const texture = PIXI.Texture.from(video);
          return {
            video,
            texture,
          };
        } else if (clip.type === "audio") {
          const audio = await loadAudioElement(clip.src);
          return {
            audio,
          };
        } else if (clip.type === "image")  {
          const image = await loadImageElement(clip.src);
          const texture = PIXI.Texture.from(image);
          return {
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

  const loadedPlayables: LoadedClip[] = useMemo(() => {
    return clips.map((clip, idx) => {
      return {
        ...clip,
        ...results[idx].data,
        isLoading: results[idx].isLoading,
        isError: results[idx].isError,
        error: results[idx].error?.message,
      }
    })
  }, [results, clips])

  const getLoadedClipAtTime = useCallback((
      timeMs: number
  ): LoadedClip | undefined => {
      return loadedPlayables.find(
          (clip) =>
              clip?.start_ms! <= timeMs &&
              clip?.start_ms! + clip?.duration_ms! > timeMs
      );
  }, [loadedPlayables]);

  return { loadedPlayables, allLoaded, getLoadedClipAtTime };
}
