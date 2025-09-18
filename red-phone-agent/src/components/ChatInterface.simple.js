// Simplified ChatInterface for debugging
import React, { useState } from 'react';
import '../styles/Chat.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 **Welcome to Red Phone Agent!** (Simplified Mode)\n\nI\'m here to help you with sales questions, policy lookups, and case creation.',
      timestamp: Date.now(),
      type: 'welcome'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    const botResponse = {
      id: `msg_${Date.now()}_bot`,
      role: 'assistant',
      content: `I received your message: "${messageText}". The full AI integration is temporarily disabled for debugging. The server is working correctly!`,
      timestamp: Date.now() + 1
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-main">
            <h2>Red Phone Agent (Debug Mode)</h2>
            <p>Testing basic functionality</p>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}-message`}>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="message-input-container">
          <div className="input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                  setInputValue('');
                }
              }}
              placeholder="Type a test message..."
              className="message-input"
              rows={1}
            />
            
            <button
              onClick={() => {
                handleSendMessage(inputValue);
                setInputValue('');
              }}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
