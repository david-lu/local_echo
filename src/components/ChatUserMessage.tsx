import React from 'react';
import { UserMessage } from '../type';

interface ChatUserMessageProps {
  message: UserMessage;
}

const ChatUserMessage: React.FC<ChatUserMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-2xl px-6 py-4 rounded-lg bg-blue-600 text-white">
        <div className="text-sm font-medium mb-2">You</div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
        <div className="text-xs mt-2 text-blue-200">
          {message.timestamp ? new Date(parseInt(message.timestamp)).toLocaleString() : ''}
        </div>
      </div>
    </div>
  );
};

export default ChatUserMessage; 