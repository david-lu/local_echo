import React from 'react';
import { Timeline as TimelineType, AudioClip, VisualClip } from '../type';
import TimelineTrack from './TimelineTrack';
import TimelineAxis from './TimelineAxis';

interface TimelineProps {
  timeline: TimelineType;
  onResetTimeline?: () => void;
  onClipClick?: (clip: AudioClip | VisualClip) => void;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const Timeline: React.FC<TimelineProps> = ({ timeline, onResetTimeline, onClipClick }) => {
  // Find the max end time for scaling
  const maxEnd = Math.max(
    ...timeline.audio_track.map(c => c.end_ms),
    ...timeline.visual_track.map(c => c.end_ms),
    10000 // fallback
  );

  // Helper to get percent width and position
  const getWidth = (start: number, end: number) => ((end - start) / maxEnd) * 100;
  const getLeft = (start: number) => (start / maxEnd) * 100;

  return (
    <div className="h-full bg-zinc-900 border-t border-zinc-800 flex flex-col">
      <div className="flex-shrink-0 p-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">Timeline</h2>
            <button
              onClick={onResetTimeline}
              className="px-2 py-1 text-xs border border-zinc-700 rounded-md text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-2">
        <div className="space-y-2">
          {/* Timeline Axis */}
          <TimelineAxis maxEnd={maxEnd} />
          
          {/* Visual Track */}
          <TimelineTrack
            clips={timeline.visual_track}
            trackLabel="Visual"
            trackColor="text-emerald-600"
            maxEnd={maxEnd}
            zIndex={1}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
          />

          {/* Audio Track */}
          <TimelineTrack
            clips={timeline.audio_track}
            trackLabel="Audio"
            trackColor="text-blue-600"
            maxEnd={maxEnd}
            zIndex={2}
            getWidth={getWidth}
            getLeft={getLeft}
            onClipClick={onClipClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline; 