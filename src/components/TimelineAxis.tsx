import React from 'react'

interface TimelineAxisProps {
  maxEnd: number
  onSeek?: (time: number) => void
}

export const TimelineAxis: React.FC<TimelineAxisProps> = ({ maxEnd, onSeek }) => {
  // Generate second markings
  const totalSeconds = Math.ceil(maxEnd / 1000)
  const secondMarkings = Array.from({ length: totalSeconds + 1 }, (_, i) => i)

  const handleAxisClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickPercent = (clickX / rect.width) * 100
    const timeMs = (clickPercent / 100) * maxEnd

    onSeek(timeMs)
  }

  return (
    <div className="flex items-center gap-2 h-8 select-none">
      <div
        className="relative flex-1 h-3 cursor-pointer"
        onClick={handleAxisClick}
      >
        {/* Main timeline line */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-zinc-600 rounded-full" />

        {/* Second markings */}
        {secondMarkings.map((second) => {
          const position = ((second * 1000) / maxEnd) * 100
          return (
            <div
              key={second}
              className="absolute top-0 bottom-0 w-px bg-zinc-600"
              style={{ left: `${position}%` }}
            ></div>
          )
        })}

        {/* Second labels above axis */}
        <div className="absolute left-0 right-0 bottom-full mb-4">
          {secondMarkings.map((second) => {
            const position = ((second * 1000) / maxEnd) * 100
            return (
              <div
                key={second}
                className="absolute text-xs text-zinc-400 font-medium"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                {second}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TimelineAxis
