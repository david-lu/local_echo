import React from 'react';
import { Message } from '../type';
import { getMutationFromToolCall } from "../utils";

interface ChatSystemMessageProps {
  message: Message;
}

const ChatSystemMessage: React.FC<ChatSystemMessageProps> = ({ message }) => {
    const toolCall = message.tool_calls?.[0];
    const mutation = getMutationFromToolCall(toolCall);

  return (
    <div className="flex justify-start w-full flex-col gap-2">
        <div className="text-sm text-zinc-200 px-3 whitespace-pre-wrap break-words">{message.content}</div>
        
        {/* Display mutation descriptions if they exist */}
        {mutation && (
          <div className="text-xs text-zinc-400 bg-zinc-800 w-full p-3 rounded-md break-words">
            {mutation.description}
          </div>
        )}
    </div>
  );
};

export default ChatSystemMessage; 