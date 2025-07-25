import React from 'react';

interface TimelineControlsProps {
  currentTime: number;
  duration: number;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTime,
  duration,
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-zinc-950 border-t border-zinc-800">
      <div className="text-sm text-zinc-400 font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

    </div>
  );
};

export default TimelineControls; 