import { z } from 'zod'
import { ClipSchema, RangeSchema } from '../kronos/types/timeline'

export const AudioGenerationParamsSchema = z
  .object({
    text: z.string().describe('Text content to be converted to speech'),
    speed: z.number().describe('Speech rate multiplier (0.5 = slow, 2.0 = fast)'),
    stability: z.number().describe('Voice stability (0.0 = variable, 1.0 = stable)')
  })
  .describe('Parameters for text-to-speech audio generation')
export type AudioGenerationParams = z.infer<typeof AudioGenerationParamsSchema>

export const AudioClipSchema = ClipSchema.extend({
  type: z.literal('audio').describe('Type identifier for audio clips'),
  audio_generation_params: AudioGenerationParamsSchema.nullable().describe(
    'Text-to-speech parameters, null if audio is pre-generated'
  ),
  audio_task_id: z
    .string()
    .nullable()
    .describe('ID of the audio generation task, null if not yet generated'),
  audio_asset_id: z
    .string()
    .nullable()
    .describe('ID of the generated audio asset, null if not yet generated'),
  speaker: z.string().nullable().describe('Name of the speaker, null if not yet generated')
}).describe('Audio clip with text-to-speech generation capabilities')
export type AudioClip = z.infer<typeof AudioClipSchema>

export const ImageGenerationTypeSchema = z
  .enum(['text_to_image', 'image_to_image'])
  .describe('Type of image generation: from text prompt or from reference image')
export type ImageGenerationType = z.infer<typeof ImageGenerationTypeSchema>

export const ImageGenerationParamsSchema = z
  .object({
    type: ImageGenerationTypeSchema.describe('Type of image generation'),
    ai_model_id: z.string().describe('ID of the AI model to use for image generation'),
    prompt: z.string().describe('Text prompt describing the image to generate'),
    aspect_ratio: z.string().describe("Aspect ratio of the image (e.g., '16:9', '1:1', '4:3')")
  })
  .describe('Base parameters for image generation')
export type ImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>

export const ImageToImageGenerationParamsSchema = ImageGenerationParamsSchema.extend({
  type: z.literal('image_to_image').describe('Image-to-image generation type'),
  reference_image_asset_id: z.string().describe('ID of the reference image to use as base')
}).describe('Parameters for image-to-image generation using a reference image')
export type ImageToImageGenerationParams = z.infer<typeof ImageToImageGenerationParamsSchema>

export const TextToImageGenerationParamsSchema = ImageGenerationParamsSchema.extend({
  type: z.literal('text_to_image').describe('Text-to-image generation type')
}).describe('Parameters for text-to-image generation from a text prompt')
export type TextToImageGenerationParams = z.infer<typeof TextToImageGenerationParamsSchema>

export const VideoGenerationParamsSchema = z
  .object({
    type: z.literal('video').describe('Video generation type'),
    ai_model_id: z.string().describe('ID of the AI model to use for video generation'),
    description: z.string().describe('Text description of the video to generate'),
    aspect_ratio: z.string().describe("Aspect ratio of the video (e.g., '16:9', '9:16', '1:1')")
  })
  .describe('Parameters for AI video generation')
export type VideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>

export const VisualExtensionSchema = z
  .object({
    image_generation_params: z
      .union([TextToImageGenerationParamsSchema, ImageToImageGenerationParamsSchema])
      .nullable()
      .describe('Image generation parameters, null if using pre-generated image'),
    image_task_id: z
      .string()
      .nullable()
      .describe('ID of the image generation task, null if not yet generated'),
    image_asset_id: z
      .string()
      .nullable()
      .describe('ID of the generated image asset, null if not yet generated'),
    video_generation_params: VideoGenerationParamsSchema.nullable().describe(
      'Video generation parameters, null if using pre-generated video'
    ),
    video_task_id: z
      .string()
      .nullable()
      .describe('ID of the video generation task, null if not yet generated'),
    video_asset_id: z
      .string()
      .nullable()
      .describe('ID of the generated video asset, null if not yet generated'),
    speaker: z.string().nullable().describe('Name of the speaker, null if not yet generated')
  })
  .describe('Visual extension with an image asset')
export type VisualExtension = z.infer<typeof VisualExtensionSchema>

export const VisualClipSchema = ClipSchema.merge(VisualExtensionSchema)
  .extend({
    type: z.literal('visual').describe('Type identifier for visual clips')
  })
  .describe('Visual clip with image and video generation capabilities')
export type VisualClip = z.infer<typeof VisualClipSchema>

export const TimelineSchema = z
  .object({
    audio_track: z.array(AudioClipSchema).describe('Array of audio clips in chronological order'),
    visual_track: z.array(VisualClipSchema).describe('Array of visual clips in chronological order')
  })
  .describe('Complete timeline with separate audio and visual tracks')
export type Timeline = z.infer<typeof TimelineSchema>

export const RefinedSchema = z
  .object({
    overlaps: z.array(
      z
        .object({
          clip_id: z.string().describe('ID of the clip that overlaps')
        })
        .merge(RangeSchema)
    ),
    end_ms: z.number().describe('End time of the clip in milliseconds')
  })
  .describe('An overlap between two clips in a timeline')

export const RefinedTimelineSchema = TimelineSchema.extend({
  audio_gaps: z.array(RangeSchema).describe('All the gaps between audio clips in milliseconds'),
  visual_gaps: z.array(RangeSchema).describe('All the gaps between visual clips in milliseconds'),
  audio_track: z
    .array(AudioClipSchema.merge(RefinedSchema))
    .describe('Array of audio clips in chronological order'),
  visual_track: z
    .array(VisualClipSchema.merge(RefinedSchema))
    .describe('Array of visual clips in chronological order')
}).describe(
  'Complete timeline with separate audio and visual tracks but also with the gaps and overlaps of the clips.'
)
export type RefinedTimeline = z.infer<typeof RefinedTimelineSchema>
