import React from 'react';
import { formatTime } from '../utils';

interface TimelineControlsProps {
  currentTime: number;
  duration: number;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTime,
  duration,
}) => {

  return (
    <div className="flex items-center gap-3 p-2 bg-zinc-950 border-t border-zinc-800">
      <div className="text-sm text-zinc-400 font-mono">
      </div>

    </div>
  );
};

export default TimelineControls; 