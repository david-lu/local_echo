import React from 'react';
import JsonPopup from './JsonPopup';

interface BaseClipProps {
  startPercent: number;
  widthPercent: number;
  color: string;
  title: string;
  children: React.ReactNode;
  clipData?: any; // Add optional clip data for JSON popup
}

export const BaseClip: React.FC<BaseClipProps> = ({
  startPercent,
  widthPercent,
  color,
  title,
  children,
  clipData
}) => {
  const clipElement = (
    <div
      className={`absolute h-8 ${color} text-sm text-white flex items-center justify-center rounded border border-white/20 hover:opacity-90 transition-opacity duration-200`}
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

  // If clip data is provided, wrap with JSON popup
  if (clipData) {
    return (
      <JsonPopup data={clipData}>
        {clipElement}
      </JsonPopup>
    );
  }

  return clipElement;
};

export default BaseClip; 