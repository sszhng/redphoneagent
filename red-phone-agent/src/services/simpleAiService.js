// Simplified AI Service using Real Customer Scenarios
// Replaces complex AI integration with practical scenario matching

import { findMatchingScenario, getCategories, caseCreationSteps } from '../data/realScenarios.js';

class SimpleAiService {
  constructor() {
    this.isInitialized = false;
    this.conversationHistory = [];
    this.currentCase = null;
  }

  async initialize() {
    this.isInitialized = true;
    return { success: true, mode: 'scenarios' };
  }

  async processMessage(messageText, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Store conversation context
      this.conversationHistory.push({
        role: 'user',
        content: messageText,
        timestamp: Date.now()
      });

      // Check for specific help requests first
      if (messageText.toLowerCase().includes('help me access dynamics')) {
        return this.handleDynamicsAccessHelp(messageText);
      }

      // Analyze user intent and extract key information
      const analysis = this.analyzeUserInput(messageText);
      
      // Find matching scenario with enhanced context
      const scenario = findMatchingScenario(messageText);
      
      if (scenario) {
        return this.handleScenarioMatch(scenario, messageText, options, analysis);
      } else {
        return this.handleIntelligentResponse(messageText, options, analysis);
      }
      
    } catch (error) {
      console.error('Simple AI Service error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  analyzeUserInput(messageText) {
    const input = messageText.toLowerCase();
    
    // Extract key entities and intent
    const analysis = {
      intent: this.detectIntent(input),
      entities: this.extractEntities(input),
      urgency: this.detectUrgency(input),
      sentiment: this.detectSentiment(input),
      context: this.getConversationContext()
    };

    return analysis;
  }

  detectIntent(input) {
    // Intent detection patterns
    const intents = {
      'pricing_help': ['pricing', 'discount', 'cost', 'price', 'quote', 'hep'],
      'case_creation': ['create case', 'need approval', 'escalate', 'submit'],
      'compensation_issue': ['compensation', 'commission', 'missing', 'bookings'],
      'invoice_help': ['invoice', 'billing', 'payment', 'receipt'],
      'system_issue': ['error', 'broken', 'not working', 'system', 'bug'],
      'legal_help': ['legal', 'contract', 'terms', 'agreement'],
      'deal_structure': ['deal structure', 'terms', 'payment', 'tear up'],
      'general_question': ['help', 'how', 'what', 'when', 'why', 'can you'],
      'status_check': ['status', 'progress', 'update', 'when will'],
      'urgent_request': ['urgent', 'asap', 'immediately', 'emergency']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return intent;
      }
    }

    return 'general_question';
  }

  extractEntities(input) {
    const entities = {};

    // Extract monetary amounts
    const moneyMatch = input.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (moneyMatch) {
      entities.amount = moneyMatch[1];
    }

    // Extract percentages
    const percentMatch = input.match(/(\d+)%/);
    if (percentMatch) {
      entities.percentage = percentMatch[1];
    }

    // Extract customer names (simple heuristic)
    const customerMatch = input.match(/(?:customer|client|account)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (customerMatch) {
      entities.customer = customerMatch[1];
    }

    // Extract time references
    const timePatterns = ['today', 'tomorrow', 'this week', 'next week', 'asap', 'immediately'];
    timePatterns.forEach(pattern => {
      if (input.includes(pattern)) {
        entities.timeframe = pattern;
      }
    });

    return entities;
  }

  detectUrgency(input) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline'];
    const hasUrgentWords = urgentWords.some(word => input.includes(word));
    
    if (hasUrgentWords) return 'high';
    if (input.includes('soon') || input.includes('quickly')) return 'medium';
    return 'normal';
  }

  detectSentiment(input) {
    const frustrationWords = ['frustrated', 'angry', 'broken', 'terrible', 'awful', 'hate'];
    const positiveWords = ['thank', 'great', 'perfect', 'awesome', 'helpful'];
    
    if (frustrationWords.some(word => input.includes(word))) return 'frustrated';
    if (positiveWords.some(word => input.includes(word))) return 'positive';
    return 'neutral';
  }

  getConversationContext() {
    // Get recent conversation history for context
    return this.conversationHistory.slice(-3); // Last 3 messages
  }

