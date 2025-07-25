import React from 'react';

interface TimelineCursorProps {
  currentTime: number;
  maxEnd: number;
}

export const TimelineCursor: React.FC<TimelineCursorProps> = ({ currentTime, maxEnd }) => {
  const position = (currentTime / maxEnd) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      {/* Cursor head */}
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
    </div>
  );
};

export default TimelineCursor; 