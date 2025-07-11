import React from 'react';
import { Timeline as TimelineType } from '../type';
import TimelineTrack from './TimelineTrack';

interface TimelineProps {
  timeline: TimelineType;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const Timeline: React.FC<TimelineProps> = ({ timeline }) => {
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
    <div className="w-screen bg-white border-t border-gray-300 shadow-2xl">
      <div className="mx-auto" style={{maxWidth: '100vw'}}>
        <h2 className="text-2xl font-bold mb-2 px-6 pt-4">Timeline Visualization</h2>
        <div className="flex flex-col gap-1 px-6 pb-4">
          {/* Audio Track */}
          <TimelineTrack
            clips={timeline.audio_track}
            trackLabel="Audio Track"
            trackColor="text-blue-700"
            icon="🎤"
            maxEnd={maxEnd}
            zIndex={2}
            getWidth={getWidth}
            getLeft={getLeft}
          />
          
          {/* Visual Track */}
          <TimelineTrack
            clips={timeline.visual_track}
            trackLabel="Visual Track"
            trackColor="text-green-700"
            icon="🖼️"
            maxEnd={maxEnd}
            zIndex={1}
            getWidth={getWidth}
            getLeft={getLeft}
          />
          
          {/* Timeline axis with second markings */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28" />
            <div className="relative flex-1 h-4">
              {/* Main timeline line */}
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-400 rounded" />
              
              {/* Second markings */}
              {secondMarkings.map((second) => {
                const position = (second * 1000 / maxEnd) * 100;
                return (
                  <div
                    key={second}
                    className="absolute top-0 bottom-0 w-px bg-gray-300"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-500" />
                  </div>
                );
              })}
              
              {/* Time labels */}
              <div className="flex justify-between absolute left-0 right-0 top-full mt-1 text-xs text-gray-500">
                <span>0s</span>
                <span>{msToSec(maxEnd)}</span>
              </div>
              
              {/* Second labels */}
              <div className="absolute left-0 right-0 top-full mt-3">
                {secondMarkings.slice(1, -1).map((second) => {
                  const position = (second * 1000 / maxEnd) * 100;
                  return (
                    <div
                      key={second}
                      className="absolute text-xs text-gray-400"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      {second}s
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline; 