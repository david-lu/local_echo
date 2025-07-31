import { useQueries } from '@tanstack/react-query'
import * as PIXI from 'pixi.js'
import { LoadedClip, PlayableClip, PlayableMedia } from '../types/loader'
import { useCallback, useMemo } from 'react'

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    // console.log("loading video", src);
    const video = document.createElement('video')
    video.src = src
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.loop = false
    video.autoplay = false
    video.playsInline = true
    video.preload = 'auto'

    const onCanPlayThrough = () => {
      cleanup()
      resolve(video)
    }
    const onError = (e: any) => {
      cleanup()
      reject(e)
    }

    function cleanup() {
      video.removeEventListener('canplaythrough', onCanPlayThrough)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('canplaythrough', onCanPlayThrough)
    video.addEventListener('error', onError)

    video.load()
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.src = src
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      resolve(image)
    }
    image.onerror = (e) => {
      reject(e)
    }
  })
}

export interface LoadedClips {
  loadedPlayables: LoadedClip[]
  allLoaded: boolean
  getLoadedClipAtTime: (timeMs: number) => LoadedClip | undefined
}

// TODO: SEPARATE CLIP SETTING LOGIC FROM LOADING LOGIC
// THIS IS PREVENTING THE CLIPS FROM BEING UPDATED WHEN THE CLIP PARAMS CHANGES
export function usePlayableLoader(clips: PlayableClip[], audioContext?: AudioContext): LoadedClips {
  // console.log("usePlayableLoader", clips);
  const results = useQueries({
    queries: useMemo(
      () =>
        clips.map((clip) => ({
          queryKey: ['playable', clip.id, clip.src],
          queryFn: async (): Promise<PlayableMedia | undefined> => {
            const response = await fetch(clip.src)

            if (clip.type === 'video') {
              const blob = await response.blob()
              const src = URL.createObjectURL(blob)
              const video = await loadVideoElement(src)
              const texture = PIXI.Texture.from(video)
              return {
                video,
                texture
              }
            } else if (clip.type === 'audio') {
              // console.log('DECODING AUDIO', audioContext)
              if (!audioContext) throw new Error('AudioContext not available')
              // console.log('DECODING', audioContext)
              const arrayBuffer = await response.arrayBuffer()
              // console.log('DECODING', arrayBuffer)
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
              // console.log('DECODING', audioBuffer)
              return {
                audio: audioBuffer
              }
            } else if (clip.type === 'image') {
              const blob = await response.blob()
              const src = URL.createObjectURL(blob)
              const image = await loadImageElement(src)
              const texture = PIXI.Texture.from(image)
              return {
                image,
                texture
              }
            }
            return undefined
          },
          staleTime: Infinity,
          cacheTime: Infinity
        })),
      [clips, audioContext]
    ) // <-- dependencies here
  })

  const allLoaded = results.every((entry) => !entry.isLoading && !entry.isError)

  const loadedPlayables: LoadedClip[] = useMemo(() => {
    console.log('results', results, clips)
    return clips.map((clip, idx) => {
      return {
        ...clip,
        ...results?.[idx]?.data,
        isLoading: results?.[idx]?.isLoading,
        isError: results?.[idx]?.isError,
        error: results?.[idx]?.error?.message
      }
    })
  }, [...results.flatMap((r) => [r.data, r.isLoading, r.isError, r.error]), clips])

  const getLoadedClipAtTime = useCallback(
    (timeMs: number): LoadedClip | undefined => {
      return loadedPlayables.find(
        (clip) => clip?.start_ms! <= timeMs && clip?.start_ms! + clip?.duration_ms! > timeMs
      )
    },
    [loadedPlayables]
  )

  return { loadedPlayables, allLoaded, getLoadedClipAtTime }
}
