// Vector Search Simulation for Red Phone Agent
// Simulates semantic search capabilities using keyword matching and contextual relevance

import rulesOfEngagement from '../data/rulesOfEngagement.js';
import historicalCases from '../data/historicalCases.js';
import caseCreationGuidelines from '../data/caseCreationGuidelines.js';

class VectorSearchSimulation {
  constructor() {
    this.documents = this.prepareDocuments();
    this.semanticMappings = this.buildSemanticMappings();
    this.contextualPatterns = this.buildContextualPatterns();
  }

  // Prepare documents for vector simulation
  prepareDocuments() {
    const documents = [];

    // Convert ROE sections to searchable documents
    Object.entries(rulesOfEngagement).forEach(([section, content]) => {
      if (typeof content === 'object' && content !== null) {
        documents.push({
          id: `roe_${section}`,
          type: 'roe',
          section,
          title: this.formatSectionTitle(section),
          content: JSON.stringify(content),
          searchableText: this.extractSearchableText(content),
          metadata: {
            source: 'Rules of Engagement',
            category: section,
            importance: this.getSectionImportance(section)
          }
        });
      }
    });

    // Convert historical cases to documents
    historicalCases.forEach(case_ => {
      documents.push({
        id: `case_${case_.id}`,
        type: 'case',
        title: case_.title,
        content: case_.description,
        searchableText: `${case_.title} ${case_.description} ${case_.category} ${case_.subcategory} ${case_.tags.join(' ')} ${case_.resolution} ${case_.precedent}`,
        metadata: {
          source: 'Historical Cases',
          category: case_.category,
          dealType: case_.dealType,
          segment: case_.segment,
          region: case_.region,
          outcome: case_.outcome,
          dealValue: case_.dealValue,
          importance: this.getCaseImportance(case_)
        }
      });
    });

    // Convert guidelines to documents
    Object.entries(caseCreationGuidelines.caseCategories).forEach(([key, category]) => {
      documents.push({
        id: `guideline_${key}`,
        type: 'guideline',
        title: category.name,
        content: category.description,
        searchableText: `${category.name} ${category.description} ${category.subcategories.map(s => s.name).join(' ')}`,
        metadata: {
          source: 'Case Creation Guidelines',
          category: key,
          priority: category.priority,
          importance: 0.8
        }
      });
    });

    return documents;
  }

