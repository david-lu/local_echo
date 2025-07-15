import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import Timeline from './components/Timeline';
import ChatContainer from './components/ChatContainer';
import ChatInput from './components/ChatInput';
import { Message, SystemMessageSchema, UserMessage, SystemMessage } from './type';
import { getTimelineEditorPrompt } from './prompts';
import { parseTimeline } from './timelineConverter';
import timelineJson from './sampleTimeline.json';
import { Timeline as TimelineType } from './type';
import { zodResponseFormat } from 'openai/helpers/zod';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(parseTimeline(timelineJson));

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
    if (role === 'user') {
      const newMessage: UserMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now().toString()
      };
      setMessages(prev => [...prev, newMessage]);
    } else {
      const newMessage: SystemMessage = {
        id: Date.now().toString(),
        role: 'system',
        content,
        timestamp: Date.now().toString(),
        mutations: mutations || null
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const buildConversationHistory = (timeline: TimelineType, messages: Message[], userMessage: string) => {
    return [
      {
        role: "system" as const,
        content: getTimelineEditorPrompt(timeline)
      },
      ...messages
        .filter(msg => msg.role === 'user')
        .map(msg => ({
          role: "user" as const,
          content: msg.content
        })),
      {
        role: "user" as const,
        content: userMessage
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

      const chatResponse = await client.chat.completions.parse({
        // model: "gpt-4o-mini",
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 10000,
        response_format: zodResponseFormat(SystemMessageSchema, "message"),
      });

      const response = chatResponse.choices[0]?.message;
      if (response && response.content) {
        // The response is parsed according to our schema, so we can access the content
        addMessage('system', response.parsed!.content);
        console.log('RESPONSE', response);
        
        // For now, we'll handle mutations separately when we implement them
        // The parse method gives us the structured data, but we need to handle it properly
      } else {
        throw new Error('No response received from OpenAI');
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Timeline Editor</h1>
            <div className="flex gap-2">
              <button
                onClick={clearChat}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Chat
              </button>
              <button
                onClick={resetTimeline}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Timeline
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-6 px-4">
            <ChatContainer messages={messages} loading={loading} />
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <ChatInput onSubmit={handleSubmit} loading={loading} />
      </main>
      
      <footer className="w-full bg-transparent">
        <Timeline timeline={currentTimeline} />
      </footer>
    </div>
  );
};

export default App; 