import React from 'react';
import { AssistantMessage } from '../type';
import { getMutationFromToolCall } from "../utils";

interface ChatSystemMessageProps {
  message: AssistantMessage;
}

const ChatSystemMessage: React.FC<ChatSystemMessageProps> = ({ message }) => {
    const toolCall = message.tool_calls?.[0];
    const mutation = getMutationFromToolCall(toolCall);

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl px-6 py-4 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700">
        <div className="text-sm font-medium mb-2">Assistant</div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
        
        {/* Display mutation descriptions if they exist */}
        {mutation && (
          <div className="mt-3 pt-3 border-t border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 mb-2">Timeline Changes:</div>
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 bg-zinc-900 px-3 py-2 rounded break-words">
                {mutation.description}
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs mt-2 text-zinc-400">
          {message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}
        </div>
      </div>
    </div>
  );
};

export default ChatSystemMessage; 