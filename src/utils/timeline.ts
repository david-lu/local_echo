import { getTotalDuration, refineTrack, getGaps } from '../kronos/utils/timeline'
import { Timeline, RefinedTimeline, TimelineSchema } from '../types/timeline'

export function sortTimeline(timeline: Timeline): Timeline {
  timeline.audio_track = timeline.audio_track.sort((a, b) => a.start_ms - b.start_ms)
  timeline.visual_track = timeline.visual_track.sort((a, b) => a.start_ms - b.start_ms)
  return timeline
}

export function parseTimeline(jsonData: unknown): Timeline {
  const result = TimelineSchema.parse(jsonData)
  return sortTimeline(result)
}

export const refineTimeline = (timeline: Timeline): RefinedTimeline => {
  const totalDuration = getTotalDuration([...timeline.audio_track, ...timeline.visual_track])
  const refinedTimeline: RefinedTimeline = {
    ...timeline,
    audio_track: refineTrack(timeline.audio_track),
    visual_track: refineTrack(timeline.visual_track),
    audio_gaps: getGaps(timeline.audio_track, totalDuration),
    visual_gaps: getGaps(timeline.visual_track, totalDuration)
  }
  return refinedTimeline
}
