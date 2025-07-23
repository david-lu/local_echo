import React from 'react';
import { VisualClip as VisualClipType } from '../type';
import BaseClip from './BaseClip';

interface VisualClipProps {
  clip: VisualClipType;
  startPercent: number;
  widthPercent: number;
  onClick?: () => void;
}

export const VisualClip: React.FC<VisualClipProps> = ({
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
    <BaseClip
      startPercent={startPercent}
      widthPercent={widthPercent}
      color="bg-emerald-500"
      title={title}
      onClick={onClick}
    >
      <span className="px-2 text-xs truncate text-ellipsis overflow-hidden">
        {icon} {content}
      </span>
    </BaseClip>
  );
};

export default VisualClip; 