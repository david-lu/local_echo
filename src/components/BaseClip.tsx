import React from 'react';

interface BaseClipProps {
  startPercent: number;
  widthPercent: number;
  color: string;
  title: string;
  children: React.ReactNode;
}

export const BaseClip: React.FC<BaseClipProps> = ({
  startPercent,
  widthPercent,
  color,
  title,
  children
}) => {
  return (
    <div
      className={`absolute h-10 ${color} text-sm text-white flex items-center justify-center rounded-md shadow-md border border-white/20 hover:shadow-lg transition-all duration-200 hover:opacity-90 hover:brightness-110`}
      style={{
        left: startPercent + '%',
        width: widthPercent + '%',
        top: 0
      }}
      title={title}
    >
      {children}
    </div>
  );
};

export default BaseClip; 