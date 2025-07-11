import React, { useState, useRef } from 'react';
import { OpenAI } from 'openai';
import { timeline } from './timelineConverter';
import TimelineVisualizer from './TimelineVisualizer';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get API key from environment variables
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // Create a ref to store the OpenAI client
  const openAIClientRef = useRef<OpenAI | null>(null);

  console.log(timeline);

  // Initialize OpenAI client
  const initializeOpenAI = (): OpenAI | null => {
    if (openAIClientRef.current) {
      return openAIClientRef.current;
    }

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      openAIClientRef.current = client;
      return client;
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      setError('Failed to initialize OpenAI client. Please check your API key in .env file.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userInput.trim()) return;
    if (!apiKey) {
      setError('OpenAI API key not found. Please add it to your .env file as REACT_APP_OPENAI_API_KEY.');
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

      // Create chat completion
      const chatResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: userInput
          }
        ],
        max_tokens: 1000
      });

      const content = chatResponse.choices[0]?.message?.content || 'No response received';
      setResponse(content);
      setUserInput('');
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">OpenAI API Boilerplate</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your message..."
                disabled={loading}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {response && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Response:</h3>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </div>
        {/* Timeline Visualizer */}
        <TimelineVisualizer timeline={timeline} />
      </main>
    </div>
  );
};

export default App; 