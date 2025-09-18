import React, { useState } from 'react';
import InlineCaseForm from './InlineCaseForm';
import '../styles/Chat.css';

const MessageBubble = ({ message, onAction, onFollowUp }) => {
  const [showActions, setShowActions] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showInlineCaseForm, setShowInlineCaseForm] = useState(message.type === 'inline_case_form');

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatContent = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="dynamics-link">$1</a>') // Links
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/^• (.+)$/gm, '<li>$1</li>') // Bullet points
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // Wrap lists
  };

  const getMessageClass = () => {
    const baseClass = 'message';
    const roleClass = message.role === 'user' ? 'user-message' : 'ai-message';
    const typeClass = message.type ? `message-type-${message.type}` : '';
    const errorClass = message.error ? 'message-error' : '';
    
    return `${baseClass} ${roleClass} ${typeClass} ${errorClass}`.trim();
  };

  // Removed confidence indicator for cleaner UI

  const renderSources = () => {
    if (!message.sources || message.sources.length === 0) return null;
    
    return (
      <div className="message-sources">
        <small>
          <strong>Sources:</strong> {message.sources.join(', ')}
        </small>
      </div>
    );
  };

  const renderActions = () => {
    if (!message.actions || message.actions.length === 0) {
      // Default retry action for error messages
      if (message.error && message.canRetry) {
        return (
          <div className="message-actions">
            <button 
              className="action-btn retry-btn"
              onClick={() => onAction({ type: 'retry_message' })}
            >
              🔄 Retry
            </button>
          </div>
        );
      }
      return null;
    }
    
    return (
      <div className="message-actions">
        {message.actions.map((action, index) => (
          <button
            key={index}
            className={`action-btn ${action.type}-btn`}
            onClick={() => onAction(action)}
            title={action.description}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  const renderFollowUpSuggestions = () => {
    if (!message.followUpSuggestions || message.followUpSuggestions.length === 0) return null;
    
    // Simplified - show only first 2 suggestions for cleaner UI
    const limitedSuggestions = message.followUpSuggestions.slice(0, 2);
    
    return (
      <div className="follow-up-suggestions">
        <div className="suggestions-list">
          {limitedSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-btn"
              onClick={() => onFollowUp(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    if (!showMetadata || !message.metadata) return null;
    
    return (
      <div className="message-metadata">
        <div className="metadata-content">
          {message.metadata.source && (
            <div><strong>Source:</strong> {message.metadata.source}</div>
          )}
          {message.metadata.confidence && (
            <div><strong>Confidence:</strong> {Math.round(message.metadata.confidence * 100)}%</div>
          )}
          {message.metadata.processingTime && (
            <div><strong>Response Time:</strong> {message.metadata.processingTime}ms</div>
          )}
          {message.metadata.wordCount && (
            <div><strong>Length:</strong> {message.metadata.wordCount} words</div>
          )}
          {message.type && (
            <div><strong>Type:</strong> {message.type}</div>
          )}
        </div>
      </div>
    );
  };

  const handleBubbleClick = () => {
    if (message.actions && message.actions.length > 0) {
      setShowActions(!showActions);
    }
  };

  const handleMetadataToggle = (e) => {
    e.stopPropagation();
    setShowMetadata(!showMetadata);
  };

  const handleInlineCaseSubmit = (caseData) => {
    setShowInlineCaseForm(false);
    onAction({ type: 'inline_case_submitted', data: caseData });
  };

  const handleInlineCaseCancel = () => {
    setShowInlineCaseForm(false);
    onAction({ type: 'inline_case_cancelled' });
  };

  return (
    <div className={getMessageClass()}>
      <div className="message-wrapper">
        <div 
          className="message-content"
          onClick={handleBubbleClick}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        
        {/* Inline case form for special message type */}
        {showInlineCaseForm && message.caseCategory && (
          <InlineCaseForm
            caseCategory={message.caseCategory}
            onSubmit={handleInlineCaseSubmit}
            onCancel={handleInlineCaseCancel}
          />
        )}
        
        <div className="message-footer">
          <div className="message-info">
            <span className="message-time">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {/* Metadata toggle for AI messages */}
            {message.role === 'assistant' && message.metadata && (
              <button 
                className="metadata-toggle"
                onClick={handleMetadataToggle}
                title="Show message details"
              >
                ℹ️
              </button>
            )}
          </div>
          
          {renderSources()}
        </div>
        
        {renderMetadata()}
        
        {/* Actions - show always for important actions, on hover/click for others */}
        {(showActions || message.type === 'suggestion' || message.error || 
          ['dynamics_access_help', 'intelligent_pricing', 'intelligent_compensation', 'intelligent_invoice', 'intelligent_system', 'intelligent_legal'].includes(message.responseType)) && renderActions()}
        
        {/* Follow-up suggestions for AI messages - hide when inline form is showing */}
        {message.role === 'assistant' && !showInlineCaseForm && renderFollowUpSuggestions()}
      </div>
    </div>
  );
};

export default MessageBubble;
