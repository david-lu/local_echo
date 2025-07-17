import React from 'react';
import { AudioClip as AudioClipType, VisualClip as VisualClipType } from '../type';
import AudioClip from './AudioClip';
import VisualClip from './VisualClip';

interface TimelineTrackProps {
  clips: (AudioClipType | VisualClipType)[];
  trackLabel: string;
  trackColor: string;
  maxEnd: number;
  zIndex: number;
  getWidth: (start: number, end: number) => number;
  getLeft: (start: number) => number;
  onClipClick?: (clip: AudioClipType | VisualClipType) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  trackLabel,
  trackColor,
  maxEnd,
  zIndex,
  getWidth,
  getLeft,
  onClipClick
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-12 text-right pr-2 text-xs font-semibold text-zinc-300 select-none flex items-center justify-end gap-1`}>
        <span>{trackLabel}</span>
      </div>
      <div className="relative flex-1 h-8 bg-zinc-800 border border-zinc-700 rounded overflow-visible" style={{ zIndex }}>
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
                onClick={() => onClipClick?.(clip)}
              />
            );
          } else {
            return (
              <VisualClip
                key={i}
                clip={clip}
                startPercent={startPercent}
                widthPercent={widthPercent}
                onClick={() => onClipClick?.(clip)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default TimelineTrack; 