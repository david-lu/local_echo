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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-10 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">
            <p>Start a conversation about your timeline...</p>
          </div>
        ) : (
          displayMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {loading && !partialMessage && <LoadingMessage />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer; 