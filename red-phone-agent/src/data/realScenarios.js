// Real Customer Scenarios and Agent Responses for Red Phone Agent
// Based on actual sales support use cases

export const customerScenarios = [
  {
    id: "compensation-missing",
    category: "Compensation",
    keywords: ["compensation", "missing", "commission", "bookings", "opportunity"],
    userPrompt: "Why is my compensation missing on this opportunity?",
    agentResponse: "It's possible that commissionables data must be refreshed. I'll refresh the bookings now. If that doesn't work, I'll create a ticket to our \"end user system support\" team to help escalate the issue to Luminosity Engineering.",
    followUpActions: [
      "Refresh commissionables data",
      "Create ticket to end user system support",
      "Escalate to Luminosity Engineering if needed"
    ],
    requiresCase: false
  },
  {
    id: "find-invoice",
    category: "Billing",
    keywords: ["invoice", "customer", "billing", "download", "dynamics"],
    userPrompt: "How do I find an invoice for my customer?",
    agentResponse: "Here are the steps to find your customer's invoice:\n\n1. Go to the opportunity on Dynamics\n2. Open 'CSP Order'\n3. Go to the Billing Tab\n4. Download the invoice file associated with Billing Period needed",
    followUpActions: [
      "Navigate to Dynamics opportunity",
      "Access CSP Order",
      "Download billing period invoice"
    ],
    requiresCase: false
  },
  {
    id: "tearup-ep",
    category: "Deal Structure",
    keywords: ["tear up", "tearup", "ep", "eligibility", "roe"],
    userPrompt: "My customer wants to do a tear up to an EP. What do I do?",
    agentResponse: "It looks like per our ROE found at go/saasroe that you are not eligible to do a tear up for an EP. However, I can help create a ticket to our Sales Policy Manager team to investigate and obtain approval for you. Can you please provide me with the customer's intended start date and intended average spend in USD per year before I create the ticket?",
    followUpActions: [
      "Collect customer start date",
      "Collect intended annual spend in USD",
      "Create ticket to Sales Policy Manager team"
    ],
    requiresCase: true,
    caseInfo: {
      category: "Deal Structure",
      reason: "EP Tear Up Request",
      requiredFields: ["customer_start_date", "annual_spend_usd"]
    }
  },
  {
    id: "hep-pricing",
    category: "Pricing",
    keywords: ["hep", "pricing", "solution builder", "quote", "spend"],
    userPrompt: "Can you help me with my HEP pricing in Solution Builder?",
    agentResponse: "Yes! What is the maximum spend the customer is willing to spend in the first year? Is the client looking to create a 2 or 3-year deal? Once I have that information, I can create a ticket to our Pricing team who can help build out pricing for your quote.",
    followUpActions: [
      "Collect maximum first year spend",
      "Determine deal length (2 or 3 years)",
      "Create ticket to Pricing team"
    ],
    requiresCase: true,
    caseInfo: {
      category: "Pricing",
      reason: "HEP Pricing Assistance",
      requiredFields: ["max_first_year_spend", "deal_length"]
    }
  },
  {
    id: "legal-terms",
    category: "Legal",
    keywords: ["legal", "terms", "contract", "non-standard", "order form"],
    userPrompt: "Can you add legal terms to my customer's contract?",
    agentResponse: "Here's the process for adding legal terms to your customer's contract:\n\n1. Please connect with your legal counsel in order to review the requested non-standard order form terms\n2. Once approved, add the non-standard order form terms on Solution Builder\n3. Trigger the case for Deal Desk assistance on Solution Builder Quote Advisor\n4. Deal Desk to add the language\n5. Deal Desk to trigger the Legal and Revenue case approvals",
    followUpActions: [
      "Review with legal counsel",
      "Add terms to Solution Builder",
      "Trigger Deal Desk case",
      "Await Legal and Revenue approvals"
    ],
    requiresCase: true,
    caseInfo: {
      category: "Legal",
      reason: "Non-Standard Contract Terms",
      requiredFields: ["requested_terms", "legal_counsel_approval"]
    }
  },
  {
    id: "opportunity-stage",
    category: "System Issues",
    keywords: ["stage", "opportunity", "error", "closed admin", "disengaged"],
    userPrompt: "Can you change the stage of my opportunity? I'm hitting errors.",
    agentResponse: "To what stage are you trying to move your opportunity and what is the error message? Please note that if you are trying to move your opportunity stage to Closed Admin I'll need to create a case to our Deal Desk team to investigate further. If your error message is related to filling out the \"Closed Disengaged Notes\" field, please let me know the Closed Disengaged details and I can fill that field out for you and move your opportunity to Closed Disengaged.",
    followUpActions: [
      "Identify target stage",
      "Collect error message details",
      "Create Deal Desk case if Closed Admin",
      "Assist with Closed Disengaged Notes if applicable"
    ],
    requiresCase: true,
    caseInfo: {
      category: "System Issues",
      reason: "Opportunity Stage Change",
      requiredFields: ["target_stage", "error_message", "opportunity_id"]
    }
  }
];

export const caseCreationSteps = [
  {
    step: 1,
    description: "Try to assess if it is in policy or not",
    action: "policy_assessment"
  },
  {
    step: 2,
    description: "If it will require an exception case, ask the user to confirm if they would like to create a case",
    action: "confirm_case_creation"
  },
  {
    step: 3,
    description: "Before creating the case, the agent should ask for certain input that should be included in the case",
    action: "collect_required_fields"
  },
  {
    step: 4,
    description: "After this, the agent will create a case with the correct case attributes (such as case category, reason), as well as the input",
    action: "create_case_with_attributes"
  },
  {
    step: 5,
    description: "If the user later decides to update or provide more input, the agent can directly update the case",
    action: "update_case_if_needed"
  }
];

// Search function to find matching scenarios
export const findMatchingScenario = (userInput) => {
  const input = userInput.toLowerCase();
  
  // Find scenarios that match keywords
  const matches = customerScenarios.filter(scenario => 
    scenario.keywords.some(keyword => input.includes(keyword.toLowerCase()))
  );
  
  // If multiple matches, return the one with the most keyword matches
  if (matches.length > 1) {
    return matches.reduce((best, current) => {
      const bestScore = best.keywords.filter(kw => input.includes(kw.toLowerCase())).length;
      const currentScore = current.keywords.filter(kw => input.includes(kw.toLowerCase())).length;
      return currentScore > bestScore ? current : best;
    });
  }
  
  return matches[0] || null;
};

// Get scenarios by category
export const getScenariosByCategory = (category) => {
  return customerScenarios.filter(scenario => scenario.category === category);
};

// Get all available categories
export const getCategories = () => {
  return [...new Set(customerScenarios.map(scenario => scenario.category))];
};

export default customerScenarios;
