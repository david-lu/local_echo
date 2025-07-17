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
      className={`absolute h-8 ${color} text-sm text-white flex items-center justify-center rounded border border-white/20 hover:opacity-90 transition-opacity duration-200 cursor-pointer`}
      style={{
        left: startPercent + '%',
        width: widthPercent + '%',
        top: 0
      }}
      title={title}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default BaseClip; 