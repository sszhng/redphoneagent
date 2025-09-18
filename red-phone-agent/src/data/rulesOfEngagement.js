// Rules of Engagement (ROE) for B2B SaaS Media Solutions Company
// This mock data represents comprehensive sales policies and guidelines

export const rulesOfEngagement = {
  // Company Overview
  company: {
    name: "MediaFlow Solutions",
    industry: "B2B SaaS Media & Analytics",
    founded: "2018",
    headquarters: "San Francisco, CA"
  },

  // Deal Types and Definitions
  dealTypes: {
    newBusiness: {
      definition: "First-time customer acquisition with new logo",
      minimumCommitment: {
        enterprise: { seats: 100, value: 50000 },
        midmarket: { seats: 25, value: 15000 },
        smb: { seats: 5, value: 5000 },
        largeEnterprise: { seats: 500, value: 250000 },
        globalAccounts: { seats: 1000, value: 500000 }
      },
      approvalRequired: "Manager approval for all new business deals"
    },
    renewal: {
      definition: "Existing customer contract extension or expansion",
      minimumCommitment: {
        enterprise: { seats: 75, value: 40000 },
        midmarket: { seats: 20, value: 12000 },
        smb: { seats: 3, value: 3000 },
        largeEnterprise: { seats: 400, value: 200000 },
        globalAccounts: { seats: 800, value: 400000 }
      },
      approvalRequired: "Auto-approved if within standard terms"
    },
    addon: {
      definition: "Additional seats or modules to existing contract",
      minimumCommitment: "No minimum requirement for add-on purchases",
      approvalRequired: "Auto-approved for standard pricing"
    },
    upsell: {
      definition: "Upgrade to higher tier or additional features",
      minimumCommitment: "25% increase from current contract value",
      approvalRequired: "Manager approval for tier upgrades"
    }
  },

  // Discount and Pricing Policies
  discountPolicies: {
    standard: {
      newBusiness: {
        enterprise: { max: 20, typical: 15, autoApproved: 10 },
        midmarket: { max: 15, typical: 10, autoApproved: 7 },
        smb: { max: 10, typical: 5, autoApproved: 5 },
        largeEnterprise: { max: 25, typical: 20, autoApproved: 15 },
        globalAccounts: { max: 30, typical: 25, autoApproved: 20 }
      },
      renewal: {
        enterprise: { max: 15, typical: 10, autoApproved: 8 },
        midmarket: { max: 12, typical: 8, autoApproved: 5 },
        smb: { max: 8, typical: 3, autoApproved: 3 },
        largeEnterprise: { max: 20, typical: 15, autoApproved: 12 },
        globalAccounts: { max: 25, typical: 20, autoApproved: 15 }
      },
      addon: {
        all: { max: 5, typical: 0, autoApproved: 5 }
      }
    },
    regional: {
      namer: { additionalDiscount: 0, note: "Standard rates apply" },
      latam: { additionalDiscount: 5, note: "Market development pricing" },
      emea: { additionalDiscount: 3, note: "Competitive market adjustment" },
      apac: { additionalDiscount: 7, note: "Growth market incentive" }
    }
  },

  // Approval Workflows
  approvalWorkflow: {
    discountApproval: {
      "0-10%": { approver: "Auto-approved", timeframe: "Immediate" },
      "11-20%": { approver: "Sales Manager", timeframe: "24 hours" },
      "21-30%": { approver: "Regional Director", timeframe: "48 hours" },
      "31%+": { approver: "VP Sales + Finance", timeframe: "72 hours" }
    },
    dealSizeApproval: {
      "under50k": { approver: "Sales Manager", timeframe: "24 hours" },
      "50k-250k": { approver: "Regional Director", timeframe: "48 hours" },
      "250k-500k": { approver: "VP Sales", timeframe: "72 hours" },
      "500k+": { approver: "VP Sales + CEO", timeframe: "1 week" }
    },
    contractTerms: {
      "standard": { approver: "Auto-approved", timeframe: "Immediate" },
      "customTerms": { approver: "Legal + Sales Director", timeframe: "1 week" },
      "paymentTerms": { approver: "Finance + Sales Manager", timeframe: "48 hours" }
    }
  },

  // Pilot and Trial Programs
  pilotPrograms: {
    standard: {
      duration: "30 days",
      maxSeats: 10,
      features: "Core platform access",
      approvalRequired: "Sales Manager",
      conversionTarget: "80%"
    },
    enterprise: {
      duration: "60 days",
      maxSeats: 50,
      features: "Full platform + premium support",
      approvalRequired: "Regional Director",
      conversionTarget: "85%"
    },
    largeEnterprise: {
      duration: "90 days",
      maxSeats: 100,
      features: "Full platform + dedicated CSM",
      approvalRequired: "VP Sales",
      conversionTarget: "90%"
    },
    extended: {
      duration: "6+ months",
      conditions: "Strategic account only",
      approvalRequired: "VP Sales + CEO",
      justificationRequired: true
    }
  },

  // Commission and Compensation
  commissionStructure: {
    newBusiness: {
      base: 8,
      accelerator: {
        "100-150% quota": 10,
        "150%+ quota": 12
      }
    },
    renewal: {
      base: 3,
      expansionBonus: 5
    },
    addon: {
      base: 5
    }
  },

  // Territory and Account Management
  territoryRules: {
    accountOwnership: {
      enterprise: "Named account model",
      midmarket: "Geographic territory",
      smb: "Inbound/marketing qualified leads",
      largeEnterprise: "Named account with team selling",
      globalAccounts: "Dedicated account team"
    },
    leadRouting: {
      inbound: "Round-robin by territory",
      outbound: "Account owner priority",
      referral: "Originating rep gets credit"
    },
    accountTransfer: {
      process: "Manager approval required",
      timeframe: "End of quarter transition",
      compensation: "Split commission for 6 months"
    }
  },

  // Sales Process and Methodology
  salesProcess: {
    qualification: {
      framework: "BANT (Budget, Authority, Need, Timeline)",
      required: ["Budget confirmed", "Decision maker identified", "Use case validated", "Timeline established"]
    },
    stages: [
      { name: "Prospecting", activities: ["Research", "Initial outreach", "Discovery call"] },
      { name: "Qualification", activities: ["BANT qualification", "Stakeholder mapping", "Needs assessment"] },
      { name: "Proposal", activities: ["Technical demo", "Proposal presentation", "ROI analysis"] },
      { name: "Negotiation", activities: ["Contract review", "Pricing discussion", "Term negotiation"] },
      { name: "Closing", activities: ["Final approval", "Contract execution", "Implementation kickoff"] }
    ],
    requiredActivities: {
      discovery: { minimum: 2, stakeholders: ["End user", "Decision maker", "Technical buyer"] },
      demo: { customization: "Required for Enterprise+", followUp: "Within 48 hours" },
      proposal: { validity: "30 days", approval: "Manager review required" }
    }
  },

  // Competitive and Partnership Rules
  competitive: {
    battlecards: {
      primary: ["CompetitorA Analytics", "DataCorp Solutions", "MediaMax Pro"],
      positioning: "Superior integration capabilities and customer success",
      discountPolicy: "Additional 5% competitive discount available"
    },
    winLoss: {
      required: "Win/loss analysis for deals >$25k",
      timeline: "Within 7 days of deal close",
      stakeholders: ["Sales rep", "Sales manager", "Product marketing"]
    }
  },

  partnerProgram: {
    referral: {
      commission: "10% of first year ACV",
      paymentTerms: "Net 30 after customer payment received",
      requirements: "Active partner agreement"
    },
    channel: {
      discount: "Partner receives 20% margin",
      support: "Joint sales calls available",
      requirements: "Certified partner status"
    }
  },

  // Compliance and Legal
  compliance: {
    dataPrivacy: {
      regions: {
        emea: "GDPR compliance required",
        namer: "CCPA compliance for CA customers",
        apac: "Local data residency requirements",
        latam: "LGPD compliance for Brazil"
      },
      documentation: "Data Processing Agreement required for Enterprise+"
    },
    security: {
      certifications: ["SOC 2 Type II", "ISO 27001", "GDPR"],
      requirements: "Security questionnaire for Enterprise+",
      approvals: "Security review for custom integrations"
    }
  },

  // Escalation Procedures
  escalation: {
    internal: {
      level1: { contact: "Sales Manager", response: "4 hours" },
      level2: { contact: "Regional Director", response: "24 hours" },
      level3: { contact: "VP Sales", response: "48 hours" }
    },
    customer: {
      technical: { contact: "Solutions Engineer", response: "2 hours" },
      commercial: { contact: "Sales Manager", response: "4 hours" },
      executive: { contact: "Regional Director", response: "24 hours" }
    }
  },

  // Key Metrics and KPIs
  metrics: {
    quotaAttainment: {
      target: 100,
      accelerator: 110,
      expectations: {
        newHire: { year1: 70, year2: 85 },
        experienced: { minimum: 85, target: 100 }
      }
    },
    activityMetrics: {
      calls: { daily: 20, weekly: 100 },
      emails: { daily: 30, weekly: 150 },
      demos: { weekly: 5, monthly: 20 },
      proposals: { monthly: 8, quarterly: 25 }
    },
    pipelineMetrics: {
      coverage: "3x quota",
      velocity: "90 days average",
      winRate: {
        target: 25,
        newBusiness: 20,
        renewal: 85,
        upsell: 60
      }
    }
  },

  // Training and Certification
  training: {
    required: [
      { name: "Product Certification", frequency: "Annual", owner: "Product Marketing" },
      { name: "Sales Methodology", frequency: "Onboarding + Refresher", owner: "Sales Enablement" },
      { name: "Compliance Training", frequency: "Annual", owner: "Legal" }
    ],
    optional: [
      { name: "Industry Specialization", frequency: "Quarterly", owner: "Product Marketing" },
      { name: "Advanced Negotiation", frequency: "Annual", owner: "Sales Development" }
    ]
  },

  // Exception Handling
  exceptions: {
    process: "Submit exception request through Salesforce",
    approvalChain: ["Sales Manager", "Regional Director", "VP Sales"],
    documentation: "Business justification and risk assessment required",
    timeline: "72 hours for standard exceptions",
    commonExceptions: [
      "Non-standard payment terms",
      "Custom contract language",
      "Pricing below floor",
      "Extended trial periods",
      "Multi-year discount stacking"
    ]
  }
};

