import React from 'react';
import { Timeline } from './type';

interface TimelineVisualizerProps {
  timeline: Timeline;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ timeline }) => {
  // Find the max end time for scaling
  const maxEnd = Math.max(
    ...timeline.audio_track.map(c => c.end_ms),
    ...timeline.visual_track.map(c => c.end_ms),
    10000 // fallback
  );

  // Helper to get percent width
  const getWidth = (start: number, end: number) => ((end - start) / maxEnd) * 100;
  const getLeft = (start: number) => (start / maxEnd) * 100;

  return (
    <div className="w-full p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Timeline Visualization</h2>
      <div className="flex flex-col gap-2">
        {/* Track labels and bars */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-28 text-right pr-2 text-base font-semibold text-blue-700 select-none">Audio Track</div>
          <div className="relative flex-1 h-14 bg-gray-100 rounded overflow-visible">
            {timeline.audio_track.map((clip, i) => (
              <div
                key={i}
                className="absolute h-14 bg-blue-500 text-base text-white flex items-center justify-center rounded shadow-lg"
                style={{
                  left: getLeft(clip.start_ms) + '%',
                  width: getWidth(clip.start_ms, clip.end_ms) + '%',
                  zIndex: 2,
                  top: 0
                }}
                title={`Audio: ${clip.speaker || 'unknown'} (${msToSec(clip.start_ms)} - ${msToSec(clip.end_ms)})`}
              >
                <span className="px-4">🎤 {clip.speaker || 'Audio'}<br/>{msToSec(clip.start_ms)} - {msToSec(clip.end_ms)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-28 text-right pr-2 text-base font-semibold text-green-700 select-none">Visual Track</div>
          <div className="relative flex-1 h-14 bg-gray-100 rounded overflow-visible">
            {timeline.visual_track.map((clip, i) => (
              <div
                key={i}
                className="absolute h-14 bg-green-500 text-base text-white flex items-center justify-center rounded shadow-lg"
                style={{
                  left: getLeft(clip.start_ms) + '%',
                  width: getWidth(clip.start_ms, clip.end_ms) + '%',
                  zIndex: 1,
                  top: 0
                }}
                title={`Visual: ${clip.image_generation_params ? 'Image' : 'Video'} (${msToSec(clip.start_ms)} - ${msToSec(clip.end_ms)})`}
              >
                <span className="px-4">
                  {clip.image_generation_params ? '🖼️' : '🎬'} {clip.image_generation_params?.prompt || clip.video_generation_params?.description || 'Visual'}<br/>
                  {msToSec(clip.start_ms)} - {msToSec(clip.end_ms)}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Timeline axis */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-28" />
          <div className="relative flex-1 h-6">
            <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-400 rounded" />
            <div className="flex justify-between absolute left-0 right-0 top-full mt-1 text-base text-gray-500">
              <span>0s</span>
              <span>{msToSec(maxEnd)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualizer; 