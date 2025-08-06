import { CanvasSink, Input, InputVideoTrack } from 'mediabunny'
import z from 'zod'

import { AudioClipSchema, ClipSchema, VisualClipSchema } from './timeline'

export const PlayableClipSchema = ClipSchema.extend({
  asset_type: z.enum(['image', 'video', 'audio']),
  src: z.string()
})
export type PlayableClip = z.infer<typeof PlayableClipSchema>

export const VideoMediaSchema = z.object({
  input: z.instanceof(Input),
  video_track: z.instanceof(InputVideoTrack),
  canvas_sink: z.instanceof(CanvasSink)
})
export type VideoMedia = z.infer<typeof VideoMediaSchema>

export const PlayableMediaSchema = z.object({
  response: z.instanceof(Response).optional(),
  video: VideoMediaSchema.optional(),
  image: z.instanceof(HTMLImageElement).optional(),
  audio: z.instanceof(AudioBuffer).optional()
})
export type PlayableMedia = z.infer<typeof PlayableMediaSchema>

export const LoadedClipSchema = PlayableClipSchema.merge(PlayableMediaSchema).extend({
  isLoading: z.boolean().optional(),
  isError: z.boolean().optional(),
  error: z.string().optional()
})
export type LoadedClip = z.infer<typeof LoadedClipSchema>

export const PlayableAudioClipSchema = PlayableClipSchema.merge(AudioClipSchema).extend({
  asset_type: z.literal('audio')
})
export type PlayableAudioClip = z.infer<typeof PlayableAudioClipSchema>

export const PlayableVisualClipSchema = PlayableClipSchema.merge(VisualClipSchema).extend({
  asset_type: z.enum(['image', 'video'])
})
export type PlayableVisualClip = z.infer<typeof PlayableVisualClipSchema>
