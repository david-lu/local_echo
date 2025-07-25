import { useQueries } from '@tanstack/react-query';

type VideoClip = {
  src: string;
  startTimeMs: number;
  durationMs: number;
};

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.preload = 'auto';

    const onCanPlayThrough = () => {
      cleanup();
      resolve(video);
    };
    const onError = (e: any) => {
      cleanup();
      reject(e);
    };

    function cleanup() {
      video.removeEventListener('canplaythrough', onCanPlayThrough);
      video.removeEventListener('error', onError);
    }

    video.addEventListener('canplaythrough', onCanPlayThrough);
    video.addEventListener('error', onError);

    video.load();
  });
}

export function usePreloadVideosWithQueries(clips: VideoClip[]) {
  const results = useQueries({
    queries: clips.map((clip, idx) => ({
      queryKey: ['video', clip.src, idx],
      queryFn: () => loadVideoElement(clip.src),
      staleTime: Infinity,
      cacheTime: Infinity,
    })),
  });

  const loadedVideos = results.map((result, idx) => ({
    video: result.data ?? null,
    clip: clips[idx],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  }));

  const allLoaded = loadedVideos.every(v => v.video !== null && !v.isLoading && !v.isError);

  return { loadedVideos, allLoaded };
}