  handleScenarioMatch(scenario, messageText, options, analysis) {
    // Customize response based on user input analysis
    let response = this.customizeResponse(scenario.agentResponse, messageText, analysis);
    
    const actions = [];
    const followUpSuggestions = [];

    // Add follow-up actions
    if (scenario.followUpActions && scenario.followUpActions.length > 0) {
      response += `\n\n**Next Steps:**`;
      scenario.followUpActions.forEach((action, index) => {
        response += `\n${index + 1}. ${action}`;
      });
    }

    // Integrate case creation into next steps if required
    if (scenario.requiresCase) {
      if (scenario.followUpActions && scenario.followUpActions.length > 0) {
        // Add case creation as the final step
        response += `\n${scenario.followUpActions.length + 1}. Create a ${scenario.caseInfo.category} case for approval`;
      } else {
        response += `\n\n**Next Steps:**\n1. Create a ${scenario.caseInfo.category} case for approval`;
      }
      
      // Add case creation as primary action
      actions.unshift({
        type: 'create_case',
        label: '📋 Create Required Case',
        data: {
          category: scenario.caseInfo.category,
          reason: scenario.caseInfo.reason,
          requiredFields: scenario.caseInfo.requiredFields,
          scenarioId: scenario.id
        }
      });

      // Contextual follow-up suggestions based on scenario
      followUpSuggestions.push("Create the required case now");
    }

    // Add contextual follow-up suggestions based on scenario
    this.addContextualSuggestions(scenario, followUpSuggestions);

    return {
      success: true,
      response: response,
      responseType: 'scenario_match',
      confidence: 0.9,
      scenarioId: scenario.id,
      category: scenario.category,
      actions: actions,
      followUpSuggestions: followUpSuggestions,
      requiresCase: scenario.requiresCase
    };
  }

  addContextualSuggestions(scenario, followUpSuggestions) {
    // Add scenario-specific next steps based on the actual follow-up actions
    switch (scenario.id) {
      case 'compensation-missing':
        followUpSuggestions.push("Check if the refresh worked");
        if (!scenario.requiresCase) {
          followUpSuggestions.push("Still having issues? Let me escalate this");
        }
        break;
        
      case 'find-invoice':
        followUpSuggestions.push("I can't find the CSP Order tab");
        followUpSuggestions.push("Help me access Dynamics");
        break;
        
      case 'tearup-ep':
        if (scenario.requiresCase) {
          followUpSuggestions.push("I have the customer start date and spend info");
        }
        followUpSuggestions.push("What is the ROE policy exactly?");
        break;
        
      case 'hep-pricing':
        if (scenario.requiresCase) {
          followUpSuggestions.push("I know the spend and deal length");
        }
        followUpSuggestions.push("How long will pricing take?");
        break;
        
      case 'legal-terms':
        followUpSuggestions.push("Who is my legal counsel?");
        followUpSuggestions.push("How do I use Solution Builder Quote Advisor?");
        break;
        
      case 'opportunity-stage':
        followUpSuggestions.push("I'm moving to Closed Admin");
        followUpSuggestions.push("I need help with Closed Disengaged Notes");
        break;
        
      default:
        // Generic helpful suggestions
        followUpSuggestions.push("I need more specific guidance");
        followUpSuggestions.push("Help with a different issue");
    }
  }

  customizeResponse(baseResponse, messageText, analysis) {
    let customizedResponse = baseResponse;

    // Add urgency acknowledgment
    if (analysis.urgency === 'high') {
      customizedResponse = `I understand this is urgent. ${customizedResponse}`;
    }

    // Add sentiment response
    if (analysis.sentiment === 'frustrated') {
      customizedResponse = `I can see you're having trouble with this. Let me help resolve it quickly. ${customizedResponse}`;
    }

    // Reference specific entities mentioned
    if (analysis.entities.amount) {
      customizedResponse = customizedResponse.replace(
        /\$[\d,]+/g, 
        `$${analysis.entities.amount}`
      );
    }

    if (analysis.entities.percentage) {
      customizedResponse = customizedResponse.replace(
        /\d+%/g, 
        `${analysis.entities.percentage}%`
      );
    }

    if (analysis.entities.customer) {
      customizedResponse = customizedResponse.replace(
        /customer/g, 
        analysis.entities.customer
      );
    }

    return customizedResponse;
  }

