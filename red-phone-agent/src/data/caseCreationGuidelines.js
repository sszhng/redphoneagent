// Case Creation Guidelines for Red Phone Agent
// Comprehensive guidance for creating well-structured cases with proper routing

export const caseCreationGuidelines = {
  // Case Categories and Templates
  caseCategories: {
    pricing: {
      name: "Pricing & Discounts",
      description: "Discount requests, competitive pricing, volume pricing",
      priority: "Medium to High",
      typicalApprover: "Sales Manager or Regional Director",
      avgResolutionTime: "24-48 hours",
      subcategories: [
        { id: "discount-request", name: "Discount Request", urgency: "medium" },
        { id: "competitive-pricing", name: "Competitive Pricing", urgency: "high" },
        { id: "volume-discount", name: "Volume Discount", urgency: "low" },
        { id: "multi-year-pricing", name: "Multi-Year Pricing", urgency: "medium" },
        { id: "emergency-pricing", name: "Emergency Pricing", urgency: "critical" }
      ]
    },
    dealStructure: {
      name: "Deal Structure & Terms",
      description: "Contract terms, payment structures, minimum requirements",
      priority: "Medium",
      typicalApprover: "Sales Manager or Legal",
      avgResolutionTime: "48-72 hours",
      subcategories: [
        { id: "payment-terms", name: "Payment Terms", urgency: "medium" },
        { id: "minimum-requirements", name: "Minimum Requirements", urgency: "low" },
        { id: "contract-terms", name: "Contract Terms", urgency: "medium" },
        { id: "custom-agreement", name: "Custom Agreement", urgency: "high" }
      ]
    },
    pilotPrograms: {
      name: "Pilot Programs",
      description: "Trial extensions, pilot modifications, evaluation programs",
      priority: "Medium to High",
      typicalApprover: "Regional Director or VP Sales",
      avgResolutionTime: "3-5 days",
      subcategories: [
        { id: "pilot-extension", name: "Pilot Extension", urgency: "medium" },
        { id: "pilot-expansion", name: "Pilot Expansion", urgency: "medium" },
        { id: "custom-pilot", name: "Custom Pilot Program", urgency: "high" }
      ]
    },
    technical: {
      name: "Technical Requirements",
      description: "Custom integrations, security requirements, compliance needs",
      priority: "High",
      typicalApprover: "Engineering + Sales Leadership",
      avgResolutionTime: "1-2 weeks",
      subcategories: [
        { id: "custom-integration", name: "Custom Integration", urgency: "high" },
        { id: "security-requirements", name: "Security Requirements", urgency: "high" },
        { id: "compliance", name: "Compliance Requirements", urgency: "high" },
        { id: "data-residency", name: "Data Residency", urgency: "medium" }
      ]
    },
    competitive: {
      name: "Competitive Situations",
      description: "Competitive threats, displacement opportunities, market responses",
      priority: "High to Critical",
      typicalApprover: "Regional Director or VP Sales",
      avgResolutionTime: "4-24 hours",
      subcategories: [
        { id: "competitive-threat", name: "Competitive Threat", urgency: "critical" },
        { id: "displacement", name: "Competitive Displacement", urgency: "high" },
        { id: "rfp-response", name: "RFP Response", urgency: "high" }
      ]
    },
    customerSuccess: {
      name: "Customer Success",
      description: "Retention issues, satisfaction concerns, escalations",
      priority: "High",
      typicalApprover: "CS Director + Sales Manager",
      avgResolutionTime: "24-48 hours",
      subcategories: [
        { id: "churn-risk", name: "Churn Risk", urgency: "critical" },
        { id: "satisfaction", name: "Satisfaction Issue", urgency: "high" },
        { id: "escalation", name: "Customer Escalation", urgency: "critical" }
      ]
    },
    channel: {
      name: "Channel & Partners",
      description: "Partner conflicts, margin requests, channel management",
      priority: "Medium",
      typicalApprover: "Channel Manager",
      avgResolutionTime: "48-72 hours",
      subcategories: [
        { id: "partner-conflict", name: "Partner Conflict", urgency: "medium" },
        { id: "margin-request", name: "Margin Request", urgency: "low" },
        { id: "channel-exception", name: "Channel Exception", urgency: "medium" }
      ]
    },
    legal: {
      name: "Legal & Compliance",
      description: "Contract modifications, legal reviews, compliance issues",
      priority: "High",
      typicalApprover: "Legal + Sales Leadership",
      avgResolutionTime: "1-2 weeks",
      subcategories: [
        { id: "contract-modification", name: "Contract Modification", urgency: "medium" },
        { id: "legal-review", name: "Legal Review", urgency: "high" },
        { id: "compliance-issue", name: "Compliance Issue", urgency: "high" }
      ]
    }
  },

  // Required Fields by Category
  requiredFields: {
    common: [
      { field: "title", type: "text", maxLength: 100, required: true, description: "Clear, descriptive case title" },
      { field: "category", type: "select", required: true, description: "Primary case category" },
      { field: "subcategory", type: "select", required: true, description: "Specific case subcategory" },
      { field: "priority", type: "select", options: ["Low", "Medium", "High", "Critical"], required: true },
      { field: "description", type: "textarea", maxLength: 1000, required: true, description: "Detailed case description" },
      { field: "businessJustification", type: "textarea", maxLength: 500, required: true, description: "Why this exception/request is needed" },
      { field: "customerName", type: "text", required: true, description: "Customer organization name" },
      { field: "dealValue", type: "number", required: true, description: "Total deal value (USD)" },
      { field: "dealType", type: "select", options: ["New Business", "Renewal", "Upsell", "Add-on"], required: true },
      { field: "segment", type: "select", options: ["SMB", "Midmarket", "Enterprise", "Large Enterprise", "Global Accounts"], required: true },
      { field: "region", type: "select", options: ["NAMER", "LATAM", "EMEA", "APAC"], required: true },
      { field: "timeline", type: "select", options: ["Immediate", "Within 24 hours", "Within 1 week", "Within 1 month"], required: true },
      { field: "customerImpact", type: "textarea", maxLength: 300, required: true, description: "Impact on customer if not approved" },
      { field: "riskAssessment", type: "textarea", maxLength: 300, required: true, description: "Risks of approval/denial" }
    ],
    pricing: [
      { field: "currentPrice", type: "number", required: true, description: "Standard list price" },
      { field: "requestedPrice", type: "number", required: true, description: "Requested price" },
      { field: "requestedDiscount", type: "number", required: true, description: "Discount percentage requested" },
      { field: "competitorInfo", type: "textarea", maxLength: 300, required: false, description: "Competitor pricing or threat details" },
      { field: "lastYearDiscount", type: "number", required: false, description: "Previous year discount if renewal" },
      { field: "volumeCommitment", type: "text", required: false, description: "Multi-year or volume commitments" }
    ],
    dealStructure: [
      { field: "standardTerms", type: "textarea", required: true, description: "Current standard terms" },
      { field: "requestedTerms", type: "textarea", required: true, description: "Requested modification" },
      { field: "paymentTerms", type: "select", options: ["Net 30", "Net 45", "Net 60", "Net 90", "Custom"], required: true },
      { field: "contractLength", type: "select", options: ["1 Year", "2 Years", "3 Years", "Multi-Year", "Month-to-Month"], required: true },
      { field: "legalReview", type: "boolean", required: true, description: "Does this require legal review?" }
    ],
    pilotPrograms: [
      { field: "standardPilotDuration", type: "text", required: true, description: "Standard pilot duration" },
      { field: "requestedDuration", type: "text", required: true, description: "Requested pilot duration" },
      { field: "pilotScope", type: "textarea", required: true, description: "Pilot scope and objectives" },
      { field: "evaluationCriteria", type: "textarea", required: true, description: "Success criteria for pilot" },
      { field: "decisionTimeline", type: "text", required: true, description: "When will purchase decision be made" },
      { field: "pilotUsers", type: "number", required: true, description: "Number of pilot users" }
    ],
    technical: [
      { field: "technicalRequirement", type: "textarea", required: true, description: "Specific technical requirement" },
      { field: "standardSolution", type: "textarea", required: true, description: "Why standard solution doesn't work" },
      { field: "developmentEffort", type: "select", options: ["Low", "Medium", "High", "Unknown"], required: true },
      { field: "timelineRequirement", type: "text", required: true, description: "Customer timeline for implementation" },
      { field: "engineeringApproval", type: "boolean", required: true, description: "Has engineering reviewed this?" }
    ],
    competitive: [
      { field: "competitor", type: "text", required: true, description: "Primary competitor" },
      { field: "competitorAdvantage", type: "textarea", required: true, description: "Competitor's key advantages" },
      { field: "ourAdvantage", type: "textarea", required: true, description: "Our competitive advantages" },
      { field: "customerPreference", type: "textarea", required: true, description: "Customer's stated preferences" },
      { field: "decisionTimeframe", type: "text", required: true, description: "When is decision being made" },
      { field: "influencers", type: "textarea", required: true, description: "Key decision influencers" }
    ]
  },

  // Routing Logic
  routingLogic: {
    autoRouting: {
      pricing: {
        "0-10%": { approver: "auto-approved", department: "sales" },
        "11-20%": { approver: "sales-manager", department: "sales" },
        "21-30%": { approver: "regional-director", department: "sales" },
        "31%+": { approver: "vp-sales", department: "sales", requiresFinance: true }
      },
      dealSize: {
        "under-50k": { approver: "sales-manager", department: "sales" },
        "50k-250k": { approver: "regional-director", department: "sales" },
        "250k-500k": { approver: "vp-sales", department: "sales" },
        "500k+": { approver: "vp-sales", department: "sales", requiresCEO: true }
      },
      urgency: {
        "critical": { escalation: "immediate", notifications: ["sms", "email", "slack"] },
        "high": { escalation: "4-hours", notifications: ["email", "slack"] },
        "medium": { escalation: "24-hours", notifications: ["email"] },
        "low": { escalation: "72-hours", notifications: ["email"] }
      }
    },
    specialRouting: {
      technical: {
        departments: ["engineering", "sales"],
        requiredApprovers: ["technical-lead", "sales-manager"],
        estimatedTime: "1-2 weeks"
      },
      legal: {
        departments: ["legal", "sales"],
        requiredApprovers: ["legal-counsel", "sales-director"],
        estimatedTime: "1-2 weeks"
      },
      competitive: {
        departments: ["sales", "product-marketing"],
        requiredApprovers: ["regional-director", "competitive-analyst"],
        estimatedTime: "4-24 hours"
      },
      customerSuccess: {
        departments: ["customer-success", "sales"],
        requiredApprovers: ["cs-director", "sales-manager"],
        estimatedTime: "24-48 hours"
      }
    }
  },

  // Case Templates
  templates: {
    discountRequest: {
      title: "Discount Request - [Customer Name] - [Deal Value]",
      structure: [
        "## Customer Information",
        "- **Customer**: [Customer Name]",
        "- **Deal Value**: $[Amount]",
        "- **Deal Type**: [New Business/Renewal/Upsell]",
        "- **Segment**: [SMB/Midmarket/Enterprise/etc.]",
        "",
        "## Request Details",
        "- **Standard Price**: $[Amount]",
        "- **Requested Price**: $[Amount]",
        "- **Discount**: [X]%",
        "",
        "## Business Justification",
        "[Explain why this discount is needed]",
        "",
        "## Competitive Context",
        "[Any competitive threats or market factors]",
        "",
        "## Customer Impact",
        "[What happens if not approved]",
        "",
        "## Risk Assessment",
        "[Risks of approval/denial]"
      ]
    },
    pilotExtension: {
      title: "Pilot Extension Request - [Customer Name]",
      structure: [
        "## Customer Information",
        "- **Customer**: [Customer Name]",
        "- **Current Pilot**: [Duration] ([Start Date] - [End Date])",
        "- **Requested Extension**: [Duration]",
        "",
        "## Pilot Progress",
        "- **Current Usage**: [Metrics]",
        "- **Feedback**: [Customer feedback]",
        "- **Remaining Objectives**: [What needs to be completed]",
        "",
        "## Extension Justification",
        "[Why extension is needed]",
        "",
        "## Success Criteria",
        "[How success will be measured]",
        "",
        "## Purchase Timeline",
        "[When purchase decision will be made]"
      ]
    },
    competitiveThreat: {
      title: "Competitive Threat - [Customer Name] vs [Competitor]",
      structure: [
        "## Deal Information",
        "- **Customer**: [Customer Name]",
        "- **Deal Value**: $[Amount]",
        "- **Decision Timeline**: [Date]",
        "",
        "## Competitive Landscape",
        "- **Primary Competitor**: [Competitor Name]",
        "- **Competitor Advantages**: [List advantages]",
        "- **Our Advantages**: [List our strengths]",
        "",
        "## Customer Requirements",
        "[Key customer requirements and preferences]",
        "",
        "## Proposed Response",
        "[Our competitive response strategy]",
        "",
        "## Approval Needed",
        "[Specific approvals required]"
      ]
    },
    customIntegration: {
      title: "Custom Integration Request - [Customer Name]",
      structure: [
        "## Customer Information",
        "- **Customer**: [Customer Name]",
        "- **Deal Value**: $[Amount]",
        "- **Timeline**: [Customer timeline]",
        "",
        "## Technical Requirements",
        "- **Integration Type**: [API/Database/etc.]",
        "- **Systems to Integrate**: [List systems]",
        "- **Data Flow**: [Describe data requirements]",
        "",
        "## Standard Solution Gap",
        "[Why standard solution doesn't meet needs]",
        "",
        "## Development Scope",
        "- **Estimated Effort**: [Engineering estimate]",
        "- **Timeline**: [Development timeline]",
        "- **Resources Required**: [Team members needed]",
        "",
        "## Business Case",
        "[Revenue justification for custom work]"
      ]
    }
  },

  // Submission Guidelines
  submissionGuidelines: {
    bestPractices: [
      "Use clear, descriptive titles that include customer name and request type",
      "Provide complete business justification with specific metrics when possible",
      "Include customer quotes or documented requirements when available",
      "Attach relevant competitive intelligence or market research",
      "Specify exact timeline requirements and customer deadlines",
      "Include risk assessment for both approval and denial scenarios",
      "Reference similar cases or precedents when applicable",
      "Ensure all required fields are completed before submission"
    ],
    commonMistakes: [
      "Vague or generic case descriptions",
      "Missing business justification",
      "Incomplete competitive analysis",
      "No timeline or urgency specified",
      "Missing customer impact assessment",
      "Inadequate risk analysis",
      "Wrong category or routing",
      "Missing required approvals or documentation"
    ],
    qualityChecklist: [
      "✓ Title clearly identifies the request and customer",
      "✓ All required fields are completed",
      "✓ Business justification includes specific benefits/risks",
      "✓ Customer impact is clearly articulated",
      "✓ Timeline and urgency are appropriate",
      "✓ Competitive context is provided when relevant",
      "✓ Risk assessment covers both scenarios",
      "✓ Supporting documentation is attached",
      "✓ Precedent cases are referenced if available",
      "✓ Proper category and routing selected"
    ]
  },

  // Approval Process
  approvalProcess: {
    stages: [
      {
        stage: "submission",
        description: "Case submitted by sales rep",
        actions: ["Auto-routing", "Validation check", "Notification sent"]
      },
      {
        stage: "review",
        description: "Initial review by appropriate approver",
        actions: ["Requirements check", "Additional info request", "Stakeholder consultation"]
      },
      {
        stage: "evaluation",
        description: "Detailed evaluation and decision",
        actions: ["Risk assessment", "Precedent analysis", "Cross-functional input"]
      },
      {
        stage: "decision",
        description: "Final approval or denial",
        actions: ["Decision documented", "Conditions specified", "Notifications sent"]
      },
      {
        stage: "implementation",
        description: "Approved changes implemented",
        actions: ["Updates applied", "Customer notification", "Case closed"]
      }
    ],
    slaTargets: {
      critical: "4 hours",
      high: "24 hours",
      medium: "72 hours",
      low: "1 week"
    }
  }
};

