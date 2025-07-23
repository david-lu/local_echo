import { ChatCompletionMessageToolCall } from "openai/resources/index";
import {
  BaseMutation,
  AddVisualMutationSchema,
  RemoveVisualMutationSchema,
  ModifyVisualMutationSchema,
  AddAudioMutationSchema,
  RemoveAudioMutationSchema,
  ModifyAudioMutationSchema,
  Message,
  Timeline,
  TimelineSchema,
  BaseClip,
  Overlap,
  Span,
  RefinedTimeline,
} from "./type";

export const stringifyWithoutNull = (obj: unknown): string =>
    JSON.stringify(obj, (_key, value) => (value === null ? undefined : value));

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

function isOverlapping(a: Span, b: Span): boolean {
  return Math.max(a.start_ms, b.start_ms) < Math.min(a.end_ms, b.end_ms);
}

export function getOverlaps(clips: BaseClip[]): Overlap[] {
  let overlaps: Overlap[] = [];
  const others = [...clips]

  console.log('getOverlaps clips', clips)

  for (const clip of clips) {
    const newOverlaps: Overlap[] = [...overlaps]
    // First, check against existing overlaps
    for (const overlap of overlaps) {
      if (
        clip.start_ms === overlap.start_ms &&
        clip.end_ms === overlap.end_ms
      ) {
        // Exact match, add clip_id if missing
        if (!overlap.clip_ids.includes(clip.id)) {
          overlap.clip_ids.push(clip.id);
        }
      } else if (isOverlapping(clip, overlap)) {
        // Partial overlap, create a new overlap with intersection
        newOverlaps.push({
          start_ms: Math.max(clip.start_ms, overlap.start_ms),
          end_ms: Math.min(clip.end_ms, overlap.end_ms),
          clip_ids: Array.from(new Set(overlap.clip_ids.concat(clip.id))),
        });
      }
    }

    // Then check against other spans to find pairwise overlaps
    for (const other of others) {
      if (clip.id === other.id) continue;
      if (isOverlapping(clip, other)) {
        const overlapStart = Math.max(clip.start_ms, other.start_ms);
        const overlapEnd = Math.min(clip.end_ms, other.end_ms);

        // Check if this exact overlap already exists
        const existing = overlaps.find(
          (o) => o.start_ms === overlapStart && o.end_ms === overlapEnd
        );

        if (existing) {
          if (!existing.clip_ids.includes(clip.id))
            existing.clip_ids.push(clip.id);
          if (!existing.clip_ids.includes(other.id))
            existing.clip_ids.push(other.id);
        } else {
          newOverlaps.push({
            start_ms: overlapStart,
            end_ms: overlapEnd,
            clip_ids: [clip.id, other.id],
          });
        }
      }
    }
    overlaps = newOverlaps
  }

  return overlaps;
}

export const getTotalDuration = (spans: Span[]): number => {
  return spans.reduce((max, clip) => Math.max(max, clip.end_ms), 0);
};

export const getGaps = (
  clips: BaseClip[],
  timeline_duration_ms?: number
): Span[] => {
  console.log('getGaps clips', clips)
  const timelineEnd = Math.max(
    getTotalDuration(clips),
    timeline_duration_ms || 0
  );

  let gaps: Span[] = [{ start_ms: 0, end_ms: timelineEnd }];

  for (const clip of clips) {
    const nextGaps: Span[] = [];

    for (const gap of gaps) {
      if (clip.end_ms <= gap.start_ms || clip.start_ms >= gap.end_ms) {
        // No overlap, keep gap as is
        nextGaps.push(gap);
      } else {
        // Overlap, split the gap

        if (gap.start_ms < clip.start_ms) {
          nextGaps.push({ start_ms: gap.start_ms, end_ms: clip.start_ms });
        }

        if (gap.end_ms > clip.end_ms) {
          nextGaps.push({ start_ms: clip.end_ms, end_ms: gap.end_ms });
        }
        // If clip fully covers the gap, we add nothing
      }
    }

    gaps = nextGaps;
  }

  return gaps;
};

// UGHHHHH
export const convertToOpenAIMessage = (message: Message) => {
  // Extract only the properties that OpenAI API expects
  const { role, content, tool_calls, function_call, refusal, annotations } =
    message;
  const openAIMessage: any = { role, content };

  if (tool_calls) openAIMessage.tool_calls = tool_calls;
  if (function_call) openAIMessage.function_call = function_call;
  if (refusal) openAIMessage.refusal = refusal;
  if (annotations) openAIMessage.annotations = annotations;

  return openAIMessage;
};

export const getMutationFromToolCall = (
  toolCall?: ChatCompletionMessageToolCall
): BaseMutation | null => {
  if (!toolCall) {
    return null;
  }
  try {
    const mutation = JSON.parse(toolCall.function.arguments);
    if (toolCall.function.name === "add_visual") {
      return AddVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "remove_visual") {
      return RemoveVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "modify_visual") {
      return ModifyVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "add_audio") {
      return AddAudioMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "remove_audio") {
      return RemoveAudioMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "modify_audio") {
      return ModifyAudioMutationSchema.parse(mutation);
    }
  } catch (error) {
    console.error("Error parsing tool call arguments:", error);
  }
  return null;
};
export const getMutationsFromMessages = (
  messages: Message[]
): BaseMutation[] => {
  const mutations: BaseMutation[] = [];
  for (const message of messages) {
    const toolCalls = message.tool_calls;
    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const mutation = getMutationFromToolCall(toolCall);
        if (mutation) {
          mutations.push(mutation);
        }
      }
    }
  }
  return mutations;
};


export const refineTimeline = (timeline: Timeline): RefinedTimeline => {
    const totalDuration = getTotalDuration([...timeline.audio_track, ...timeline.visual_track]);
    const refinedTimeline: RefinedTimeline = {
      ...timeline,
      audio_gaps: getGaps(timeline.audio_track, totalDuration),
      // audio_overlaps: [],
      audio_overlaps: getOverlaps(timeline.audio_track),
      visual_gaps: getGaps(timeline.visual_track, totalDuration),
      // visual_overlaps: [],
      visual_overlaps: getOverlaps(timeline.visual_track)
    };
    return refinedTimeline;
  }