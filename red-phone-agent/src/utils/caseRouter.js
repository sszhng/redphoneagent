// Case Routing Logic for Red Phone Agent
// Intelligent routing based on request type, complexity, deal size, and urgency

import { getApprovalRequirement, getDiscountPolicy, rulesOfEngagement } from '../data/rulesOfEngagement.js';

class CaseRouter {
  constructor() {
    // Define routing rules and approval hierarchies
    this.routingRules = {
      // Approval levels in order of authority
      approvalLevels: [
        { level: 1, title: 'Auto-approved', response: 'Immediate' },
        { level: 2, title: 'Sales Manager', response: '24 hours' },
        { level: 3, title: 'Regional Director', response: '48 hours' },
        { level: 4, title: 'VP Sales', response: '72 hours' },
        { level: 5, title: 'VP Sales + Finance', response: '1 week' },
        { level: 6, title: 'VP Sales + CEO', response: '1 week' }
      ],

      // Team specializations
      teams: {
        pricing: {
          primary: 'Sales Manager',
          secondary: 'Regional Director',
          escalation: 'VP Sales + Finance'
        },
        technical: {
          primary: 'Solutions Engineer',
          secondary: 'Engineering Manager',
          escalation: 'VP Engineering'
        },
        legal: {
          primary: 'Legal Team',
          secondary: 'Legal + Sales Director',
          escalation: 'General Counsel'
        },
        competitive: {
          primary: 'Sales Manager',
          secondary: 'Regional Director',
          escalation: 'VP Sales'
        },
        customerSuccess: {
          primary: 'Customer Success Manager',
          secondary: 'CS Director',
          escalation: 'VP Customer Success'
        }
      }
    };
  }

  // Main routing function
  routeCase(caseData) {
    try {
      // Analyze case complexity and requirements
      const analysis = this.analyzeCaseComplexity(caseData);
      
      // Determine required approval level
      const approvalRequirement = this.determineApprovalLevel(caseData, analysis);
      
      // Route to appropriate team
      const teamAssignment = this.assignTeam(caseData, analysis);
      
      // Calculate urgency and timeline
      const urgencyAssessment = this.assessUrgency(caseData, analysis);
      
      // Generate routing recommendations
      const recommendations = this.generateRecommendations(caseData, analysis, approvalRequirement);

      return {
        success: true,
        routing: {
          primaryApprover: approvalRequirement.primaryApprover,
          secondaryApprover: approvalRequirement.secondaryApprover,
          team: teamAssignment.primaryTeam,
          supportingTeams: teamAssignment.supportingTeams,
          approvalLevel: approvalRequirement.level,
          expectedTimeline: approvalRequirement.timeline,
          urgency: urgencyAssessment.level,
          escalationPath: this.buildEscalationPath(caseData, analysis)
        },
        analysis: {
          complexity: analysis.complexity,
          riskLevel: analysis.riskLevel,
          precedentAvailable: analysis.precedentAvailable,
          autoApprovable: analysis.autoApprovable
        },
        recommendations: recommendations,
        routing_rationale: this.explainRouting(caseData, analysis, approvalRequirement, teamAssignment)
      };
    } catch (error) {
      console.error('Case routing error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackRouting(caseData)
      };
    }
  }

