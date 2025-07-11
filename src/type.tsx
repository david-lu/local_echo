import { z } from 'zod';

// Zod schemas
export const ImageGenerationTypeSchema = z.enum(["text_to_image", "image_to_image"]);
export type ImageGenerationType = z.infer<typeof ImageGenerationTypeSchema>;

export const EventTypeSchema = z.enum(["replace", "add", "remove"]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const BaseClipSchema = z.object({
    id: z.string(),
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

export const EventSchema = z.object({
    type: EventTypeSchema,
    id: z.string(),
    data: z.union([AudioClipSchema, VisualClipSchema])
});
export type Event = z.infer<typeof EventSchema>;

export const ServerResponseSchema = z.object({
    events: z.array(EventSchema)
});
export type ServerResponse = z.infer<typeof ServerResponseSchema>;

// ChatGPT API Response Schemas
export const ChatMessageSchema = z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().optional(),
    tool_calls: z.array(z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
            name: z.string(),
            arguments: z.string()
        })
    })).optional()
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatChoiceSchema = z.object({
    index: z.number(),
    message: ChatMessageSchema,
    finish_reason: z.string().optional()
});
export type ChatChoice = z.infer<typeof ChatChoiceSchema>;

export const ChatUsageSchema = z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number()
});
export type ChatUsage = z.infer<typeof ChatUsageSchema>;

export const ChatCompletionResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(ChatChoiceSchema),
    usage: ChatUsageSchema.optional()
});
export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

// Schema for the response content we actually care about
export const ChatResponseContentSchema = z.object({
    content: z.string()
});
export type ChatResponseContent = z.infer<typeof ChatResponseContentSchema>;

// Simplified timeline modification event
export const TimelineEventSchema = z.object({
    action: z.enum(["add", "remove"]),
    track: z.enum(["audio", "visual"]),
    clip: z.union([AudioClipSchema, VisualClipSchema]).optional(),
    targetId: z.string().optional()
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

// Simplified ChatGPT response
export const TimelineResponseSchema = z.object({
    events: z.array(TimelineEventSchema),
    message: z.string()
});
export type TimelineResponse = z.infer<typeof TimelineResponseSchema>;