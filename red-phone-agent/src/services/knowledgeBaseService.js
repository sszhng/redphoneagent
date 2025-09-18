// Knowledge Base Service for Red Phone Agent
// Comprehensive search and retrieval service for ROE, cases, and guidelines

import rulesOfEngagement, { getRulesByDealType, getDiscountPolicy, getApprovalRequirement } from '../data/rulesOfEngagement.js';
import historicalCases, { searchCases, getCasesByCategory, getSimilarCases, getCaseMetrics } from '../data/historicalCases.js';
import caseCreationGuidelines, { getCategoryGuidelines, getRequiredFields, getRoutingInfo, getTemplate, validateCase } from '../data/caseCreationGuidelines.js';

class KnowledgeBaseService {
  constructor() {
    this.roe = rulesOfEngagement;
    this.cases = historicalCases;
    this.guidelines = caseCreationGuidelines;
    this.searchIndex = this.buildSearchIndex();
  }

  // Build search index for efficient text searching
  buildSearchIndex() {
    const index = {};
    
    // Index ROE content
    this.indexContent('roe', 'discount-policies', JSON.stringify(this.roe.discountPolicies), index);
    this.indexContent('roe', 'deal-types', JSON.stringify(this.roe.dealTypes), index);
    this.indexContent('roe', 'approval-workflow', JSON.stringify(this.roe.approvalWorkflow), index);
    this.indexContent('roe', 'pilot-programs', JSON.stringify(this.roe.pilotPrograms), index);
    this.indexContent('roe', 'territory-rules', JSON.stringify(this.roe.territoryRules), index);
    this.indexContent('roe', 'competitive', JSON.stringify(this.roe.competitive), index);
    this.indexContent('roe', 'compliance', JSON.stringify(this.roe.compliance), index);
    
    // Index historical cases
    this.cases.forEach(case_ => {
      const searchText = `${case_.title} ${case_.description} ${case_.tags.join(' ')} ${case_.category} ${case_.subcategory}`;
      this.indexContent('cases', case_.id, searchText, index);
    });
    
    // Index case creation guidelines
    Object.entries(this.guidelines.caseCategories).forEach(([key, category]) => {
      const searchText = `${category.name} ${category.description} ${category.subcategories.map(s => s.name).join(' ')}`;
      this.indexContent('guidelines', `category-${key}`, searchText, index);
    });
    
    return index;
  }

  indexContent(source, id, content, index) {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    words.forEach(word => {
      if (!index[word]) index[word] = [];
      index[word].push({ source, id, relevance: 1 });
    });
  }

  // Main search function
  search(query, filters = {}) {
    const results = {
      roe: [],
      cases: [],
      guidelines: [],
      summary: {}
    };

    if (!query) return results;

    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const matchedItems = new Map();

    // Score matches based on term frequency
    searchTerms.forEach(term => {
      if (this.searchIndex[term]) {
        this.searchIndex[term].forEach(item => {
          const key = `${item.source}-${item.id}`;
          matchedItems.set(key, (matchedItems.get(key) || 0) + item.relevance);
        });
      }
    });

    // Process results by source
    Array.from(matchedItems.entries())
      .sort(([,a], [,b]) => b - a) // Sort by relevance score
      .forEach(([key, score]) => {
        const [source, id] = key.split('-');
        
        if (source === 'roe') {
          results.roe.push(this.getROEContent(id, score));
        } else if (source === 'cases') {
          const case_ = this.cases.find(c => c.id === id);
          if (case_ && this.matchesFilters(case_, filters)) {
            results.cases.push({ ...case_, relevanceScore: score });
          }
        } else if (source === 'guidelines') {
          results.guidelines.push(this.getGuidelineContent(id, score));
        }
      });

    // Limit results and add summary
    results.roe = results.roe.slice(0, 5);
    results.cases = results.cases.slice(0, 10);
    results.guidelines = results.guidelines.slice(0, 5);
    results.summary = this.generateSearchSummary(results, query);

    return results;
  }