  analyzeCaseComplexity(caseData) {
    let complexityScore = 0;
    const factors = [];
    
    // Deal size impact
    const dealValue = parseFloat(caseData.dealValue) || 0;
    if (dealValue > 500000) {
      complexityScore += 3;
      factors.push('Large deal size (>$500k)');
    } else if (dealValue > 100000) {
      complexityScore += 2;
      factors.push('Significant deal size (>$100k)');
    } else if (dealValue > 25000) {
      complexityScore += 1;
      factors.push('Medium deal size (>$25k)');
    }

    // Discount percentage impact
    const discountPercent = parseFloat(caseData.discountRequested) || 0;
    if (discountPercent > 30) {
      complexityScore += 3;
      factors.push('Very high discount request (>30%)');
    } else if (discountPercent > 20) {
      complexityScore += 2;
      factors.push('High discount request (>20%)');
    } else if (discountPercent > 10) {
      complexityScore += 1;
      factors.push('Moderate discount request (>10%)');
    }

    // Category complexity
    const categoryComplexity = {
      'pricing': 1,
      'dealStructure': 2,
      'technical': 3,
      'legal': 3,
      'competitive': 2,
      'pilotProgram': 2,
      'customerSuccess': 1,
      'general': 1
    };
    complexityScore += categoryComplexity[caseData.category] || 1;
    factors.push(`Category: ${caseData.category}`);

    // Priority impact
    const priorityMultiplier = {
      'low': 1,
      'medium': 1.2,
      'high': 1.5,
      'critical': 2
    };
    complexityScore *= (priorityMultiplier[caseData.priority] || 1);
    
    if (caseData.priority === 'critical') {
      factors.push('Critical priority escalation');
    }

    // Custom terms or competitive factors
    if (caseData.competitorInfo && caseData.competitorInfo.trim()) {
      complexityScore += 2;
      factors.push('Competitive situation');
    }

    // Multi-year or custom terms
    if (caseData.description && caseData.description.toLowerCase().includes('multi-year')) {
      complexityScore += 1;
      factors.push('Multi-year terms requested');
    }

    // Determine overall complexity
    let complexity = 'simple';
    let riskLevel = 'low';
    
    if (complexityScore >= 8) {
      complexity = 'very_complex';
      riskLevel = 'high';
    } else if (complexityScore >= 5) {
      complexity = 'complex';
      riskLevel = 'medium';
    } else if (complexityScore >= 3) {
      complexity = 'moderate';
      riskLevel = 'medium';
    }

    return {
      complexity,
      complexityScore,
      riskLevel,
      factors,
      autoApprovable: complexityScore <= 2 && discountPercent <= 10,
      precedentAvailable: this.checkForPrecedent(caseData)
    };
  }

  determineApprovalLevel(caseData, analysis) {
    const dealValue = parseFloat(caseData.dealValue) || 0;
    const discountPercent = parseFloat(caseData.discountRequested) || 0;

    // Get ROE approval requirements
    let approvalReq = null;
    if (discountPercent > 0 && dealValue > 0) {
      approvalReq = getApprovalRequirement(discountPercent, dealValue);
    }

    // Determine primary approver based on case type and ROE
    let primaryApprover = 'Sales Manager';
    let level = 2;
    let timeline = '24 hours';

    if (analysis.autoApprovable) {
      primaryApprover = 'Auto-approved';
      level = 1;
      timeline = 'Immediate';
    } else if (approvalReq?.discountApproval) {
      primaryApprover = approvalReq.discountApproval.approver;
      timeline = approvalReq.discountApproval.timeframe;
      
      // Map approver to level
      if (primaryApprover.includes('VP') && primaryApprover.includes('Finance')) {
        level = 5;
      } else if (primaryApprover.includes('VP')) {
        level = 4;
      } else if (primaryApprover.includes('Director')) {
        level = 3;
      } else if (primaryApprover.includes('Manager')) {
        level = 2;
      }
    } else {
      // Category-based routing
      switch (caseData.category) {
        case 'technical':
          if (dealValue > 250000) {
            primaryApprover = 'VP Engineering';
            level = 4;
            timeline = '72 hours';
          } else {
            primaryApprover = 'Engineering Manager';
            level = 3;
            timeline = '48 hours';
          }
          break;
          
        case 'legal':
          primaryApprover = 'Legal + Sales Director';
          level = 4;
          timeline = '1 week';
          break;
          
        case 'competitive':
          if (caseData.priority === 'critical') {
            primaryApprover = 'VP Sales';
            level = 4;
            timeline = '4 hours';
          } else if (discountPercent > 20) {
            primaryApprover = 'Regional Director';
            level = 3;
            timeline = '48 hours';
          }
          break;
          
        case 'customerSuccess':
          primaryApprover = 'CS Director';
          level = 3;
          timeline = '48 hours';
          break;
          
        default:
          // Use deal size for general cases
          if (dealValue > 500000) {
            primaryApprover = 'VP Sales';
            level = 4;
            timeline = '72 hours';
          } else if (dealValue > 100000) {
            primaryApprover = 'Regional Director';
            level = 3;
            timeline = '48 hours';
          }
      }
    }

    // Determine secondary approver for high-risk cases
    let secondaryApprover = null;
    if (analysis.riskLevel === 'high' || level >= 4) {
      if (caseData.category === 'legal') {
        secondaryApprover = 'General Counsel';
      } else if (dealValue > 500000) {
        secondaryApprover = 'CEO';
      } else if (primaryApprover.includes('Finance')) {
        secondaryApprover = 'CFO';
      }
    }

    return {
      primaryApprover,
      secondaryApprover,
      level,
      timeline,
      requiresFinanceApproval: primaryApprover.includes('Finance') || dealValue > 500000,
      requiresLegalReview: caseData.category === 'legal' || analysis.riskLevel === 'high'
    };
  }