// Helper functions for easy access to ROE data
export const getRulesByDealType = (dealType) => {
  return rulesOfEngagement.dealTypes[dealType] || null;
};

export const getDiscountPolicy = (dealType, segment, region = 'namer') => {
  const standardDiscount = rulesOfEngagement.discountPolicies.standard[dealType]?.[segment];
  const regionalAdjustment = rulesOfEngagement.discountPolicies.regional[region]?.additionalDiscount || 0;
  
  if (standardDiscount) {
    return {
      ...standardDiscount,
      regionalAdjustment,
      effectiveMax: standardDiscount.max + regionalAdjustment
    };
  }
  return null;
};

export const getApprovalRequirement = (discountPercent, dealSize) => {
  const discountApproval = Object.entries(rulesOfEngagement.approvalWorkflow.discountApproval)
    .find(([range]) => {
      if (range.includes('+')) {
        const min = parseInt(range.split('%')[0]);
        return discountPercent >= min;
      } else {
        const [min, max] = range.split('-').map(r => parseInt(r));
        return discountPercent >= min && discountPercent <= max;
      }
    });

  const sizeApproval = Object.entries(rulesOfEngagement.approvalWorkflow.dealSizeApproval)
    .find(([range]) => {
      if (range.includes('+')) {
        const min = parseInt(range.split('k')[0]) * 1000;
        return dealSize >= min;
      } else if (range.includes('-')) {
        const [min, max] = range.split('-').map(r => parseInt(r.replace('k', '')) * 1000);
        return dealSize >= min && dealSize <= max;
      } else {
        const threshold = parseInt(range.replace('under', '').replace('k', '')) * 1000;
        return dealSize < threshold;
      }
    });

  return {
    discountApproval: discountApproval?.[1],
    sizeApproval: sizeApproval?.[1],
    highestLevel: discountApproval?.[1]?.approver === sizeApproval?.[1]?.approver 
      ? discountApproval?.[1] 
      : [discountApproval?.[1], sizeApproval?.[1]]
  };
};

export default rulesOfEngagement;