  getROEContent(contentType, score) {
    const content = {};
    
    switch(contentType) {
      case 'discount-policies':
        content.type = 'Discount Policies';
        content.data = this.roe.discountPolicies;
        content.description = 'Discount limits and approval thresholds by deal type and segment';
        break;
      case 'deal-types':
        content.type = 'Deal Types';
        content.data = this.roe.dealTypes;
        content.description = 'Definitions and requirements for different deal types';
        break;
      case 'approval-workflow':
        content.type = 'Approval Workflows';
        content.data = this.roe.approvalWorkflow;
        content.description = 'Required approvals based on discount percentage and deal size';
        break;
      case 'pilot-programs':
        content.type = 'Pilot Programs';
        content.data = this.roe.pilotPrograms;
        content.description = 'Pilot program durations, requirements, and approval processes';
        break;
      default:
        content.type = 'General ROE';
        content.data = {};
        content.description = 'Rules of engagement information';
    }
    
    content.relevanceScore = score;
    return content;
  }

  getGuidelineContent(contentType, score) {
    if (contentType.startsWith('category-')) {
      const categoryKey = contentType.replace('category-', '');
      const category = this.guidelines.caseCategories[categoryKey];
      
      return {
        type: 'Case Category Guidelines',
        category: categoryKey,
        data: category,
        description: `Guidelines for ${category?.name || 'case creation'}`,
        relevanceScore: score
      };
    }
    
    return {
      type: 'General Guidelines',
      data: {},
      description: 'Case creation guidelines',
      relevanceScore: score
    };
  }

