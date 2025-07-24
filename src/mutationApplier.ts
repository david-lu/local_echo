import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions/completions";
import {
  Timeline,
  AudioClip,
  VisualClip,
  AddVisualMutation,
  AddAudioMutation,
  ModifyVisualMutation,
  ModifyAudioMutation,
  BaseMutation,
  RemoveAudioMutation,
  RemoveVisualMutation,
  RetimeClipsMutation,
} from "./type";
import { getMutationFromToolCall } from "./utils";

/**
 * Applies a single mutation to the timeline
 */
export function applyMutation(
  timeline: Timeline,
  mutation: BaseMutation
): Timeline {
  const newTimeline = {
    audio_track: [...timeline.audio_track],
    visual_track: [...timeline.visual_track],
  };

  switch (mutation.type) {
    case "add_audio":
      const addAudioMutation = mutation as AddAudioMutation;
      newTimeline.audio_track.push(addAudioMutation.clip as AudioClip);
      break;

    case "add_visual":
      const addVisualMutation = mutation as AddVisualMutation;
      newTimeline.visual_track.push(addVisualMutation.clip as VisualClip);
      break;

    case "remove_audio": {
      const removeAudioMutation = mutation as RemoveAudioMutation;
      const index = newTimeline.audio_track.findIndex(
        (clip) => clip.id === removeAudioMutation.clip_id
      );
      if (index !== -1) newTimeline.audio_track.splice(index, 1);
      break;
    }

    case "remove_visual": {
      const removeVisualMutation = mutation as RemoveVisualMutation;
      const index = newTimeline.visual_track.findIndex(
        (clip) => clip.id === removeVisualMutation.clip_id
      );
      if (index !== -1) newTimeline.visual_track.splice(index, 1);
      break;
    }

    case "modify_audio": {
      const modifyAudioMutation = mutation as ModifyAudioMutation;
      const index = newTimeline.audio_track.findIndex(
        (clip) => clip.id === modifyAudioMutation.clip.id
      );
      if (index !== -1)
        newTimeline.audio_track[index] = modifyAudioMutation.clip as AudioClip;
      break;
    }

    case "modify_visual": {
      const modifyVisualMutation = mutation as ModifyVisualMutation;
      const index = newTimeline.visual_track.findIndex(
        (clip) => clip.id === modifyVisualMutation.clip.id
      );
      if (index !== -1)
        newTimeline.visual_track[index] =
          modifyVisualMutation.clip as VisualClip;
      break;
    }

    case "retime_clips": {
      const retimeClipsMutation = mutation as RetimeClipsMutation;
      for (const retime of retimeClipsMutation.retimes) {
        const audioIndex = newTimeline.audio_track.findIndex(
          (clip) => clip.id === retime.clip_id
        );
        const visualIndex = newTimeline.visual_track.findIndex(
          (clip) => clip.id === retime.clip_id
        );
        if (audioIndex !== -1) {
          newTimeline.audio_track[audioIndex] = {
            ...newTimeline.audio_track[audioIndex],
            start_ms: retime.start_time_ms,
            end_ms: retime.end_time_ms,
          }
        }
        if (visualIndex !== -1) {
          newTimeline.visual_track[visualIndex] = {
            ...newTimeline.visual_track[visualIndex],
            start_ms: retime.start_time_ms,
            end_ms: retime.end_time_ms,
          }
        }
      }
      break;
    }
  }

  return newTimeline;
}

/**
 * Applies multiple mutations to the timeline in sequence
 */
export function applyMutations(
  timeline: Timeline,
  mutations: BaseMutation[]
): Timeline {
  return mutations.reduce(applyMutation, timeline);
}
