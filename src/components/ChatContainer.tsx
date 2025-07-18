import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingMessage from './LoadingMessage';
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
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-lg">Start a conversation about your timeline...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
        
        {loading && !partialMessage && <LoadingMessage />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer; 