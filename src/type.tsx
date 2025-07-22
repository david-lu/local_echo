import { z } from "zod";

// Core timeline schemas
export const BaseClipSchema = z
  .object({
    id: z.string().describe("Unique identifier for the clip"),
    start_ms: z.number().describe("Start time of the clip in milliseconds"),
    end_ms: z.number().describe("End time of the clip in milliseconds"),
    speaker: z
      .string()
      .nullable()
      .describe(
        "Name of the speaker for the clips. The speaker of an audio and a visual clip should match if they're the same person."
      ),
  })
  .describe("Base properties shared by all clip types");
export type BaseClip = z.infer<typeof BaseClipSchema>;

export const AudioGenerationParamsSchema = z
  .object({
    text: z.string().describe("Text content to be converted to speech"),
    speed: z
      .number()
      .describe("Speech rate multiplier (0.5 = slow, 2.0 = fast)"),
    stability: z
      .number()
      .describe("Voice stability (0.0 = variable, 1.0 = stable)"),
  })
  .describe("Parameters for text-to-speech audio generation");
export type AudioGenerationParams = z.infer<typeof AudioGenerationParamsSchema>;

export const AudioClipSchema = BaseClipSchema.extend({
  type: z.literal("audio").describe("Type identifier for audio clips"),
  audio_generation_params: AudioGenerationParamsSchema.nullable().describe(
    "Text-to-speech parameters, null if audio is pre-generated"
  ),
  audio_task_id: z
    .string()
    .nullable()
    .describe("ID of the audio generation task, null if not yet generated"),
  audio_asset_id: z
    .string()
    .nullable()
    .describe("ID of the generated audio asset, null if not yet generated"),
}).describe("Audio clip with text-to-speech generation capabilities");
export type AudioClip = z.infer<typeof AudioClipSchema>;

export const ImageGenerationTypeSchema = z
  .enum(["text_to_image", "image_to_image"])
  .describe(
    "Type of image generation: from text prompt or from reference image"
  );
export type ImageGenerationType = z.infer<typeof ImageGenerationTypeSchema>;

export const ImageGenerationParamsSchema = z
  .object({
    type: ImageGenerationTypeSchema.describe("Type of image generation"),
    ai_model_id: z
      .string()
      .describe("ID of the AI model to use for image generation"),
    prompt: z.string().describe("Text prompt describing the image to generate"),
    aspect_ratio: z
      .string()
      .describe("Aspect ratio of the image (e.g., '16:9', '1:1', '4:3')"),
  })
  .describe("Base parameters for image generation");
export type ImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>;

export const ImageToImageGenerationParamsSchema =
  ImageGenerationParamsSchema.extend({
    type: z
      .literal("image_to_image")
      .describe("Image-to-image generation type"),
    reference_image_asset_id: z
      .string()
      .describe("ID of the reference image to use as base"),
  }).describe(
    "Parameters for image-to-image generation using a reference image"
  );
export type ImageToImageGenerationParams = z.infer<
  typeof ImageToImageGenerationParamsSchema
>;

export const TextToImageGenerationParamsSchema =
  ImageGenerationParamsSchema.extend({
    type: z.literal("text_to_image").describe("Text-to-image generation type"),
  }).describe("Parameters for text-to-image generation from a text prompt");
export type TextToImageGenerationParams = z.infer<
  typeof TextToImageGenerationParamsSchema
>;

export const VideoGenerationParamsSchema = z
  .object({
    type: z.literal("video").describe("Video generation type"),
    ai_model_id: z
      .string()
      .describe("ID of the AI model to use for video generation"),
    description: z
      .string()
      .describe("Text description of the video to generate"),
    aspect_ratio: z
      .string()
      .describe("Aspect ratio of the video (e.g., '16:9', '9:16', '1:1')"),
  })
  .describe("Parameters for AI video generation");
export type VideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>;

export const VisualClipSchema = BaseClipSchema.extend({
  type: z.literal("visual").describe("Type identifier for visual clips"),
  image_generation_params: z
    .union([
      TextToImageGenerationParamsSchema,
      ImageToImageGenerationParamsSchema,
    ])
    .nullable()
    .describe("Image generation parameters, null if using pre-generated image"),
  image_task_id: z
    .string()
    .nullable()
    .describe("ID of the image generation task, null if not yet generated"),
  image_asset_id: z
    .string()
    .nullable()
    .describe("ID of the generated image asset, null if not yet generated"),
  video_generation_params: VideoGenerationParamsSchema.nullable().describe(
    "Video generation parameters, null if using pre-generated video"
  ),
  video_task_id: z
    .string()
    .nullable()
    .describe("ID of the video generation task, null if not yet generated"),
  video_asset_id: z
    .string()
    .nullable()
    .describe("ID of the generated video asset, null if not yet generated"),
}).describe("Visual clip with image and video generation capabilities");
export type VisualClip = z.infer<typeof VisualClipSchema>;

export const TimelineSchema = z
  .object({
    audio_track: z
      .array(AudioClipSchema)
      .describe("Array of audio clips in chronological order"),
    visual_track: z
      .array(VisualClipSchema)
      .describe("Array of visual clips in chronological order"),
  })
  .describe("Complete timeline with separate audio and visual tracks");
