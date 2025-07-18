import React, { useState, useEffect } from 'react';

interface LoadingMessageProps {
  className?: string;
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({ className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messages = [
    "Sending message...",
    "Processing...", 
    "Thinking..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Wait for fade out, then change message
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setIsTransitioning(false);
      }, 150); // Half of the transition duration
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg px-4 py-2">
        <div className="text-sm font-medium mb-1">Assistant</div>
        <div 
          className={`text-sm text-zinc-400 transition-opacity duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {messages[currentIndex]}
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage; 