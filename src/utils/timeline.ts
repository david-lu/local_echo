import { UseQueryResult } from "@tanstack/react-query";
import { LoadedClip, PlayableClip } from "../types/loader";
import {
    Timeline,
    TimelineSchema,
    Clip,
    Range,
    RefinedTimeline,
} from "../types/timeline";

export function sortTimeline(timeline: Timeline): Timeline {
    timeline.audio_track = timeline.audio_track.sort(
        (a, b) => a.start_ms - b.start_ms
    );
    timeline.visual_track = timeline.visual_track.sort(
        (a, b) => a.start_ms - b.start_ms
    );
    return timeline;
}

export function parseTimeline(jsonData: unknown): Timeline {
    const result = TimelineSchema.parse(jsonData);
    return sortTimeline(result);
}
function getOverlapRange(a: Clip, b: Clip): Range | null {
    const start = Math.max(a.start_ms, b.start_ms);
    const end = Math.min(
        a.start_ms + a.duration_ms,
        b.start_ms + b.duration_ms
    );

    if (start < end) {
        return { start_ms: start, end_ms: end };
    }

    return null;
}

export const refineClip = (clip: Clip, track: Clip[]) => {
    const overlaps = [];
    for (const otherClip of track) {
        const overlap = getOverlapRange(clip, otherClip);
        if (overlap) {
            overlaps.push({
                clip_id: otherClip.id,
                ...overlap,
            });
        }
    }
    return {
        ...clip,
        overlaps: overlaps,
        end_ms: clip.start_ms + clip.duration_ms,
    };
};

export const refineTrack = (track: Clip[]): any[] => {
    return track.map((clip) => refineClip(clip, track));
};

export const getTotalDuration = (spans: Clip[]): number => {
    return spans.reduce(
        (max, clip) => Math.max(max, clip.start_ms + clip.duration_ms),
        0
    );
};

export const getGaps = (
    clips: Clip[],
    timeline_duration_ms?: number
): Range[] => {
    // console.log("getGaps clips", clips);
    const timelineEnd = Math.max(
        getTotalDuration(clips),
        timeline_duration_ms || 0
    );

    let gaps: Range[] = [{ start_ms: 0, end_ms: timelineEnd }];

    for (const clip of clips) {
        const clipEnd = clip.start_ms + clip.duration_ms;
        const nextGaps: Range[] = [];

        for (const gap of gaps) {
            if (clipEnd <= gap.start_ms || clip.start_ms >= gap.end_ms) {
                // No overlap, keep gap as is
                nextGaps.push(gap);
            } else {
                // Overlap, split the gap
                if (gap.start_ms < clip.start_ms) {
                    nextGaps.push({
                        start_ms: gap.start_ms,
                        end_ms: clip.start_ms,
                    });
                }

                if (gap.end_ms > clipEnd) {
                    nextGaps.push({ start_ms: clipEnd, end_ms: gap.end_ms });
                }
                // If clip fully covers the gap, we add nothing
            }
        }

        gaps = nextGaps;
    }

    return gaps;
};
export const refineTimeline = (timeline: Timeline): RefinedTimeline => {
    const totalDuration = getTotalDuration([
        ...timeline.audio_track,
        ...timeline.visual_track,
    ]);
    const refinedTimeline: RefinedTimeline = {
        ...timeline,
        audio_track: refineTrack(timeline.audio_track),
        visual_track: refineTrack(timeline.visual_track),
        audio_gaps: getGaps(timeline.audio_track, totalDuration),
        visual_gaps: getGaps(timeline.visual_track, totalDuration),
    };
    return refinedTimeline;
}; // Convert JSON to Timeline with Zod validation

export const getClipAtTime = (track: Clip[], time: number): Clip | null => {
    return (
        track.find(
            (clip) =>
                clip.start_ms <= time && clip.start_ms + clip.duration_ms > time
        ) || null
    );
};

export const updateMediaCurrentTime = (
    media: HTMLVideoElement | HTMLAudioElement,
    startMs: number,
    playheadTimeMs: number,
    thresholdMs: number = 200
) => {
    const localTime = playheadTimeMs - startMs;
    const videoTime = media.currentTime * 1000;
    // console.log("video time", playheadTimeMs, videoTime);
    if (Math.abs(videoTime - localTime) > thresholdMs) {
        console.log("setting time", videoTime, localTime);
        media!.currentTime = localTime / 1000;
    }
};
