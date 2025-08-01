import React, { useState, useRef, useMemo, useEffect } from 'react'
import { OpenAI } from 'openai'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import Timeline from './components/Timeline'
import ChatContainer from './components/ChatContainer'
import ChatInput from './components/ChatInput'
import ClipDisplayer from './components/ClipDisplayer'
import { AudioClip, VisualClip, AgentState } from './types/timeline'
import { Message, UserMessage, AssistantMessage } from './types/agent'
import {
  AddVisualMutationSchema,
  AddAudioMutationSchema,
  ModifyAudioMutationSchema,
  ModifyVisualMutationSchema,
  RemoveAudioMutationSchema,
  RemoveVisualMutationSchema,
  RetimeClipsMutationSchema
} from './types/mutation'
import { hashToArrayItem, stringifyWithoutNull, useAudioContext } from './utils/misc'
import { convertToOpenAIMessage, getMutationsFromMessages } from './utils/mutation'
import { getClipAtTime, refineTimeline } from './utils/timeline'
import { getMutationFromToolCall } from './utils/mutation'
import { AGENT_PROMPT, AGENT_PROMPT_LONG } from './prompts'
import { parseTimeline } from './utils/timeline'
import timelineJson from './data/sampleTimeline.json'
import { zodFunction } from 'openai/helpers/zod'
import { applyMutations } from './mutation'
import { v4 as uuidv4 } from 'uuid'
import { TimelinePlayer } from './components/TimelinePlayer'
import { useTicker } from './hooks/tick'
import { PlayableClip } from './types/loader'
import { usePlayAudioTrack } from './hooks/audio'
import { exportVideo } from './utils/export'

