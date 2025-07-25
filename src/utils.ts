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
  Clip,
  Range,
  RefinedTimeline,
  RetimeClipsMutationSchema,
} from "./type";

export const stringifyWithoutNull = (obj: unknown): string =>
  JSON.stringify(obj, (_key, value) => (value === null ? undefined : value));

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};

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
  const end = Math.min(a.start_ms + a.duration_ms, b.start_ms + b.duration_ms);

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
  return {...clip, overlaps: overlaps, end_ms: clip.start_ms + clip.duration_ms};
}

export const refineTrack = (track: Clip[]): any[] => {
  return track.map(clip => refineClip(clip, track));
}

export const getTotalDuration = (spans: Clip[]): number => {
  return spans.reduce((max, clip) => Math.max(max, clip.start_ms + clip.duration_ms), 0);
};

export const getGaps = (
  clips: Clip[],
  timeline_duration_ms?: number
): Range[] => {
  console.log("getGaps clips", clips);
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
          nextGaps.push({ start_ms: gap.start_ms, end_ms: clip.start_ms });
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
    } else if (toolCall.function.name === "retime_clips") {
      return RetimeClipsMutationSchema.parse(mutation);
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
};// Convert JSON to Timeline with Zod validation


export const getClipAtTime = (track: Clip[], time: number): Clip | null => {
  return track.find(clip => clip.start_ms <= time && clip.start_ms + clip.duration_ms > time) || null;
};

type Size = {
  width: number;
  height: number;
};

type Rect = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export function objectFitContain(container: Size, child: Size): Rect {
  const containerRatio = container.width / container.height;
  const childRatio = child.width / child.height;

  let scale: number;
  if (childRatio > containerRatio) {
    // Fit to width
    scale = container.width / child.width;
  } else {
    // Fit to height
    scale = container.height / child.height;
  }

  const width = child.width * scale;
  const height = child.height * scale;
  const x = (container.width - width) / 2;
  const y = (container.height - height) / 2;

  return { width, height, x, y };
}
