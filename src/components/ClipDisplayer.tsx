import React from 'react';
import { AudioClip, VisualClip } from '../type';

interface ClipDisplayerProps {
  selectedClip: AudioClip | VisualClip | null;
}

export const ClipDisplayer: React.FC<ClipDisplayerProps> = ({ selectedClip }) => {
  const clip: any = {...selectedClip};
  if (clip.type === 'audio') {
    clip.duration_ms = clip.end_ms - clip.start_ms;
    clip.estimated_duration_ms = (clip.audio_generation_params?.text?.length ?? 0) / 15 * 1000;
  }
  if (!selectedClip) {
    return (
      <div className="h-full bg-zinc-900 flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Clip Details</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center text-zinc-400 py-8">
            <p>Click on a clip to view its details...</p>
          </div>
        </div>
      </div>
    );
  }

  const clipType = selectedClip.type === 'audio' ? 'Audio' : 'Visual';

  return (
    <div className="h-full bg-zinc-900 flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-100">Clip Details</h2>
        <p className="text-sm text-zinc-400 mt-1">
          {clipType} Clip • {selectedClip.duration_ms}ms • {selectedClip.speaker || 'No speaker'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-zinc-950 text-emerald-400 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-words border border-zinc-800">
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(clip, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default ClipDisplayer; 