import React, { useState, useRef, useMemo, useEffect } from "react";
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
    RetimeClipsMutationSchema,
    AgentState,
} from "./type";
import {
    convertToOpenAIMessage,
    getClipAtTime,
    getMutationsFromMessages,
    hashToArrayItem,
    refineTimeline,
    stringifyWithoutNull,
} from "./utils";
import { getMutationFromToolCall } from "./utils";
import { AGENT_PROMPT, AGENT_PROMPT_LONG } from "./prompts";
import { parseTimeline } from "./utils";
import timelineJson from "./data/sampleTimeline.json";
import { Timeline as TimelineType } from "./type";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { applyMutations } from "./mutation";
import { v4 as uuidv4 } from "uuid";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions/completions";
import { PixiVideoPlayer } from "./components/VideoPlayer";
import { useTicker } from "./tick";
import { PlayableVisualClip } from "./loader";

const App: React.FC = () => {
    const [messages, setMessages] = useState<(Message | AssistantMessage)[]>(
        []
    );
    const [agentState, setAgentState] = useState<AgentState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [currentTimeline, setCurrentTimeline] = useState(
        parseTimeline(timelineJson)
    );
    const [partialMessages, setPartialMessages] = useState<Message[]>([]);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);

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

    const addPartialMessage = (message: Message) => {
        setPartialMessages((prev) => [...prev, message]);
    };

    const buildConversationHistory = (systemMessages: Message[]) => {
        console.log(messages, systemMessages);
        let mutatedTimeline = currentTimeline;
        let history = [];
        history.push({
            role: "system" as const,
            content: AGENT_PROMPT_LONG,
        });
        for (const systemMessage of systemMessages) {
            history.push(convertToOpenAIMessage(systemMessage));
            // Add tool response for each tool call in the system message
            if (
                systemMessage.tool_calls &&
                systemMessage.tool_calls.length > 0
            ) {
                const toolCall = systemMessage.tool_calls[0];
                const mutation = getMutationFromToolCall(toolCall);
                if (!mutation) {
                    console.error("Bad mutation", toolCall);
                    continue;
                }
                mutatedTimeline = applyMutations(mutatedTimeline, [mutation]);
                console.log("mutatedTimeline", mutatedTimeline);
                const refinedTimeline = refineTimeline(mutatedTimeline);
                console.log("refineTimeline", refinedTimeline);
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: `Updated timeline: ${stringifyWithoutNull(
                        refinedTimeline
                    )}`,
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

        setError(null);

        try {
            const client = initializeOpenAI();
            if (!client) {
                return;
            }

            setAgentState("processing");

            const localMessages: UserMessage = {
                id: uuidv4(),
                role: "user",
                content: userMessage,
                timestamp: Date.now(),
                refusal: null,
                timeline: currentTimeline,
            };
            const localPartialMessages = [...partialMessages, localMessages];
            setPartialMessages([...localPartialMessages]);

            while (true) {
                console.log("while true");
                const conversationHistory =
                    buildConversationHistory(localPartialMessages);
                console.log("CONVERSATION HISTORY", conversationHistory);

                const completion = await client.chat.completions.create({
                    model: "gpt-4.1-mini",
                    max_tokens: 10000,
                    // temperature: 1,
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
                        zodFunction({
                            name: "retime_clips",
                            parameters: RetimeClipsMutationSchema,
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

            if (localPartialMessages.length > 1) {
                setAgentState("waiting");
            } else {
                acceptChanges(localPartialMessages);
                setAgentState("idle");
            }
        } catch (error: any) {
            console.error("Error:", error);
            setError(`Error: ${error.message}`);
            addPartialMessage({
                role: "system",
                content: `Sorry, I encountered an error: ${error.message}`,
                id: uuidv4(),
                timestamp: Date.now(),
                refusal: null,
            });
            setAgentState("idle");
        }
    };

    const resetTimeline = () => {
        setCurrentTimeline({ audio_track: [], visual_track: [] });
        setMessages([]);
    };

    const acceptChanges = (partialMessages: Message[]) => {
        setAgentState("idle");
        const mutations = getMutationsFromMessages(partialMessages);
        setCurrentTimeline(applyMutations(currentTimeline, mutations));
        setMessages([...messages, ...partialMessages]);
        setPartialMessages([]);
    };

    const rejectChanges = () => {
        setAgentState("idle");
        setPartialMessages([]);
    };

    const clearChat = () => {
        setMessages([]);
    };

    const handleClipClick = (clip: AudioClip | VisualClip) => {
        setCurrentTimeMs(clip.start_ms);
        // setSelectedClip(clip);
    };

    const displayTimeline = useMemo(() => {
        const mutations = getMutationsFromMessages(partialMessages);
        return applyMutations(currentTimeline, mutations);
    }, [currentTimeline, partialMessages]);

    // Calculate timeline duration
    const timelineDuration = useMemo(() => {
        const maxEnd = Math.max(
            ...displayTimeline.audio_track.map(
                (c) => c.start_ms + c.duration_ms
            ),
            ...displayTimeline.visual_track.map(
                (c) => c.start_ms + c.duration_ms
            ),
            10000 // fallback
        );
        return maxEnd;
    }, [displayTimeline]);

    useTicker((deltaMs) => {
        setCurrentTimeMs((prev) => {
            const newTime = prev + deltaMs;
            if (newTime >= timelineDuration) {
                setIsPlaying(false);
                return timelineDuration;
            }
            return newTime;
        });
    }, isPlaying);

    // Playback control functions
    const handlePlayPause = () => {
        console.log("Play/Pause clicked, current isPlaying:", isPlaying);
        setIsPlaying((prev) => !prev);
    };

    const handleSeek = (time: number) => {
        setCurrentTimeMs(Math.max(0, Math.min(time, timelineDuration)));
    };

    const currentVisualClip = useMemo(() => {
        return getClipAtTime(displayTimeline.visual_track, currentTimeMs);
    }, [displayTimeline, currentTimeMs]);

    const currentAudioClip = useMemo(() => {
        return getClipAtTime(displayTimeline.audio_track, currentTimeMs);
    }, [displayTimeline, currentTimeMs]);

    // console.log(
    //     "rendering",
    //     displayTimeline,
    //     "isPlaying:",
    //     isPlaying,
    //     "currentTime:",
    //     currentTimeMs
    // );

    const playableClips: PlayableVisualClip[] = useMemo(() => {
        return currentTimeline.visual_track.map((clip) => {
            return {
                id: clip.id,
                start_ms: clip.start_ms,
                duration_ms: clip.duration_ms,
                speaker: clip.speaker,
                type: "video",
                src: hashToArrayItem(clip.id, [
                  "https://videos.pexels.com/video-files/33003281/14065566_2560_1440_24fps.mp4",
                  "https://images.pexels.com/video-files/3256542/3256542-sd_960_540_25fps.mp4",
                  "https://images.pexels.com/video-files/5091624/5091624-sd_960_540_24fps.mp4",
                ]) ,
            };
        });
    }, [currentTimeline]);

    return (
        <div className="h-screen flex flex-col bg-zinc-950">
            <div className="flex-1 flex flex-col min-h-0">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={50} minSize={30}>
                        <div className="h-full flex flex-col bg-zinc-900">
                            <div className="flex-1 min-h-0">
                                <ChatContainer
                                    messages={messages}
                                    loading={agentState !== "idle"}
                                    partialMessages={partialMessages}
                                />
                            </div>

                            {error && (
                                <div className="mx-4 mb-4 bg-red-900/50 border border-red-700 rounded-md p-4">
                                    <p className="text-red-300">{error}</p>
                                </div>
                            )}

                            {agentState === "waiting" && (
                                <div className="flex flex-row flex-shrink-0 mx-3 mb-2 justify-end">
                                    <button
                                        className="bg-green-900 hover:bg-green-800 border border-green-700 text-white text-xs px-3 py-1.5 rounded-md mr-2"
                                        onClick={() =>
                                            acceptChanges(partialMessages)
                                        }
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="bg-red-900 hover:bg-red-800 border border-red-700   text-white text-xs px-3 py-1.5 rounded-md"
                                        onClick={rejectChanges}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            <div className="flex-shrink-0">
                                <ChatInput
                                    onSubmit={handleSubmit}
                                    loading={agentState === "processing"}
                                    onClearChat={clearChat}
                                />
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-zinc-700 hover:bg-zinc-600 transition-colors" />

                    <Panel defaultSize={50} minSize={40}>
                        <div className="h-full flex flex-col bg-zinc-900 min-h-0 justify-between">
                            {/* ClipDisplayer */}
                            <PixiVideoPlayer
                                clips={playableClips}
                                playheadTimeMs={currentTimeMs}
                                width={860}
                                height={640}
                                isPlaying={isPlaying}
                            />
                            {/* <ClipDisplayer selectedClip={currentVisualClip} /> */}
                            <ClipDisplayer selectedClip={currentAudioClip} />

                            {/* Timeline Controls */}
                            <div className="flex-grow-1">
                                <Timeline
                                    timeline={displayTimeline}
                                    onResetTimeline={resetTimeline}
                                    onClipClick={handleClipClick}
                                    currentTimeMs={currentTimeMs}
                                    isPlaying={isPlaying}
                                    onPlayPause={handlePlayPause}
                                    onSeek={handleSeek}
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
