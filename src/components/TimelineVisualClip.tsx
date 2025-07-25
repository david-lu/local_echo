import React from 'react';
import { VisualClip } from '../type';
import TimelineClip from './TimelineClip';

interface TimelineVisualClipProps {
  clip: VisualClip;
  startPercent: number;
  widthPercent: number;
  onClick?: () => void;
}

export const TimelineVisualClip: React.FC<TimelineVisualClipProps> = ({
  clip,
  startPercent,
  widthPercent,
  onClick
}) => {
  const isImage = !!clip.image_generation_params;
  const icon = isImage ? '🖼️' : '🎬';
  const content = isImage 
    ? clip.image_generation_params?.prompt || 'Image'
    : clip.video_generation_params?.description || 'Video';
  
  const title = `${isImage ? 'Image' : 'Video'}`;

  return (
    <TimelineClip
      startPercent={startPercent}
      widthPercent={widthPercent}
      color="bg-emerald-500"
      title={title}
      onClick={onClick}
    >
      <span className="px-2 text-xs truncate text-ellipsis overflow-hidden">
        {icon} {content}
      </span>
    </TimelineClip>
  );
};

export default TimelineVisualClip; 