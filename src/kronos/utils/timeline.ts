import { Clip, Range } from '../types/timeline'

export const getTotalDuration = (spans: Clip[]): number => {
  return spans.reduce((max, clip) => Math.max(max, clip.start_ms + clip.duration_ms), 0)
}

export const getGaps = (clips: Clip[], timeline_duration_ms?: number): Range[] => {
  // console.log("getGaps clips", clips);
  const timelineEnd = Math.max(getTotalDuration(clips), timeline_duration_ms || 0)

  let gaps: Range[] = [{ start_ms: 0, end_ms: timelineEnd }]

  for (const clip of clips) {
    const clipEnd = clip.start_ms + clip.duration_ms
    const nextGaps: Range[] = []

    for (const gap of gaps) {
      if (clipEnd <= gap.start_ms || clip.start_ms >= gap.end_ms) {
        // No overlap, keep gap as is
        nextGaps.push(gap)
      } else {
        // Overlap, split the gap
        if (gap.start_ms < clip.start_ms) {
          nextGaps.push({
            start_ms: gap.start_ms,
            end_ms: clip.start_ms
          })
        }

        if (gap.end_ms > clipEnd) {
          nextGaps.push({ start_ms: clipEnd, end_ms: gap.end_ms })
        }
        // If clip fully covers the gap, we add nothing
      }
    }

    gaps = nextGaps
  }

  return gaps
}

export const getClipAtTime = (track: Clip[], time: number): Clip | null => {
  return (
    track.find((clip) => clip.start_ms <= time && clip.start_ms + clip.duration_ms > time) || null
  )
}
