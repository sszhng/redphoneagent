// AI Service for Red Phone Agent
// OpenAI integration with intelligent prompt engineering and response processing

import OpenAI from 'openai';
import knowledgeBaseService from './knowledgeBaseService.js';
import vectorSearch from '../utils/vectorSearchSimulation.js';

class AIService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.conversationHistory = [];
    this.systemPrompt = this.buildSystemPrompt();
    this.maxContextLength = parseInt(process.env.REACT_APP_MAX_CONVERSATION_LENGTH) || 50;
    this.apiTimeout = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;
  }

  // Initialize OpenAI client
  async initialize() {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.warn('OpenAI API key not configured. Running in mock mode.');
        this.isInitialized = true;
        return { success: true, mode: 'mock' };
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use backend proxy
      });

      // Test the connection
      await this.client.models.list();
      this.isInitialized = true;
      
      return { success: true, mode: 'live' };
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.isInitialized = true; // Fall back to mock mode
      return { success: false, error: error.message, mode: 'mock' };
    }
  }

  buildSystemPrompt() {
    return `You are the Red Phone Agent, an AI assistant helping sales representatives with policy questions, case creation, and troubleshooting for MediaFlow Solutions, a B2B SaaS media analytics company.

CORE CAPABILITIES:
- Answer questions about sales policies, discount limits, and approval requirements
- Help create properly formatted cases for exceptions and approvals
- Find relevant historical precedents and similar cases
- Provide guidance on deal structures, pilot programs, and competitive situations
- Route requests to appropriate approvers with proper justification

COMPANY CONTEXT:
- MediaFlow Solutions: B2B SaaS media analytics platform
- Segments: SMB, Midmarket, Enterprise, Large Enterprise, Global Accounts
- Regions: NAMER, LATAM, EMEA, APAC
- Deal Types: New Business, Renewal, Add-on, Upsell

KEY POLICIES TO REMEMBER:
- Discount Limits: SMB (10% max), Midmarket (15% max), Enterprise (20% max), Large Enterprise (25% max), Global (30% max)
- Approval Thresholds: 0-10% (Auto), 11-20% (Manager), 21-30% (Director), 31%+ (VP+Finance)
- Minimum Seats: SMB (5), Midmarket (25), Enterprise (100), Large Enterprise (500), Global (1000)
- Add-on deals have NO minimum requirements and standard 5% discount max
- Pilot Programs: Standard (30 days), Enterprise (60 days), Large Enterprise (90 days), Extended (6+ months requires VP approval)

RESPONSE STYLE:
- Be helpful, professional, and concise
- Provide specific policy details with exact numbers when available
- Reference similar cases when relevant
- Explain approval processes and timelines
- Offer to help create cases when needed
- Use bullet points for clarity when listing multiple items
- Always cite your source (ROE, Historical Cases, or Guidelines)

WHEN TO SUGGEST CASE CREATION:
- Requests exceed standard policy limits
- Custom terms or non-standard agreements needed
- Competitive situations requiring special approval
- Technical requirements outside standard offerings
- Customer escalations or satisfaction issues

If you don't have specific information, say so clearly and offer to help find it or create a case for clarification.`;
  }

  // Main chat processing function
  async processMessage(userMessage, context = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Add user message to conversation history
      this.addToHistory('user', userMessage);

      // Analyze the message to determine response strategy
      const messageAnalysis = await this.analyzeMessage(userMessage, context);
      
      // Search knowledge base for relevant information
      const knowledgeResults = await this.searchKnowledge(userMessage, messageAnalysis);
      
      // Generate response based on analysis and knowledge
      const response = await this.generateResponse(userMessage, messageAnalysis, knowledgeResults);
      
      // Add AI response to conversation history
      this.addToHistory('assistant', response.content);
      
      return {
        success: true,
        response: response.content,
        responseType: response.type,
        confidence: response.confidence,
        sources: response.sources,
        suggestedActions: response.suggestedActions,
        analysis: messageAnalysis
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        error: error.message,
        response: "I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question or contact your sales manager for immediate assistance."
      };
    }
  }

  async analyzeMessage(message, context) {
    const messageLower = message.toLowerCase();
    
    // Determine intent
    let intent = 'general_inquiry';
    if (messageLower.includes('discount') || messageLower.includes('price') || messageLower.includes('pricing')) {
      intent = 'pricing_question';
    } else if (messageLower.includes('case') || messageLower.includes('approval') || messageLower.includes('exception')) {
      intent = 'case_creation';
    } else if (messageLower.includes('pilot') || messageLower.includes('trial')) {
      intent = 'pilot_question';
    } else if (messageLower.includes('minimum') || messageLower.includes('seats') || messageLower.includes('requirement')) {
      intent = 'requirement_question';
    } else if (messageLower.includes('competitor') || messageLower.includes('competitive')) {
      intent = 'competitive_question';
    } else if (messageLower.includes('approval') || messageLower.includes('who approves')) {
      intent = 'approval_question';
    }

    // Extract entities
    const entities = this.extractEntities(message);
    
    // Determine response complexity needed
    const complexity = this.assessComplexity(message, intent);
    
    return {
      intent,
      entities,
      complexity,
      needsKnowledgeBase: complexity > 'simple',
      suggestsCaseCreation: this.shouldSuggestCase(message, intent, entities)
    };
  }

  extractEntities(message) {
    const entities = {};
    
    // Extract percentages
    const percentMatch = message.match(/(\d+)%/);
    if (percentMatch) entities.percentage = parseInt(percentMatch[1]);
    
    // Extract dollar amounts
    const dollarMatch = message.match(/\$?([\d,]+)k?/);
    if (dollarMatch) {
      const amount = parseInt(dollarMatch[1].replace(/,/g, ''));
      entities.amount = dollarMatch[0].includes('k') ? amount * 1000 : amount;
    }
    
    // Extract segments
    if (message.toLowerCase().includes('enterprise')) entities.segment = 'enterprise';
    else if (message.toLowerCase().includes('midmarket')) entities.segment = 'midmarket';
    else if (message.toLowerCase().includes('smb')) entities.segment = 'smb';
    else if (message.toLowerCase().includes('global')) entities.segment = 'globalAccounts';
    
    // Extract deal types
    if (message.toLowerCase().includes('renewal')) entities.dealType = 'renewal';
    else if (message.toLowerCase().includes('new business')) entities.dealType = 'newBusiness';
    else if (message.toLowerCase().includes('add-on') || message.toLowerCase().includes('addon')) entities.dealType = 'addon';
    else if (message.toLowerCase().includes('upsell')) entities.dealType = 'upsell';
    
    // Extract regions
    if (message.toLowerCase().includes('emea') || message.toLowerCase().includes('europe')) entities.region = 'emea';
    else if (message.toLowerCase().includes('apac') || message.toLowerCase().includes('asia')) entities.region = 'apac';
    else if (message.toLowerCase().includes('latam') || message.toLowerCase().includes('latin')) entities.region = 'latam';
    else if (message.toLowerCase().includes('namer') || message.toLowerCase().includes('us')) entities.region = 'namer';
    
    return entities;
  }

  assessComplexity(message, intent) {
    if (intent === 'general_inquiry' && message.split(' ').length < 5) return 'simple';
    if (intent === 'case_creation' || message.includes('exception')) return 'complex';
    if (message.includes('competitive') || message.includes('urgent')) return 'complex';
    return 'moderate';
  }

  shouldSuggestCase(message, intent, entities) {
    // Suggest case creation for complex scenarios
    if (intent === 'case_creation') return true;
    if (message.includes('exception') || message.includes('special')) return true;
    if (entities.percentage && entities.percentage > 30) return true;
    if (message.includes('competitive') && entities.amount) return true;
    if (message.includes('pilot') && message.includes('extend')) return true;
    return false;
  }

  async searchKnowledge(message, analysis) {
    try {
      // Use vector search for semantic understanding
      const vectorResults = vectorSearch.semanticSearch(message, { limit: 5 });
      
      // Get specific policy information if entities detected
      let policyInfo = null;
      if (analysis.entities.segment && analysis.entities.dealType) {
        policyInfo = knowledgeBaseService.getPolicyInformation(
          analysis.entities.dealType,
          analysis.entities.segment,
          analysis.entities.region || 'namer'
        );
      }
      
      // Find similar cases if relevant
      let similarCases = [];
      if (analysis.entities.amount || analysis.intent === 'case_creation') {
        similarCases = knowledgeBaseService.findSimilarCases(
          analysis.entities.amount || 50000,
          analysis.entities.dealType || 'newBusiness',
          analysis.entities.segment || 'enterprise',
          analysis.entities.region || 'namer'
        ).slice(0, 3);
      }
      
      return {
        vectorResults,
        policyInfo,
        similarCases,
        hasRelevantData: vectorResults.results.length > 0 || policyInfo || similarCases.length > 0
      };
    } catch (error) {
      console.error('Knowledge search error:', error);
      return { hasRelevantData: false };
    }
  }

  async generateResponse(message, analysis, knowledgeResults) {
    // If we have specific policy information, provide direct answer
    if (knowledgeResults.policyInfo) {
      return this.generatePolicyResponse(message, analysis, knowledgeResults);
    }
    
    // If we have good vector search results, use them
    if (knowledgeResults.vectorResults && knowledgeResults.vectorResults.results.length > 0) {
      return this.generateKnowledgeBasedResponse(message, analysis, knowledgeResults);
    }
    
    // Fallback to general guidance
    return this.generateGeneralResponse(message, analysis);
  }

  generatePolicyResponse(message, analysis, knowledgeResults) {
    const { policyInfo } = knowledgeResults;
    const { entities } = analysis;
    
    let content = "";
    const sources = ["Rules of Engagement"];
    const suggestedActions = [];
    
    if (analysis.intent === 'pricing_question') {
      const discountPolicy = policyInfo.discountPolicy;
      if (discountPolicy) {
        content = `For ${entities.segment || 'this segment'} ${entities.dealType || 'deals'}:\n\n`;
        content += `• **Maximum Discount**: ${discountPolicy.max}%\n`;
        content += `• **Typical Discount**: ${discountPolicy.typical}%\n`;
        content += `• **Auto-approved up to**: ${discountPolicy.autoApproved}%\n`;
        
        if (discountPolicy.regionalAdjustment > 0) {
          content += `• **Regional Adjustment**: +${discountPolicy.regionalAdjustment}% for ${entities.region || 'this region'}\n`;
          content += `• **Effective Maximum**: ${discountPolicy.effectiveMax}%\n`;
        }
        
        if (entities.percentage) {
          if (entities.percentage <= discountPolicy.autoApproved) {
            content += `\n✅ **Your ${entities.percentage}% request is auto-approved!**`;
          } else if (entities.percentage <= discountPolicy.max) {
            content += `\n⚠️ **Your ${entities.percentage}% request requires approval.** `;
            const approvalInfo = knowledgeBaseService.getApprovalRequirements(entities.percentage, entities.amount || 50000);
            if (approvalInfo.discountApproval) {
              content += `Needs: ${approvalInfo.discountApproval.approver} (${approvalInfo.discountApproval.timeframe})`;
              suggestedActions.push(`Submit for ${approvalInfo.discountApproval.approver} approval`);
            }
          } else {
            content += `\n❌ **Your ${entities.percentage}% request exceeds policy limits.**`;
            suggestedActions.push("Create exception case with strong business justification");
          }
        }
      }
    } else if (analysis.intent === 'requirement_question') {
      const minimumCommitment = policyInfo.minimumCommitment;
      if (minimumCommitment) {
        content = `**Minimum Requirements for ${entities.segment || 'this segment'} ${entities.dealType || 'new business'}:**\n\n`;
        content += `• **Minimum Seats**: ${minimumCommitment.seats}\n`;
        content += `• **Minimum Value**: $${minimumCommitment.value.toLocaleString()}\n`;
        
        if (entities.dealType === 'addon') {
          content += `\n💡 **Note**: Add-on deals have no minimum requirements!`;
        }
      }
    }
    
    return {
      content,
      type: 'policy_answer',
      confidence: 0.9,
      sources,
      suggestedActions
    };
  }

  generateKnowledgeBasedResponse(message, analysis, knowledgeResults) {
    const { vectorResults, similarCases } = knowledgeResults;
    const topResults = vectorResults.results.slice(0, 3);
    
    let content = "Based on our policies and historical cases:\n\n";
    const sources = [];
    const suggestedActions = [];
    
    // Include top search results
    topResults.forEach((result, index) => {
      if (result.type === 'roe') {
        content += `📋 **${result.data.type || 'Policy'}**: ${result.description}\n\n`;
        sources.push("Rules of Engagement");
      } else if (result.type === 'case') {
        content += `📁 **Similar Case**: ${result.title}\n`;
        content += `   Resolution: ${result.resolution}\n`;
        content += `   Outcome: ${result.outcome}\n\n`;
        sources.push("Historical Cases");
      }
    });
    
    // Add similar cases if available
    if (similarCases.length > 0) {
      content += `**Relevant Precedents:**\n`;
      similarCases.forEach(case_ => {
        content += `• ${case_.title} - ${case_.outcome}\n`;
      });
      content += "\n";
    }
    
    // Suggest case creation if appropriate
    if (analysis.suggestsCaseCreation) {
      content += `💡 **Recommendation**: This situation may require case creation for proper approval.\n`;
      suggestedActions.push("Create case for approval");
    }
    
    return {
      content,
      type: 'knowledge_based',
      confidence: 0.8,
      sources: [...new Set(sources)],
      suggestedActions
    };
  }

  generateGeneralResponse(message, analysis) {
    let content = "";
    const suggestedActions = [];
    
    if (analysis.intent === 'pricing_question') {
      content = `I can help you with pricing questions! To provide specific discount limits and approval requirements, I need to know:\n\n`;
      content += `• **Customer segment** (SMB, Midmarket, Enterprise, Large Enterprise, Global)\n`;
      content += `• **Deal type** (New Business, Renewal, Add-on, Upsell)\n`;
      content += `• **Region** (NAMER, EMEA, APAC, LATAM)\n`;
      content += `• **Requested discount percentage**\n\n`;
      content += `**Quick Reference:**\n`;
      content += `• SMB: Up to 10% discount\n`;
      content += `• Midmarket: Up to 15% discount\n`;
      content += `• Enterprise: Up to 20% discount\n`;
      content += `• Large Enterprise: Up to 25% discount\n`;
      content += `• Global Accounts: Up to 30% discount\n`;
      suggestedActions.push("Provide customer segment and deal details for specific guidance");
    } else if (analysis.intent === 'case_creation') {
      content = `I can help you create a properly formatted case! Common case types include:\n\n`;
      content += `• **Pricing & Discounts** - For discount requests above policy limits\n`;
      content += `• **Deal Structure** - For payment terms, contract modifications\n`;
      content += `• **Pilot Programs** - For trial extensions or custom pilots\n`;
      content += `• **Technical Requirements** - For custom integrations or compliance\n`;
      content += `• **Competitive Situations** - For urgent competitive responses\n\n`;
      content += `What type of case do you need to create?`;
      suggestedActions.push("Specify case type and provide deal details");
    } else {
      content = `I'm here to help with sales policies, case creation, and troubleshooting! I can assist with:\n\n`;
      content += `• **Policy Questions** - Discount limits, approval requirements, minimum commitments\n`;
      content += `• **Case Creation** - Help format and route approval requests\n`;
      content += `• **Historical Precedents** - Find similar cases and outcomes\n`;
      content += `• **Guidance** - Best practices for deal structures and competitive situations\n\n`;
      content += `What specific question can I help you with?`;
      suggestedActions.push("Ask about specific policies or situations");
    }
    
    return {
      content,
      type: 'general_guidance',
      confidence: 0.6,
      sources: [],
      suggestedActions
    };
  }

  // Mock response for when OpenAI is not available
  generateMockResponse(message, analysis, knowledgeResults) {
    return this.generateResponse(message, analysis, knowledgeResults);
  }

  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    // Maintain conversation length limit
    if (this.conversationHistory.length > this.maxContextLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxContextLength);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return [...this.conversationHistory];
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return {
        status: 'healthy',
        mode: this.client ? 'live' : 'mock',
        historyLength: this.conversationHistory.length,
        initialized: this.isInitialized
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        mode: 'mock'
      };
    }
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
