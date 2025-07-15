import { z } from 'zod';

// Core timeline schemas
export const BaseClipSchema = z.object({
    id: z.string(),
    start_ms: z.number(),
    end_ms: z.number(),
    speaker: z.string().nullable()
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
    audio_generation_params: AudioGenerationParamsSchema.nullable(),
    audio_task_id: z.string().nullable(),
    audio_asset_id: z.string().nullable()
});
export type AudioClip = z.infer<typeof AudioClipSchema>;

export const ImageGenerationTypeSchema = z.enum(["text_to_image", "image_to_image"]);
export type ImageGenerationType = z.infer<typeof ImageGenerationTypeSchema>;

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
    image_generation_params: z.union([TextToImageGenerationParamsSchema, ImageToImageGenerationParamsSchema]).nullable(),
    image_task_id: z.string().nullable(),
    image_asset_id: z.string().nullable(),
    video_generation_params: VideoGenerationParamsSchema.nullable(),
    video_task_id: z.string().nullable(),
    video_asset_id: z.string().nullable()
});
export type VisualClip = z.infer<typeof VisualClipSchema>;

export const TimelineSchema = z.object({
    audio_track: z.array(AudioClipSchema),
    visual_track: z.array(VisualClipSchema)
});
export type Timeline = z.infer<typeof TimelineSchema>;

// Mutation schemas using extension pattern
export const MutationTypeSchema = z.enum(["add_visual", "remove_visual", "add_audio", "remove_audio", "modify_visual", "modify_audio"]);
export type MutationType = z.infer<typeof MutationTypeSchema>;

export const MutationSchema = z.object({
    type: MutationTypeSchema,
    clip: z.union([AudioClipSchema, VisualClipSchema]).nullable()
});
export type Mutation = z.infer<typeof MutationSchema>;

export const AddVisualMutationSchema = MutationSchema.extend({
    type: z.literal("add_visual"),
    clip: VisualClipSchema
});
export type AddVisualMutation = z.infer<typeof AddVisualMutationSchema>;

export const AddAudioMutationSchema = MutationSchema.extend({
    type: z.literal("add_audio"),
    clip: AudioClipSchema
});
export type AddAudioMutation = z.infer<typeof AddAudioMutationSchema>;

export const RemoveVisualMutationSchema = MutationSchema.extend({
    type: z.literal("remove_visual"),
    clip_id: z.string()
});
export type RemoveVisualMutation = z.infer<typeof RemoveVisualMutationSchema>;

export const RemoveAudioMutationSchema = MutationSchema.extend({
    type: z.literal("remove_audio"),
    clip_id: z.string()
});
export type RemoveAudioMutation = z.infer<typeof RemoveAudioMutationSchema>;

export const ModifyVisualMutationSchema = MutationSchema.extend({
    type: z.literal("modify_visual"),
    clip: VisualClipSchema
});
export type ModifyVisualMutation = z.infer<typeof ModifyVisualMutationSchema>;

export const ModifyAudioMutationSchema = MutationSchema.extend({
    type: z.literal("modify_audio"),
    clip: AudioClipSchema
});
export type ModifyAudioMutation = z.infer<typeof ModifyAudioMutationSchema>;

// Chat message schemas
export const UserMessageSchema = z.object({
  id: z.string(),
  role: z.literal('user'),
  content: z.string(),
  timestamp: z.date()
});
export type UserMessage = z.infer<typeof UserMessageSchema>;

export const SystemMessageSchema = z.object({
  id: z.string(),
  role: z.literal('system'),
  content: z.string(),
  timestamp: z.date(),
  mutations: z.array(z.union([
    AddVisualMutationSchema,
    AddAudioMutationSchema,
    RemoveVisualMutationSchema,
    RemoveAudioMutationSchema,
    ModifyVisualMutationSchema,
    ModifyAudioMutationSchema
  ])).nullable()
});
export type SystemMessage = z.infer<typeof SystemMessageSchema>;

// Union of all message types
export const MessageSchema = z.discriminatedUnion("role", [
  UserMessageSchema,
  SystemMessageSchema
]);
export type Message = z.infer<typeof MessageSchema>;
