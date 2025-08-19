import { Clip, Range } from '../kronos/types/timeline'
import { getTotalDuration, getGaps } from '../kronos/utils/timeline'
import { Timeline, RefinedTimeline, TimelineSchema } from '../types/timeline'

export function getOverlapRange(a: Clip, b: Clip): Range | null {
  const start = Math.max(a.start_ms, b.start_ms)
  const end = Math.min(a.start_ms + a.duration_ms, b.start_ms + b.duration_ms)

  if (start < end) {
    return { start_ms: start, end_ms: end }
  }

  return null
}

export const refineClip = (clip: Clip, track: Clip[]) => {
  const overlaps = []
  for (const otherClip of track) {
    if (clip.id === otherClip.id) continue
    const overlap = getOverlapRange(clip, otherClip)
    if (overlap) {
      overlaps.push({
        clip_id: otherClip.id,
        ...overlap
      })
    }
  }
  return {
    ...clip,
    overlaps: overlaps,
    end_ms: clip.start_ms + clip.duration_ms
  }
}

export const refineTrack = (track: Clip[]): any[] => {
  return track.map((clip) => refineClip(clip, track))
}

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
  timeline = sortTimeline(timeline)
  const totalDuration = getTotalDuration([...timeline.audio_track, ...timeline.visual_track])
  const refinedTimeline: RefinedTimeline = {
    ...timeline,
    audio_track: refineTrack(timeline.audio_track),
    visual_track: refineTrack(timeline.visual_track),
    audio_gaps: getGaps(timeline.audio_track, totalDuration),
    visual_gaps: getGaps(timeline.visual_track, totalDuration)
  }
  // Add scene index to visual clips
  for (let i = 0; i < refinedTimeline.visual_track.length; i++) {
    const clip = refinedTimeline.visual_track[i]
    clip.scene_index = i + 1
  }
  for (const audioClip of refinedTimeline.audio_track) {
    for (const visualClip of refinedTimeline.visual_track) {
      if (getOverlapRange(audioClip, visualClip)) {
        audioClip.scene_index = visualClip.scene_index
        break
      }
    }
  }
  return refinedTimeline
}
