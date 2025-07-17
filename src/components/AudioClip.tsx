import React from 'react';
import { AudioClip as AudioClipType } from '../type';
import BaseClip from './BaseClip';

interface AudioClipProps {
  clip: AudioClipType;
  startPercent: number;
  widthPercent: number;
}

const msToSec = (ms: number) => (ms / 1000).toFixed(1) + 's';

export const AudioClip: React.FC<AudioClipProps> = ({
  clip,
  startPercent,
  widthPercent
}) => {
  const speaker = clip.speaker || 'Audio';
  const title = `Audio: ${speaker} (${msToSec(clip.start_ms)} - ${msToSec(clip.end_ms)})`;

  return (
    <BaseClip
      startPercent={startPercent}
      widthPercent={widthPercent}
      color="bg-blue-500"
      title={title}
      clipData={clip}
    >
      <span className="px-2 text-xs truncate text-ellipsis overflow-hidden">
        {speaker}: {clip.audio_generation_params?.text}
      </span>
    </BaseClip>
  );
};

export default AudioClip; 