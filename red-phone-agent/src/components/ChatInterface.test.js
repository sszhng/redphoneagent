// Test version of ChatInterface to isolate the problematic import
import React, { useState } from 'react';
import '../styles/Chat.css';

// Test imports one by one
try {
  console.log('Testing aiService import...');
  const aiService = require('../services/aiService.js');
  console.log('✅ aiService imported successfully');
} catch (error) {
  console.error('❌ aiService failed:', error);
}

try {
  console.log('Testing contextManager import...');
  const contextManager = require('../utils/contextManager.js');
  console.log('✅ contextManager imported successfully');
} catch (error) {
  console.error('❌ contextManager failed:', error);
}

try {
  console.log('Testing errorHandler import...');
  const errorHandler = require('../utils/errorHandler.js');
  console.log('✅ errorHandler imported successfully');
} catch (error) {
  console.error('❌ errorHandler failed:', error);
}

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 **Testing imports...** Check browser console for import test results.',
      timestamp: Date.now(),
      type: 'welcome'
    }
  ]);

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-main">
            <h2>Red Phone Agent (Import Test)</h2>
            <p>Check browser console for details</p>
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
          <p>Check the browser console (F12) for import test results</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
