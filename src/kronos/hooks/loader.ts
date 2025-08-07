import { useQueries } from '@tanstack/react-query'
import { ALL_FORMATS, BlobSource, CanvasSink, Input, InputVideoTrack } from 'mediabunny'
import { useCallback } from 'react'

import { LoadedClip, AssetClip, PlayableMedia } from '../types/timeline'

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
export function usePlayableLoader(clips: AssetClip[], audioContext?: AudioContext): LoadedClips {
  // console.log("usePlayableLoader", clips);
  const results = useQueries({
    queries: clips.map((clip) => ({
      queryKey: ['playable', clip.id, clip.src],
      queryFn: async (): Promise<PlayableMedia | null> => {
        const response = await fetch(clip.src!)

        if (clip.asset_type === 'video') {
          const blob = await response.blob()
          const input = new Input({
            source: new BlobSource(blob),
            formats: ALL_FORMATS
          })
          const videoTrack = (await input.getPrimaryVideoTrack()) as InputVideoTrack
          await videoTrack.canDecode()
          const canvasSink = new CanvasSink(videoTrack, { poolSize: 2 })
          return {
            response,
            video: {
              input,
              video_track: videoTrack,
              canvas_sink: canvasSink
            }
          }
        } else if (clip.asset_type === 'audio') {
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
        } else if (clip.asset_type === 'image') {
          const blob = await response.blob()
          const src = URL.createObjectURL(blob)
          const image = await loadImageElement(src)
          return {
            image
          }
        }
        return null
      },
      staleTime: Infinity,
      cacheTime: Infinity
    })) // <-- dependencies here
  })

  const allLoaded = results.every((entry) => !entry.isLoading && !entry.isError)

  const loadedPlayables: LoadedClip[] = clips.map((clip, idx) => {
    return {
      ...clip,
      ...results?.[idx]?.data,
      isLoading: results?.[idx]?.isLoading,
      isError: results?.[idx]?.isError,
      error: results?.[idx]?.error?.message
    }
  })

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
