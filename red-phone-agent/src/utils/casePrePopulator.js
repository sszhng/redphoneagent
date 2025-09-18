// Case Pre-Population Utility for Red Phone Agent
// Intelligently extracts and formats conversation context into case creation forms

import contextManager from './contextManager.js';
import { rulesOfEngagement } from '../data/rulesOfEngagement.js';

class CasePrePopulator {
  constructor() {
    this.entityMappings = {
      // Map conversation entities to form fields
      percentage: 'discountRequested',
      currency: 'dealValue',
      segment: 'customerInfo',
      dealType: 'description',
      region: 'description',
      timeframe: 'timeframe',
      urgency: 'priority'
    };

    this.priorityMappings = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };

    this.categoryMappings = {
      'pricing_question': 'pricing',
      'policy_lookup': 'pricing',
      'case_creation': 'general',
      'guidance_request': 'general',
      'precedent_search': 'pricing',
      'escalation_needed': 'customerSuccess'
    };
  }

  // Main pre-population function
  prePopulateCase(sessionId, analysisData = null) {
    try {
      // Get conversation context
      const conversationContext = contextManager.getContextForAI(sessionId);
      if (!conversationContext) {
        return this.getDefaultCaseData();
      }

      // Extract entities and context
      const entities = conversationContext.contextualEntities || {};
      const currentDeal = conversationContext.currentDeal || {};
      const userProfile = conversationContext.userProfile || {};
      const conversationHistory = conversationContext.conversationHistory || [];

      // Generate case data
      const caseData = {
        title: this.generateTitle(entities, currentDeal, analysisData),
        category: this.determineCategory(entities, analysisData, conversationHistory),
        priority: this.determinePriority(entities, currentDeal, analysisData),
        description: this.generateDescription(entities, currentDeal, conversationHistory),
        businessJustification: this.generateBusinessJustification(entities, currentDeal, analysisData),
        customerInfo: this.generateCustomerInfo(entities, currentDeal),
        dealValue: this.extractDealValue(entities, currentDeal),
        discountRequested: this.extractDiscountRequested(entities, currentDeal),
        timeframe: this.extractTimeframe(entities, currentDeal),
        competitorInfo: this.extractCompetitorInfo(conversationHistory, entities),
        // Additional metadata
        conversationSummary: this.generateConversationSummary(conversationHistory),
        userContext: this.formatUserContext(userProfile),
        extractedEntities: entities,
        confidence: this.calculateConfidence(entities, currentDeal, analysisData)
      };

      return {
        success: true,
        caseData,
        suggestions: this.generateSuggestions(caseData, entities, analysisData),
        warnings: this.generateWarnings(caseData, entities),
        metadata: {
          sessionId,
          extractedAt: new Date().toISOString(),
          sourceMessages: conversationHistory.length,
          confidence: caseData.confidence
        }
      };

    } catch (error) {
      console.error('Case pre-population error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getDefaultCaseData()
      };
    }
  }

  generateTitle(entities, currentDeal, analysisData) {
    // Construct intelligent title based on context
    const parts = [];

    // Add customer segment
    if (entities.segment || currentDeal.segment) {
      parts.push(entities.segment || currentDeal.segment);
    }

    // Add deal type
    if (entities.dealType || currentDeal.dealType) {
      parts.push(entities.dealType || currentDeal.dealType);
    }

    // Add specific request type
    if (entities.percentage && (entities.percentage > 0)) {
      parts.push(`${entities.percentage}% discount request`);
    } else if (analysisData?.intent === 'case_creation') {
      parts.push('approval request');
    } else if (analysisData?.intent === 'competitive_question') {
      parts.push('competitive situation');
    } else {
      parts.push('exception request');
    }

    // Fallback title
    if (parts.length === 0) {
      return 'Sales Exception Request';
    }

    return parts.join(' - ').replace(/([a-z])([A-Z])/g, '$1 $2'); // Add spaces to camelCase
  }

  determineCategory(entities, analysisData, conversationHistory) {
    // Use analysis data if available
    if (analysisData?.intent && this.categoryMappings[analysisData.intent]) {
      return this.categoryMappings[analysisData.intent];
    }

    // Check for pricing-related keywords
    const recentMessages = conversationHistory.slice(-3).map(m => m.content?.toLowerCase() || '').join(' ');
    
    if (entities.percentage || recentMessages.includes('discount') || recentMessages.includes('pricing')) {
      return 'pricing';
    }

    if (recentMessages.includes('pilot') || recentMessages.includes('trial')) {
      return 'pilotProgram';
    }

    if (recentMessages.includes('technical') || recentMessages.includes('integration') || recentMessages.includes('api')) {
      return 'technical';
    }

    if (recentMessages.includes('competitor') || recentMessages.includes('competitive')) {
      return 'competitive';
    }

    if (recentMessages.includes('legal') || recentMessages.includes('contract') || recentMessages.includes('terms')) {
      return 'legal';
    }

    if (recentMessages.includes('structure') || recentMessages.includes('payment') || recentMessages.includes('terms')) {
      return 'dealStructure';
    }

    if (recentMessages.includes('support') || recentMessages.includes('success') || recentMessages.includes('retention')) {
      return 'customerSuccess';
    }

    return 'general';
  }

  determinePriority(entities, currentDeal, analysisData) {
    let priorityScore = 1; // Start with low

    // Urgency indicators
    if (entities.urgency) {
      const urgencyLevel = Array.isArray(entities.urgency) ? entities.urgency[0] : entities.urgency;
      if (urgencyLevel === 'critical') return 'critical';
      if (urgencyLevel === 'high') priorityScore += 2;
      if (urgencyLevel === 'medium') priorityScore += 1;
    }

    // Deal size impact
    const dealValue = this.extractDealValue(entities, currentDeal);
    if (dealValue) {
      const value = parseFloat(dealValue);
      if (value > 500000) priorityScore += 2;
      else if (value > 100000) priorityScore += 1;
    }

    // Competitive situation
    if (analysisData?.businessContext?.hasCompetitiveElement) {
      priorityScore += 2;
    }

    // High discount percentage
    const discountPercent = this.extractDiscountRequested(entities, currentDeal);
    if (discountPercent && parseFloat(discountPercent) > 25) {
      priorityScore += 1;
    }

    // Map score to priority
    if (priorityScore >= 5) return 'critical';
    if (priorityScore >= 3) return 'high';
    if (priorityScore >= 2) return 'medium';
    return 'low';
  }

  generateDescription(entities, currentDeal, conversationHistory) {
    const parts = [];

    // Add customer context
    if (entities.segment || currentDeal.segment) {
      parts.push(`Customer Segment: ${entities.segment || currentDeal.segment}`);
    }

    if (entities.dealType || currentDeal.dealType) {
      parts.push(`Deal Type: ${entities.dealType || currentDeal.dealType}`);
    }

    if (entities.region || currentDeal.region) {
      parts.push(`Region: ${entities.region || currentDeal.region}`);
    }

    // Add deal details
    const dealValue = this.extractDealValue(entities, currentDeal);
    if (dealValue) {
      parts.push(`Deal Value: $${parseFloat(dealValue).toLocaleString()}`);
    }

    const discountPercent = this.extractDiscountRequested(entities, currentDeal);
    if (discountPercent) {
      parts.push(`Discount Requested: ${discountPercent}%`);
    }

    const timeframe = this.extractTimeframe(entities, currentDeal);
    if (timeframe) {
      parts.push(`Timeframe: ${timeframe}`);
    }

    // Add conversation context
    const recentContent = conversationHistory.slice(-2)
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    if (recentContent) {
      parts.push(`\nConversation Context:\n${recentContent}`);
    }

    return parts.join('\n') || 'Exception request based on conversation with Red Phone Agent.';
  }

  generateBusinessJustification(entities, currentDeal, analysisData) {
    const justifications = [];

    // Competitive justification
    if (analysisData?.businessContext?.hasCompetitiveElement) {
      justifications.push('Competitive situation requires urgent response to retain/win business.');
    }

    // Deal size justification
    const dealValue = this.extractDealValue(entities, currentDeal);
    if (dealValue && parseFloat(dealValue) > 100000) {
      justifications.push(`Significant deal size ($${parseFloat(dealValue).toLocaleString()}) justifies special consideration.`);
    }

    // Customer relationship justification
    if (entities.dealType === 'renewal' || currentDeal.dealType === 'renewal') {
      justifications.push('Existing customer relationship and retention value support this request.');
    }

    // Strategic account justification
    if (entities.segment === 'largeEnterprise' || entities.segment === 'globalAccounts') {
      justifications.push('Strategic account classification warrants flexible terms to secure partnership.');
    }

    // Pilot/trial justification
    if (currentDeal.dealType === 'newBusiness' && entities.segment) {
      justifications.push('New business opportunity with potential for long-term growth and expansion.');
    }

    // Time sensitivity justification
    if (entities.urgency && entities.urgency.includes('critical')) {
      justifications.push('Time-sensitive opportunity requiring expedited approval process.');
    }

    // Default justification if none found
    if (justifications.length === 0) {
      justifications.push('Request aligns with company revenue objectives and customer success initiatives.');
    }

    return justifications.join(' ');
  }

  generateCustomerInfo(entities, currentDeal) {
    const info = [];

    if (entities.segment || currentDeal.segment) {
      info.push(`Segment: ${entities.segment || currentDeal.segment}`);
    }

    if (entities.region || currentDeal.region) {
      info.push(`Region: ${entities.region || currentDeal.region}`);
    }

    if (currentDeal.dealType) {
      info.push(`Deal Type: ${currentDeal.dealType}`);
    }

    return info.join(' | ') || 'Customer details extracted from conversation context';
  }

  extractDealValue(entities, currentDeal) {
    // Try current deal first
    if (currentDeal.dealValue && currentDeal.dealValue > 0) {
      return currentDeal.dealValue.toString();
    }

    // Try entities
    if (entities.currency && entities.currency.length > 0) {
      return entities.currency[0].toString();
    }

    return '';
  }

  extractDiscountRequested(entities, currentDeal) {
    // Try current deal first
    if (currentDeal.discountPercent && currentDeal.discountPercent > 0) {
      return currentDeal.discountPercent.toString();
    }

    // Try entities
    if (entities.percentage && entities.percentage.length > 0) {
      return entities.percentage[0].toString();
    }

    return '';
  }

  extractTimeframe(entities, currentDeal) {
    // Try current deal first
    if (currentDeal.timeframe) {
      return currentDeal.timeframe;
    }

    // Try entities
    if (entities.timeframe && entities.timeframe.length > 0) {
      const timeframe = entities.timeframe[0];
      if (typeof timeframe === 'object') {
        return `${timeframe.value} ${timeframe.unit}${timeframe.value > 1 ? 's' : ''}`;
      }
      return timeframe.toString();
    }

    // Check urgency for implied timeframe
    if (entities.urgency) {
      const urgency = Array.isArray(entities.urgency) ? entities.urgency[0] : entities.urgency;
      if (urgency === 'critical') return 'Immediate';
      if (urgency === 'high') return 'Within 1 week';
      if (urgency === 'medium') return 'Within 2 weeks';
    }

    return '';
  }

  extractCompetitorInfo(conversationHistory, entities) {
    const recentMessages = conversationHistory.slice(-3).map(m => m.content || '').join(' ').toLowerCase();
    
    const competitors = ['datacorp', 'competitora', 'mediamax', 'analytics pro'];
    const foundCompetitors = competitors.filter(comp => recentMessages.includes(comp));
    
    if (foundCompetitors.length > 0) {
      return `Competitive situation involving: ${foundCompetitors.join(', ')}`;
    }

    if (recentMessages.includes('competitor') || recentMessages.includes('competitive')) {
      return 'Competitive situation mentioned in conversation';
    }

    return '';
  }

  generateConversationSummary(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'No conversation history available';
    }

    const userMessages = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => `• ${m.content}`)
      .join('\n');

    const aiMessages = conversationHistory
      .filter(m => m.role === 'assistant')
      .slice(-2)
      .map(m => `• ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}`)
      .join('\n');

    return `Recent User Requests:\n${userMessages}\n\nAgent Responses:\n${aiMessages}`;
  }

  formatUserContext(userProfile) {
    if (!userProfile) return 'No user profile available';

    const context = [];
    
    if (userProfile.experienceLevel) {
      context.push(`Experience Level: ${userProfile.experienceLevel}`);
    }

    if (userProfile.commonSegments && userProfile.commonSegments.length > 0) {
      context.push(`Common Segments: ${userProfile.commonSegments.join(', ')}`);
    }

    if (userProfile.commonDealTypes && userProfile.commonDealTypes.length > 0) {
      context.push(`Common Deal Types: ${userProfile.commonDealTypes.join(', ')}`);
    }

    if (userProfile.recentQueries && userProfile.recentQueries.length > 0) {
      context.push(`Recent Query Types: ${userProfile.recentQueries.slice(-3).join(', ')}`);
    }

    return context.join(' | ') || 'Standard user profile';
  }

  calculateConfidence(entities, currentDeal, analysisData) {
    let confidence = 0.5; // Base confidence

    // Entity presence boosts confidence
    const entityCount = Object.keys(entities).length;
    confidence += Math.min(entityCount * 0.1, 0.3);

    // Current deal context boosts confidence
    if (currentDeal && Object.keys(currentDeal).length > 0) {
      confidence += 0.2;
    }

    // Analysis data boosts confidence
    if (analysisData && analysisData.confidence) {
      confidence += analysisData.confidence * 0.2;
    }

    // Specific important entities
    if (entities.percentage && entities.percentage.length > 0) confidence += 0.1;
    if (entities.currency && entities.currency.length > 0) confidence += 0.1;
    if (entities.segment && entities.segment.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  generateSuggestions(caseData, entities, analysisData) {
    const suggestions = [];

    // Policy compliance suggestions
    if (caseData.category === 'pricing' && caseData.discountRequested) {
      const discountPercent = parseFloat(caseData.discountRequested);
      if (discountPercent > 30) {
        suggestions.push({
          type: 'policy',
          level: 'warning',
          message: 'Discount request exceeds typical policy limits',
          suggestion: 'Consider providing strong competitive justification'
        });
      }
    }

    // Missing information suggestions
    if (!caseData.dealValue) {
      suggestions.push({
        type: 'missing_info',
        level: 'info',
        message: 'Deal value not specified',
        suggestion: 'Add deal value for proper approval routing'
      });
    }

    if (!caseData.timeframe) {
      suggestions.push({
        type: 'missing_info',
        level: 'info',
        message: 'Timeframe not specified',
        suggestion: 'Include urgency and timeline for faster processing'
      });
    }

    // Competitive situation suggestions
    if (analysisData?.businessContext?.hasCompetitiveElement && !caseData.competitorInfo) {
      suggestions.push({
        type: 'competitive',
        level: 'warning',
        message: 'Competitive situation detected',
        suggestion: 'Add competitor details for context and urgency'
      });
    }

    return suggestions;
  }

  generateWarnings(caseData, entities) {
    const warnings = [];

    // High discount warning
    if (caseData.discountRequested && parseFloat(caseData.discountRequested) > 25) {
      warnings.push({
        type: 'high_discount',
        level: 'warning',
        message: 'High discount percentage may require executive approval'
      });
    }

    // Large deal warning
    if (caseData.dealValue && parseFloat(caseData.dealValue) > 500000) {
      warnings.push({
        type: 'large_deal',
        level: 'info',
        message: 'Large deal size may require additional approvals'
      });
    }

    // Missing critical info warning
    if (!caseData.businessJustification || caseData.businessJustification.length < 50) {
      warnings.push({
        type: 'insufficient_justification',
        level: 'warning',
        message: 'Business justification may need more detail'
      });
    }

    return warnings;
  }

  getDefaultCaseData() {
    return {
      title: 'Sales Exception Request',
      category: 'general',
      priority: 'medium',
      description: 'Request generated from Red Phone Agent conversation',
      businessJustification: 'Business justification needed for approval',
      customerInfo: '',
      dealValue: '',
      discountRequested: '',
      timeframe: '',
      competitorInfo: '',
      confidence: 0.3
    };
  }

  // Utility function for testing and validation
  validatePrePopulatedData(caseData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Required field validation
    if (!caseData.title || caseData.title.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('Title is required');
    }

    if (!caseData.description || caseData.description.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('Description is required');
    }

    if (!caseData.businessJustification || caseData.businessJustification.trim().length < 20) {
      validation.warnings.push('Business justification should be more detailed');
    }

    // Data type validation
    if (caseData.dealValue && isNaN(parseFloat(caseData.dealValue))) {
      validation.errors.push('Deal value must be a valid number');
      validation.isValid = false;
    }

    if (caseData.discountRequested && isNaN(parseFloat(caseData.discountRequested))) {
      validation.errors.push('Discount percentage must be a valid number');
      validation.isValid = false;
    }

    return validation;
  }
}

// Create singleton instance
const casePrePopulator = new CasePrePopulator();

export default casePrePopulator;
