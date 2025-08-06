import React, { useRef } from 'react'

import { formatTime } from '../utils/misc'

import TimelineAxis from './TimelineAxis'
import TimelineCursor from './TimelineCursor'
import TimelineTrack from './TimelineTrack'
import { getTotalDuration } from '../utils/timeline'
import { Download, LoaderCircle, PauseCircle, PlayCircle, RotateCcw } from 'lucide-react'
import { PlayableAudioClip, AssetClip, PlayableVisualClip } from '../types/loader'

interface TimelineProps {
  audioClips: PlayableAudioClip[]
  visualClips: PlayableVisualClip[]
  onResetTimeline?: () => void
  onExport?: () => void
  onClipClick?: (clip: AssetClip) => void
  currentTimeMs?: number
  isPlaying?: boolean
  isExporting?: boolean
  onPlayPause?: () => void
  onSeek?: (time: number) => void
}

export const Timeline: React.FC<TimelineProps> = ({
  audioClips,
  visualClips,
  onResetTimeline,
  onExport,
  onClipClick,
  currentTimeMs = 0,
  isPlaying = false,
  isExporting = false,
  onPlayPause,
  onSeek
}) => {
  // Find the max end time for scaling
  const maxEnd = Math.max(10000, getTotalDuration([...audioClips, ...visualClips]))
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  // Helper to get percent width and position
  const getWidth = (start: number, end: number) => ((end - start) / maxEnd) * 100
  const getLeft = (start: number) => (start / maxEnd) * 100

  return (
    <div className="h-full bg-zinc-900 border-t border-zinc-800 flex flex-col text-white">
      <div className="flex-shrink-0 p-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              onPlayPause?.()
            }}
            className="flex items-center justify-center w-8 h-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-md transition-colors"
          >
            {isPlaying ? <PauseCircle /> : <PlayCircle />}
          </button>
          {formatTime(currentTimeMs)}
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="px-2 py-1 text-xs border border-zinc-700 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
              disabled={isExporting}
            >
              {isExporting ? <LoaderCircle className="animate-spin" /> : <Download />}
            </button>
            <button
              onClick={onResetTimeline}
              className="px-2 py-1 text-xs border border-zinc-700 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <RotateCcw />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2">
        <div
          className="space-y-2 relative"
          ref={timelineContainerRef}
        >
          <TimelineAxis
            maxEnd={maxEnd}
            onSeek={onSeek}
          />

          <TimelineCursor
            timelineContainer={timelineContainerRef.current}
            currentTime={currentTimeMs}
            maxEnd={maxEnd}
            onSeek={onSeek}
          />

          {/* Visual Track */}
          <TimelineTrack
            clips={visualClips}
            zIndex={1}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
            maxEnd={maxEnd}
          />

          {/* Audio Track */}
          <TimelineTrack
            clips={audioClips}
            zIndex={2}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
            maxEnd={maxEnd}
          />
        </div>
      </div>
    </div>
  )
}

export default Timeline
