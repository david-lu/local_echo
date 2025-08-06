import { usePlayableLoader } from './loader'
import { AssetClip } from '../types/timeline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isApple } from '../utils/misc'

// I mean this is basically like a component but there's no visuals
export const usePlayAudioTrack = (
  audioContext: AudioContext | null,
  audioTrack: AssetClip[],
  playheadTimeMs: number,
  isPlaying: boolean
) => {
  const { getLoadedClipAtTime } = usePlayableLoader(audioTrack, audioContext || undefined)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)

  useEffect(() => {
    if (!audioContext) return
    const currentAudio = getLoadedClipAtTime(playheadTimeMs)
    if (currentAudio && currentAudio.audio && isPlaying) {
      if (currentSourceRef.current?.buffer !== currentAudio.audio) {
        // Stop the current source
        console.log('switching buffer', currentSourceRef.current)
        currentSourceRef.current?.stop()
        currentSourceRef.current?.disconnect()
        // New source
        currentSourceRef.current = audioContext.createBufferSource()
        currentSourceRef.current.buffer = currentAudio.audio!
        currentSourceRef.current.connect(audioContext.destination)
        currentSourceRef.current.start(
          audioContext.currentTime,
          (playheadTimeMs - currentAudio.start_ms) / 1000
        )
      }
    } else {
      currentSourceRef.current?.stop()
      currentSourceRef.current?.disconnect()
      currentSourceRef.current = null
    }
  }, [isPlaying, playheadTimeMs])
}

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(
    isApple() ? null : new AudioContext()
  )

  // Yeah so this is only really needed for Safari.
  // Which hides the audio context until first click.
  // It's really annoying.
  const activateAudio = useCallback(() => {
    console.log('activateAudio', audioContext?.state)
    if (!audioContext || audioContext.state !== 'running') {
      console.log('activateAudio', audioContext)
      const context = new AudioContext()
      setAudioContext(context)
      context.resume()
    }
  }, [audioContext?.state, audioContext])

  return { audioContext, activateAudio }
}