  matchesFilters(case_, filters) {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;
      return case_[key] === value;
    });
  }

  generateSearchSummary(results, query) {
    return {
      query,
      totalResults: results.roe.length + results.cases.length + results.guidelines.length,
      roeMatches: results.roe.length,
      caseMatches: results.cases.length,
      guidelineMatches: results.guidelines.length,
      hasResults: results.roe.length > 0 || results.cases.length > 0 || results.guidelines.length > 0
    };
  }

  // Specific query functions
  getPolicyInformation(dealType, segment, region = 'namer') {
    const dealInfo = getRulesByDealType(dealType);
    const discountInfo = getDiscountPolicy(dealType, segment, region);
    
    return {
      dealType: dealInfo,
      discountPolicy: discountInfo,
      minimumCommitment: dealInfo?.minimumCommitment?.[segment],
      approvalRequired: dealInfo?.approvalRequired
    };
  }

  getApprovalRequirements(discountPercent, dealSize) {
    return getApprovalRequirement(discountPercent, dealSize);
  }

  findSimilarCases(dealValue, dealType, segment, region) {
    return getSimilarCases(dealValue, dealType, segment, region);
  }

  getCaseGuidance(category) {
    const categoryInfo = getCategoryGuidelines(category);
    const requiredFields = getRequiredFields(category);
    const template = getTemplate(category === 'pricing' ? 'discountRequest' : 
                                 category === 'pilotPrograms' ? 'pilotExtension' :
                                 category === 'competitive' ? 'competitiveThreat' :
                                 category === 'technical' ? 'customIntegration' : null);
    
    return {
      category: categoryInfo,
      requiredFields,
      template,
      routing: this.guidelines.routingLogic.specialRouting[category]
    };
  }

  getRoutingRecommendation(category, subcategory, dealValue = 0, discountPercent = 0) {
    return getRoutingInfo(category, subcategory, dealValue, discountPercent);
  }

  // Answer specific questions
  answerPolicyQuestion(question) {
    const questionLower = question.toLowerCase();
    
    // Discount-related questions
    if (questionLower.includes('discount')) {
      if (questionLower.includes('enterprise')) {
        return this.formatDiscountAnswer('enterprise', questionLower);
      } else if (questionLower.includes('midmarket')) {
        return this.formatDiscountAnswer('midmarket', questionLower);
      } else if (questionLower.includes('smb')) {
        return this.formatDiscountAnswer('smb', questionLower);
      }
    }
    
    // Minimum seat questions
    if (questionLower.includes('minimum') && questionLower.includes('seat')) {
      return this.formatMinimumSeatAnswer(questionLower);
    }
    
    // Approval questions
    if (questionLower.includes('approval') || questionLower.includes('approve')) {
      return this.formatApprovalAnswer(questionLower);
    }
    
    // Pilot questions
    if (questionLower.includes('pilot')) {
      return this.formatPilotAnswer(questionLower);
    }
    
    return null;
  }

  formatDiscountAnswer(segment, question) {
    const newBusiness = this.roe.discountPolicies.standard.newBusiness[segment];
    const renewal = this.roe.discountPolicies.standard.renewal[segment];
    
    if (question.includes('renewal')) {
      return {
        answer: `For ${segment} renewals: Maximum ${renewal.max}%, typical ${renewal.typical}%, auto-approved up to ${renewal.autoApproved}%`,
        source: 'ROE Discount Policies',
        details: renewal
      };
    } else {
      return {
        answer: `For ${segment} new business: Maximum ${newBusiness.max}%, typical ${newBusiness.typical}%, auto-approved up to ${newBusiness.autoApproved}%`,
        source: 'ROE Discount Policies',
        details: newBusiness
      };
    }
  }

  formatMinimumSeatAnswer(question) {
    const minimums = {
      enterprise: this.roe.dealTypes.newBusiness.minimumCommitment.enterprise.seats,
      midmarket: this.roe.dealTypes.newBusiness.minimumCommitment.midmarket.seats,
      smb: this.roe.dealTypes.newBusiness.minimumCommitment.smb.seats,
      largeEnterprise: this.roe.dealTypes.newBusiness.minimumCommitment.largeEnterprise.seats,
      globalAccounts: this.roe.dealTypes.newBusiness.minimumCommitment.globalAccounts.seats
    };
    
    return {
      answer: `Minimum seat requirements for new business: SMB: ${minimums.smb}, Midmarket: ${minimums.midmarket}, Enterprise: ${minimums.enterprise}, Large Enterprise: ${minimums.largeEnterprise}, Global Accounts: ${minimums.globalAccounts}`,
      source: 'ROE Deal Types',
      details: minimums,
      note: 'Add-on deals have no minimum seat requirements'
    };
  }

  formatApprovalAnswer(question) {
    const approvals = this.roe.approvalWorkflow.discountApproval;
    
    return {
      answer: 'Discount approval requirements: 0-10% (Auto-approved), 11-20% (Sales Manager), 21-30% (Regional Director), 31%+ (VP Sales + Finance)',
      source: 'ROE Approval Workflow',
      details: approvals,
      timeframes: {
        'Sales Manager': '24 hours',
        'Regional Director': '48 hours',
        'VP Sales + Finance': '72 hours'
      }
    };
  }

  formatPilotAnswer(question) {
    const pilots = this.roe.pilotPrograms;
    
    if (question.includes('extend') || question.includes('extension')) {
      return {
        answer: 'Extended pilots (6+ months) require VP Sales + CEO approval and are reserved for strategic accounts only. Standard pilots: 30 days (SMB), 60 days (Enterprise), 90 days (Large Enterprise)',
        source: 'ROE Pilot Programs',
        details: pilots
      };
    } else {
      return {
        answer: 'Standard pilot durations: 30 days (Standard), 60 days (Enterprise), 90 days (Large Enterprise). All require respective approvals.',
        source: 'ROE Pilot Programs',
        details: pilots
      };
    }
  }

  // Case analysis
  analyzeCaseRequirements(caseData) {
    const validation = validateCase(caseData);
    const routing = this.getRoutingRecommendation(
      caseData.category, 
      caseData.subcategory, 
      caseData.dealValue, 
      caseData.requestedDiscount
    );
    const similarCases = this.findSimilarCases(
      caseData.dealValue, 
      caseData.dealType, 
      caseData.segment, 
      caseData.region
    );
    
    return {
      validation,
      routing,
      similarCases: similarCases.slice(0, 3), // Top 3 similar cases
      recommendations: this.generateCaseRecommendations(caseData, similarCases)
    };
  }

  generateCaseRecommendations(caseData, similarCases) {
    const recommendations = [];
    
    // Success rate analysis
    const successfulCases = similarCases.filter(c => c.outcome.includes('Won') || c.outcome.includes('Retained'));
    const successRate = similarCases.length > 0 ? (successfulCases.length / similarCases.length) * 100 : 0;
    
    if (successRate > 70) {
      recommendations.push(`High success rate (${successRate.toFixed(0)}%) for similar cases`);
    } else if (successRate < 50) {
      recommendations.push(`Lower success rate (${successRate.toFixed(0)}%) for similar cases - consider strengthening justification`);
    }
    
    // Common success factors
    if (successfulCases.length > 0) {
      const commonFactors = this.findCommonSuccessFactors(successfulCases);
      recommendations.push(...commonFactors);
    }
    
    return recommendations;
  }

  findCommonSuccessFactors(cases) {
    const factors = [];
    const allFactors = cases.flatMap(c => c.keyFactors || []);
    
    // Count factor frequency
    const factorCounts = {};
    allFactors.forEach(factor => {
      const key = factor.toLowerCase();
      factorCounts[key] = (factorCounts[key] || 0) + 1;
    });
    
    // Identify common factors (appearing in 50%+ of cases)
    const threshold = Math.ceil(cases.length * 0.5);
    Object.entries(factorCounts)
      .filter(([factor, count]) => count >= threshold)
      .forEach(([factor]) => {
        factors.push(`Consider emphasizing: ${factor}`);
      });
    
    return factors.slice(0, 3); // Top 3 recommendations
  }

  // Enhanced policy lookup for AI service
  async enhancedPolicyLookup(query, context = {}) {
    try {
      // Direct policy question handling
      const directAnswer = this.answerPolicyQuestion(query);
      if (directAnswer) {
        return {
          type: 'direct_answer',
          answer: directAnswer.answer,
          source: directAnswer.source,
          details: directAnswer.details,
          confidence: 0.9
        };
      }

      // Contextual policy lookup
      const contextualResults = await this.contextualPolicySearch(query, context);
      if (contextualResults.length > 0) {
        return {
          type: 'contextual_policy',
          results: contextualResults,
          confidence: 0.8
        };
      }

      // Fallback to general search
      const generalResults = this.search(query, { dealType: context.dealType, segment: context.segment });
      return {
        type: 'general_search',
        results: generalResults,
        confidence: 0.6
      };
    } catch (error) {
      console.error('Enhanced policy lookup error:', error);
      return {
        type: 'error',
        message: 'Unable to perform policy lookup',
        confidence: 0
      };
    }
  }

  async contextualPolicySearch(query, context) {
    const results = [];
    
    // Search based on extracted context
    if (context.dealType && context.segment) {
      const policyInfo = this.getPolicyInformation(context.dealType, context.segment, context.region);
      if (policyInfo) {
        results.push({
          type: 'policy_match',
          category: 'Deal Policy',
          data: policyInfo,
          relevance: 0.9
        });
      }
    }

    // Search for approval requirements if discount mentioned
    if (context.discountPercent && context.dealValue) {
      const approvalInfo = this.getApprovalRequirements(context.discountPercent, context.dealValue);
      if (approvalInfo) {
        results.push({
          type: 'approval_requirements',
          category: 'Approval Workflow',
          data: approvalInfo,
          relevance: 0.9
        });
      }
    }

    // Search for similar cases
    if (context.dealValue || context.dealType) {
      const similarCases = this.findSimilarCases(
        context.dealValue || 50000,
        context.dealType || 'newBusiness',
        context.segment || 'enterprise',
        context.region || 'namer'
      );
      if (similarCases.length > 0) {
        results.push({
          type: 'similar_cases',
          category: 'Historical Precedents',
          data: similarCases.slice(0, 3),
          relevance: 0.7
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // Policy-specific lookup functions
  lookupDiscountPolicy(dealType, segment, region = 'namer') {
    try {
      const policy = getDiscountPolicy(dealType, segment, region);
      if (!policy) {
        return {
          success: false,
          message: `No discount policy found for ${segment} ${dealType} in ${region}`
        };
      }

      return {
        success: true,
        policy: {
          segment,
          dealType,
          region,
          maxDiscount: policy.max,
          typicalDiscount: policy.typical,
          autoApprovedLimit: policy.autoApproved,
          regionalAdjustment: policy.regionalAdjustment || 0,
          effectiveMax: policy.effectiveMax || policy.max
        },
        guidance: this.generateDiscountGuidance(policy, dealType, segment)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error looking up discount policy',
        error: error.message
      };
    }
  }

  generateDiscountGuidance(policy, dealType, segment) {
    const guidance = [];
    
    guidance.push(`${segment} ${dealType} deals can receive up to ${policy.max}% discount`);
    
    if (policy.autoApproved > 0) {
      guidance.push(`Discounts up to ${policy.autoApproved}% are auto-approved`);
    }
    
    if (policy.typical < policy.max) {
      guidance.push(`Typical discount is ${policy.typical}%`);
    }
    
    if (policy.regionalAdjustment > 0) {
      guidance.push(`Regional adjustment adds ${policy.regionalAdjustment}% to limits`);
    }

    return guidance;
  }

  lookupApprovalRequirements(discountPercent, dealSize) {
    try {
      const requirements = getApprovalRequirement(discountPercent, dealSize);
      
      if (!requirements.discountApproval && !requirements.sizeApproval) {
        return {
          success: false,
          message: 'No specific approval requirements found'
        };
      }

      const result = {
        success: true,
        discountPercent,
        dealSize,
        requirements: {
          discount: requirements.discountApproval,
          dealSize: requirements.sizeApproval,
          highestLevel: requirements.highestLevel
        }
      };

      // Add guidance
      result.guidance = this.generateApprovalGuidance(requirements, discountPercent, dealSize);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Error looking up approval requirements',
        error: error.message
      };
    }
  }

  generateApprovalGuidance(requirements, discountPercent, dealSize) {
    const guidance = [];
    
    if (requirements.discountApproval) {
      guidance.push(`${discountPercent}% discount requires ${requirements.discountApproval.approver} approval`);
      guidance.push(`Expected timeframe: ${requirements.discountApproval.timeframe}`);
    }
    
    if (requirements.sizeApproval && requirements.sizeApproval.approver !== requirements.discountApproval?.approver) {
      guidance.push(`$${dealSize.toLocaleString()} deal size requires ${requirements.sizeApproval.approver} approval`);
    }
    
    if (Array.isArray(requirements.highestLevel)) {
      const approvers = requirements.highestLevel.map(r => r.approver).join(' and ');
      guidance.push(`This deal requires approval from both: ${approvers}`);
    }

    return guidance;
  }

  lookupMinimumRequirements(dealType, segment) {
    try {
      const dealInfo = getRulesByDealType(dealType);
      if (!dealInfo || !dealInfo.minimumCommitment) {
        return {
          success: false,
          message: `No minimum requirements found for ${dealType}`
        };
      }

      const requirements = dealInfo.minimumCommitment[segment];
      if (!requirements) {
        return {
          success: false,
          message: `No minimum requirements found for ${segment} ${dealType}`
        };
      }

      return {
        success: true,
        dealType,
        segment,
        requirements: {
          minimumSeats: requirements.seats,
          minimumValue: requirements.value
        },
        guidance: [
          `${segment} ${dealType} requires minimum ${requirements.seats} seats`,
          `Minimum deal value: $${requirements.value.toLocaleString()}`,
          dealType === 'addon' ? 'Note: Add-on deals have no minimum requirements' : ''
        ].filter(Boolean)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error looking up minimum requirements',
        error: error.message
      };
    }
  }

  lookupPilotPolicies(pilotType = 'standard') {
    try {
      const pilotInfo = this.roe.pilotPrograms[pilotType];
      if (!pilotInfo) {
        return {
          success: false,
          message: `No pilot policy found for type: ${pilotType}`
        };
      }

      const result = {
        success: true,
        pilotType,
        policy: pilotInfo,
        guidance: []
      };

      result.guidance.push(`${pilotType} pilot duration: ${pilotInfo.duration}`);
      
      if (pilotInfo.maxSeats) {
        result.guidance.push(`Maximum seats: ${pilotInfo.maxSeats}`);
      }
      
      if (pilotInfo.approvalRequired) {
        result.guidance.push(`Requires approval from: ${pilotInfo.approvalRequired}`);
      }
      
      if (pilotInfo.conversionTarget) {
        result.guidance.push(`Target conversion rate: ${pilotInfo.conversionTarget}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Error looking up pilot policies',
        error: error.message
      };
    }
  }

  // Quick lookup for common questions
  quickPolicyLookup(questionType, params = {}) {
    switch (questionType) {
      case 'discount_limit':
        return this.lookupDiscountPolicy(params.dealType, params.segment, params.region);
      
      case 'approval_required':
        return this.lookupApprovalRequirements(params.discountPercent, params.dealSize);
      
      case 'minimum_seats':
        return this.lookupMinimumRequirements(params.dealType, params.segment);
      
      case 'pilot_duration':
        return this.lookupPilotPolicies(params.pilotType);
      
      case 'competitive_discount':
        // Special handling for competitive situations
        const basePolicy = this.lookupDiscountPolicy(params.dealType, params.segment, params.region);
        if (basePolicy.success) {
          basePolicy.policy.competitiveBonus = 5; // Additional 5% for competitive situations
          basePolicy.policy.effectiveMax += 5;
          basePolicy.guidance.push('Competitive situations may qualify for additional 5% discount');
        }
        return basePolicy;
      
      default:
        return {
          success: false,
          message: `Unknown question type: ${questionType}`
        };
    }
  }

  // Comprehensive policy summary for a specific context
  generatePolicySummary(context) {
    const summary = {
      dealContext: context,
      applicablePolicies: [],
      recommendations: [],
      warnings: []
    };

    try {
      // Get discount policy
      if (context.dealType && context.segment) {
        const discountPolicy = this.lookupDiscountPolicy(context.dealType, context.segment, context.region);
        if (discountPolicy.success) {
          summary.applicablePolicies.push({
            type: 'discount',
            policy: discountPolicy.policy,
            guidance: discountPolicy.guidance
          });
        }
      }

      // Get minimum requirements
      if (context.dealType && context.segment && context.dealType !== 'addon') {
        const minimumReqs = this.lookupMinimumRequirements(context.dealType, context.segment);
        if (minimumReqs.success) {
          summary.applicablePolicies.push({
            type: 'minimums',
            policy: minimumReqs.requirements,
            guidance: minimumReqs.guidance
          });
        }
      }

      // Get approval requirements if discount specified
      if (context.discountPercent && context.dealValue) {
        const approvalReqs = this.lookupApprovalRequirements(context.discountPercent, context.dealValue);
        if (approvalReqs.success) {
          summary.applicablePolicies.push({
            type: 'approvals',
            policy: approvalReqs.requirements,
            guidance: approvalReqs.guidance
          });
        }
      }

      // Generate recommendations
      summary.recommendations = this.generateContextualRecommendations(context, summary.applicablePolicies);
      
      // Generate warnings
      summary.warnings = this.generateContextualWarnings(context, summary.applicablePolicies);

    } catch (error) {
      summary.error = error.message;
    }

    return summary;
  }

  generateContextualRecommendations(context, policies) {
    const recommendations = [];

    // Discount recommendations
    const discountPolicy = policies.find(p => p.type === 'discount');
    if (discountPolicy && context.discountPercent) {
      if (context.discountPercent <= discountPolicy.policy.autoApprovedLimit) {
        recommendations.push('This discount level is auto-approved - no additional approval needed');
      } else if (context.discountPercent <= discountPolicy.policy.maxDiscount) {
        recommendations.push('This discount requires approval but is within policy limits');
      } else {
        recommendations.push('This discount exceeds policy limits - consider creating an exception case');
      }
    }

    // Deal size recommendations
    if (context.dealValue) {
      if (context.dealValue > 250000) {
        recommendations.push('Large deal - ensure all stakeholders are identified and engaged');
      }
      if (context.dealValue > 500000) {
        recommendations.push('Enterprise deal - consider involving executive sponsor');
      }
    }

    // Competitive recommendations
    if (context.hasCompetitive) {
      recommendations.push('Competitive situation - document competitive advantages and customer preferences');
      recommendations.push('Consider expedited approval process for competitive deals');
    }

    return recommendations;
  }

  generateContextualWarnings(context, policies) {
    const warnings = [];

    // Discount warnings
    if (context.discountPercent > 30) {
      warnings.push('High discount percentage - ensure strong business justification');
    }

    // Minimum requirement warnings
    const minimumsPolicy = policies.find(p => p.type === 'minimums');
    if (minimumsPolicy && context.seats && context.seats < minimumsPolicy.policy.minimumSeats) {
      warnings.push(`Below minimum seat requirement (${minimumsPolicy.policy.minimumSeats} required)`);
    }

    // Timeline warnings
    if (context.urgency === 'critical') {
      warnings.push('Critical timeline - ensure all approvers are notified immediately');
    }

    return warnings;
  }

  // Knowledge base statistics
  getKnowledgeBaseStats() {
    return {
      totalCases: this.cases.length,
      caseMetrics: getCaseMetrics(),
      roeCategories: Object.keys(this.roe.dealTypes).length,
      guidelineCategories: Object.keys(this.guidelines.caseCategories).length,
      searchIndexSize: Object.keys(this.searchIndex).length
    };
  }
}

// Create singleton instance
const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService;
