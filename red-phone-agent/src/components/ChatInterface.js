import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import CaseCreationForm from './CaseCreationForm';
import SmartCaseCreationForm from './SmartCaseCreationForm';
import simpleAiService from '../services/simpleAiService.js';
import '../styles/Chat.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showSmartCaseForm, setShowSmartCaseForm] = useState(false);
  const [caseFormData, setCaseFormData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with real AI service
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Initialize simple AI service
        const initResult = await simpleAiService.initialize();
        console.log('Simple AI Service initialized:', initResult.mode);

        // Add welcome message
        const welcomeMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your Red Phone Agent. I can help you with:

• Compensation and commission questions
• Finding invoices and billing info
• Deal structure and pricing guidance
• Legal terms and contract questions
• System issues and opportunity management
• Creating cases for approval

What would you like assistance with today?`,
          timestamp: Date.now(),
          type: 'welcome',
          followUpSuggestions: [
            "Can you help me with HEP pricing?",
            "How do I find an invoice for my customer?"
          ]
        };

        setMessages([welcomeMessage]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        const errorMessage = {
          id: 'init_error',
          role: 'assistant',
          content: 'Sorry, I\'m having trouble starting up. Please refresh the page and try again.',
          timestamp: Date.now(),
          type: 'error',
          error: true
        };
        
        setMessages([errorMessage]);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Process message with simple AI service
      const response = await simpleAiService.processMessage(messageText, {
        sessionId
      });

      if (response.success) {
        const aiMessage = {
          id: `msg_${Date.now()}_ai`,
          role: 'assistant',
          content: response.response,
          timestamp: Date.now(),
          type: response.responseType,
          confidence: response.confidence,
          scenarioId: response.scenarioId,
          category: response.category,
          actions: response.actions,
          followUpSuggestions: response.followUpSuggestions
        };

        setMessages(prev => [...prev, aiMessage]);

        // Handle case creation if suggested
        if (response.requiresCase && response.actions) {
          const caseAction = response.actions.find(action => action.type === 'create_case');
          if (caseAction) {
            setCaseFormData(caseAction.data);
          }
        }

      } else {
        // Handle error
        const errorMessage = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: `I'm having trouble processing your request. Please try rephrasing your question or ask for help.

You can ask me about:
• Compensation issues
• Finding invoices  
• Deal structure questions
• Pricing help
• Legal terms
• System errors`,
          timestamp: Date.now(),
          type: 'error',
          error: true
        };

        setMessages(prev => [...prev, errorMessage]);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or refresh the page.',
        timestamp: Date.now(),
        type: 'error',
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryMessage = async (messageId) => {
    // Simplified retry for debugging mode
    console.log('Retry requested for message:', messageId);
  };

  // Removed unused handleSuggestCaseCreation function

  const handleMessageAction = (action, messageId) => {
    switch (action.type) {
      case 'create_case':
        setCaseFormData(action.data);
        setShowCaseForm(true);
        break;
        
      case 'retry_message':
        handleRetryMessage(messageId);
        break;
        
      case 'get_guidance':
        handleSendMessage(`Please provide guidance on ${action.data.topic}`);
        break;
        
      case 'check_approval':
        if (action.data.discountPercent) {
          handleSendMessage(`What approval is needed for ${action.data.discountPercent}% discount?`);
        }
        break;

      case 'inline_case_submitted':
        handleInlineCaseSubmit(action.data);
        break;

      case 'inline_case_cancelled':
        handleInlineCaseCancel();
        break;

      case 'open_dynamics':
        // Open Dynamics in a new tab for demo purposes
        if (action.data && action.data.url) {
          window.open(action.data.url, '_blank');
        } else {
          // Fallback demo URL
          const demoUrl = `https://dynamics.microsoft.com/demo/customer-account?customer=${encodeURIComponent('Pellegrino E2E Test')}&opportunity=OPP-2025-001234`;
          window.open(demoUrl, '_blank');
        }
        
        // Add a response message to confirm the action
        const confirmMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔗 Opening Dynamics for ${action.data?.customerName || 'your customer'}...\n\nI've opened the customer account in a new tab. You should now be able to navigate to the CSP Order section and find the Billing Tab to download the invoice.`,
          timestamp: Date.now(),
          type: 'action_confirmation'
        };
        setMessages(prev => [...prev, confirmMessage]);
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleInlineCaseSubmit = (caseData) => {
    // Create success message with case details
    const confirmationMessage = {
      id: `inline_case_confirmation_${Date.now()}`,
      role: 'assistant',
      content: `✅ **Case Created Successfully!**

**Case ID:** ${caseData.caseId}
**Title:** ${caseData.title}
**Category:** ${caseData.category}
**Priority:** ${caseData.priority}

Your case has been submitted and routed to the appropriate team. You'll receive email updates as it progresses.

**Estimated Response Time:**
${caseData.priority === 'Critical' ? '• **Critical**: 4 hours' :
  caseData.priority === 'High' ? '• **High**: 24 hours' :
  caseData.priority === 'Medium' ? '• **Medium**: 72 hours' :
  '• **Low**: 1 week'}

Is there anything else I can help you with?`,
      timestamp: Date.now(),
      type: 'confirmation',
      followUpSuggestions: [
        "Track my case status",
        "Help with another issue"
      ]
    };

    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleInlineCaseCancel = () => {
    const cancelMessage = {
      id: `case_cancelled_${Date.now()}`,
      role: 'assistant',
      content: `No problem! Case creation has been cancelled. 

If you need help with anything else, just let me know!`,
      timestamp: Date.now(),
      type: 'info',
      followUpSuggestions: [
        "Help with another issue",
        "What other support do you provide?"
      ]
    };

    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleFollowUpSuggestion = (suggestion) => {
    // Check if this is a case creation request
    if (suggestion.toLowerCase().includes('create the required case now') || 
        suggestion.toLowerCase().includes('create required case')) {
      
      // Create an inline case form message
      const caseFormMessage = {
        id: `inline_case_form_${Date.now()}`,
        role: 'assistant',
        content: `I'll help you create a case right here. Most information has been pre-filled from your current quote:`,
        timestamp: Date.now(),
        type: 'inline_case_form',
        caseCategory: 'Pricing' // Default category, can be made dynamic
      };

      setMessages(prev => [...prev, caseFormMessage]);
      return;
    }
    
    handleSendMessage(suggestion);
  };

  const handleCaseFormSubmit = (caseData) => {
    // Simplified case submission for debugging
    const confirmationMessage = {
      id: `case_confirmation_${Date.now()}`,
      role: 'assistant',
      content: `✅ **Case Created Successfully** (Debug Mode)\n\nYour case has been formatted:\n\n**Title**: ${caseData.title}\n**Category**: ${caseData.category}\n**Priority**: ${caseData.priority}\n\nNote: Full case processing is disabled for debugging.`,
      timestamp: Date.now(),
      type: 'confirmation'
    };

    setMessages(prev => [...prev, confirmationMessage]);
    setShowCaseForm(false);
    setCaseFormData(null);
  };

  const handleCaseFormCancel = () => {
    setShowCaseForm(false);
    setCaseFormData(null);
  };

  const handleSmartCaseFormSubmit = (caseData) => {
    // Create success message with case details
    const confirmationMessage = {
      id: `smart_case_confirmation_${Date.now()}`,
      role: 'assistant',
      content: `✅ **Case Created Successfully!**

**Case ID:** ${caseData.caseId}
**Title:** ${caseData.title}
**Category:** ${caseData.category}
**Priority:** ${caseData.priority}

Your case has been submitted to the appropriate team and you'll receive updates via email. The estimated response time for ${caseData.priority.toLowerCase()} priority cases is:

${caseData.priority === 'Critical' ? '• **Critical**: 4 hours' :
  caseData.priority === 'High' ? '• **High**: 24 hours' :
  caseData.priority === 'Medium' ? '• **Medium**: 72 hours' :
  '• **Low**: 1 week'}

Is there anything else I can help you with?`,
      timestamp: Date.now(),
      type: 'confirmation',
      followUpSuggestions: [
        "Track my case status",
        "Help with another issue"
      ]
    };

    setMessages(prev => [...prev, confirmationMessage]);
    setShowSmartCaseForm(false);
    setCaseFormData(null);
  };

  const handleSmartCaseFormCancel = () => {
    setShowSmartCaseForm(false);
    setCaseFormData(null);
  };


  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleReopen = () => {
    setIsMinimized(false);
  };

  // Floating Action Button
  if (isMinimized) {
    return (
      <div className="chat-fab" onClick={handleReopen}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-main">
            <h2>☎️ Red Phone Agent</h2>
          </div>
          <button className="chat-close-btn" onClick={handleMinimize}>
            ✕
          </button>
        </div>
        
        <div className="chat-messages">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onAction={(action) => handleMessageAction(action, message.id)}
              onFollowUp={handleFollowUpSuggestion}
            />
          ))}
          
          {isLoading && (
            <div className="message ai-message loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">Red Phone Agent is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isInitialized || isLoading}
          placeholder={
            !isInitialized 
              ? "Initializing..." 
              : isLoading 
                ? "Processing..." 
                : "Ask about policies, cases, or get guidance..."
          }
        />
      </div>

      {showCaseForm && (
        <CaseCreationForm
          initialData={caseFormData}
          onSubmit={handleCaseFormSubmit}
          onCancel={handleCaseFormCancel}
        />
      )}

      {showSmartCaseForm && (
        <SmartCaseCreationForm
          initialData={caseFormData}
          onSubmit={handleSmartCaseFormSubmit}
          onCancel={handleSmartCaseFormCancel}
        />
      )}
    </div>
  );
};

export default ChatInterface;
