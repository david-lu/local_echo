import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import Timeline from './components/Timeline';
import ChatContainer from './components/ChatContainer';
import ChatInput from './components/ChatInput';
import { Message, SystemMessageSchema, UserMessage, SystemMessage } from './type';
import { AGENT_PROMPT, getTimelineEditorPrompt } from './prompts';
import { parseTimeline } from './timelineConverter';
import timelineJson from './sampleTimeline.json';
import { Timeline as TimelineType } from './type';
import { zodResponseFormat } from 'openai/helpers/zod';
import { applyMutations } from './mutationApplier';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(parseTimeline(timelineJson));
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
      id: Date.now().toString(),
      role: role,
      content,
      timestamp: Date.now().toString(),
      mutations: mutations || null
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

      const stream = client.chat.completions.stream({
        // model: "gpt-4o",
        // max_tokens: 10000,
        model: "o3",
        max_completion_tokens: 5000,
        messages: conversationHistory,
        response_format: zodResponseFormat(SystemMessageSchema, "message"),
      })
      .on("refusal.done", () => console.log("request refused"))
      .on("content.delta", ({ snapshot, parsed }) => {
        // console.log("content:", snapshot);
        console.log("NEW parsed:", parsed);
        if (parsed && typeof parsed === 'object' && 'content' in parsed) {
          setPartialMessage(parsed as SystemMessage);
        }
        console.log();
      })
      .on("content.done", (props) => {
        console.log(props);
      });

      await stream.done();
      const finalCompletion = await stream.finalChatCompletion();

      const response = finalCompletion.choices[0]?.message;
      if (response && response.content) {
        // The response is parsed according to our schema, so we can access the content
        const systemMessage = response.parsed!;
        console.log('SYSTEM MESSAGE', systemMessage);
        addMessage('system', systemMessage.content, systemMessage.mutations || undefined);
        
        // Apply mutations to the timeline if any exist
        if (systemMessage.mutations && systemMessage.mutations.length > 0) {
          try {
            const updatedTimeline = applyMutations(currentTimeline, systemMessage.mutations);
            setCurrentTimeline(updatedTimeline);
            console.log('Applied mutations:', systemMessage.mutations);
          } catch (mutationError) {
            console.error('Error applying mutations:', mutationError);
            setError(`Failed to apply timeline changes: ${mutationError instanceof Error ? mutationError.message : 'Unknown error'}`);
          }
        }
        
        console.log('RESPONSE', response);
      } else {
        throw new Error('No response received from OpenAI');
      }

    } catch (error: any) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
      addMessage('system', `Sorry, I encountered an error: ${error.message}`);
    } finally {
      setLoading(false);
      setPartialMessage(null); // Clear partial message when stream finishes
    }
  };

  const resetTimeline = () => {
    setCurrentTimeline({audio_track: [], visual_track: []});
    setMessages([]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const displayTimeline = partialMessage ? applyMutations(currentTimeline, (partialMessage.mutations ?? []).slice(0, -1)) : currentTimeline;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat and Timeline Container */}
        <div className="flex-1 flex min-h-0">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              <div className="h-full max-w-4xl mx-auto py-4 px-4">
                <ChatContainer messages={messages} loading={loading} partialMessage={partialMessage} />
                
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <ChatInput onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="flex-1 min-w-0">
            <Timeline timeline={displayTimeline} onClearChat={clearChat} onResetTimeline={resetTimeline} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 