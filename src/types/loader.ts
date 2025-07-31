import z from 'zod'
import { ClipSchema } from './timeline'
import * as PIXI from 'pixi.js'

export const PlayableClipSchema = ClipSchema.extend({
  type: z.enum(['image', 'video', 'audio']),
  src: z.string()
})
export type PlayableClip = z.infer<typeof PlayableClipSchema>

export const PlayableMediaSchema = z.object({
  video: z.instanceof(HTMLVideoElement).optional(),
  image: z.instanceof(HTMLImageElement).optional(),
  audio: z.instanceof(AudioBuffer).optional(),
  texture: z.instanceof(PIXI.Texture).optional()
})
export type PlayableMedia = z.infer<typeof PlayableMediaSchema>

export const LoadedClipSchema = PlayableClipSchema.merge(PlayableMediaSchema).extend({
  isLoading: z.boolean().optional(),
  isError: z.boolean().optional(),
  error: z.string().optional()
})
export type LoadedClip = z.infer<typeof LoadedClipSchema>
