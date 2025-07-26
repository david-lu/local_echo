import React, { useState, useEffect } from "react";
import { Timeline as TimelineType, AudioClip, VisualClip } from "../type";
import TimelineTrack from "./TimelineTrack";
import TimelineAxis from "./TimelineAxis";
import TimelineCursor from "./TimelineCursor";
import { formatTime } from "../utils";

interface TimelineProps {
  timeline: TimelineType;
  onResetTimeline?: () => void;
  onClipClick?: (clip: AudioClip | VisualClip) => void;
  currentTimeMs?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  onResetTimeline,
  onClipClick,
  currentTimeMs = 0,
  isPlaying = false,
  onPlayPause,
  onSeek,
}) => {
  // Find the max end time for scaling
  const maxEnd = Math.max(
    ...timeline.audio_track.map((c) => c.start_ms + c.duration_ms),
    ...timeline.visual_track.map((c) => c.start_ms + c.duration_ms),
    10000 // fallback
  );

  // Helper to get percent width and position
  const getWidth = (start: number, end: number) =>
    ((end - start) / maxEnd) * 100;
  const getLeft = (start: number) => (start / maxEnd) * 100;

  return (
    <div className="h-full bg-zinc-900 border-t border-zinc-800 flex flex-col text-white">
      <div className="flex-shrink-0 p-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex justify-between items-center">
        <button
              onClick={() => {
                console.log("Button clicked!");
                onPlayPause?.();
              }}
              className="flex items-center justify-center w-8 h-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-md transition-colors"
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4 text-zinc-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-zinc-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            {formatTime(currentTimeMs)}
          <button
            onClick={onResetTimeline}
            className="px-2 py-1 text-xs border border-zinc-700 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 p-2">
        <div className="space-y-2 relative timeline-container">
          {/* Timeline Axis */}
          <TimelineAxis maxEnd={maxEnd} onSeek={onSeek} />

          {/* Timeline Cursor */}
          <TimelineCursor
            currentTime={currentTimeMs}
            maxEnd={maxEnd}
            onSeek={onSeek}
          />

          {/* Visual Track */}
          <TimelineTrack
            clips={timeline.visual_track}
            zIndex={1}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
            maxEnd={maxEnd}
          />

          {/* Audio Track */}
          <TimelineTrack
            clips={timeline.audio_track}
            zIndex={2}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
            maxEnd={maxEnd}
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
