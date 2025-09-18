// Message Processor for Red Phone Agent
// Intelligent message analysis and response type determination

import knowledgeBaseService from '../services/knowledgeBaseService.js';
import vectorSearch from './vectorSearchSimulation.js';

class MessageProcessor {
  constructor() {
    this.responseTypes = {
      SELF_SERVICE: 'self_service',
      CASE_CREATION: 'case_creation',
      POLICY_LOOKUP: 'policy_lookup',
      GUIDANCE_REQUEST: 'guidance_request',
      PRECEDENT_SEARCH: 'precedent_search',
      ESCALATION_NEEDED: 'escalation_needed'
    };
    
    this.confidenceThresholds = {
      HIGH: 0.8,
      MEDIUM: 0.6,
      LOW: 0.4
    };
    
    this.intentPatterns = this.buildIntentPatterns();
    this.entityExtractors = this.buildEntityExtractors();
  }

  buildIntentPatterns() {
    return {
      // Self-service patterns - simple policy questions
      selfService: [
        /what (is|are) the (discount|minimum|limit|requirement)/i,
        /can I (give|offer|provide) (\d+)%/i,
        /is (\d+)% (allowed|approved|ok)/i,
        /minimum (seats|users|commitment) for/i,
        /standard (pricing|terms|policy) for/i,
        /auto.approved (limit|threshold)/i,
        /who approves (\d+)%/i,
        /approval (process|workflow) for/i
      ],
      
      // Case creation patterns - need approval/exception
      caseCreation: [
        /need (approval|exception|case) for/i,
        /create (a )?case/i,
        /submit (request|case)/i,
        /exception to policy/i,
        /special (approval|request|terms)/i,
        /outside (of )?policy/i,
        /custom (terms|agreement|pricing)/i,
        /emergency (approval|discount)/i,
        /competitive (threat|situation|response)/i,
        /urgent.*(approval|case|request)/i
      ],
      
      // Policy lookup patterns - specific information requests
      policyLookup: [
        /what.*(policy|rule|roe) (says|states)/i,
        /lookup.*policy/i,
        /check.*rules/i,
        /policy for.*segment/i,
        /rules.*for.*(enterprise|smb|midmarket)/i,
        /discount.*limits.*for/i,
        /approval.*thresholds/i
      ],
      
      // Guidance patterns - how-to questions
      guidance: [
        /how (do I|to|should I)/i,
        /what should I (do|say)/i,
        /best practice(s)? for/i,
        /recommend(ation)?.*for/i,
        /guidance (on|for)/i,
        /help (me )?with/i,
        /what.*(approach|strategy)/i,
        /how.*(structure|format|create)/i
      ],
      
      // Precedent search patterns - looking for examples
      precedentSearch: [
        /similar (case|situation|deal)/i,
        /has this happened before/i,
        /precedent for/i,
        /example(s)? of/i,
        /other (cases|deals) like/i,
        /history of.*approvals/i,
        /past (cases|examples)/i,
        /comparable (situation|deal)/i
      ],
      
      // Escalation patterns - urgent/complex situations
      escalation: [
        /urgent.*customer/i,
        /escalat(e|ion)/i,
        /customer (complaint|angry|upset)/i,
        /immediate.*help/i,
        /crisis/i,
        /emergency/i,
        /critical.*situation/i,
        /legal.*review/i,
        /compliance.*issue/i
      ]
    };
  }