// Helper functions for case creation
export const getCategoryGuidelines = (category) => {
  return caseCreationGuidelines.caseCategories[category] || null;
};

export const getRequiredFields = (category) => {
  const common = caseCreationGuidelines.requiredFields.common;
  const specific = caseCreationGuidelines.requiredFields[category] || [];
  return [...common, ...specific];
};

export const getRoutingInfo = (category, subcategory, dealValue, discountPercent) => {
  const routing = caseCreationGuidelines.routingLogic;
  
  // Determine approver based on discount percentage
  let discountApprover = null;
  if (discountPercent <= 10) discountApprover = routing.autoRouting.pricing["0-10%"];
  else if (discountPercent <= 20) discountApprover = routing.autoRouting.pricing["11-20%"];
  else if (discountPercent <= 30) discountApprover = routing.autoRouting.pricing["21-30%"];
  else discountApprover = routing.autoRouting.pricing["31%+"];
  
  // Determine approver based on deal size
  let sizeApprover = null;
  if (dealValue < 50000) sizeApprover = routing.autoRouting.dealSize["under-50k"];
  else if (dealValue < 250000) sizeApprover = routing.autoRouting.dealSize["50k-250k"];
  else if (dealValue < 500000) sizeApprover = routing.autoRouting.dealSize["250k-500k"];
  else sizeApprover = routing.autoRouting.dealSize["500k+"];
  
  // Get special routing for category
  const specialRouting = routing.specialRouting[category];
  
  return {
    discountApprover,
    sizeApprover,
    specialRouting,
    recommendedApprover: specialRouting ? specialRouting.requiredApprovers : [discountApprover?.approver, sizeApprover?.approver].filter(Boolean)
  };
};

export const getTemplate = (templateType) => {
  return caseCreationGuidelines.templates[templateType] || null;
};

export const validateCase = (caseData) => {
  const required = getRequiredFields(caseData.category);
  const missing = required.filter(field => 
    field.required && (!caseData[field.field] || caseData[field.field].toString().trim() === '')
  );
  
  const errors = [];
  if (missing.length > 0) {
    errors.push(`Missing required fields: ${missing.map(f => f.field).join(', ')}`);
  }
  
  // Validate specific field constraints
  if (caseData.title && caseData.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }
  
  if (caseData.description && caseData.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default caseCreationGuidelines;
