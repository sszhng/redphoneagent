import React, { useState, useRef, useEffect } from 'react';
import '../styles/Chat.css';

const MessageInput = ({ onSendMessage, disabled = false, placeholder = "Type your message..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef(null);
  const maxLength = 1000;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  // Focus input when component mounts or becomes enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !disabled) {
      onSendMessage(trimmedValue);
      setInputValue('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const newValue = inputValue + pastedText;
    
    if (newValue.length > maxLength) {
      e.preventDefault();
      setInputValue(newValue.substring(0, maxLength));
    }
  };

  // Removed unused getCharacterCountClass function

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className={`message-input ${disabled ? 'disabled' : ''}`}
          rows={1}
          maxLength={maxLength}
          aria-label="Type your message"
        />
        
        <button
          onClick={handleSend}
          disabled={disabled || !inputValue.trim()}
          className={`send-button ${!inputValue.trim() || disabled ? 'disabled' : ''}`}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <SendIcon />
        </button>
      </div>
      
      {/* Simplified - removed quick suggestions section */}
    </div>
  );
};

// Send icon component
const SendIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9"></polygon>
  </svg>
);

// Removed QuickSuggestions component for simplified UI

export default MessageInput;
