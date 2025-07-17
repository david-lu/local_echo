import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Message, SystemMessage } from '../type';

interface ChatContainerProps {
  messages: Message[];
  loading: boolean;
  partialMessage?: SystemMessage | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, loading, partialMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partialMessage]);

  const displayMessages = partialMessage ? [...messages, partialMessage] : messages;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation about your timeline...</p>
          </div>
        ) : (
          displayMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {loading && !partialMessage && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2">
              <div className="text-sm font-medium mb-1">Assistant</div>
              <div className="text-sm text-gray-600">Thinking...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer; 