  buildEntityExtractors() {
    return {
      // Numeric extractors
      percentage: {
        pattern: /(\d+(?:\.\d+)?)%/g,
        extract: (matches) => matches.map(m => parseFloat(m.replace('%', '')))
      },
      
      currency: {
        pattern: /\$?([\d,]+(?:\.\d{2})?)[kKmM]?/g,
        extract: (matches) => matches.map(m => {
          const clean = m.replace(/[$,]/g, '');
          const num = parseFloat(clean);
          if (m.toLowerCase().includes('k')) return num * 1000;
          if (m.toLowerCase().includes('m')) return num * 1000000;
          return num;
        })
      },
      
      timeframe: {
        pattern: /(\d+)\s*(day|week|month|year)s?/gi,
        extract: (matches) => matches.map(m => {
          const [, num, unit] = m.match(/(\d+)\s*(day|week|month|year)s?/i);
          return { value: parseInt(num), unit: unit.toLowerCase() };
        })
      },
      
      // Business entity extractors
      segment: {
        pattern: /(smb|small business|midmarket|mid-market|enterprise|large enterprise|global account|fortune)/gi,
        extract: (matches) => matches.map(m => {
          const lower = m.toLowerCase();
          if (lower.includes('smb') || lower.includes('small')) return 'smb';
          if (lower.includes('midmarket') || lower.includes('mid-market')) return 'midmarket';
          if (lower.includes('large') || lower.includes('fortune')) return 'largeEnterprise';
          if (lower.includes('global')) return 'globalAccounts';
          return 'enterprise';
        })
      },
      
      dealType: {
        pattern: /(new business|renewal|add-on|addon|upsell|expansion)/gi,
        extract: (matches) => matches.map(m => {
          const lower = m.toLowerCase();
          if (lower.includes('renewal')) return 'renewal';
          if (lower.includes('add') || lower.includes('addon')) return 'addon';
          if (lower.includes('upsell') || lower.includes('expansion')) return 'upsell';
          return 'newBusiness';
        })
      },
      
      region: {
        pattern: /(namer|north america|us|usa|emea|europe|european|apac|asia|pacific|latam|latin america|brazil|mexico)/gi,
        extract: (matches) => matches.map(m => {
          const lower = m.toLowerCase();
          if (lower.includes('emea') || lower.includes('europe')) return 'emea';
          if (lower.includes('apac') || lower.includes('asia') || lower.includes('pacific')) return 'apac';
          if (lower.includes('latam') || lower.includes('latin') || lower.includes('brazil') || lower.includes('mexico')) return 'latam';
          return 'namer';
        })
      },
      
      urgency: {
        pattern: /(urgent|asap|immediately|emergency|critical|soon|rush|deadline)/gi,
        extract: (matches) => {
          const urgencyMap = {
            'emergency': 'critical',
            'critical': 'critical',
            'urgent': 'high',
            'asap': 'high',
            'immediately': 'high',
            'soon': 'medium',
            'rush': 'high',
            'deadline': 'medium'
          };
          return matches.map(m => urgencyMap[m.toLowerCase()] || 'medium');
        }
      }
    };
  }

  // Main message processing function
  async processMessage(message, conversationContext = []) {
    const analysis = await this.analyzeMessage(message, conversationContext);
    const responseStrategy = this.determineResponseStrategy(analysis);
    const knowledgeRequirements = this.identifyKnowledgeRequirements(analysis, responseStrategy);
    
    return {
      originalMessage: message,
      analysis,
      responseStrategy,
      knowledgeRequirements,
      processingMetadata: {
        timestamp: new Date().toISOString(),
        confidence: analysis.confidence,
        complexity: analysis.complexity
      }
    };
  }

  async analyzeMessage(message, conversationContext) {
    // Extract entities from the message
    const entities = this.extractAllEntities(message);
    
    // Determine primary intent
    const intent = this.determineIntent(message);
    
    // Assess message complexity
    const complexity = this.assessComplexity(message, entities, intent);
    
    // Analyze business context
    const businessContext = this.analyzeBusinessContext(message, entities);
    
    // Determine confidence level
    const confidence = this.calculateConfidence(intent, entities, businessContext);
    
    // Check for conversation continuity
    const contextualInfo = this.analyzeConversationContext(message, conversationContext);
    
    return {
      intent,
      entities,
      complexity,
      businessContext,
      confidence,
      contextualInfo,
      requiresKnowledgeBase: complexity !== 'simple' || entities.length > 0,
      suggestsCaseCreation: this.shouldSuggestCaseCreation(intent, entities, businessContext)
    };
  }

