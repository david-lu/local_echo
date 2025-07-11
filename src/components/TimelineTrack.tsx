import React from 'react';
import { AudioClip as AudioClipType, VisualClip as VisualClipType } from '../type';
import AudioClip from './AudioClip';
import VisualClip from './VisualClip';

interface TimelineTrackProps {
  clips: (AudioClipType | VisualClipType)[];
  trackLabel: string;
  trackColor: string;
  icon: string;
  maxEnd: number;
  zIndex: number;
  getWidth: (start: number, end: number) => number;
  getLeft: (start: number) => number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  trackLabel,
  trackColor,
  icon,
  maxEnd,
  zIndex,
  getWidth,
  getLeft
}) => {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-28 text-right pr-3 text-sm font-semibold ${trackColor} select-none`}>
        {trackLabel}
      </div>
      <div className="relative flex-1 h-10 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm overflow-visible" style={{ zIndex }}>
        {clips.map((clip, i) => {
          const startPercent = getLeft(clip.start_ms);
          const widthPercent = getWidth(clip.start_ms, clip.end_ms);
          
          if (clip.type === 'audio') {
            return (
              <AudioClip
                key={i}
                clip={clip}
                startPercent={startPercent}
                widthPercent={widthPercent}
              />
            );
          } else {
            return (
              <VisualClip
                key={i}
                clip={clip}
                startPercent={startPercent}
                widthPercent={widthPercent}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default TimelineTrack; 