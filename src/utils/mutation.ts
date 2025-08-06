import { ChatCompletionMessageToolCall } from 'openai/resources/index'
import { Message } from '../types/agent'
import {
  BaseMutation,
  AddVisualMutationSchema,
  RemoveVisualMutationSchema,
  ModifyVisualMutationSchema,
  AddAudioMutationSchema,
  RemoveAudioMutationSchema,
  ModifyAudioMutationSchema,
  RetimeClipsMutationSchema,
  AddAudioMutation,
  AddVisualMutation,
  ModifyAudioMutation,
  ModifyVisualMutation,
  RemoveAudioMutation,
  RemoveVisualMutation,
  RetimeClipsMutation
} from '../types/mutation'
import { refineTimeline } from './refine'
import { Timeline, AudioClip, VisualClip } from '../types/timeline'

export const convertToOpenAIMessage = (message: Message) => {
  // Extract only the properties that OpenAI API expects
  const { role, content, tool_calls, function_call, refusal, annotations, timeline } =
    message as any
  const openAIMessage: any = { role, content }

  if (tool_calls) openAIMessage.tool_calls = tool_calls
  if (function_call) openAIMessage.function_call = function_call
  if (refusal) openAIMessage.refusal = refusal
  if (annotations) openAIMessage.annotations = annotations
  if (timeline)
    openAIMessage.content =
      openAIMessage.content + '\n\n' + JSON.stringify(refineTimeline(timeline))

  return openAIMessage
}

export const getMutationFromToolCall = (
  toolCall?: ChatCompletionMessageToolCall
): BaseMutation | null => {
  if (!toolCall) {
    return null
  }
  try {
    const mutation = JSON.parse(toolCall.function.arguments)
    if (toolCall.function.name === 'add_visual') {
      return AddVisualMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'remove_visual') {
      return RemoveVisualMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'modify_visual') {
      return ModifyVisualMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'add_audio') {
      return AddAudioMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'remove_audio') {
      return RemoveAudioMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'modify_audio') {
      return ModifyAudioMutationSchema.parse(mutation)
    } else if (toolCall.function.name === 'retime_clips') {
      return RetimeClipsMutationSchema.parse(mutation)
    }
  } catch (error) {
    console.error('Error parsing tool call arguments:', error)
  }
  return null
}

export const getMutationsFromMessages = (messages: Message[]): BaseMutation[] => {
  const mutations: BaseMutation[] = []
  for (const message of messages) {
    const toolCalls = message.tool_calls
    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const mutation = getMutationFromToolCall(toolCall)
        if (mutation) {
          mutations.push(mutation)
        }
      }
    }
  }
  return mutations
}

/**
 * Applies a single mutation to the timeline
 */
export function applyMutation(timeline: Timeline, mutation: BaseMutation): Timeline {
  const newTimeline = {
    audio_track: [...timeline.audio_track],
    visual_track: [...timeline.visual_track]
  }

  switch (mutation.type) {
    case 'add_audio':
      const addAudioMutation = mutation as AddAudioMutation
      newTimeline.audio_track.push(addAudioMutation.clip as AudioClip)
      break

    case 'add_visual':
      const addVisualMutation = mutation as AddVisualMutation
      newTimeline.visual_track.push(addVisualMutation.clip as VisualClip)
      break

    case 'remove_audio': {
      const removeAudioMutation = mutation as RemoveAudioMutation
      const index = newTimeline.audio_track.findIndex(
        (clip) => clip.id === removeAudioMutation.clip_id
      )
      if (index !== -1) newTimeline.audio_track.splice(index, 1)
      break
    }

    case 'remove_visual': {
      const removeVisualMutation = mutation as RemoveVisualMutation
      const index = newTimeline.visual_track.findIndex(
        (clip) => clip.id === removeVisualMutation.clip_id
      )
      if (index !== -1) newTimeline.visual_track.splice(index, 1)
      break
    }

    case 'modify_audio': {
      const modifyAudioMutation = mutation as ModifyAudioMutation
      const index = newTimeline.audio_track.findIndex(
        (clip) => clip.id === modifyAudioMutation.clip.id
      )
      if (index !== -1) newTimeline.audio_track[index] = modifyAudioMutation.clip as AudioClip
      break
    }

    case 'modify_visual': {
      const modifyVisualMutation = mutation as ModifyVisualMutation
      const index = newTimeline.visual_track.findIndex(
        (clip) => clip.id === modifyVisualMutation.clip.id
      )
      if (index !== -1) newTimeline.visual_track[index] = modifyVisualMutation.clip as VisualClip
      break
    }

    case 'retime_clips': {
      const retimeClipsMutation = mutation as RetimeClipsMutation
      for (const retime of retimeClipsMutation.retimes) {
        const audioIndex = newTimeline.audio_track.findIndex((clip) => clip.id === retime.clip_id)
        const visualIndex = newTimeline.visual_track.findIndex((clip) => clip.id === retime.clip_id)
        if (audioIndex !== -1) {
          newTimeline.audio_track[audioIndex] = {
            ...newTimeline.audio_track[audioIndex],
            start_ms: retime.start_time_ms,
            duration_ms: retime.duration_ms
          }
        }
        if (visualIndex !== -1) {
          newTimeline.visual_track[visualIndex] = {
            ...newTimeline.visual_track[visualIndex],
            start_ms: retime.start_time_ms,
            duration_ms: retime.duration_ms
          }
        }
      }
      break
    }
  }

  return newTimeline
}

/**
 * Applies multiple mutations to the timeline in sequence
 */
export function applyMutations(timeline: Timeline, mutations: BaseMutation[]): Timeline {
  return mutations.reduce(applyMutation, timeline)
}
