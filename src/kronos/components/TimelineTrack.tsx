import React from 'react'
import { AudioClip as AudioClipType, VisualClip as VisualClipType } from '../types/timeline'
import TimelineClip from './TimelineClip'

interface TimelineTrackProps {
  clips: (AudioClipType | VisualClipType)[]
  zIndex: number
  getWidth: (start: number, end: number) => number
  getLeft: (start: number) => number
  onClipClick?: (clip: AudioClipType | VisualClipType) => void
  onClipMove?: (clipId: string, newStartMs: number) => void
  maxEnd: number
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  zIndex,
  getWidth,
  getLeft,
  onClipClick,
  onClipMove,
  maxEnd
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex-1 h-8 bg-zinc-800 border border-zinc-700 rounded overflow-visible"
        style={{ zIndex }}
      >
        {clips.map((clip) => {
          const startPercent = getLeft(clip.start_ms)
          const widthPercent = getWidth(clip.start_ms, clip.start_ms + clip.duration_ms)

          const isAudio = clip.type === 'audio'
          const color = isAudio ? 'bg-blue-500' : 'bg-emerald-500'
          const content = isAudio
            ? `${clip.speaker || 'Audio'}: ${clip.audio_generation_params?.text || ''}`
            : `${clip.image_generation_params ? '🖼️' : '🎬'} ${clip.image_generation_params?.prompt || clip.video_generation_params?.description || ''}`

          return (
            <TimelineClip
              key={clip.id}
              startPercent={startPercent}
              widthPercent={widthPercent}
              color={color}
              title={clip.type}
              onClick={() => onClipClick?.(clip)}
            >
              <span className="px-2 text-xs truncate text-ellipsis overflow-hidden">{content}</span>
            </TimelineClip>
          )
        })}
      </div>
    </div>
  )
}

export default TimelineTrack
