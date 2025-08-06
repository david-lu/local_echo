import React, { useState, useMemo } from 'react'
import Timeline from './Timeline'
import { useAudioContext } from '../hooks/audio'
import { VisualPlayer } from './VisualPlayer'
import { useTicker } from '../hooks/tick'
import { usePlayAudioTrack } from '../hooks/audio'
import { exportVideo } from '../utils/export'
import { PlayableAudioClip, AssetClip, PlayableVisualClip } from '../types/loader'
import { getTotalDuration } from '../../utils/timeline'

interface KronosProps {
  visualClips: PlayableVisualClip[]
  audioClips: PlayableAudioClip[]
  onClipsChange?: (
    newVisualTrack?: PlayableVisualClip[],
    newAudioTrack?: PlayableAudioClip[]
  ) => void
}

const Kronos: React.FC<KronosProps> = ({
  visualClips: visualTrack,
  audioClips: audioTrack,
  onClipsChange
}) => {
  const { audioContext, activateAudio } = useAudioContext()

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  usePlayAudioTrack(audioContext, audioTrack, currentTimeMs, isPlaying)

  // Calculate timeline duration
  const timelineDuration = useMemo(
    () => getTotalDuration([...audioTrack, ...visualTrack]),
    [audioTrack, visualTrack]
  )

  useTicker((deltaMs: number) => {
    setCurrentTimeMs((prev) => {
      const newTime = prev + deltaMs
      if (newTime >= timelineDuration) {
        setIsPlaying(false)
        return 0
      }
      return newTime
    })
  }, isPlaying)

  // Playback control functions
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev)
    activateAudio()
  }

  const handleExport = async () => {
    setIsExporting(true)
    await exportVideo(visualTrack, audioTrack, 'output.mp4', audioContext!)
    setIsExporting(false)
  }

  const handleClipClick = (clip: AssetClip) => {
    console.log('clip', clip)
  }

  const handleResetTimeline = () => {
    onClipsChange?.([], [])
  }

  const handleSeek = (time: number) => {
    setCurrentTimeMs(Math.max(0, Math.min(time, timelineDuration)))
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 justify-between">
      {/* ClipDisplayer */}
      <div className="relative flex h-full w-full">
        <VisualPlayer
          visualClips={visualTrack}
          playheadTimeMs={currentTimeMs}
          isLandscape={true}
          isPlaying={isPlaying}
        />
      </div>

      {/* Timeline Controls */}
      <div className="flex-shrink-1">
        <Timeline
          audioClips={audioTrack}
          visualClips={visualTrack}
          onResetTimeline={handleResetTimeline}
          onExport={handleExport}
          onClipClick={handleClipClick}
          currentTimeMs={currentTimeMs}
          isPlaying={isPlaying}
          isExporting={isExporting}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
        />
      </div>
    </div>
  )
}

export default Kronos
