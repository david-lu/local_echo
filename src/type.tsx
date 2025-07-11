import { z } from 'zod';

// Zod schemas
export const ImageGenerationTypeSchema = z.enum(["text_to_image", "image_to_image"]);
export type ImageGenerationType = z.infer<typeof ImageGenerationTypeSchema>;

export const BaseClipSchema = z.object({
    start_ms: z.number(),
    end_ms: z.number(),
    speaker: z.string().optional()
});
export type BaseClip = z.infer<typeof BaseClipSchema>;

export const AudioGenerationParamsSchema = z.object({
    text: z.string(),
    speed: z.number(),
    stability: z.number()
});
export type AudioGenerationParams = z.infer<typeof AudioGenerationParamsSchema>;

export const AudioClipSchema = BaseClipSchema.extend({
    type: z.literal("audio"),
    audio_generation_params: AudioGenerationParamsSchema.optional(),
    audio_task_id: z.string().optional(),
    audio_asset_id: z.string().optional()
});
export type AudioClip = z.infer<typeof AudioClipSchema>;

export const ImageGenerationParamsSchema = z.object({
    type: ImageGenerationTypeSchema,
    ai_model_id: z.string(),
    prompt: z.string(),
    aspect_ratio: z.string()
});
export type ImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>;

export const ImageToImageGenerationParamsSchema = ImageGenerationParamsSchema.extend({
    type: z.literal("image_to_image"),
    reference_image_asset_id: z.string()
});
export type ImageToImageGenerationParams = z.infer<typeof ImageToImageGenerationParamsSchema>;

export const TextToImageGenerationParamsSchema = ImageGenerationParamsSchema.extend({
    type: z.literal("text_to_image")
});
export type TextToImageGenerationParams = z.infer<typeof TextToImageGenerationParamsSchema>;

export const VideoGenerationParamsSchema = z.object({
    type: z.literal("video"),
    ai_model_id: z.string(),
    description: z.string(),
    aspect_ratio: z.string()
});
export type VideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>;

export const VisualClipSchema = BaseClipSchema.extend({
    type: z.literal("visual"),
    image_generation_params: z.union([TextToImageGenerationParamsSchema, ImageToImageGenerationParamsSchema]).optional(),
    image_task_id: z.string().optional(),
    image_asset_id: z.string().optional(),
    video_generation_params: VideoGenerationParamsSchema.optional(),
    video_task_id: z.string().optional(),
    video_asset_id: z.string().optional()
});
export type VisualClip = z.infer<typeof VisualClipSchema>;

export const TimelineSchema = z.object({
    audio_track: z.array(AudioClipSchema),
    visual_track: z.array(VisualClipSchema)
});
export type Timeline = z.infer<typeof TimelineSchema>;