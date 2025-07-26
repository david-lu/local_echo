import { ChatCompletionMessageToolCall } from "openai/resources/index";
import { Message } from "../types/agent";
import { BaseMutation, AddVisualMutationSchema, RemoveVisualMutationSchema, ModifyVisualMutationSchema, AddAudioMutationSchema, RemoveAudioMutationSchema, ModifyAudioMutationSchema, RetimeClipsMutationSchema } from "../types/mutation";


export const convertToOpenAIMessage = (message: Message) => {
  // Extract only the properties that OpenAI API expects
  const { role, content, tool_calls, function_call, refusal, annotations } = message;
  const openAIMessage: any = { role, content };

  if (tool_calls) openAIMessage.tool_calls = tool_calls;
  if (function_call) openAIMessage.function_call = function_call;
  if (refusal) openAIMessage.refusal = refusal;
  if (annotations) openAIMessage.annotations = annotations;

  return openAIMessage;
};

export const getMutationFromToolCall = (
  toolCall?: ChatCompletionMessageToolCall
): BaseMutation | null => {
  if (!toolCall) {
    return null;
  }
  try {
    const mutation = JSON.parse(toolCall.function.arguments);
    if (toolCall.function.name === "add_visual") {
      return AddVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "remove_visual") {
      return RemoveVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "modify_visual") {
      return ModifyVisualMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "add_audio") {
      return AddAudioMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "remove_audio") {
      return RemoveAudioMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "modify_audio") {
      return ModifyAudioMutationSchema.parse(mutation);
    } else if (toolCall.function.name === "retime_clips") {
      return RetimeClipsMutationSchema.parse(mutation);
    }
  } catch (error) {
    console.error("Error parsing tool call arguments:", error);
  }
  return null;
};

export const getMutationsFromMessages = (
  messages: Message[]
): BaseMutation[] => {
  const mutations: BaseMutation[] = [];
  for (const message of messages) {
    const toolCalls = message.tool_calls;
    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const mutation = getMutationFromToolCall(toolCall);
        if (mutation) {
          mutations.push(mutation);
        }
      }
    }
  }
  return mutations;
};
