// Error Handler for Red Phone Agent
// Comprehensive error handling and fallback response system

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      API_ERROR: 'api_error',
      NETWORK_ERROR: 'network_error',
      VALIDATION_ERROR: 'validation_error',
      AUTHENTICATION_ERROR: 'auth_error',
      RATE_LIMIT_ERROR: 'rate_limit_error',
      PARSING_ERROR: 'parsing_error',
      KNOWLEDGE_BASE_ERROR: 'knowledge_base_error',
      CONTEXT_ERROR: 'context_error',
      FORMATTING_ERROR: 'formatting_error',
      UNKNOWN_ERROR: 'unknown_error'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.fallbackResponses = this.buildFallbackResponses();
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  // Main error handling function
  handleError(error, context = {}) {
    try {
      const errorInfo = this.analyzeError(error, context);
      this.logError(errorInfo);
      
      const fallbackResponse = this.generateFallbackResponse(errorInfo);
      const recoveryAction = this.determineRecoveryAction(errorInfo);
      
      return {
        success: false,
        error: {
          type: errorInfo.type,
          severity: errorInfo.severity,
          message: errorInfo.userMessage,
          timestamp: errorInfo.timestamp,
          id: errorInfo.id
        },
        fallbackResponse,
        recoveryAction,
        canRetry: errorInfo.canRetry,
        metadata: {
          context: context,
          originalError: errorInfo.originalMessage
        }
      };
    } catch (handlingError) {
      // Fallback for error handler itself failing
      return this.emergencyFallback(handlingError, error);
    }
  }

  analyzeError(error, context) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      originalError: error,
      originalMessage: error?.message || 'Unknown error',
      context: context
    };

    // Determine error type
    errorInfo.type = this.classifyError(error);
    
    // Determine severity
    errorInfo.severity = this.assessSeverity(error, errorInfo.type, context);
    
    // Generate user-friendly message
    errorInfo.userMessage = this.generateUserMessage(errorInfo.type, errorInfo.severity);
    
    // Determine if retry is possible
    errorInfo.canRetry = this.canRetry(errorInfo.type, error);
    
    // Extract relevant details
    errorInfo.details = this.extractErrorDetails(error, errorInfo.type);

    return errorInfo;
  }

  classifyError(error) {
    if (!error) return this.errorTypes.UNKNOWN_ERROR;

    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    const code = error.code || error.status;

    // Network and API errors
    if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
      return this.errorTypes.NETWORK_ERROR;
    }
    
    if (code === 401 || message.includes('unauthorized') || message.includes('authentication')) {
      return this.errorTypes.AUTHENTICATION_ERROR;
    }
    
    if (code === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return this.errorTypes.RATE_LIMIT_ERROR;
    }
    
    if (code >= 500 || message.includes('server error') || message.includes('internal error')) {
      return this.errorTypes.API_ERROR;
    }

    // Application-specific errors
    if (message.includes('validation') || message.includes('invalid')) {
      return this.errorTypes.VALIDATION_ERROR;
    }
    
    if (message.includes('parse') || message.includes('json') || name.includes('syntax')) {
      return this.errorTypes.PARSING_ERROR;
    }
    
    if (message.includes('knowledge') || message.includes('search') || message.includes('database')) {
      return this.errorTypes.KNOWLEDGE_BASE_ERROR;
    }
    
    if (message.includes('context') || message.includes('session') || message.includes('conversation')) {
      return this.errorTypes.CONTEXT_ERROR;
    }
    
    if (message.includes('format') || message.includes('render') || message.includes('display')) {
      return this.errorTypes.FORMATTING_ERROR;
    }

    return this.errorTypes.UNKNOWN_ERROR;
  }

  assessSeverity(error, errorType, context) {
    // Critical errors that break core functionality
    if (errorType === this.errorTypes.AUTHENTICATION_ERROR) {
      return this.severityLevels.CRITICAL;
    }
    
    // High severity errors
    if ([
      this.errorTypes.API_ERROR,
      this.errorTypes.KNOWLEDGE_BASE_ERROR
    ].includes(errorType)) {
      return this.severityLevels.HIGH;
    }
    
    // Medium severity errors
    if ([
      this.errorTypes.NETWORK_ERROR,
      this.errorTypes.RATE_LIMIT_ERROR,
      this.errorTypes.CONTEXT_ERROR
    ].includes(errorType)) {
      return this.severityLevels.MEDIUM;
    }
    
    // Low severity errors
    return this.severityLevels.LOW;
  }

  generateUserMessage(errorType, severity) {
    const messages = {
      [this.errorTypes.API_ERROR]: {
        [this.severityLevels.HIGH]: "I'm experiencing technical difficulties with my AI service. Let me try to help with my knowledge base instead.",
        [this.severityLevels.MEDIUM]: "My AI service is temporarily unavailable, but I can still access policy information."
      },
      [this.errorTypes.NETWORK_ERROR]: {
        [this.severityLevels.MEDIUM]: "I'm having connectivity issues. Please check your connection and try again.",
        [this.severityLevels.LOW]: "Network request failed. Please try again in a moment."
      },
      [this.errorTypes.AUTHENTICATION_ERROR]: {
        [this.severityLevels.CRITICAL]: "Authentication failed. Please check your API configuration or contact support."
      },
      [this.errorTypes.RATE_LIMIT_ERROR]: {
        [this.severityLevels.MEDIUM]: "I'm receiving too many requests. Please wait a moment before trying again."
      },
      [this.errorTypes.VALIDATION_ERROR]: {
        [this.severityLevels.LOW]: "I couldn't understand your request. Could you please rephrase or provide more details?"
      },
      [this.errorTypes.PARSING_ERROR]: {
        [this.severityLevels.LOW]: "I had trouble processing your request. Please try rephrasing your question."
      },
      [this.errorTypes.KNOWLEDGE_BASE_ERROR]: {
        [this.severityLevels.HIGH]: "I'm having trouble accessing policy information. Please contact your sales manager for immediate assistance."
      },
      [this.errorTypes.CONTEXT_ERROR]: {
        [this.severityLevels.MEDIUM]: "I lost track of our conversation. Could you please repeat your question?"
      },
      [this.errorTypes.FORMATTING_ERROR]: {
        [this.severityLevels.LOW]: "I had trouble formatting my response, but I can still help you."
      },
      [this.errorTypes.UNKNOWN_ERROR]: {
        [this.severityLevels.MEDIUM]: "Something unexpected happened. Let me try a different approach to help you."
      }
    };

    return messages[errorType]?.[severity] || 
           messages[errorType]?.[this.severityLevels.MEDIUM] ||
           "I encountered an issue, but I'm still here to help you.";
  }

  canRetry(errorType, error) {
    const retryableErrors = [
      this.errorTypes.NETWORK_ERROR,
      this.errorTypes.API_ERROR,
      this.errorTypes.RATE_LIMIT_ERROR,
      this.errorTypes.PARSING_ERROR
    ];
    
    return retryableErrors.includes(errorType) && 
           !error?.message?.includes('permanent');
  }

  extractErrorDetails(error, errorType) {
    const details = {
      code: error?.code || error?.status,
      stack: error?.stack,
      url: error?.config?.url,
      method: error?.config?.method
    };

    // Type-specific details
    if (errorType === this.errorTypes.RATE_LIMIT_ERROR) {
      details.retryAfter = error?.response?.headers?.['retry-after'];
    }
    
    if (errorType === this.errorTypes.VALIDATION_ERROR) {
      details.validationErrors = error?.details || error?.errors;
    }

    return details;
  }

  buildFallbackResponses() {
    return {
      [this.errorTypes.API_ERROR]: {
        type: 'knowledge_base_search',
        message: "While my AI service is unavailable, I can still help you with policy questions using my knowledge base. What would you like to know?",
        suggestions: [
          "Ask about discount policies",
          "Check approval requirements", 
          "Find minimum seat requirements",
          "Get pilot program information"
        ]
      },
      [this.errorTypes.NETWORK_ERROR]: {
        type: 'offline_guidance',
        message: "I'm having connectivity issues, but here are some quick guidelines while we reconnect:",
        suggestions: [
          "Enterprise discounts: up to 20%",
          "SMB discounts: up to 10%", 
          "Discounts over 20% need director approval",
          "Add-on deals have no minimum requirements"
        ]
      },
      [this.errorTypes.KNOWLEDGE_BASE_ERROR]: {
        type: 'manual_assistance',
        message: "I can't access my knowledge base right now. For immediate help, please:",
        suggestions: [
          "Contact your sales manager",
          "Check the ROE document directly",
          "Submit a case in Salesforce",
          "Ask a colleague for guidance"
        ]
      },
      [this.errorTypes.VALIDATION_ERROR]: {
        type: 'clarification_request',
        message: "I need more information to help you effectively. Could you provide:",
        suggestions: [
          "Customer segment (SMB, Enterprise, etc.)",
          "Deal type (New Business, Renewal, etc.)",
          "Specific discount percentage or deal value",
          "Any competitive or urgency factors"
        ]
      },
      [this.errorTypes.RATE_LIMIT_ERROR]: {
        type: 'patience_request',
        message: "I'm processing a lot of requests right now. While you wait, you can:",
        suggestions: [
          "Review your question for clarity",
          "Check if it's a simple policy lookup",
          "Prepare any additional context",
          "Try again in 30 seconds"
        ]
      },
      default: {
        type: 'general_assistance',
        message: "I'm experiencing some technical difficulties, but I'm still here to help. You can:",
        suggestions: [
          "Try rephrasing your question",
          "Ask about specific policies",
          "Contact your sales manager",
          "Try again in a few moments"
        ]
      }
    };
  }

  generateFallbackResponse(errorInfo) {
    const fallback = this.fallbackResponses[errorInfo.type] || 
                    this.fallbackResponses.default;
    
    return {
      content: fallback.message,
      type: fallback.type,
      suggestions: fallback.suggestions,
      severity: errorInfo.severity,
      canRecover: errorInfo.canRetry,
      timestamp: errorInfo.timestamp
    };
  }

  determineRecoveryAction(errorInfo) {
    const recoveryActions = {
      [this.errorTypes.API_ERROR]: {
        action: 'fallback_to_knowledge_base',
        description: 'Switch to knowledge base only mode',
        automated: true
      },
      [this.errorTypes.NETWORK_ERROR]: {
        action: 'retry_with_backoff',
        description: 'Retry request with exponential backoff',
        automated: true,
        retryDelay: 1000
      },
      [this.errorTypes.RATE_LIMIT_ERROR]: {
        action: 'wait_and_retry',
        description: 'Wait for rate limit reset',
        automated: true,
        retryDelay: 30000
      },
      [this.errorTypes.VALIDATION_ERROR]: {
        action: 'request_clarification',
        description: 'Ask user for more specific information',
        automated: false
      },
      [this.errorTypes.AUTHENTICATION_ERROR]: {
        action: 'switch_to_mock_mode',
        description: 'Continue with mock responses',
        automated: true
      },
      [this.errorTypes.KNOWLEDGE_BASE_ERROR]: {
        action: 'escalate_to_human',
        description: 'Redirect to human support',
        automated: false
      }
    };

    return recoveryActions[errorInfo.type] || {
      action: 'general_recovery',
      description: 'Attempt general error recovery',
      automated: false
    };
  }

  logError(errorInfo) {
    this.errorLog.push(errorInfo);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console for development
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.error('Red Phone Agent Error:', errorInfo);
    }
  }

  emergencyFallback(handlingError, originalError) {
    console.error('Error handler failed:', handlingError);
    console.error('Original error:', originalError);
    
    return {
      success: false,
      error: {
        type: this.errorTypes.CRITICAL,
        severity: this.severityLevels.CRITICAL,
        message: "I'm experiencing critical technical difficulties. Please contact your sales manager immediately for assistance.",
        timestamp: new Date().toISOString(),
        id: 'emergency_' + Date.now()
      },
      fallbackResponse: {
        content: "🚨 **Critical Error** \n\nI'm unable to process requests right now. Please:\n\n• Contact your sales manager immediately\n• Use direct policy documents\n• Submit cases through Salesforce\n• Try again later",
        type: 'emergency',
        suggestions: [
          "Contact sales manager",
          "Use Salesforce directly", 
          "Check ROE documents",
          "Try again later"
        ]
      },
      canRetry: false,
      metadata: {
        emergencyFallback: true,
        handlingError: handlingError.message
      }
    };
  }

  // Error recovery functions
  async attemptRecovery(errorInfo, context = {}) {
    const recoveryAction = this.determineRecoveryAction(errorInfo);
    
    if (!recoveryAction.automated) {
      return { recovered: false, reason: 'Manual intervention required' };
    }

    try {
      switch (recoveryAction.action) {
        case 'fallback_to_knowledge_base':
          return await this.fallbackToKnowledgeBase(context);
          
        case 'retry_with_backoff':
          return await this.retryWithBackoff(context, recoveryAction.retryDelay);
          
        case 'switch_to_mock_mode':
          return this.switchToMockMode(context);
          
        default:
          return { recovered: false, reason: 'Unknown recovery action' };
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return { recovered: false, reason: 'Recovery failed', error: recoveryError };
    }
  }

  async fallbackToKnowledgeBase(context) {
    try {
      // Attempt to use knowledge base service directly
      const knowledgeBaseService = await import('../services/knowledgeBaseService');
      const result = await knowledgeBaseService.default.search(context.query || 'general help');
      
      return {
        recovered: true,
        mode: 'knowledge_base_only',
        data: result
      };
    } catch (error) {
      return { recovered: false, reason: 'Knowledge base also unavailable' };
    }
  }

  async retryWithBackoff(context, initialDelay = 1000) {
    const maxRetries = 3;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await this.delay(delay);
      
      try {
        // Attempt to retry original operation
        if (context.retryFunction) {
          const result = await context.retryFunction();
          return { recovered: true, attempt, data: result };
        }
        return { recovered: true, attempt };
      } catch (error) {
        if (attempt === maxRetries) {
          return { recovered: false, reason: 'Max retries exceeded', lastError: error };
        }
        delay *= 2; // Exponential backoff
      }
    }
  }

  switchToMockMode(context) {
    return {
      recovered: true,
      mode: 'mock',
      message: "Switched to demonstration mode. Responses will be simulated.",
      data: {
        mockResponse: "This is a mock response. In normal operation, I would provide real policy information and case guidance."
      }
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Error analysis and reporting
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {},
      errorsBySeverity: {},
      recentErrors: this.errorLog.slice(-10),
      errorRate: this.calculateErrorRate()
    };

    this.errorLog.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  calculateErrorRate() {
    if (this.errorLog.length === 0) return 0;
    
    const lastHour = Date.now() - (60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(error => 
      new Date(error.timestamp).getTime() > lastHour
    );
    
    return recentErrors.length; // Errors per hour
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  isHealthy() {
    const stats = this.getErrorStats();
    
    return {
      healthy: stats.errorRate < 10, // Less than 10 errors per hour
      errorRate: stats.errorRate,
      criticalErrors: stats.errorsBySeverity[this.severityLevels.CRITICAL] || 0,
      lastError: stats.recentErrors[stats.recentErrors.length - 1] || null
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;
