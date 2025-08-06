import { Input, InputVideoTrack, CanvasSink } from 'mediabunny'
import { z } from 'zod'

export const RangeSchema = z
  .object({
    start_ms: z.number().describe('Start time of the span in milliseconds'),
    end_ms: z.number().describe('End time of the span in milliseconds')
  })
  .describe('A span of time in a Timeline track.')
export type Range = z.infer<typeof RangeSchema>
// Core timeline schemas

export const ClipSchema = z
  .object({
    id: z.string().describe('Unique identifier for the clip'),
    start_ms: z.number().describe('Start time of the clip in milliseconds'),
    duration_ms: z.number().describe('Duration of the clip in milliseconds'),
    speaker: z
      .string()
      .nullable()
      .describe(
        "Name of the speaker for the clips. The speaker of an audio and a visual clip should match if they're the same person."
      )
  })
  .describe('A clip is a span of time in a Timeline track.')
export type Clip = z.infer<typeof ClipSchema>

export const AssetClipSchema = ClipSchema.extend({
  asset_type: z.enum(['image', 'video', 'audio']),
  src: z.string().optional(),
  description: z.string().optional()
})
export type AssetClip = z.infer<typeof AssetClipSchema>

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

export const LoadedClipSchema = AssetClipSchema.merge(PlayableMediaSchema).extend({
  isLoading: z.boolean().optional(),
  isError: z.boolean().optional(),
  error: z.string().optional()
})
export type LoadedClip = z.infer<typeof LoadedClipSchema>

export const AudioAssetClipSchema = AssetClipSchema.extend({
  asset_type: z.literal('audio'),
  src: z.string()
})
export type PlayableAudioClip = z.infer<typeof AudioAssetClipSchema>

export const VisualAssetClipSchema = AssetClipSchema.extend({
  asset_type: z.enum(['image', 'video']),
  src: z.string()
})
export type PlayableVisualClip = z.infer<typeof VisualAssetClipSchema>
