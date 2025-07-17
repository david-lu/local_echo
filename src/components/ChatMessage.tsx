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
            ? 'bg-indigo-600 text-white'
            : isSystem
            ? 'bg-white text-gray-900 border border-gray-200'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : isSystem ? 'Assistant' : 'System'}
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {/* Display mutation descriptions if they exist */}
        {isSystem && message.mutations && message.mutations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">Timeline Changes:</div>
            <div className="space-y-1">
              {message.mutations.map((mutation, index) => (
                <div key={index} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {mutation.description}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 