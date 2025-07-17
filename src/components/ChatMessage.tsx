import React from 'react';
import { Message } from '../type';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white'
            : isSystem
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
            : 'bg-zinc-700 text-zinc-100'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : isSystem ? 'Assistant' : 'System'}
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {/* Display mutation descriptions if they exist */}
        {isSystem && message.mutations && message.mutations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 mb-1">Timeline Changes:</div>
            <div className="space-y-1">
              {message.mutations.map((mutation, index) => (
                <div key={index} className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                  {mutation.description}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-zinc-400'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 