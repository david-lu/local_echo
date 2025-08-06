import React from 'react'
import { AudioClip, Clip, VisualClip } from '../kronos/types/timeline'

interface ClipDisplayerProps {
  selectedClip: Clip | null
}

export const ClipDisplayer: React.FC<ClipDisplayerProps> = ({ selectedClip }) => {
  return (
    <div className="overflow-y-auto p-4">
      <p className="text-sm text-zinc-400 mt-1">
        {selectedClip?.duration_ms}ms • {selectedClip?.speaker || 'No speaker'}
      </p>
      <div className="bg-zinc-950 text-emerald-400 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-words border border-zinc-800 mt-2">
        {JSON.stringify(selectedClip, null, 2)}
      </div>
    </div>
  )
}

export default ClipDisplayer