  assignTeam(caseData, analysis) {
    const teams = this.routingRules.teams;
    
    // Primary team based on category
    const categoryTeamMap = {
      'pricing': 'pricing',
      'dealStructure': 'pricing',
      'technical': 'technical',
      'legal': 'legal',
      'competitive': 'competitive',
      'pilotProgram': 'pricing',
      'customerSuccess': 'customerSuccess',
      'general': 'pricing'
    };

    const primaryTeamType = categoryTeamMap[caseData.category] || 'pricing';
    const primaryTeam = teams[primaryTeamType];

    // Supporting teams based on complexity and risk
    const supportingTeams = [];
    
    if (analysis.riskLevel === 'high') {
      supportingTeams.push('Legal Team');
    }
    
    if (parseFloat(caseData.dealValue) > 250000) {
      supportingTeams.push('Finance Team');
    }
    
    if (caseData.competitorInfo) {
      supportingTeams.push('Product Marketing');
    }
    
    if (caseData.category === 'technical') {
      supportingTeams.push('Solutions Engineering');
    }

    return {
      primaryTeam: primaryTeam.primary,
      supportingTeams: [...new Set(supportingTeams)], // Remove duplicates
      escalationTeam: primaryTeam.escalation
    };
  }

  assessUrgency(caseData, analysis) {
    let urgencyScore = 0;
    const factors = [];

    // Priority-based urgency
    const priorityScore = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    urgencyScore += priorityScore[caseData.priority] || 2;
    factors.push(`Priority: ${caseData.priority}`);

    // Deal size urgency
    const dealValue = parseFloat(caseData.dealValue) || 0;
    if (dealValue > 500000) {
      urgencyScore += 2;
      factors.push('Large deal size');
    } else if (dealValue > 100000) {
      urgencyScore += 1;
      factors.push('Significant deal size');
    }

    // Competitive urgency
    if (caseData.competitorInfo) {
      urgencyScore += 2;
      factors.push('Competitive situation');
    }

    // Time sensitivity
    if (caseData.timeframe) {
      const timeframe = caseData.timeframe.toLowerCase();
      if (timeframe.includes('urgent') || timeframe.includes('asap') || timeframe.includes('immediate')) {
        urgencyScore += 2;
        factors.push('Urgent timeframe');
      } else if (timeframe.includes('week') || timeframe.includes('soon')) {
        urgencyScore += 1;
        factors.push('Short timeframe');
      }
    }

    // Renewal risk
    if (caseData.description && caseData.description.toLowerCase().includes('renewal') && 
        caseData.description.toLowerCase().includes('risk')) {
      urgencyScore += 2;
      factors.push('Renewal at risk');
    }

    // Determine urgency level
    let level = 'low';
    if (urgencyScore >= 7) {
      level = 'critical';
    } else if (urgencyScore >= 5) {
      level = 'high';
    } else if (urgencyScore >= 3) {
      level = 'medium';
    }

    return {
      level,
      score: urgencyScore,
      factors
    };
  }

  buildEscalationPath(caseData, analysis) {
    const dealValue = parseFloat(caseData.dealValue) || 0;
    const path = [];

    // Build escalation hierarchy
    if (analysis.complexity === 'simple') {
      path.push('Sales Manager');
      if (dealValue > 100000) {
        path.push('Regional Director');
      }
    } else {
      path.push('Sales Manager');
      path.push('Regional Director');
      if (dealValue > 250000 || analysis.riskLevel === 'high') {
        path.push('VP Sales');
      }
      if (dealValue > 500000 || caseData.category === 'legal') {
        path.push('VP Sales + CEO');
      }
    }

    return path;
  }