  formatSectionTitle(section) {
    return section
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  extractSearchableText(obj) {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number') return obj.toString();
    if (Array.isArray(obj)) return obj.map(item => this.extractSearchableText(item)).join(' ');
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).map(value => this.extractSearchableText(value)).join(' ');
    }
    return '';
  }

  getSectionImportance(section) {
    const importanceMap = {
      'discountPolicies': 1.0,
      'dealTypes': 0.9,
      'approvalWorkflow': 0.95,
      'pilotPrograms': 0.8,
      'territoryRules': 0.7,
      'competitive': 0.85,
      'compliance': 0.8
    };
    return importanceMap[section] || 0.6;
  }

  getCaseImportance(case_) {
    let importance = 0.7;
    
    // Recent cases are more important
    if (case_.createdDate && new Date(case_.createdDate) > new Date('2024-01-01')) {
      importance += 0.1;
    }
    
    // Successful outcomes are more important
    if (case_.outcome.includes('Won') || case_.outcome.includes('Retained')) {
      importance += 0.1;
    }
    
    // High-value deals are more important
    if (case_.dealValue > 100000) {
      importance += 0.1;
    }
    
    return Math.min(importance, 1.0);
  }

  // Build semantic mappings for better matching
  buildSemanticMappings() {
    return {
      // Synonyms and related terms
      synonyms: {
        'discount': ['price reduction', 'pricing', 'rebate', 'allowance', 'concession'],
        'approval': ['authorization', 'permission', 'sign-off', 'clearance', 'consent'],
        'pilot': ['trial', 'test', 'evaluation', 'proof of concept', 'poc'],
        'competitor': ['rival', 'competition', 'alternative', 'vendor'],
        'customer': ['client', 'account', 'buyer', 'prospect'],
        'deal': ['opportunity', 'sale', 'contract', 'agreement'],
        'renewal': ['extension', 'continuation', 'refresh'],
        'enterprise': ['large company', 'corporation', 'big business'],
        'smb': ['small business', 'small company', 'startup'],
        'quota': ['target', 'goal', 'objective'],
        'commission': ['incentive', 'bonus', 'compensation'],
        'territory': ['region', 'area', 'geography', 'market'],
        'escalation': ['escalate', 'urgent', 'critical', 'emergency']
      },
      
      // Contextual relationships
      contextual: {
        'pricing': ['discount', 'cost', 'price', 'budget', 'financial'],
        'approval': ['manager', 'director', 'vp', 'authorization', 'workflow'],
        'competitive': ['threat', 'battle', 'win', 'lose', 'displacement'],
        'technical': ['integration', 'api', 'security', 'compliance', 'custom'],
        'legal': ['contract', 'terms', 'agreement', 'compliance', 'review'],
        'sales': ['rep', 'quota', 'pipeline', 'forecast', 'close']
      },
      
      // Intent patterns
      intents: {
        'policy_question': ['what is', 'what are', 'can i', 'do i need', 'is it allowed'],
        'case_creation': ['create case', 'submit request', 'need approval', 'exception'],
        'precedent_search': ['similar case', 'has this happened', 'precedent', 'example'],
        'guidance_request': ['how to', 'what should', 'best practice', 'recommend'],
        'approval_status': ['who approves', 'approval required', 'sign off needed']
      }
    };
  }

  // Build contextual patterns for semantic understanding
  buildContextualPatterns() {
    return {
      dealContext: {
        patterns: [
          { keywords: ['new business', 'new logo', 'first time'], context: 'new_business' },
          { keywords: ['renewal', 'existing customer', 'extension'], context: 'renewal' },
          { keywords: ['add-on', 'additional seats', 'expansion'], context: 'addon' },
          { keywords: ['upsell', 'upgrade', 'tier'], context: 'upsell' }
        ]
      },
      
      segmentContext: {
        patterns: [
          { keywords: ['enterprise', 'large company', 'corporation'], context: 'enterprise' },
          { keywords: ['midmarket', 'mid-market', 'medium business'], context: 'midmarket' },
          { keywords: ['smb', 'small business', 'startup'], context: 'smb' },
          { keywords: ['global', 'fortune', 'multinational'], context: 'globalAccounts' }
        ]
      },
      
      urgencyContext: {
        patterns: [
          { keywords: ['urgent', 'asap', 'immediately', 'emergency'], context: 'critical' },
          { keywords: ['soon', 'this week', 'quickly'], context: 'high' },
          { keywords: ['normal', 'standard', 'regular'], context: 'medium' },
          { keywords: ['whenever', 'no rush', 'flexible'], context: 'low' }
        ]
      },
      
      regionContext: {
        patterns: [
          { keywords: ['us', 'usa', 'america', 'north america'], context: 'namer' },
          { keywords: ['europe', 'eu', 'emea', 'european'], context: 'emea' },
          { keywords: ['asia', 'apac', 'japan', 'singapore'], context: 'apac' },
          { keywords: ['latin america', 'brazil', 'mexico'], context: 'latam' }
        ]
      }
    };
  }

  // Main vector search simulation function
  semanticSearch(query, options = {}) {
    const {
      limit = 10,
      threshold = 0.3,
      includeMetadata = true,
      focusArea = null // 'roe', 'cases', 'guidelines'
    } = options;

    // Parse query and extract context
    const queryAnalysis = this.analyzeQuery(query);
    
    // Filter documents based on focus area
    let searchDocuments = this.documents;
    if (focusArea) {
      searchDocuments = this.documents.filter(doc => doc.type === focusArea);
    }

    // Calculate semantic similarity for each document
    const results = searchDocuments.map(doc => {
      const similarity = this.calculateSemanticSimilarity(queryAnalysis, doc);
      return {
        document: doc,
        similarity,
        matchReasons: this.getMatchReasons(queryAnalysis, doc, similarity)
      };
    })
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    return {
      query: query,
      queryAnalysis,
      results: results.map(result => ({
        ...result.document,
        similarity: result.similarity,
        matchReasons: result.matchReasons,
        ...(includeMetadata ? { metadata: result.document.metadata } : {})
      })),
      totalResults: results.length,
      searchStats: this.getSearchStats(queryAnalysis, results)
    };
  }

  analyzeQuery(query) {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    return {
      originalQuery: query,
      words,
      synonyms: this.expandWithSynonyms(words),
      intent: this.detectIntent(queryLower),
      context: {
        dealType: this.extractContext(queryLower, 'dealContext'),
        segment: this.extractContext(queryLower, 'segmentContext'),
        urgency: this.extractContext(queryLower, 'urgencyContext'),
        region: this.extractContext(queryLower, 'regionContext')
      },
      entities: this.extractEntities(queryLower)
    };
  }

  expandWithSynonyms(words) {
    const expanded = new Set(words);
    
    words.forEach(word => {
      if (this.semanticMappings.synonyms[word]) {
        this.semanticMappings.synonyms[word].forEach(synonym => {
          expanded.add(synonym.replace(/\s+/g, ' '));
        });
      }
    });
    
    return Array.from(expanded);
  }

  detectIntent(query) {
    for (const [intent, patterns] of Object.entries(this.semanticMappings.intents)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        return intent;
      }
    }
    return 'general_inquiry';
  }

  extractContext(query, contextType) {
    const patterns = this.contextualPatterns[contextType]?.patterns || [];
    
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => query.includes(keyword))) {
        return pattern.context;
      }
    }
    return null;
  }

  extractEntities(query) {
    const entities = {};
    
    // Extract percentages
    const percentMatch = query.match(/(\d+)%/);
    if (percentMatch) {
      entities.percentage = parseInt(percentMatch[1]);
    }
    
    // Extract dollar amounts
    const dollarMatch = query.match(/\$?([\d,]+)k?/);
    if (dollarMatch) {
      const amount = parseInt(dollarMatch[1].replace(/,/g, ''));
      entities.amount = dollarMatch[0].includes('k') ? amount * 1000 : amount;
    }
    
    // Extract time periods
    const timeMatch = query.match(/(\d+)\s*(day|week|month|year)s?/);
    if (timeMatch) {
      entities.timeValue = parseInt(timeMatch[1]);
      entities.timeUnit = timeMatch[2];
    }
    
    return entities;
  }

  calculateSemanticSimilarity(queryAnalysis, document) {
    let similarity = 0;
    
    // Base text similarity using expanded synonyms
    const textSimilarity = this.calculateTextSimilarity(queryAnalysis.synonyms, document.searchableText);
    similarity += textSimilarity * 0.4;
    
    // Context matching bonus
    const contextBonus = this.calculateContextBonus(queryAnalysis.context, document.metadata);
    similarity += contextBonus * 0.3;
    
    // Intent-based relevance
    const intentRelevance = this.calculateIntentRelevance(queryAnalysis.intent, document);
    similarity += intentRelevance * 0.2;
    
    // Document importance weight
    similarity += (document.metadata.importance || 0.5) * 0.1;
    
    return Math.min(similarity, 1.0);
  }

  calculateTextSimilarity(queryTerms, documentText) {
    const docWords = documentText.toLowerCase().split(/\s+/);
    const matches = queryTerms.filter(term => 
      docWords.some(word => word.includes(term) || term.includes(word))
    );
    
    return queryTerms.length > 0 ? matches.length / queryTerms.length : 0;
  }

  calculateContextBonus(queryContext, docMetadata) {
    let bonus = 0;
    
    if (queryContext.dealType && docMetadata.dealType === queryContext.dealType) {
      bonus += 0.3;
    }
    
    if (queryContext.segment && docMetadata.segment === queryContext.segment) {
      bonus += 0.3;
    }
    
    if (queryContext.region && docMetadata.region === queryContext.region) {
      bonus += 0.2;
    }
    
    if (queryContext.urgency && docMetadata.priority) {
      const urgencyMap = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
      if (docMetadata.priority === urgencyMap[queryContext.urgency]) {
        bonus += 0.2;
      }
    }
    
    return bonus;
  }

  calculateIntentRelevance(intent, document) {
    const intentRelevance = {
      'policy_question': {
        'roe': 0.9,
        'case': 0.3,
        'guideline': 0.6
      },
      'case_creation': {
        'roe': 0.4,
        'case': 0.7,
        'guideline': 0.9
      },
      'precedent_search': {
        'roe': 0.2,
        'case': 0.9,
        'guideline': 0.3
      },
      'guidance_request': {
        'roe': 0.6,
        'case': 0.5,
        'guideline': 0.9
      }
    };
    
    return intentRelevance[intent]?.[document.type] || 0.5;
  }

  getMatchReasons(queryAnalysis, document, similarity) {
    const reasons = [];
    
    if (similarity > 0.8) {
      reasons.push('High relevance match');
    }
    
    if (queryAnalysis.context.dealType && document.metadata.dealType === queryAnalysis.context.dealType) {
      reasons.push(`Matches deal type: ${queryAnalysis.context.dealType}`);
    }
    
    if (queryAnalysis.context.segment && document.metadata.segment === queryAnalysis.context.segment) {
      reasons.push(`Matches segment: ${queryAnalysis.context.segment}`);
    }
    
    if (queryAnalysis.intent !== 'general_inquiry') {
      reasons.push(`Relevant to: ${queryAnalysis.intent.replace('_', ' ')}`);
    }
    
    if (document.metadata.importance > 0.8) {
      reasons.push('High importance document');
    }
    
    return reasons;
  }

  getSearchStats(queryAnalysis, results) {
    return {
      queryComplexity: queryAnalysis.words.length,
      intentDetected: queryAnalysis.intent,
      contextExtracted: Object.values(queryAnalysis.context).filter(Boolean).length,
      averageSimilarity: results.length > 0 ? 
        (results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(3) : 0,
      sourceDistribution: this.getSourceDistribution(results)
    };
  }

  getSourceDistribution(results) {
    const distribution = { roe: 0, case: 0, guideline: 0 };
    results.forEach(result => {
      distribution[result.document.type]++;
    });
    return distribution;
  }

  // Convenience methods for specific search types
  searchPolicies(query, options = {}) {
    return this.semanticSearch(query, { ...options, focusArea: 'roe' });
  }

  searchCases(query, options = {}) {
    return this.semanticSearch(query, { ...options, focusArea: 'cases' });
  }

  searchGuidelines(query, options = {}) {
    return this.semanticSearch(query, { ...options, focusArea: 'guidelines' });
  }

  // Advanced search with filters
  advancedSearch(query, filters = {}) {
    const results = this.semanticSearch(query, { limit: 50 });
    
    // Apply post-search filters
    let filteredResults = results.results;
    
    if (filters.dealValue) {
      const [min, max] = filters.dealValue;
      filteredResults = filteredResults.filter(doc => 
        !doc.metadata.dealValue || (doc.metadata.dealValue >= min && doc.metadata.dealValue <= max)
      );
    }
    
    if (filters.outcome) {
      filteredResults = filteredResults.filter(doc => 
        !doc.metadata.outcome || doc.metadata.outcome.toLowerCase().includes(filters.outcome.toLowerCase())
      );
    }
    
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      filteredResults = filteredResults.filter(doc => {
        if (!doc.createdDate) return true;
        const docDate = new Date(doc.createdDate);
        return docDate >= new Date(startDate) && docDate <= new Date(endDate);
      });
    }
    
    return {
      ...results,
      results: filteredResults.slice(0, filters.limit || 10),
      totalResults: filteredResults.length,
      filtersApplied: Object.keys(filters).length
    };
  }
}

// Create singleton instance
const vectorSearch = new VectorSearchSimulation();

export default vectorSearch;
