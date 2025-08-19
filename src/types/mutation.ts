import z from 'zod'
import {
  VisualClipSchema,
  AudioClipSchema,
  VisualExtensionSchema,
  AudioExtensionSchema
} from './timeline'
import { ClipSchema } from '../kronos/types/timeline'

// Mutation schemas using extension pattern
export const MutationTypeSchema = z
  .enum([
    'add_scene',
    'add_visual',
    'remove_visual',
    'add_audio',
    'remove_audio',
    'modify_visual',
    'modify_audio',
    'retime_clips'
  ])
  .describe('Types of timeline mutations: add, remove, or modify audio/visual clips')
export type MutationType = z.infer<typeof MutationTypeSchema>

export const BaseMutationSchema = z
  .object({
    type: MutationTypeSchema.describe('Type of mutation to perform'),
    description: z.string().describe('Description of what the mutation is doing')
  })
  .describe('Base mutation schema with type and description')
export type BaseMutation = z.infer<typeof BaseMutationSchema>

export const AddSceneMutationSchema = BaseMutationSchema.extend({
  type: z.literal('add_scene').describe('Add both a visual and audio clip to the timeline'),
  visual_clip: VisualExtensionSchema.describe('Visual clip to add'),
  audio_clip: AudioExtensionSchema.describe('Audio clip to add'),
  duration: ClipSchema.describe('Start time and duration of the scene')
}).describe('Mutation to add a new scene')
export type AddSceneMutation = z.infer<typeof AddSceneMutationSchema>

export const AddVisualMutationSchema = BaseMutationSchema.extend({
  type: z.literal('add_visual').describe('Add a new visual clip to the timeline'),
  clip: VisualClipSchema.describe('Visual clip to add')
}).describe('Mutation to add a new visual clip')
export type AddVisualMutation = z.infer<typeof AddVisualMutationSchema>

export const AddAudioMutationSchema = BaseMutationSchema.extend({
  type: z.literal('add_audio').describe('Add a new audio clip to the timeline'),
  clip: AudioClipSchema.describe('Audio clip to add')
}).describe('Mutation to add a new audio clip')
export type AddAudioMutation = z.infer<typeof AddAudioMutationSchema>

export const RemoveVisualMutationSchema = BaseMutationSchema.extend({
  type: z.literal('remove_visual').describe('Remove a visual clip from the timeline'),
  clip_id: z.string().describe('ID of the visual clip to remove')
}).describe('Mutation to remove a visual clip by ID')
export type RemoveVisualMutation = z.infer<typeof RemoveVisualMutationSchema>

export const RemoveAudioMutationSchema = BaseMutationSchema.extend({
  type: z.literal('remove_audio').describe('Remove an audio clip from the timeline'),
  clip_id: z.string().describe('ID of the audio clip to remove')
}).describe('Mutation to remove an audio clip by ID')
export type RemoveAudioMutation = z.infer<typeof RemoveAudioMutationSchema>

export const ModifyVisualMutationSchema = BaseMutationSchema.extend({
  type: z.literal('modify_visual').describe('Modify an existing visual clip'),
  clip: VisualClipSchema.describe('Updated visual clip data')
}).describe('Mutation to modify an existing visual clip')
export type ModifyVisualMutation = z.infer<typeof ModifyVisualMutationSchema>

export const ModifyAudioMutationSchema = BaseMutationSchema.extend({
  type: z.literal('modify_audio').describe('Modify an existing audio clip'),
  clip: AudioClipSchema.describe('Updated audio clip data')
}).describe('Mutation to modify an existing audio clip')
export type ModifyAudioMutation = z.infer<typeof ModifyAudioMutationSchema>

// export const AudioRetimeMutationSchema = BaseMutationSchema.extend({

export const RetimeClipsMutationSchema = BaseMutationSchema.extend({
  type: z.literal('retime_clips'),
  retimes: z
    .array(
      z.object({
        clip_id: z.string().describe('ID of the clip to shift'),
        start_time_ms: z.number().describe('New start time of the clip in milliseconds'),
        duration_ms: z.number().describe('New duration of the clip in milliseconds')
      })
    )
    .describe('Array of retimes to apply to the clips')
}).describe('Retime the noted clips by the given amount')

export type RetimeClipsMutation = z.infer<typeof RetimeClipsMutationSchema>
export const AnyMutationSchema = z.union([
  AddVisualMutationSchema,
  AddAudioMutationSchema,
  RemoveVisualMutationSchema,
  RemoveAudioMutationSchema,
  ModifyVisualMutationSchema,
  ModifyAudioMutationSchema
])

export type AnyMutation = z.infer<typeof AnyMutationSchema>
