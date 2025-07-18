import React, { useRef, useEffect } from 'react';
import ChatUserMessage from './ChatUserMessage';
import ChatSystemMessage from './ChatSystemMessage';
import LoadingMessage from './LoadingMessage';
import { Message, SystemMessage, UserMessage } from '../type';

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

  const renderMessage = (message: Message) => {
    if (message.role === 'user') {
      return <ChatUserMessage key={message.id} message={message as UserMessage} />;
    } else {
      return <ChatSystemMessage key={message.id} message={message as SystemMessage} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-lg">Start a conversation about your timeline...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayMessages.map(renderMessage)}
          </div>
        )}
        
        {loading && !partialMessage && <LoadingMessage />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer; 