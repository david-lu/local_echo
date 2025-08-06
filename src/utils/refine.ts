import { getTotalDuration, refineTrack, getGaps } from '../kronos/utils/timeline'
import { Timeline, RefinedTimeline } from '../types/timeline'

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
} // Convert JSON to Timeline with Zod validation
