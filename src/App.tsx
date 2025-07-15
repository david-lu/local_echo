import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import Timeline from './components/Timeline';
import ChatContainer from './components/ChatContainer';
import { Message, SystemMessageSchema } from './type';
import { getTimelineEditorPrompt } from './prompts';
import { parseTimeline } from './timelineConverter';
import timelineJson from './sampleTimeline.json';
import { Timeline as TimelineType } from './type';
import { zodResponseFormat } from 'openai/helpers/zod';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(parseTimeline(timelineJson));

  // Get API key from environment variables
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // Create a ref to store the OpenAI client
  const openAIClientRef = useRef<OpenAI | null>(null);

  console.log(zodResponseFormat(SystemMessageSchema, "message"));

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

  const addMessage = (role: 'user' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const buildConversationHistory = (timeline: TimelineType, messages: Message[]) => {
    return [
      {
        role: "system" as const,
        content: getTimelineEditorPrompt(timeline)
      },
      ...messages
        .map(msg => ({
          role: "user" as const,
          content: msg.content
        })),
    ];
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userInput.trim()) return;
    if (!apiKey) {
      setError('OpenAI API key not found.');
      return;
    }

    const userMessage = userInput.trim();
    setUserInput('');
    addMessage('user', userMessage);
    setLoading(true);
    setError(null);

    try {
      const client = initializeOpenAI();
      if (!client) {
        setLoading(false);
        return;
      }

      const conversationHistory = buildConversationHistory(currentTimeline, messages);

      const chatResponse = await client.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: conversationHistory,
        max_tokens: 1000,
        response_format: zodResponseFormat(SystemMessageSchema, "message"),
      });

      const responseContent = chatResponse.choices[0]?.message?.content;
      if (responseContent) {
        addMessage('system', responseContent);
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

      <main className="flex-1 max-w-4xl mx-auto py-6 px-4 flex flex-col h-full">
        <div className="flex-1 mb-4">
          <ChatContainer messages={messages} loading={loading} />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe timeline changes..."
              disabled={loading}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button 
              type="submit" 
              disabled={loading || !userInput.trim()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send'}
            </button>
          </div>
        </form>
      </main>
      
      <footer className="w-full fixed left-0 bottom-0 z-50 bg-transparent">
        <Timeline timeline={currentTimeline} />
      </footer>
    </div>
  );
};

export default App; 