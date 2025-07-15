import React from 'react';
import { Message } from '../type';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-indigo-600 text-white'
            : isAssistant
            ? 'bg-white text-gray-900 border border-gray-200'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : isAssistant ? 'Assistant' : 'System'}
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 