const App: React.FC = () => {
  const { audioContext, activateAudio } = useAudioContext()
  const [messages, setMessages] = useState<(Message | AssistantMessage)[]>([])
  const [agentState, setAgentState] = useState<AgentState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [currentTimeline, setCurrentTimeline] = useState(parseTimeline(timelineJson))
  const [partialMessages, setPartialMessages] = useState<Message[]>([])
  const [selectedClip, setSelectedClip] = useState<AudioClip | VisualClip | null>(null)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  // Get API key from environment variables
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY

  // Create a ref to store the OpenAI client
  const openAIClientRef = useRef<OpenAI | null>(null)

  // console.log(zodResponseFormat(SystemMessageSchema, "message"));

  // Initialize OpenAI client
  const initializeOpenAI = (): OpenAI | null => {
    if (openAIClientRef.current) {
      return openAIClientRef.current
    }

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      })
      openAIClientRef.current = client
      return client
    } catch (error) {
      console.error('Error initializing OpenAI client:', error)
      setError('Failed to initialize OpenAI client.')
      return null
    }
  }

  const addPartialMessage = (message: Message) => {
    setPartialMessages((prev) => [...prev, message])
  }

  const buildConversationHistory = (systemMessages: Message[]) => {
    console.log(messages, systemMessages)
    let mutatedTimeline = currentTimeline
    let history = []
    history.push({
      role: 'system' as const,
      content: AGENT_PROMPT_LONG
    })
    for (const systemMessage of systemMessages) {
      history.push(convertToOpenAIMessage(systemMessage))
      // Add tool response for each tool call in the system message
      if (systemMessage.tool_calls && systemMessage.tool_calls.length > 0) {
        const toolCall = systemMessage.tool_calls[0]
        const mutation = getMutationFromToolCall(toolCall)
        if (!mutation) {
          console.error('Bad mutation', toolCall)
          continue
        }
        mutatedTimeline = applyMutations(mutatedTimeline, [mutation])
        console.log('mutatedTimeline', mutatedTimeline)
        const refinedTimeline = refineTimeline(mutatedTimeline)
        console.log('refineTimeline', refinedTimeline)
        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Updated timeline: ${stringifyWithoutNull(refinedTimeline)}`
        })
      }
    }
    return history
  }

  const handleSubmit = async (content: string): Promise<void> => {
    if (!content.trim()) return
    if (!apiKey) {
      setError('OpenAI API key not found.')
      return
    }

    const userMessage = content.trim()

    setError(null)

    try {
      const client = initializeOpenAI()
      if (!client) {
        return
      }

      setAgentState('processing')

      const localMessages: UserMessage = {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        refusal: null,
        timeline: currentTimeline
      }
      const localPartialMessages = [...partialMessages, localMessages]
      setPartialMessages([...localPartialMessages])

      while (true) {
        const conversationHistory = buildConversationHistory(localPartialMessages)
        console.log('CONVERSATION HISTORY', conversationHistory)

        const completion = await client.chat.completions.create({
          model: 'gpt-4.1-mini',
          max_tokens: 10000,
          // temperature: 1,
          // model: "o4-mini",
          // reasoning_effort: "low",
          // max_completion_tokens: 10000,
          messages: conversationHistory,
          parallel_tool_calls: false,
          tools: [
            zodFunction({
              name: 'add_visual',
              parameters: AddVisualMutationSchema
            }),
            zodFunction({
              name: 'remove_visual',
              parameters: RemoveVisualMutationSchema
            }),
            zodFunction({
              name: 'modify_visual',
              parameters: ModifyVisualMutationSchema
            }),
            zodFunction({
              name: 'add_audio',
              parameters: AddAudioMutationSchema
            }),
            zodFunction({
              name: 'remove_audio',
              parameters: RemoveAudioMutationSchema
            }),
            zodFunction({
              name: 'modify_audio',
              parameters: ModifyAudioMutationSchema
            }),
            zodFunction({
              name: 'retime_clips',
              parameters: RetimeClipsMutationSchema
            })
          ],
          store: true
        })

        const response = completion?.choices[0]
        console.log('COMPLETION', completion)

        localPartialMessages.push({
          ...response.message,
          id: uuidv4(),
          timestamp: Date.now()
        })
        setPartialMessages([...localPartialMessages])

        if (!response || response.finish_reason === 'stop') {
          break
        }
      }

      if (localPartialMessages.length > 1) {
        setAgentState('waiting')
      } else {
        acceptChanges(localPartialMessages)
        setAgentState('idle')
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(`Error: ${error.message}`)
      addPartialMessage({
        role: 'system',
        content: `Sorry, I encountered an error: ${error.message}`,
        id: uuidv4(),
        timestamp: Date.now(),
        refusal: null
      })
      setAgentState('idle')
    }
  }

  const resetTimeline = () => {
    setCurrentTimeline({ audio_track: [], visual_track: [] })
    setMessages([])
  }

  const acceptChanges = (partialMessages: Message[]) => {
    setAgentState('idle')
    const mutations = getMutationsFromMessages(partialMessages)
    setCurrentTimeline(applyMutations(currentTimeline, mutations))
    setMessages([...messages, ...partialMessages])
    setPartialMessages([])
  }

  const rejectChanges = () => {
    setAgentState('idle')
    setPartialMessages([])
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleClipClick = (clip: AudioClip | VisualClip) => {
    setSelectedClip(clip)
  }

  const { displayTimeline, playableVisualClips, playableAudioClips } = useMemo(() => {
    // console.log("new display timeline");
    const mutations = getMutationsFromMessages(partialMessages)
    const displayTimeline = applyMutations(currentTimeline, mutations)

    const playableVisualClips: PlayableClip[] = displayTimeline.visual_track.map((clip) => {
      return {
        ...clip,
        type: clip.video_asset_id ? 'video' : 'image',
        src: clip.video_asset_id
          ? hashToArrayItem(clip.id, [
              'https://videos.pexels.com/video-files/855971/855971-hd_1920_1080_30fps.mp4',
              'https://videos.pexels.com/video-files/6950902/6950902-uhd_3840_2160_25fps.mp4',
              'https://videos.pexels.com/video-files/26867682/12024481_1080_1920_30fps.mp4'
            ])
          : hashToArrayItem(clip.id, [
              'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg',
              'https://images.pexels.com/photos/46505/swiss-shepherd-dog-dog-pet-portrait-46505.jpeg',
              'https://images.pexels.com/photos/485294/pexels-photo-485294.jpeg'
            ])
      }
    })

    const playableAudioClips: PlayableClip[] = displayTimeline.audio_track.map((clip) => {
      return {
        ...clip,
        type: 'audio',
        src: hashToArrayItem(clip.id, [
          'https://ia800204.us.archive.org/28/items/twakalto/ida-lmar2o-tone.mp3',
          'https://ia800204.us.archive.org/28/items/twakalto/ida-lmar2o.mp3',
          'https://ia801309.us.archive.org/9/items/Quran-MP3-Ghamdi/001.mp3'
        ])
      }
    })

    return { displayTimeline, playableVisualClips, playableAudioClips }
  }, [currentTimeline, partialMessages])

  // Calculate timeline duration
  const timelineDuration = useMemo(() => {
    const maxEnd = Math.max(
      ...displayTimeline.audio_track.map((c) => c.start_ms + c.duration_ms),
      ...displayTimeline.visual_track.map((c) => c.start_ms + c.duration_ms),
      10000 // fallback
    )
    return maxEnd
  }, [displayTimeline])

  useTicker((deltaMs) => {
    setCurrentTimeMs((prev) => {
      const newTime = prev + deltaMs
      if (newTime >= timelineDuration) {
        setIsPlaying(false)
        return 0
      }
      return newTime
    })
  }, isPlaying)

  // Playback control functions
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev)
    activateAudio()
  }

  const handleExport = () => {
    exportVideo(playableVisualClips, playableAudioClips, 'output.mp4', audioContext!)
  }

  const handleSeek = (time: number) => {
    setCurrentTimeMs(Math.max(0, Math.min(time, timelineDuration)))
  }

  usePlayAudioTrack(audioContext, playableAudioClips, currentTimeMs, isPlaying)

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <div className="flex-1 flex flex-col min-h-0">
        <PanelGroup direction="horizontal">
          <Panel
            defaultSize={50}
            minSize={30}
          >
            <div className="h-full flex flex-col bg-zinc-900">
              <div className="flex-1 min-h-0">
                {selectedClip && (
                  <div className="flex flex-col items-end justify-center">
                    <button
                      className="p-4 rounded bg-zinc-600 text-white"
                      onClick={() => setSelectedClip(null)}
                    >
                      X
                    </button>
                    <ClipDisplayer selectedClip={selectedClip} />
                  </div>
                )}
                {!selectedClip && (
                  <ChatContainer
                    messages={messages}
                    loading={agentState !== 'idle'}
                    partialMessages={partialMessages}
                  />
                )}
              </div>

              {error && (
                <div className="mx-4 mb-4 bg-red-900/50 border border-red-700 rounded-md p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {agentState === 'waiting' && (
                <div className="flex flex-row flex-shrink-0 mx-3 mb-2 justify-end">
                  <button
                    className="bg-green-900 hover:bg-green-800 border border-green-700 text-white text-xs px-3 py-1.5 rounded-md mr-2"
                    onClick={() => acceptChanges(partialMessages)}
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
                  loading={agentState === 'processing'}
                  onClearChat={clearChat}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-zinc-700 hover:bg-zinc-600 transition-colors" />

          <Panel
            defaultSize={50}
            minSize={40}
          >
            <div className="h-full flex flex-col bg-zinc-900 justify-between">
              {/* ClipDisplayer */}
              <TimelinePlayer
                visualClips={playableVisualClips}
                playheadTimeMs={currentTimeMs}
                isLandscape={true}
                isPlaying={isPlaying}
              />

              {/* Timeline Controls */}
              <div className="flex-shrink-1">
                <Timeline
                  timeline={displayTimeline}
                  onResetTimeline={resetTimeline}
                  onExport={handleExport}
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
  )
}

export default App
