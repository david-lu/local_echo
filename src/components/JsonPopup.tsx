import React, { useState, useRef, useEffect } from 'react';

interface JsonPopupProps {
  data: any;
  children: React.ReactNode;
}

export const JsonPopup: React.FC<JsonPopupProps> = ({ data, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className="absolute z-[9999] bg-gray-900 text-green-400 p-4 rounded-lg shadow-2xl border border-gray-700 max-w-md max-h-96 overflow-auto text-xs font-mono whitespace-pre-wrap"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px'
          }}
        >
          <div className="mb-2 text-white text-sm font-semibold border-b border-gray-600 pb-1">
            Clip JSON Data
          </div>
          <pre className="text-xs leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
          {/* Arrow pointing down */}
          <div 
            className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={{
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default JsonPopup; 