  handleIntelligentResponse(messageText, options, analysis) {
    // Generate intelligent response based on intent and context
    switch (analysis.intent) {
      case 'pricing_help':
        return this.handlePricingQuery(messageText, analysis);
      case 'compensation_issue':
        return this.handleCompensationQuery(messageText, analysis);
      case 'invoice_help':
        return this.handleInvoiceQuery(messageText, analysis);
      case 'system_issue':
        return this.handleSystemIssueQuery(messageText, analysis);
      case 'legal_help':
        return this.handleLegalQuery(messageText, analysis);
      case 'status_check':
        return this.handleStatusQuery(messageText, analysis);
      case 'case_creation':
        return this.suggestCaseCreation(messageText);
      default:
        return this.handleContextualGeneralQuery(messageText, analysis);
    }
  }

  handlePricingQuery(messageText, analysis) {
    let response = `I can help you with pricing questions. `;

    if (analysis.entities.percentage) {
      response += `For a ${analysis.entities.percentage}% discount request, you'll typically need manager approval. `;
    } else if (analysis.entities.amount) {
      response += `For deals involving $${analysis.entities.amount}, `;
    }

    response += `Here's what I recommend:

**Next Steps:**
1. Gather customer requirements and competitive information
2. Check our standard discount policies  
3. Create a Pricing case for approval if needed

I can help you create a case with all the required information pre-filled.`;

    return {
      success: true,
      response: response,
      responseType: 'intelligent_pricing',
      confidence: 0.9,
      followUpSuggestions: [
        "Create the required case now",
        "What's the standard discount policy?",
        "Help me gather competitive information"
      ]
    };
  }

  handleCompensationQuery(messageText, analysis) {
    let response = `Let me help you resolve your compensation issue. `;

    if (analysis.urgency === 'high') {
      response += `Since this is urgent, I'll prioritize the fastest resolution path. `;
    }

    response += `Here's what I recommend:

**Next Steps:**
1. Refresh the commissionables data in the system
2. Check if the opportunity is properly tagged
3. Escalate to system support if the refresh doesn't work

I can start the refresh process now or help you create a support case.`;

    return {
      success: true,
      response: response,
      responseType: 'intelligent_compensation',
      confidence: 0.9,
      followUpSuggestions: [
        "Start the refresh process",
        "Create a support case",
        "Check opportunity tagging"
      ]
    };
  }

  handleInvoiceQuery(messageText, analysis) {
    let response = `I'll help you locate the invoice you need. `;

    if (analysis.entities.customer) {
      response += `For ${analysis.entities.customer}, `;
    }

    response += `here's how to find it:

**Next Steps:**
1. Go to the opportunity in Dynamics
2. Open the 'CSP Order' section
3. Navigate to the Billing Tab
4. Download the invoice for the needed billing period

I can guide you through each step if you get stuck.`;

    return {
      success: true,
      response: response,
      responseType: 'intelligent_invoice',
      confidence: 0.9,
      followUpSuggestions: [
        "I can't find the CSP Order tab",
        "Help me access Dynamics",
        "What if there's no billing tab?"
      ],
      actions: [{
        type: 'help_dynamics_access',
        label: '🔗 Open Customer in Dynamics',
        data: {
          customerName: analysis.entities.customer || 'Pellegrino E2E Test',
          opportunityId: 'OPP-2025-001234'
        }
      }]
    };
  }

  handleSystemIssueQuery(messageText, analysis) {
    let response = `I understand you're experiencing a system issue. `;

    if (analysis.sentiment === 'frustrated') {
      response += `I know how frustrating technical problems can be. `;
    }

    response += `Let me help resolve this:

**Next Steps:**
1. Document the specific error message
2. Note the steps that lead to the issue
3. Try basic troubleshooting (refresh, clear cache)
4. Create a System Issues case if the problem persists

I can help you create a detailed case with all the technical information.`;

    return {
      success: true,
      response: response,
      responseType: 'intelligent_system',
      confidence: 0.9,
      followUpSuggestions: [
        "Create a system issue case",
        "I need help with troubleshooting",
        "The error message is unclear"
      ]
    };
  }

  handleLegalQuery(messageText, analysis) {
    let response = `I can help you with legal and contract questions. `;

    response += `Here's the recommended process:

**Next Steps:**
1. Review the specific terms with your legal counsel
2. Add any non-standard terms in Solution Builder
3. Trigger Deal Desk case for legal review
4. Wait for Legal and Revenue team approvals

I can help you create a Legal case with the proper routing.`;

    return {
      success: true,
      response: response,
      responseType: 'intelligent_legal',
      confidence: 0.9,
      followUpSuggestions: [
        "Create the required case now",
        "Who is my legal counsel?",
        "How long does legal review take?"
      ]
    };
  }

