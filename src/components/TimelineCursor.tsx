import React, { useState, useEffect } from 'react';

interface TimelineCursorProps {
  currentTime: number;
  maxEnd: number;
  onSeek?: (time: number) => void;
}

export const TimelineCursor: React.FC<TimelineCursorProps> = ({ currentTime, maxEnd, onSeek }) => {
  const [isDragging, setIsDragging] = useState(false);
  const position = (currentTime / maxEnd) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onSeek) return;
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onSeek) return;
    
    const timelineElement = document.querySelector('.timeline-container');
    if (!timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const clickTime = clickPercent * maxEnd;
    
    onSeek(Math.max(0, Math.min(clickTime, maxEnd)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onSeek, maxEnd]);

  return (
    <div
      className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-red-500 z-10 cursor-grab active:cursor-grabbing"
      style={{ left: `${position}%` }}
      onMouseDown={handleMouseDown}
    >
      {/* Cursor head */}
      <div className="absolute -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
    </div>
  );
};

export default TimelineCursor; 