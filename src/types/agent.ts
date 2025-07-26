import z from "zod";
import { TimelineSchema } from "./timeline";

// COPY of ChatCompletionMessageToolCall
export const ToolCallSchema = z
  .object({
    id: z.string().describe("Unique identifier for the tool call"),
    type: z.literal("function").describe("Type of tool call"),
    // index: z.number().describe("Index of the tool call"),
    function: z
      .object({
        name: z.string().describe("Name of the tool to call"),
        arguments: z.string().describe("Arguments for the tool call"),
      })
      .describe("Function call to perform"),
  })
  .describe("Tool call to perform");
export type ToolCall = z.infer<typeof ToolCallSchema>;
// Copy of ChatCompletionMessageToolCall

export const MessageSchema = z
  .object({
    // REQUIRED
    role: z
      .enum(["user", "system", "assistant"])
      .describe("Message role indicating it's from the user"),
    content: z
      .string()
      .nullable()
      .describe("Text content of the user's message"),
    refusal: z
      .string()
      .nullable()
      .describe("Reason for refusal of the message"),
    annotations: z
      .array(z.any())
      .optional()
      .describe("Annotations for the message"),
    audio: z
      .any()
      .optional()
      .nullable()
      .describe("Audio content of the message"),
    tool_calls: z
      .array(ToolCallSchema)
      .optional()
      .describe("Tool calls to perform"),
    function_call: z.any().nullable().describe("Function call to perform"),

    // ADDONS
    id: z.string().nullable().describe("Unique identifier for the message"),
    timestamp: z
      .number()
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
  timeline: TimelineSchema.describe("Timeline to edit"),
}).describe("User message in the chat conversation");
export type UserMessage = z.infer<typeof UserMessageSchema>;

export const AssistantMessageSchema = MessageSchema.extend({
  role: z
    .literal("assistant")
    .describe("Message role indicating it's from the AI system"),
}).describe("System message from AI with optional timeline mutations");
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
