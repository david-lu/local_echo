import React from 'react';
import { AudioClip, VisualClip } from '../type';

interface ClipDisplayerProps {
  selectedClip: AudioClip | VisualClip | null;
}

export const ClipDisplayer: React.FC<ClipDisplayerProps> = ({ selectedClip }) => {
  if (!selectedClip) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Clip Details</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 py-8">
            <p>Click on a clip to view its details...</p>
          </div>
        </div>
      </div>
    );
  }

  const clipType = selectedClip.type === 'audio' ? 'Audio' : 'Visual';
  const duration = selectedClip.end_ms - selectedClip.start_ms;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Clip Details</h2>
        <p className="text-sm text-gray-600 mt-1">
          {clipType} Clip • {duration}ms • {selectedClip.speaker || 'No speaker'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-words">
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedClip, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default ClipDisplayer; 