import React, { useState } from 'react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  loading: boolean
  placeholder?: string
  onClearChat?: () => void
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  loading,
  placeholder = 'Describe timeline changes...',
  onClearChat
}) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    onSubmit(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              rows={1}
              className="w-full resize-none rounded-lg border border-zinc-700 px-4 py-3 h-full text-sm bg-zinc-800 text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-900 disabled:text-zinc-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm h-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-zinc-400">Press Enter to send, Shift+Enter for new line</div>
          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ChatInput
