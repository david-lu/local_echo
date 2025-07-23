import { ChatCompletionMessageToolCall } from "openai/resources/index";
import { BaseMutation, AddVisualMutationSchema, RemoveVisualMutationSchema, ModifyVisualMutationSchema, AddAudioMutationSchema, RemoveAudioMutationSchema, ModifyAudioMutationSchema, Message } from "./type";


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
        }
    } catch (error) {
        console.error("Error parsing tool call arguments:", error);
    }
    return null;
};export const getMutationsFromMessages = (messages: Message[]): BaseMutation[] => {
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

