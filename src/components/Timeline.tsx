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
    <div className="h-full bg-gradient-to-br from-gray-50 to-white border-t border-gray-200 flex flex-col">
      <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-sm font-semibold text-gray-800">Timeline</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {msToSec(maxEnd)}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onResetTimeline}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
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