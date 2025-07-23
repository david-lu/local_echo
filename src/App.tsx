import React, { useState, useRef, useMemo } from "react";
import { OpenAI } from "openai";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Timeline from "./components/Timeline";
import ChatContainer from "./components/ChatContainer";
import ChatInput from "./components/ChatInput";
import ClipDisplayer from "./components/ClipDisplayer";
import {
  Message,
  UserMessage,
  AudioClip,
  VisualClip,
  AddVisualMutationSchema,
  AddAudioMutationSchema,
  ModifyAudioMutationSchema,
  ModifyVisualMutationSchema,
  RemoveAudioMutationSchema,
  RemoveVisualMutationSchema,
  AssistantMessage,
  ToolCall,
  AnyMutation,
  BaseMutation,
} from "./type";
import { convertToOpenAIMessage, getMutationsFromMessages, refineTimeline, stringifyWithoutNull } from "./utils";
import { getMutationFromToolCall } from "./utils";
import { AGENT_PROMPT } from "./prompts";
import { parseTimeline } from "./timelineConverter";
import timelineJson from "./data/sampleTimeline.json";
import { Timeline as TimelineType } from "./type";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { applyMutations } from "./mutationApplier";
import { v4 as uuidv4 } from "uuid";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions/completions";

const App: React.FC = () => {
  const [messages, setMessages] = useState<(Message | AssistantMessage)[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(
    parseTimeline(timelineJson)
  );
  const [selectedClip, setSelectedClip] = useState<
    AudioClip | VisualClip | null
  >(null);
  const [partialMessages, setPartialMessages] = useState<AssistantMessage[]>([]);

  // Get API key from environment variables
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // Create a ref to store the OpenAI client
  const openAIClientRef = useRef<OpenAI | null>(null);

  // console.log(zodResponseFormat(SystemMessageSchema, "message"));

  // Initialize OpenAI client
  const initializeOpenAI = (): OpenAI | null => {
    if (openAIClientRef.current) {
      return openAIClientRef.current;
    }

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      openAIClientRef.current = client;
      return client;
    } catch (error) {
      console.error("Error initializing OpenAI client:", error);
      setError("Failed to initialize OpenAI client.");
      return null;
    }
  };

  const addMessage = (
    message: Message
  ) => {
    setMessages((prev) => [
      ...prev,
      message,
    ]);
  };

  const addUserMessage = (
    content: string,
  ) => {
    addMessage({
      id: uuidv4(),
      role: "user",
      content,
      timestamp: Date.now(),
      refusal: null,
    });
  };

  /**
   * messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: result.toString()
  });
    * 
    */

  console.log('rendering', currentTimeline)

  const buildConversationHistory = (
    timeline: TimelineType,
    messages: Message[],
    systemMessages: AssistantMessage[],
    userMessage: string
  ) => {
    console.log(messages, systemMessages, userMessage);
    let mutatedTimeline = currentTimeline;
    let history = []
    history.push({
      role: "system" as const,
      content: AGENT_PROMPT,
    });
    history.push(...messages.map(convertToOpenAIMessage));
    history.push({
      role: "user" as const,
      content: userMessage + `\n\nCurrent timeline: ${stringifyWithoutNull(timeline)}`,
    });
    for (const systemMessage of systemMessages) {
      history.push(convertToOpenAIMessage(systemMessage));
      // Add tool response for each tool call in the system message
      if (systemMessage.tool_calls && systemMessage.tool_calls.length > 0) {
        const toolCall = systemMessage.tool_calls[0];
        const mutation = getMutationFromToolCall(toolCall);
        if (!mutation) {
          console.error("Bad mutation", toolCall);
          continue;
        }
        mutatedTimeline = applyMutations(mutatedTimeline, [mutation]);
        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(refineTimeline(mutatedTimeline)),
        });
      }
    }
    return history;
  };

  const handleSubmit = async (content: string): Promise<void> => {
    if (!content.trim()) return;
    if (!apiKey) {
      setError("OpenAI API key not found.");
      return;
    }

    const userMessage = content.trim();
    addUserMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const client = initializeOpenAI();
      if (!client) {
        setLoading(false);
        return;
      }

      const localPartialMessages = [...partialMessages];

      while (true) {
        const conversationHistory = buildConversationHistory(
          currentTimeline,
          messages,
          localPartialMessages,
          userMessage
        );
        console.log("CONVERSATION HISTORY", conversationHistory);

        const completion = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          max_tokens: 10000,
          // temperature: 0.5,
          // model: "o4-mini",
          // reasoning_effort: "low",
          // max_completion_tokens: 10000,
          messages: conversationHistory,
          parallel_tool_calls: false,
          tools: [
            zodFunction({
              name: "add_visual",
              parameters: AddVisualMutationSchema,
            }),
            zodFunction({
              name: "remove_visual",
              parameters: RemoveVisualMutationSchema,
            }),
            zodFunction({
              name: "modify_visual",
              parameters: ModifyVisualMutationSchema,
            }),
            zodFunction({
              name: "add_audio",
              parameters: AddAudioMutationSchema,
            }),
            zodFunction({
              name: "remove_audio",
              parameters: RemoveAudioMutationSchema,
            }),
            zodFunction({
              name: "modify_audio",
              parameters: ModifyAudioMutationSchema,
            }),
          ],
          store: true,
        });

        const response = completion?.choices[0];
        console.log("COMPLETION", completion);

        localPartialMessages.push({
          ...response.message,
          id: uuidv4(),
          timestamp: Date.now(),
        });
        setPartialMessages([...localPartialMessages]);

        if (!response || response.finish_reason === "stop") {
          break;
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(`Error: ${error.message}`);
      addMessage({
        role: "system", 
        content: `Sorry, I encountered an error: ${error.message}`,
        id: uuidv4(),
        timestamp: Date.now(),
        refusal: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTimeline = () => {
    setCurrentTimeline({ audio_track: [], visual_track: [] });
    setMessages([]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleClipClick = (clip: AudioClip | VisualClip) => {
    setSelectedClip(clip);
  };

  const displayTimeline = useMemo(() => {
    const mutations = getMutationsFromMessages(partialMessages);
    return applyMutations(currentTimeline, mutations);
  }, [currentTimeline, partialMessages]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <div className="flex-1 flex flex-col min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-zinc-900">
              <div className="flex-1 min-h-0">
                <ChatContainer
                  messages={messages}
                  loading={loading}
                  partialMessages={partialMessages || []}
                />
              </div>

              {error && (
                <div className="mx-4 mb-4 bg-red-900/50 border border-red-700 rounded-md p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div className="flex-shrink-0">
                <ChatInput
                  onSubmit={handleSubmit}
                  loading={loading}
                  onClearChat={clearChat}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-zinc-700 hover:bg-zinc-600 transition-colors" />

          <Panel defaultSize={50} minSize={40}>
            <div className="h-full flex flex-col bg-zinc-900">
              {/* ClipDisplayer */}
              <div className="flex-1 min-h-0">
                <ClipDisplayer selectedClip={selectedClip} />
              </div>

              {/* Timeline */}
              <div className="flex-shrink-0 h-44">
                <Timeline
                  timeline={displayTimeline}
                  onResetTimeline={resetTimeline}
                  onClipClick={handleClipClick}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default App;
