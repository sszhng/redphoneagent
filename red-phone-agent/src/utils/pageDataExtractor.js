// Page Data Extractor for Solution Builder
// Extracts customer and deal information from the current quote page

export const extractSolutionBuilderData = () => {
  // In a real implementation, this would extract data from the actual DOM
  // For demo purposes, we'll use the dummy data from our Solution Builder
  
  return {
    customer: {
      name: "Pellegrino E2E Test 2fcol3xsi8ljg",
      primaryContact: {
        name: "firstname lastname",
        email: "linkedin.ei@gmail.com", 
        phone: "363199424"
      },
      billingContact: {
        name: "firstname lastname",
        email: "linkedin.ei@gmail.com",
        phone: "363199424"
      },
      address: {
        company: "Pellegrino E2E Test 2fcol3xsi8ljg",
        street: "999 N Mathilda Ave",
        city: "Sunnyvale",
        state: "CA",
        zipCode: "94085-3505",
        country: "United States"
      }
    },
    deal: {
      totalValue: 487500.00,
      currency: "USD",
      dealType: "New Business", // Assumed from quote structure
      segment: "Enterprise", // Inferred from product type
      region: "NAMER", // Inferred from address
      products: [
        {
          name: "Hiring Enterprise Program",
          quantity: 1,
          unitPrice: 487500.00,
          features: ["Job Slot - Unlimited", "Recruiter Corporate - Unlimited", "Career Pages - Enterprise basic package"]
        }
      ],
      timeline: "3 years",
      startDate: "2025-07-21",
      endDate: "2028-07-20"
    },
    quote: {
      id: "2fcol3xsi8ljg",
      status: "Pending",
      createdDate: new Date().toISOString(),
      totalBeforeTax: 487500.00,
      estimatedTax: 0.00,
      totalAfterTax: 487500.00
    }
  };
};

export const getCaseRequiredFields = (caseCategory) => {
  const commonFields = [
    { id: 'title', label: 'Case Title', type: 'text', required: true },
    { id: 'description', label: 'Description', type: 'textarea', required: true },
    { id: 'businessJustification', label: 'Business Justification', type: 'textarea', required: true },
    { id: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
    { id: 'timeline', label: 'Required Timeline', type: 'select', options: ['Immediate', 'Within 24 hours', 'Within 1 week', 'Within 1 month'], required: true }
  ];

  const categorySpecificFields = {
    'Pricing': [
      { id: 'requestedDiscount', label: 'Requested Discount %', type: 'number', required: true },
      { id: 'competitorInfo', label: 'Competitor Information', type: 'textarea', required: false },
      { id: 'customerPressure', label: 'Customer Pressure Level', type: 'select', options: ['Low', 'Medium', 'High'], required: true }
    ],
    'Deal Structure': [
      { id: 'requestedTerms', label: 'Requested Terms', type: 'textarea', required: true },
      { id: 'standardTermsDeviation', label: 'How does this deviate from standard terms?', type: 'textarea', required: true }
    ],
    'Legal': [
      { id: 'legalRequirements', label: 'Specific Legal Requirements', type: 'textarea', required: true },
      { id: 'urgencyReason', label: 'Reason for Urgency', type: 'textarea', required: true }
    ],
    'System Issues': [
      { id: 'errorMessage', label: 'Error Message', type: 'textarea', required: true },
      { id: 'stepsToReproduce', label: 'Steps to Reproduce', type: 'textarea', required: true }
    ]
  };

  return [...commonFields, ...(categorySpecificFields[caseCategory] || [])];
};

export const generateCaseTitle = (category, customerName, dealValue) => {
  const titles = {
    'Pricing': `Pricing Exception Request - ${customerName} ($${dealValue?.toLocaleString()})`,
    'Deal Structure': `Deal Structure Modification - ${customerName} ($${dealValue?.toLocaleString()})`,
    'Legal': `Legal Terms Review - ${customerName} ($${dealValue?.toLocaleString()})`,
    'System Issues': `System Issue Resolution - ${customerName}`,
    'General': `Support Request - ${customerName} ($${dealValue?.toLocaleString()})`
  };

  return titles[category] || titles['General'];
};
