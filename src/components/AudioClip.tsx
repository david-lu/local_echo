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
    >
      <span className="px-4">
        🎤 {speaker}<br/>
        {msToSec(clip.start_ms)} - {msToSec(clip.end_ms)}
      </span>
    </BaseClip>
  );
};

export default AudioClip; 