  handleStatusQuery(messageText, analysis) {
    return {
      success: true,
      response: `I can help you check on status updates. Unfortunately, I don't have access to live case tracking, but I can:

**Next Steps:**
1. Direct you to the case tracking system
2. Help you contact the appropriate team
3. Create a follow-up case if needed

What specific status are you looking for?`,
      responseType: 'status_check',
      confidence: 0.8,
      followUpSuggestions: [
        "Check my recent cases",
        "Contact the review team",
        "Create a follow-up case"
      ]
    };
  }

  handleDynamicsAccessHelp(messageText) {
    // Extract customer info from previous context or use default
    const customerName = this.getCustomerFromContext() || 'Pellegrino E2E Test 2fcol3xsi8ljg';
    const opportunityId = 'OPP-2025-001234';
    const dynamicsUrl = `https://dynamics.microsoft.com/customers/${encodeURIComponent(customerName)}/opportunities/${opportunityId}`;
    
    return {
      success: true,
      response: `I'll help you access Dynamics for your customer. Here's a direct link to open the customer account:

**Customer:** ${customerName}
**Opportunity ID:** ${opportunityId}

**Direct Link:** [Open ${customerName} in Dynamics](${dynamicsUrl})

**Next Steps:**
1. Click the link above to open Dynamics
2. Navigate to the CSP Order section
3. Look for the Billing Tab
4. Download the invoice from there

If you're still having trouble finding the invoice after accessing Dynamics, let me know and I can provide more specific guidance.`,
      responseType: 'dynamics_access_help',
      confidence: 0.95,
      actions: [{
        type: 'open_dynamics',
        label: '🔗 Open Customer in Dynamics',
        data: {
          url: dynamicsUrl,
          customerName: customerName,
          opportunityId: opportunityId
        }
      }],
      followUpSuggestions: [
        "I still can't find the CSP Order section",
        "The Billing Tab is missing",
        "Help me download the invoice file"
      ]
    };
  }

