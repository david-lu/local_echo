import React from 'react';

interface BaseClipProps {
  startPercent: number;
  widthPercent: number;
  color: string;
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const BaseClip: React.FC<BaseClipProps> = ({
  startPercent,
  widthPercent,
  color,
  title,
  children,
  onClick
}) => {
  return (
    <div
      className={`absolute h-full ${color} text-xs text-white flex items-center justify-center rounded-md border border-white/30 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer backdrop-blur-sm`}
      style={{
        left: startPercent + '%',
        width: widthPercent + '%',
      }}
      title={title}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default BaseClip; 