  extractAllEntities(message) {
    const entities = {};
    
    Object.entries(this.entityExtractors).forEach(([entityType, extractor]) => {
      const matches = message.match(extractor.pattern);
      if (matches) {
        entities[entityType] = extractor.extract(matches);
      }
    });
    
    return entities;
  }

  determineIntent(message) {
    const messageLower = message.toLowerCase();
    
    // Check each intent pattern
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(messageLower)) {
          return this.mapIntentToResponseType(intentType);
        }
      }
    }
    
    // Fallback intent determination based on keywords
    if (messageLower.includes('policy') || messageLower.includes('rule') || messageLower.includes('limit')) {
      return this.responseTypes.POLICY_LOOKUP;
    } else if (messageLower.includes('case') || messageLower.includes('approval') || messageLower.includes('exception')) {
      return this.responseTypes.CASE_CREATION;
    } else if (messageLower.includes('example') || messageLower.includes('similar') || messageLower.includes('precedent')) {
      return this.responseTypes.PRECEDENT_SEARCH;
    } else if (messageLower.includes('how') || messageLower.includes('guidance') || messageLower.includes('help')) {
      return this.responseTypes.GUIDANCE_REQUEST;
    }
    
    return this.responseTypes.POLICY_LOOKUP; // Default to policy lookup
  }

  mapIntentToResponseType(intentType) {
    const intentMap = {
      'selfService': this.responseTypes.SELF_SERVICE,
      'caseCreation': this.responseTypes.CASE_CREATION,
      'policyLookup': this.responseTypes.POLICY_LOOKUP,
      'guidance': this.responseTypes.GUIDANCE_REQUEST,
      'precedentSearch': this.responseTypes.PRECEDENT_SEARCH,
      'escalation': this.responseTypes.ESCALATION_NEEDED
    };
    
    return intentMap[intentType] || this.responseTypes.POLICY_LOOKUP;
  }

  assessComplexity(message, entities, intent) {
    let complexityScore = 0;
    
    // Message length factor
    const wordCount = message.split(/\s+/).length;
    if (wordCount > 20) complexityScore += 2;
    else if (wordCount > 10) complexityScore += 1;
    
    // Entity complexity
    const entityCount = Object.keys(entities).length;
    complexityScore += entityCount;
    
    // Intent complexity
    const intentComplexity = {
      [this.responseTypes.SELF_SERVICE]: 1,
      [this.responseTypes.POLICY_LOOKUP]: 2,
      [this.responseTypes.GUIDANCE_REQUEST]: 3,
      [this.responseTypes.PRECEDENT_SEARCH]: 3,
      [this.responseTypes.CASE_CREATION]: 4,
      [this.responseTypes.ESCALATION_NEEDED]: 5
    };
    complexityScore += intentComplexity[intent] || 2;
    
    // Categorize complexity
    if (complexityScore <= 3) return 'simple';
    if (complexityScore <= 6) return 'moderate';
    return 'complex';
  }

  analyzeBusinessContext(message, entities) {
    const context = {
      hasDealDetails: false,
      hasFinancialInfo: false,
      hasTimeConstraints: false,
      hasCompetitiveElement: false,
      hasCustomerInfo: false
    };
    
    // Check for deal details
    if (entities.segment || entities.dealType || entities.region) {
      context.hasDealDetails = true;
    }
    
    // Check for financial information
    if (entities.percentage || entities.currency) {
      context.hasFinancialInfo = true;
    }
    
    // Check for time constraints
    if (entities.timeframe || entities.urgency) {
      context.hasTimeConstraints = true;
    }
    
    // Check for competitive elements
    if (message.toLowerCase().includes('competitor') || 
        message.toLowerCase().includes('competitive') ||
        message.toLowerCase().includes('threat')) {
      context.hasCompetitiveElement = true;
    }
    
    // Check for customer references
    if (message.toLowerCase().includes('customer') ||
        message.toLowerCase().includes('client') ||
        message.toLowerCase().includes('account')) {
      context.hasCustomerInfo = true;
    }
    
    return context;
  }

  calculateConfidence(intent, entities, businessContext) {
    let confidence = 0.5; // Base confidence
    
    // Intent clarity
    if (intent !== this.responseTypes.POLICY_LOOKUP) {
      confidence += 0.2; // Clear intent detected
    }
    
    // Entity presence
    const entityCount = Object.keys(entities).length;
    confidence += Math.min(entityCount * 0.1, 0.3);
    
    // Business context richness
    const contextFactors = Object.values(businessContext).filter(Boolean).length;
    confidence += Math.min(contextFactors * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  analyzeConversationContext(message, conversationContext) {
    if (!conversationContext || conversationContext.length === 0) {
      return { isFollowUp: false, contextAvailable: false };
    }
    
    const recentMessages = conversationContext.slice(-3); // Last 3 messages
    const hasReferences = message.toLowerCase().includes('that') || 
                         message.toLowerCase().includes('it') ||
                         message.toLowerCase().includes('this');
    
    return {
      isFollowUp: hasReferences,
      contextAvailable: true,
      recentTopics: this.extractTopicsFromHistory(recentMessages),
      conversationLength: conversationContext.length
    };
  }

  extractTopicsFromHistory(messages) {
    // Simple topic extraction from recent messages
    const topics = new Set();
    
    messages.forEach(msg => {
      if (msg.content) {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (['discount', 'approval', 'case', 'policy', 'pilot', 'competitive'].includes(word)) {
            topics.add(word);
          }
        });
      }
    });
    
    return Array.from(topics);
  }

  shouldSuggestCaseCreation(intent, entities, businessContext) {
    // Always suggest for explicit case creation intent
    if (intent === this.responseTypes.CASE_CREATION) return true;
    
    // Suggest for high discount percentages
    if (entities.percentage && entities.percentage.some(p => p > 25)) return true;
    
    // Suggest for competitive situations with financial impact
    if (businessContext.hasCompetitiveElement && businessContext.hasFinancialInfo) return true;
    
    // Suggest for urgent situations with deal details
    if (entities.urgency && entities.urgency.includes('critical') && businessContext.hasDealDetails) return true;
    
    // Suggest for escalation intent
    if (intent === this.responseTypes.ESCALATION_NEEDED) return true;
    
    return false;
  }

  determineResponseStrategy(analysis) {
    const { intent, complexity, confidence, businessContext } = analysis;
    
    let strategy = {
      primaryResponseType: intent,
      shouldSearchKnowledgeBase: true,
      shouldSearchCases: false,
      shouldProvideGuidance: false,
      shouldSuggestCaseCreation: analysis.suggestsCaseCreation,
      confidenceLevel: this.getConfidenceLevel(confidence),
      responseComplexity: complexity
    };
    
    // Adjust strategy based on intent
    switch (intent) {
      case this.responseTypes.SELF_SERVICE:
        strategy.shouldSearchKnowledgeBase = true;
        strategy.shouldProvideGuidance = false;
        break;
        
      case this.responseTypes.POLICY_LOOKUP:
        strategy.shouldSearchKnowledgeBase = true;
        strategy.shouldProvideGuidance = complexity === 'complex';
        break;
        
      case this.responseTypes.PRECEDENT_SEARCH:
        strategy.shouldSearchCases = true;
        strategy.shouldSearchKnowledgeBase = true;
        break;
        
      case this.responseTypes.CASE_CREATION:
        strategy.shouldSearchCases = true;
        strategy.shouldProvideGuidance = true;
        strategy.shouldSuggestCaseCreation = true;
        break;
        
      case this.responseTypes.GUIDANCE_REQUEST:
        strategy.shouldProvideGuidance = true;
        strategy.shouldSearchKnowledgeBase = true;
        break;
        
      case this.responseTypes.ESCALATION_NEEDED:
        strategy.shouldSuggestCaseCreation = true;
        strategy.shouldProvideGuidance = true;
        strategy.responseComplexity = 'complex';
        break;
    }
    
    // Adjust based on business context
    if (businessContext.hasCompetitiveElement) {
      strategy.shouldSearchCases = true;
      strategy.shouldSuggestCaseCreation = true;
    }
    
    if (businessContext.hasTimeConstraints) {
      strategy.shouldProvideGuidance = true;
    }
    
    return strategy;
  }

  getConfidenceLevel(confidence) {
    if (confidence >= this.confidenceThresholds.HIGH) return 'high';
    if (confidence >= this.confidenceThresholds.MEDIUM) return 'medium';
    return 'low';
  }

  identifyKnowledgeRequirements(analysis, strategy) {
    const requirements = {
      needsPolicyLookup: false,
      needsCaseSearch: false,
      needsGuidanceTemplates: false,
      searchTerms: [],
      searchFilters: {}
    };
    
    // Determine search needs
    if (strategy.shouldSearchKnowledgeBase) {
      requirements.needsPolicyLookup = true;
    }
    
    if (strategy.shouldSearchCases) {
      requirements.needsCaseSearch = true;
    }
    
    if (strategy.shouldProvideGuidance) {
      requirements.needsGuidanceTemplates = true;
    }
    
    // Build search terms
    requirements.searchTerms = this.buildSearchTerms(analysis);
    
    // Build search filters
    requirements.searchFilters = this.buildSearchFilters(analysis.entities);
    
    return requirements;
  }

  buildSearchTerms(analysis) {
    const terms = [];
    
    // Add intent-based terms
    switch (analysis.intent) {
      case this.responseTypes.SELF_SERVICE:
      case this.responseTypes.POLICY_LOOKUP:
        terms.push('policy', 'discount', 'approval', 'limit');
        break;
      case this.responseTypes.CASE_CREATION:
        terms.push('case', 'exception', 'approval', 'request');
        break;
      case this.responseTypes.PRECEDENT_SEARCH:
        terms.push('similar', 'precedent', 'case', 'example');
        break;
      case this.responseTypes.GUIDANCE_REQUEST:
        terms.push('guidance', 'best practice', 'how to');
        break;
    }
    
    // Add entity-based terms
    if (analysis.entities.segment) {
      terms.push(...analysis.entities.segment);
    }
    if (analysis.entities.dealType) {
      terms.push(...analysis.entities.dealType);
    }
    
    return [...new Set(terms)]; // Remove duplicates
  }

  buildSearchFilters(entities) {
    const filters = {};
    
    if (entities.segment && entities.segment.length > 0) {
      filters.segment = entities.segment[0];
    }
    
    if (entities.dealType && entities.dealType.length > 0) {
      filters.dealType = entities.dealType[0];
    }
    
    if (entities.region && entities.region.length > 0) {
      filters.region = entities.region[0];
    }
    
    if (entities.currency && entities.currency.length > 0) {
      filters.dealValueRange = [0, Math.max(...entities.currency) * 2]; // Range up to 2x mentioned amount
    }
    
    return filters;
  }

  // Utility function to format processing results for logging/debugging
  formatProcessingResults(results) {
    return {
      summary: {
        intent: results.analysis.intent,
        confidence: results.analysis.confidence,
        complexity: results.analysis.complexity,
        suggestsCaseCreation: results.analysis.suggestsCaseCreation
      },
      entities: results.analysis.entities,
      strategy: results.responseStrategy,
      timestamp: results.processingMetadata.timestamp
    };
  }
}

// Create singleton instance
const messageProcessor = new MessageProcessor();

export default messageProcessor;