  getCustomerFromContext() {
    // Look through recent conversation history for customer names
    const recentMessages = this.conversationHistory.slice(-5);
    for (const message of recentMessages) {
      const customerMatch = message.content.match(/(?:customer|client|account)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (customerMatch) {
        return customerMatch[1];
      }
    }
    return null;
  }

  handleContextualGeneralQuery(messageText, analysis) {
    const input = messageText.toLowerCase();
    
    // Handle help/guidance requests
    if (input.includes('help') || (input.includes('what') && input.includes('do'))) {
      return this.showAvailableCategories();
    }

    // Provide intelligent response based on context
    let response = `I understand you're asking about: "${messageText}". `;

    if (analysis.urgency === 'high') {
      response += `Since this seems urgent, `;
    }

    response += `Let me help you with this. Based on your question, here are some options:

**Next Steps:**
1. Check if this relates to a specific policy or process
2. Look up relevant documentation or guidelines
3. Create a case if you need specialized assistance

I can guide you to the right resource or help create a case for expert review.`;

    return {
      success: true,
      response: response,
      responseType: 'contextual_general',
      confidence: 0.7,
      followUpSuggestions: [
        "Create a case for expert help",
        "Show me relevant policies",
        "Help me find the right team"
      ]
    };
  }

  handleGeneralQuery(messageText, options) {
    const input = messageText.toLowerCase();
    
    // Handle help/guidance requests
    if (input.includes('help') || (input.includes('what') && input.includes('do'))) {
      return this.showAvailableCategories();
    }

    // Handle case creation questions - PRIORITY FOR CASE CREATION
    if (input.includes('case') || input.includes('ticket')) {
      return this.showCaseCreationProcess();
    }
    
    // Check for keywords that typically require case creation
    const caseRequiredKeywords = [
      'approval', 'exception', 'discount', 'pricing', 'tear up', 'tearup',
      'legal terms', 'contract', 'non-standard', 'escalate', 'manager'
    ];
    
    const requiresCaseCreation = caseRequiredKeywords.some(keyword => 
      input.includes(keyword)
    );
    
    if (requiresCaseCreation) {
      return this.suggestCaseCreation(messageText);
    }

    // Handle category browsing
    const categories = getCategories();
    const matchedCategory = categories.find(cat => 
      input.includes(cat.toLowerCase())
    );

    if (matchedCategory) {
      return this.showCategoryScenarios(matchedCategory);
    }

    // Default helpful response
    return {
      success: true,
      response: `I can help you with common sales support scenarios. Here are the categories I assist with:

**Available Categories:**
${getCategories().map(cat => `• ${cat}`).join('\n')}

You can ask me questions like:
• "Why is my compensation missing?"
• "How do I find an invoice?"
• "Can you help with pricing?"
• "How do I create a case?"

Or just describe your specific situation and I'll try to help!`,
      responseType: 'general_help',
      confidence: 0.7,
      followUpSuggestions: [
        "Why is my compensation missing?",
        "How do I find an invoice?", 
        "Help me with HEP pricing",
        "I need to add legal terms to my contract"
      ]
    };
  }

  showAvailableCategories() {
    const categories = getCategories();
    
    return {
      success: true,
      response: `**🎯 I can help you with these categories:**

${categories.map(cat => `**${cat}**`).join('\n')}

**Sample questions you can ask:**
• "Why is my compensation missing on this opportunity?"
• "How do I find an invoice for my customer?"
• "My customer wants to do a tear up to an EP"
• "Can you help me with HEP pricing?"
• "Can you add legal terms to my contract?"
• "Can you change the stage of my opportunity?"

Just describe your situation and I'll provide the specific steps and guidance!`,
      responseType: 'category_overview',
      confidence: 1.0,
      followUpSuggestions: [
        "Why is my compensation missing?",
        "How do I find an invoice?",
        "My customer wants to do a tear up to an EP",
        "Can you help me with HEP pricing?"
      ]
    };
  }

  showCaseCreationProcess() {
    let response = `**📋 Case Creation Process**

Here's how I help you create cases:

`;

    caseCreationSteps.forEach(step => {
      response += `**${step.step}.** ${step.description}\n\n`;
    });

    response += `**When you need a case, I will:**
• Check if your request is in policy
• Ask for confirmation if an exception is needed  
• Collect all required information
• Create the case with proper attributes
• Allow you to update it later if needed

Just describe your situation and I'll guide you through the process!`;

    return {
      success: true,
      response: response,
      responseType: 'case_process',
      confidence: 1.0,
      followUpSuggestions: [
        "Create the required case now",
        "My customer wants to do a tear up to an EP",
        "Can you help me with HEP pricing?",
        "I need to add legal terms to my contract"
      ]
    };
  }

  suggestCaseCreation(messageText) {
    return {
      success: true,
      response: `Based on your request, this typically requires creating a case for approval.

**Next Steps:**
1. Create a case with your request details
2. Submit for manager/team review
3. Track progress via email updates

I can help you create a properly formatted case right now.`,
      responseType: 'case_suggestion',
      confidence: 0.8,
      actions: [{
        type: 'create_case',
        label: '📋 Start Case Creation',
        data: {
          category: 'General',
          reason: 'Potential Exception Request',
          requiredFields: []
        }
      }],
      followUpSuggestions: [
        "Create the required case now",
        "What information do you need for this case?",
        "Help me understand the approval process",
        "Show me similar situations"
      ],
      requiresCase: true
    };
  }

  showCategoryScenarios(category) {
    // This would show all scenarios in a specific category
    return {
      success: true,
      response: `**${category} Scenarios**

I can help you with ${category.toLowerCase()} related questions. Ask me about specific situations and I'll provide step-by-step guidance.

Some common ${category.toLowerCase()} questions include various operational and process-related scenarios.`,
      responseType: 'category_scenarios',
      confidence: 0.8,
      followUpSuggestions: [
        "Why is my compensation missing?",
        "How do I find an invoice?",
        "Help me with HEP pricing",
        "I need help with legal terms"
      ]
    };
  }

  // Simple case creation helper
  createCase(caseData) {
    this.currentCase = {
      id: `CASE-${Date.now()}`,
      ...caseData,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      caseId: this.currentCase.id,
      message: `Case ${this.currentCase.id} created successfully!`
    };
  }
}

// Create singleton instance
const simpleAiService = new SimpleAiService();

export default simpleAiService;
