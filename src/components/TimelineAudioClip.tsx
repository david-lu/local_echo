import React from 'react';
import { AudioClip } from '../type';
import TimelineClip from './TimelineClip';

interface TimelineAudioClipProps {
  clip: AudioClip;
  startPercent: number;
  widthPercent: number;
  onClick?: () => void;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const TimelineAudioClip: React.FC<TimelineAudioClipProps> = ({
  clip,
  startPercent,
  widthPercent,
  onClick
}) => {
  const speaker = clip.speaker || 'Audio';
  const title = `Audio: ${speaker} (${msToSec(clip.start_ms)} - ${msToSec(clip.start_ms + clip.duration_ms)})`;

  return (
    <TimelineClip
      startPercent={startPercent}
      widthPercent={widthPercent}
      color="bg-blue-500"
      title={title}
      onClick={onClick}
    >
      <span className="px-2 text-xs truncate text-ellipsis overflow-hidden">
        {speaker}: {clip.audio_generation_params?.text}
      </span>
    </TimelineClip>
  );
};

export default TimelineAudioClip; 