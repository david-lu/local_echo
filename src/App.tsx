import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Timeline from './components/Timeline';
import ChatContainer from './components/ChatContainer';
import ChatInput from './components/ChatInput';
import ClipDisplayer from './components/ClipDisplayer';
import { Message, UserMessage, AudioClip, VisualClip, AddVisualMutationSchema, AddAudioMutationSchema, ModifyAudioMutationSchema, ModifyVisualMutationSchema, RemoveAudioMutationSchema, RemoveVisualMutationSchema, Mutation, SystemMessage, ToolCall } from './type';
import { AGENT_PROMPT, getTimelineEditorPrompt } from './prompts';
import { parseTimeline } from './timelineConverter';
import timelineJson from './data/sampleTimeline.json';
import { Timeline as TimelineType } from './type';
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod';
import { applyMutations } from './mutationApplier';
import { v4 as uuidv4 } from 'uuid';


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(parseTimeline(timelineJson));
  const [selectedClip, setSelectedClip] = useState<AudioClip | VisualClip | null>(null);
  const [partialMessage, setPartialMessage] = useState<SystemMessage | null>(null);

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
        dangerouslyAllowBrowser: true
      });
      openAIClientRef.current = client;
      return client;
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      setError('Failed to initialize OpenAI client.');
      return null;
    }
  };

  const addMessage = (role: 'user' | 'system', content: string, mutations?: any[]) => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: role,
      content,
      timestamp: Date.now().toString(),
      mutations: mutations
    }]);
  };

  const buildConversationHistory = (timeline: TimelineType, messages: Message[], userMessage: string) => {
    return [
      {
        role: "system" as const,
        content: AGENT_PROMPT
      },
      ...messages,
      {
        role: "user" as const,
        content: userMessage + "\n\n" + getTimelineEditorPrompt(timeline)
      }
    ];
  };

  const acceptMutations = (changes: any[]) => {
    console.log('ACCEPTING CHANGES', changes);
    const updatedTimeline = applyMutations(currentTimeline, changes);
    setCurrentTimeline(updatedTimeline);
  }

  const declineMutations = (changes: any[]) => {
    console.log('DECLINING CHANGES', changes);
  }

  const handleSubmit = async (message: string): Promise<void> => {
    if (!message.trim()) return;
    if (!apiKey) {
      setError('OpenAI API key not found.');
      return;
    }

    const userMessage = message.trim();
    addMessage('user', userMessage);
    setLoading(true);
    setError(null);

    try {
      const client = initializeOpenAI();
      if (!client) {
        setLoading(false);
        return;
      }

      const conversationHistory = buildConversationHistory(currentTimeline, messages, userMessage);
      console.log('CONVERSATION HISTORY', conversationHistory);

      const stream = client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 10000,
        // model: "o4-mini",
        // // temperature: 0.5,
        // reasoning_effort: "low",
        // max_completion_tokens: 10000,
        messages: conversationHistory,
        parallel_tool_calls: true,
        stream: true,
        tools: [
          zodFunction({name:'add_visual', parameters: AddVisualMutationSchema}),
          zodFunction({name:'remove_visual', parameters: RemoveVisualMutationSchema}),
          zodFunction({name:'modify_visual', parameters: ModifyVisualMutationSchema}),
          zodFunction({name:'add_audio', parameters: AddAudioMutationSchema}),
          zodFunction({name:'remove_audio', parameters: RemoveAudioMutationSchema}),
          zodFunction({name:'modify_audio', parameters: ModifyAudioMutationSchema}),
        ],
        store: true,
      })

      let newPartialMessage: SystemMessage = {
        id: uuidv4(),
        role: 'system',
        content: '',
        timestamp: Date.now().toString(),
        tool_calls: {}
      };

      for await (const chunk of await stream) {
          const toolCalls = chunk.choices[0].delta.tool_calls || [];
          console.log(chunk.choices[0].delta)
          newPartialMessage!.content = (newPartialMessage?.content || '') + (chunk.choices[0].delta.content ?? '');

          for (const toolCall of toolCalls) {
            const { index } = toolCall;

            if (!newPartialMessage!.tool_calls[index]) {
              newPartialMessage!.tool_calls[index] = toolCall as ToolCall;
            }
    
            newPartialMessage!.tool_calls[index].function.arguments += toolCall.function?.arguments;
          }
          setPartialMessage(newPartialMessage)
          console.log(partialMessage)
      }

    } catch (error: any) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
      addMessage('system', `Sorry, I encountered an error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetTimeline = () => {
    setCurrentTimeline({audio_track: [], visual_track: []});
    setMessages([]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleClipClick = (clip: AudioClip | VisualClip) => {
    setSelectedClip(clip);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <div className="flex-1 flex flex-col min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-zinc-900">
              <div className="flex-1 min-h-0">
                <ChatContainer messages={messages} loading={loading} partialMessage={partialMessage} />
              </div>
              
              {error && (
                <div className="mx-4 mb-4 bg-red-900/50 border border-red-700 rounded-md p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}
              
              <div className="flex-shrink-0">
                <ChatInput onSubmit={handleSubmit} loading={loading} onClearChat={clearChat} />
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
                  timeline={currentTimeline} 
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