import React from 'react';
import { Timeline as TimelineType, AudioClip, VisualClip } from '../type';
import TimelineTrack from './TimelineTrack';

interface TimelineProps {
  timeline: TimelineType;
  onClearChat?: () => void;
  onResetTimeline?: () => void;
  onClipClick?: (clip: AudioClip | VisualClip) => void;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const Timeline: React.FC<TimelineProps> = ({ timeline, onClearChat, onResetTimeline, onClipClick }) => {
  // Find the max end time for scaling
  const maxEnd = Math.max(
    ...timeline.audio_track.map(c => c.end_ms),
    ...timeline.visual_track.map(c => c.end_ms),
    10000 // fallback
  );

  // Helper to get percent width and position
  const getWidth = (start: number, end: number) => ((end - start) / maxEnd) * 100;
  const getLeft = (start: number) => (start / maxEnd) * 100;

  // Generate second markings
  const totalSeconds = Math.ceil(maxEnd / 1000);
  const secondMarkings = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

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
              onClick={onClearChat}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Clear Chat
            </button>
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
          {/* Timeline markers */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 flex-shrink-0" />
            <div className="relative flex-1 h-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Main timeline line */}
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
              
              {/* Second markings */}
              {secondMarkings.map((second) => {
                const position = (second * 1000 / maxEnd) * 100;
                return (
                  <div
                    key={second}
                    className="absolute top-0 bottom-0 w-px bg-gray-200"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-gray-400 rounded-full" />
                  </div>
                );
              })}
              
              {/* Time labels */}
              <div className="flex justify-between absolute left-0 right-0 top-full mt-0.5 text-xs text-gray-500 font-medium">
                <span>0s</span>
                <span>{msToSec(maxEnd)}</span>
              </div>
              
              {/* Second labels */}
              <div className="absolute left-0 right-0 top-full mt-2">
                {secondMarkings.slice(1, -1).map((second) => {
                  const position = (second * 1000 / maxEnd) * 100;
                  return (
                    <div
                      key={second}
                      className="absolute text-xs text-gray-400 font-medium"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      {second}s
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Visual Track */}
          <TimelineTrack
            clips={timeline.visual_track}
            trackLabel="Visual"
            trackColor="text-emerald-600"
            icon="🖼️"
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
            icon="🎤"
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