export type Timeline = z.infer<typeof TimelineSchema>;

// Mutation schemas using extension pattern
export const MutationTypeSchema = z
  .enum([
    "add_visual",
    "remove_visual",
    "add_audio",
    "remove_audio",
    "modify_visual",
    "modify_audio",
  ])
  .describe(
    "Types of timeline mutations: add, remove, or modify audio/visual clips"
  );
export type MutationType = z.infer<typeof MutationTypeSchema>;

export const BaseMutationSchema = z
  .object({
    type: MutationTypeSchema.describe("Type of mutation to perform"),
    description: z
      .string()
      .describe("Description of what the mutation is doing"),
  })
  .describe("Base mutation schema with type and description");
export type BaseMutation = z.infer<typeof BaseMutationSchema>;

export const AddVisualMutationSchema = BaseMutationSchema.extend({
  type: z
    .literal("add_visual")
    .describe("Add a new visual clip to the timeline"),
  clip: VisualClipSchema.describe("Visual clip to add"),
}).describe("Mutation to add a new visual clip");
export type AddVisualMutation = z.infer<typeof AddVisualMutationSchema>;

export const AddAudioMutationSchema = BaseMutationSchema.extend({
  type: z.literal("add_audio").describe("Add a new audio clip to the timeline"),
  clip: AudioClipSchema.describe("Audio clip to add"),
}).describe("Mutation to add a new audio clip");
export type AddAudioMutation = z.infer<typeof AddAudioMutationSchema>;

export const RemoveVisualMutationSchema = BaseMutationSchema.extend({
  type: z
    .literal("remove_visual")
    .describe("Remove a visual clip from the timeline"),
  clip_id: z.string().describe("ID of the visual clip to remove"),
}).describe("Mutation to remove a visual clip by ID");
export type RemoveVisualMutation = z.infer<typeof RemoveVisualMutationSchema>;

export const RemoveAudioMutationSchema = BaseMutationSchema.extend({
  type: z
    .literal("remove_audio")
    .describe("Remove an audio clip from the timeline"),
  clip_id: z.string().describe("ID of the audio clip to remove"),
}).describe("Mutation to remove an audio clip by ID");
export type RemoveAudioMutation = z.infer<typeof RemoveAudioMutationSchema>;

export const ModifyVisualMutationSchema = BaseMutationSchema.extend({
  type: z.literal("modify_visual").describe("Modify an existing visual clip"),
  clip: VisualClipSchema.describe("Updated visual clip data"),
}).describe("Mutation to modify an existing visual clip");
export type ModifyVisualMutation = z.infer<typeof ModifyVisualMutationSchema>;

export const ModifyAudioMutationSchema = BaseMutationSchema.extend({
  type: z.literal("modify_audio").describe("Modify an existing audio clip"),
  clip: AudioClipSchema.describe("Updated audio clip data"),
}).describe("Mutation to modify an existing audio clip");
export type ModifyAudioMutation = z.infer<typeof ModifyAudioMutationSchema>;

export const MessageSchema = z
  .object({
    id: z.string().nullable().describe("Unique identifier for the message"),
    role: z
      .enum(["user", "system"])
      .describe("Message role indicating it's from the user"),
    content: z.string().describe("Text content of the user's message"),
    timestamp: z
      .string()
      .nullable()
      .describe("ISO timestamp when the message was created"),
  })
  .describe("User message in the chat conversation");
export type Message = z.infer<typeof MessageSchema>;

// Chat message schemas
export const UserMessageSchema = MessageSchema.extend({
  role: z
    .literal("user")
    .describe("Message role indicating it's from the user"),
}).describe("User message in the chat conversation");
export type UserMessage = z.infer<typeof UserMessageSchema>;

/**
 * {
    "id": "call_12345xyz",
    "type": "function",
    "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Paris, France\"}"
    }
}
 * 
 */

// COPY of ChatCompletionMessageToolCall
export const ToolCallSchema = z
  .object({
    index: z.number().describe("Index of the tool call"),
    id: z.string().describe("Unique identifier for the tool call"),
    function: z
      .object({
        name: z.string().describe("Name of the tool to call"),
        arguments: z.string().describe("Arguments for the tool call"),
      })
      .describe("Function call to perform"),
  })
  .describe("Tool call to perform");
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const AnyMutationSchema = z.union([
  AddVisualMutationSchema,
  AddAudioMutationSchema,
  RemoveVisualMutationSchema,
  RemoveAudioMutationSchema,
  ModifyVisualMutationSchema,
  ModifyAudioMutationSchema,
]);
export type AnyMutation = z.infer<typeof AnyMutationSchema>;

export const SystemMessageSchema = MessageSchema.extend({
  role: z
    .literal("system")
    .describe("Message role indicating it's from the AI system"),
  content: z.string().describe("Text content of the AI's response"),
  mutation: AnyMutationSchema
    .nullable()
    .describe("Timeline mutation to perform, null if no mutation is needed"),
}).describe("System message from AI with optional timeline mutations");
export type SystemMessage = z.infer<typeof SystemMessageSchema>;
