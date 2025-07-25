import React from 'react';
import { AudioClip as AudioClipType, VisualClip as VisualClipType } from '../type';
import TimelineAudioClip from './TimelineAudioClip';
import TimelineVisualClip from './TimelineVisualClip';

interface TimelineTrackProps {
  clips: (AudioClipType | VisualClipType)[];
  zIndex: number;
  getWidth: (start: number, end: number) => number;
  getLeft: (start: number) => number;
  onClipClick?: (clip: AudioClipType | VisualClipType) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  zIndex,
  getWidth,
  getLeft,
  onClipClick
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-8 bg-zinc-800 border border-zinc-700 rounded overflow-visible" style={{ zIndex }}>
        {clips.map((clip, i) => {
          const startPercent = getLeft(clip.start_ms);
          const widthPercent = getWidth(clip.start_ms, clip.start_ms + clip.duration_ms);
          
          if (clip.type === 'audio') {
            return (
              <TimelineAudioClip
                key={clip.id}
                clip={clip}
                startPercent={startPercent}
                widthPercent={widthPercent}
                onClick={() => onClipClick?.(clip)}
              />
            );
          } else {
            return (
              <TimelineVisualClip
                key={clip.id}
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