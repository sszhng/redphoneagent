// Context Manager for Red Phone Agent
// Manages conversation flow, context continuity, and state persistence

class ContextManager {
  constructor() {
    this.conversations = new Map(); // sessionId -> conversationState
    this.maxContextLength = 20; // Maximum messages to keep in context
    this.contextExpiryTime = 30 * 60 * 1000; // 30 minutes
    this.activeContexts = new Set(); // Track active conversation sessions
    
    // Cleanup expired contexts every 5 minutes
    setInterval(() => this.cleanupExpiredContexts(), 5 * 60 * 1000);
  }

  // Initialize or get conversation context
  getOrCreateContext(sessionId) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, this.createNewContext(sessionId));
    }
    
    const context = this.conversations.get(sessionId);
    context.lastAccessed = Date.now();
    this.activeContexts.add(sessionId);
    
    return context;
  }

  createNewContext(sessionId) {
    return {
      sessionId,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      messages: [],
      currentTopic: null,
      userProfile: {
        preferredResponseStyle: 'detailed', // brief, detailed, technical
        experienceLevel: 'intermediate', // beginner, intermediate, expert
        commonSegments: [], // frequently mentioned segments
        commonDealTypes: [], // frequently mentioned deal types
        recentQueries: [] // last 5 query types
      },
      conversationState: {
        currentIntent: null,
        pendingActions: [], // actions suggested but not completed
        contextualEntities: {}, // entities mentioned in conversation
        followUpExpected: false,
        lastTopicDepth: 0 // how deep we've gone into current topic
      },
      dealContext: {
        currentDeal: null, // if discussing a specific deal
        mentionedDeals: [], // all deals mentioned in conversation
        activeScenario: null // current scenario being discussed
      },
      preferences: {
        wantsDetailedExplanations: true,
        prefersExamples: false,
        needsStepByStepGuidance: false
      }
    };
  }

  // Add message to context with analysis
  addMessage(sessionId, message, role = 'user', analysis = null) {
    const context = this.getOrCreateContext(sessionId);
    
    const messageEntry = {
      role,
      content: message,
      timestamp: Date.now(),
      analysis: analysis || null,
      messageId: this.generateMessageId()
    };

    context.messages.push(messageEntry);
    
    // Maintain context length
    if (context.messages.length > this.maxContextLength) {
      context.messages = context.messages.slice(-this.maxContextLength);
    }

    // Update context state based on message
    if (role === 'user' && analysis) {
      this.updateContextState(context, analysis);
    }

    return messageEntry;
  }

  updateContextState(context, analysis) {
    const { intent, entities, businessContext } = analysis;

    // Update current intent
    context.conversationState.currentIntent = intent;

    // Merge entities into contextual entities
    Object.entries(entities).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        context.conversationState.contextualEntities[key] = values[0]; // Use most recent
      }
    });

    // Update deal context if business context available
    if (businessContext.hasDealDetails) {
      this.updateDealContext(context, entities);
    }

    // Update user profile
    this.updateUserProfile(context, analysis);

    // Determine if follow-up is expected
    context.conversationState.followUpExpected = this.shouldExpectFollowUp(analysis);
  }

  updateDealContext(context, entities) {
    const dealInfo = {
      segment: entities.segment ? entities.segment[0] : null,
      dealType: entities.dealType ? entities.dealType[0] : null,
      region: entities.region ? entities.region[0] : null,
      discountPercent: entities.percentage ? entities.percentage[0] : null,
      dealValue: entities.currency ? entities.currency[0] : null,
      urgency: entities.urgency ? entities.urgency[0] : null,
      timestamp: Date.now()
    };

    // If this looks like a new deal discussion, set as current
    if (dealInfo.segment || dealInfo.dealType || dealInfo.dealValue) {
      context.dealContext.currentDeal = dealInfo;
      context.dealContext.mentionedDeals.push(dealInfo);
      
      // Keep only last 5 mentioned deals
      if (context.dealContext.mentionedDeals.length > 5) {
        context.dealContext.mentionedDeals = context.dealContext.mentionedDeals.slice(-5);
      }
    }
  }

  updateUserProfile(context, analysis) {
    const { intent, complexity } = analysis;

    // Track query types
    context.userProfile.recentQueries.push(intent);
    if (context.userProfile.recentQueries.length > 5) {
      context.userProfile.recentQueries = context.userProfile.recentQueries.slice(-5);
    }

    // Update experience level based on question complexity
    if (complexity === 'complex') {
      if (context.userProfile.experienceLevel === 'beginner') {
        context.userProfile.experienceLevel = 'intermediate';
      }
    } else if (complexity === 'simple' && context.userProfile.experienceLevel === 'expert') {
      // Don't downgrade, might be a quick check
    }

    // Track common segments and deal types
    if (analysis.entities.segment) {
      analysis.entities.segment.forEach(segment => {
        if (!context.userProfile.commonSegments.includes(segment)) {
          context.userProfile.commonSegments.push(segment);
        }
      });
    }

    if (analysis.entities.dealType) {
      analysis.entities.dealType.forEach(dealType => {
        if (!context.userProfile.commonDealTypes.includes(dealType)) {
          context.userProfile.commonDealTypes.push(dealType);
        }
      });
    }
  }

  shouldExpectFollowUp(analysis) {
    const { intent, suggestsCaseCreation, complexity } = analysis;
    
    // Case creation usually leads to follow-up questions
    if (suggestsCaseCreation) return true;
    
    // Complex questions often need clarification
    if (complexity === 'complex') return true;
    
    // Guidance requests often lead to implementation questions
    if (intent === 'guidance_request') return true;
    
    return false;
  }

  // Get conversation history for AI context
  getConversationHistory(sessionId, maxMessages = 10) {
    const context = this.conversations.get(sessionId);
    if (!context) return [];

    return context.messages
      .slice(-maxMessages)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
  }

  // Get contextual information for AI to use
  getContextualInfo(sessionId) {
    const context = this.conversations.get(sessionId);
    if (!context) return null;

    return {
      currentTopic: context.currentTopic,
      currentIntent: context.conversationState.currentIntent,
      contextualEntities: context.conversationState.contextualEntities,
      currentDeal: context.dealContext.currentDeal,
      userProfile: context.userProfile,
      followUpExpected: context.conversationState.followUpExpected,
      pendingActions: context.conversationState.pendingActions
    };
  }

  // Resolve references like "that deal", "the customer", etc.
  resolveReferences(sessionId, message) {
    const context = this.conversations.get(sessionId);
    if (!context) return { resolvedMessage: message, resolvedEntities: {} };

    const resolvedEntities = {};
    let resolvedMessage = message;

    // Simple reference resolution
    const references = [
      { pattern: /\b(that|the|this)\s+(deal|customer|account|case|discount|approval)\b/gi, type: 'contextual' },
      { pattern: /\b(it|that|this)\b/gi, type: 'pronoun' }
    ];

    references.forEach(({ pattern, type }) => {
      const matches = message.match(pattern);
      if (matches) {
        // Try to resolve based on context
        const resolution = this.resolveContextualReference(context, type, matches[0]);
        if (resolution) {
          resolvedMessage = resolvedMessage.replace(pattern, resolution.replacement);
          Object.assign(resolvedEntities, resolution.entities);
        }
      }
    });

    return { resolvedMessage, resolvedEntities };
  }

  resolveContextualReference(context, type, reference) {
    const { currentDeal, contextualEntities } = context.dealContext;
    const { conversationState } = context;

    if (type === 'contextual') {
      if (reference.includes('deal') && currentDeal) {
        const dealDescription = this.formatDealDescription(currentDeal);
        return {
          replacement: dealDescription,
          entities: {
            segment: currentDeal.segment ? [currentDeal.segment] : [],
            dealType: currentDeal.dealType ? [currentDeal.dealType] : [],
            currency: currentDeal.dealValue ? [currentDeal.dealValue] : [],
            percentage: currentDeal.discountPercent ? [currentDeal.discountPercent] : []
          }
        };
      }

      if (reference.includes('customer') && currentDeal?.segment) {
        return {
          replacement: `${currentDeal.segment} customer`,
          entities: { segment: [currentDeal.segment] }
        };
      }

      if (reference.includes('discount') && currentDeal?.discountPercent) {
        return {
          replacement: `${currentDeal.discountPercent}% discount`,
          entities: { percentage: [currentDeal.discountPercent] }
        };
      }
    }

    if (type === 'pronoun') {
      // Use the most recent contextual entity mentioned
      const recentEntities = conversationState.contextualEntities;
      if (Object.keys(recentEntities).length > 0) {
        const mostRecentEntity = Object.entries(recentEntities)[0];
        return {
          replacement: mostRecentEntity[1],
          entities: { [mostRecentEntity[0]]: [mostRecentEntity[1]] }
        };
      }
    }

    return null;
  }

  formatDealDescription(deal) {
    const parts = [];
    if (deal.segment) parts.push(deal.segment);
    if (deal.dealType) parts.push(deal.dealType);
    if (deal.dealValue) parts.push(`$${deal.dealValue.toLocaleString()}`);
    return parts.join(' ') + ' deal';
  }

  // Track pending actions (like case creation suggestions)
  addPendingAction(sessionId, action) {
    const context = this.getOrCreateContext(sessionId);
    
    const actionEntry = {
      id: this.generateActionId(),
      type: action.type,
      description: action.description,
      data: action.data || {},
      timestamp: Date.now(),
      status: 'pending'
    };

    context.conversationState.pendingActions.push(actionEntry);
    
    // Keep only last 3 pending actions
    if (context.conversationState.pendingActions.length > 3) {
      context.conversationState.pendingActions = context.conversationState.pendingActions.slice(-3);
    }

    return actionEntry.id;
  }

  // Mark action as completed or cancelled
  updatePendingAction(sessionId, actionId, status, result = null) {
    const context = this.conversations.get(sessionId);
    if (!context) return false;

    const action = context.conversationState.pendingActions.find(a => a.id === actionId);
    if (action) {
      action.status = status;
      action.completedAt = Date.now();
      if (result) action.result = result;
      return true;
    }
    return false;
  }

  // Get personalized response style based on user profile
  getResponseStyle(sessionId) {
    const context = this.conversations.get(sessionId);
    if (!context) return { style: 'detailed', experienceLevel: 'intermediate' };

    const { userProfile } = context;
    
    return {
      style: userProfile.preferredResponseStyle,
      experienceLevel: userProfile.experienceLevel,
      includeExamples: userProfile.prefersExamples,
      stepByStep: userProfile.needsStepByStepGuidance,
      commonSegments: userProfile.commonSegments,
      commonDealTypes: userProfile.commonDealTypes
    };
  }

  // Update user preferences based on feedback
  updateUserPreferences(sessionId, preferences) {
    const context = this.getOrCreateContext(sessionId);
    Object.assign(context.preferences, preferences);
    
    // Infer preferred response style
    if (preferences.wantsDetailedExplanations === false) {
      context.userProfile.preferredResponseStyle = 'brief';
    } else if (preferences.needsStepByStepGuidance) {
      context.userProfile.preferredResponseStyle = 'detailed';
    }
  }

  // Get conversation summary for handoff or escalation
  getConversationSummary(sessionId) {
    const context = this.conversations.get(sessionId);
    if (!context) return null;

    const recentMessages = context.messages.slice(-5);
    const entities = context.conversationState.contextualEntities;
    const dealInfo = context.dealContext.currentDeal;

    return {
      sessionId,
      duration: Date.now() - context.createdAt,
      messageCount: context.messages.length,
      currentTopic: context.currentTopic,
      currentIntent: context.conversationState.currentIntent,
      dealContext: dealInfo,
      keyEntities: entities,
      pendingActions: context.conversationState.pendingActions,
      recentMessages: recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
        timestamp: msg.timestamp
      })),
      userProfile: {
        experienceLevel: context.userProfile.experienceLevel,
        commonQueries: context.userProfile.recentQueries
      }
    };
  }

  // Clear conversation context
  clearContext(sessionId) {
    if (this.conversations.has(sessionId)) {
      this.conversations.delete(sessionId);
      this.activeContexts.delete(sessionId);
      return true;
    }
    return false;
  }

  // Export conversation for analysis or handoff
  exportConversation(sessionId) {
    const context = this.conversations.get(sessionId);
    if (!context) return null;

    return {
      sessionId,
      exportedAt: Date.now(),
      conversationData: JSON.stringify(context, null, 2)
    };
  }

  // Cleanup expired contexts
  cleanupExpiredContexts() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, context] of this.conversations.entries()) {
      if (now - context.lastAccessed > this.contextExpiryTime) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.conversations.delete(sessionId);
      this.activeContexts.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired conversation contexts`);
    }
  }

  // Generate unique IDs
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics about active contexts
  getContextStats() {
    const stats = {
      totalContexts: this.conversations.size,
      activeContexts: this.activeContexts.size,
      averageMessages: 0,
      averageAge: 0,
      experienceLevels: { beginner: 0, intermediate: 0, expert: 0 },
      commonIntents: {}
    };

    if (this.conversations.size === 0) return stats;

    let totalMessages = 0;
    let totalAge = 0;
    const now = Date.now();

    for (const context of this.conversations.values()) {
      totalMessages += context.messages.length;
      totalAge += now - context.createdAt;
      
      // Experience level distribution
      stats.experienceLevels[context.userProfile.experienceLevel]++;
      
      // Common intents
      if (context.conversationState.currentIntent) {
        const intent = context.conversationState.currentIntent;
        stats.commonIntents[intent] = (stats.commonIntents[intent] || 0) + 1;
      }
    }

    stats.averageMessages = Math.round(totalMessages / this.conversations.size);
    stats.averageAge = Math.round(totalAge / this.conversations.size / 1000 / 60); // minutes

    return stats;
  }

  // Context continuity helpers
  isFollowUpQuestion(sessionId, message) {
    const context = this.conversations.get(sessionId);
    if (!context) return false;

    // Check for reference words
    const referenceWords = ['that', 'this', 'it', 'also', 'and', 'but', 'however'];
    const messageWords = message.toLowerCase().split(/\s+/);
    const hasReferences = referenceWords.some(ref => messageWords.includes(ref));

    // Check if follow-up was expected
    const followUpExpected = context.conversationState.followUpExpected;

    // Check timing (follow-ups usually come within 2 minutes)
    const lastMessage = context.messages[context.messages.length - 1];
    const timeSinceLastMessage = lastMessage ? Date.now() - lastMessage.timestamp : Infinity;
    const withinFollowUpWindow = timeSinceLastMessage < 2 * 60 * 1000;

    return hasReferences || (followUpExpected && withinFollowUpWindow);
  }

  getContextForAI(sessionId) {
    const context = this.conversations.get(sessionId);
    if (!context) return null;

    return {
      conversationHistory: this.getConversationHistory(sessionId, 5),
      contextualEntities: context.conversationState.contextualEntities,
      currentDeal: context.dealContext.currentDeal,
      userProfile: context.userProfile,
      pendingActions: context.conversationState.pendingActions.filter(a => a.status === 'pending'),
      isFollowUp: context.conversationState.followUpExpected,
      responseStyle: this.getResponseStyle(sessionId)
    };
  }
}

// Create singleton instance
const contextManager = new ContextManager();

export default contextManager;
