import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import { timeline } from './timelineConverter';
import Timeline from './components/Timeline';
import { 
  ChatCompletionResponseSchema, 
  TimelineResponseSchema,
  TimelineEvent,
  Timeline as TimelineType 
} from './type';
import { getTimelineEditorPrompt, timelineEditorFunction } from './prompts';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeline, setCurrentTimeline] = useState(timeline);

  // Get API key from environment variables
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // Create a ref to store the OpenAI client
  const openAIClientRef = useRef<OpenAI | null>(null);

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

  const applyEvents = (events: TimelineEvent[], timeline: TimelineType): TimelineType => {
    let updatedTimeline = { ...timeline };

    for (const event of events) {
      if (event.action === 'add' && event.clip) {
        const trackKey = event.track === 'audio' ? 'audio_track' : 'visual_track';
        if (event.track === 'audio') {
          updatedTimeline.audio_track = [...updatedTimeline.audio_track, event.clip as any];
        } else {
          updatedTimeline.visual_track = [...updatedTimeline.visual_track, event.clip as any];
        }
      } else if (event.action === 'remove' && event.targetId) {
        if (event.track === 'audio') {
          updatedTimeline.audio_track = updatedTimeline.audio_track.filter((clip: any) => clip.id !== event.targetId);
        } else {
          updatedTimeline.visual_track = updatedTimeline.visual_track.filter((clip: any) => clip.id !== event.targetId);
        }
      }
    }

    return updatedTimeline;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userInput.trim()) return;
    if (!apiKey) {
      setError('OpenAI API key not found.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = initializeOpenAI();
      if (!client) {
        setLoading(false);
        return;
      }

      const chatResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getTimelineEditorPrompt(
              currentTimeline.audio_track.length,
              currentTimeline.visual_track.length
            )
          },
          {
            role: "user",
            content: userInput
          }
        ],
        tools: [
          {
            type: "function",
            function: timelineEditorFunction
          }
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "modify_timeline"
          }
        },
        max_tokens: 1000
      });

      const validatedResponse = ChatCompletionResponseSchema.parse(chatResponse);
      const toolCall = validatedResponse.choices[0]?.message?.tool_calls?.[0];
      
      if (!toolCall || toolCall.function.name !== "modify_timeline") {
        throw new Error('No valid timeline modification received');
      }

      const functionArgs = JSON.parse(toolCall.function.arguments);
      const timelineResponse = TimelineResponseSchema.parse(functionArgs);
        
      const updatedTimeline = applyEvents(timelineResponse.events, currentTimeline);
      setCurrentTimeline(updatedTimeline);
      setResponse(timelineResponse.message);
      setUserInput('');

    } catch (error: any) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetTimeline = () => {
    setCurrentTimeline(timeline);
    setResponse('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Timeline Editor</h1>
            <button
              onClick={resetTimeline}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto py-6 px-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe timeline changes..."
              disabled={loading}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Apply'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Response:</h3>
            <p className="text-gray-700">{response}</p>
          </div>
        )}

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline:</h3>
          <p className="text-gray-600">Audio: {currentTimeline.audio_track.length} clips</p>
          <p className="text-gray-600">Visual: {currentTimeline.visual_track.length} clips</p>
        </div>
      </main>
      
      <footer className="w-full fixed left-0 bottom-0 z-50 bg-transparent">
        <Timeline timeline={currentTimeline} />
      </footer>
    </div>
  );
};

export default App; 