  generateRecommendations(caseData, analysis, approvalRequirement) {
    const recommendations = [];

    // Auto-approval recommendations
    if (analysis.autoApprovable) {
      recommendations.push({
        type: 'auto_approve',
        priority: 'high',
        message: 'This request meets auto-approval criteria',
        action: 'Process immediately without additional approval'
      });
    }

    // Policy compliance recommendations
    if (caseData.category === 'pricing') {
      const discountPercent = parseFloat(caseData.discountRequested) || 0;
      const segment = this.inferSegment(caseData);
      const policy = getDiscountPolicy('newBusiness', segment);
      
      if (policy && discountPercent > policy.max) {
        recommendations.push({
          type: 'policy_violation',
          priority: 'high',
          message: `Requested ${discountPercent}% exceeds policy limit of ${policy.max}% for ${segment}`,
          action: 'Requires exception approval with strong business justification'
        });
      }
    }

    // Precedent recommendations
    if (analysis.precedentAvailable) {
      recommendations.push({
        type: 'precedent_available',
        priority: 'medium',
        message: 'Similar cases found in historical database',
        action: 'Review precedent cases for guidance and consistency'
      });
    }

    // Risk mitigation recommendations
    if (analysis.riskLevel === 'high') {
      recommendations.push({
        type: 'risk_mitigation',
        priority: 'high',
        message: 'High-risk case requires additional review',
        action: 'Include legal and finance teams in approval process'
      });
    }

    // Competitive recommendations
    if (caseData.competitorInfo) {
      recommendations.push({
        type: 'competitive_response',
        priority: 'high',
        message: 'Competitive situation requires rapid response',
        action: 'Expedite approval process and involve product marketing'
      });
    }

    // Documentation recommendations
    if (caseData.category === 'legal' || analysis.riskLevel === 'high') {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        message: 'Additional documentation required',
        action: 'Ensure all contracts and risk assessments are complete'
      });
    }

    return recommendations;
  }

  checkForPrecedent(caseData) {
    // Simplified precedent check - in real implementation, this would query historical cases
    const commonCategories = ['pricing', 'dealStructure', 'competitive'];
    return commonCategories.includes(caseData.category);
  }

  inferSegment(caseData) {
    const dealValue = parseFloat(caseData.dealValue) || 0;
    
    if (dealValue >= 500000) return 'globalAccounts';
    if (dealValue >= 250000) return 'largeEnterprise';
    if (dealValue >= 50000) return 'enterprise';
    if (dealValue >= 15000) return 'midmarket';
    return 'smb';
  }

  explainRouting(caseData, analysis, approvalRequirement, teamAssignment) {
    const reasons = [];
    
    reasons.push(`Case categorized as "${caseData.category}" with ${analysis.complexity} complexity`);
    reasons.push(`Risk level: ${analysis.riskLevel} based on deal size and request type`);
    reasons.push(`Routed to ${approvalRequirement.primaryApprover} based on ${approvalRequirement.level > 2 ? 'discount percentage and deal size' : 'standard approval workflow'}`);
    reasons.push(`Primary team: ${teamAssignment.primaryTeam} for ${caseData.category} expertise`);
    
    if (teamAssignment.supportingTeams.length > 0) {
      reasons.push(`Supporting teams included: ${teamAssignment.supportingTeams.join(', ')}`);
    }
    
    return reasons;
  }

  generateFallbackRouting(caseData) {
    return {
      routing: {
        primaryApprover: 'Sales Manager',
        team: 'Sales Manager',
        approvalLevel: 2,
        expectedTimeline: '48 hours',
        urgency: 'medium'
      },
      message: 'Default routing applied due to analysis error'
    };
  }

  // Quick routing helpers
  getRouteForDiscountRequest(discountPercent, dealValue, segment = 'enterprise') {
    const policy = getDiscountPolicy('newBusiness', segment);
    const approval = getApprovalRequirement(discountPercent, dealValue);
    
    return {
      isWithinPolicy: policy && discountPercent <= policy.max,
      autoApproved: policy && discountPercent <= policy.autoApproved,
      requiredApprover: approval?.discountApproval?.approver || 'Sales Manager',
      timeline: approval?.discountApproval?.timeframe || '24 hours',
      policyLimit: policy?.max || 'Unknown'
    };
  }

  getRouteForDealSize(dealValue) {
    const approval = getApprovalRequirement(0, dealValue);
    
    return {
      requiredApprover: approval?.sizeApproval?.approver || 'Sales Manager',
      timeline: approval?.sizeApproval?.timeframe || '24 hours',
      requiresFinance: dealValue > 250000,
      requiresExecutive: dealValue > 500000
    };
  }
}

// Create singleton instance
const caseRouter = new CaseRouter();

export default caseRouter;
