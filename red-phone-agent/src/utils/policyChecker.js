// Policy Compliance Checker for Red Phone Agent
// Validates case requests against company ROE and provides recommendations

import { getDiscountPolicy, getApprovalRequirement, rulesOfEngagement } from '../data/rulesOfEngagement.js';
import { searchCases, getSimilarCases } from '../data/historicalCases.js';

class PolicyChecker {
  constructor() {
    this.complianceRules = {
      // Discount policy rules
      discountLimits: {
        smb: { max: 10, autoApproved: 5 },
        midmarket: { max: 15, autoApproved: 7 },
        enterprise: { max: 20, autoApproved: 10 },
        largeEnterprise: { max: 25, autoApproved: 15 },
        globalAccounts: { max: 30, autoApproved: 20 }
      },
      
      // Minimum requirements
      minimumRequirements: {
        seats: { smb: 5, midmarket: 25, enterprise: 100, largeEnterprise: 500, globalAccounts: 1000 },
        value: { smb: 5000, midmarket: 15000, enterprise: 50000, largeEnterprise: 250000, globalAccounts: 500000 }
      },

      // Deal size thresholds
      dealSizeThresholds: {
        small: 25000,
        medium: 100000,
        large: 250000,
        enterprise: 500000
      }
    };

    this.complianceChecks = [
      'discountCompliance',
      'minimumRequirements',
      'approvalWorkflow',
      'dealStructure',
      'competitivePolicy',
      'pilotProgramRules',
      'paymentTerms',
      'technicalCompliance',
      'legalCompliance'
    ];
  }

  // Main compliance checking function
  checkCompliance(caseData) {
    try {
      const results = {
        overallCompliance: 'compliant',
        score: 100,
        violations: [],
        warnings: [],
        recommendations: [],
        approvalRequirements: {},
        precedentAnalysis: {},
        riskAssessment: {},
        complianceChecks: {}
      };

      // Run all compliance checks
      for (const checkType of this.complianceChecks) {
        try {
          const checkResult = this[checkType](caseData);
          results.complianceChecks[checkType] = checkResult;
          
          // Aggregate results
          if (checkResult.violations) {
            results.violations.push(...checkResult.violations);
          }
          if (checkResult.warnings) {
            results.warnings.push(...checkResult.warnings);
          }
          if (checkResult.recommendations) {
            results.recommendations.push(...checkResult.recommendations);
          }

          // Adjust compliance score
          if (checkResult.score !== undefined) {
            results.score = Math.min(results.score, checkResult.score);
          }
        } catch (error) {
          console.error(`Policy check ${checkType} failed:`, error);
          results.warnings.push({
            type: 'system',
            severity: 'medium',
            message: `Unable to complete ${checkType} check`,
            impact: 'May require manual review'
          });
        }
      }

      // Determine overall compliance status
      results.overallCompliance = this.determineOverallCompliance(results);
      
      // Get approval requirements
      results.approvalRequirements = this.getApprovalRequirements(caseData, results);
      
      // Analyze precedents
      results.precedentAnalysis = this.analyzePrecedents(caseData);
      
      // Assess risk
      results.riskAssessment = this.assessRisk(caseData, results);

      return {
        success: true,
        compliance: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Policy compliance check error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackCompliance(caseData)
      };
    }
  }

  // Individual compliance checks

  discountCompliance(caseData) {
    const result = {
      type: 'discount_compliance',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    if (!caseData.discountRequested || caseData.category !== 'pricing') {
      return result; // Not applicable
    }

    const discountPercent = parseFloat(caseData.discountRequested);
    const segment = this.inferSegment(caseData);
    const dealType = this.inferDealType(caseData);

    // Get policy limits
    const policy = getDiscountPolicy(dealType, segment);
    
    if (!policy) {
      result.warnings.push({
        type: 'policy_lookup',
        severity: 'medium',
        message: 'Unable to determine discount policy for this segment/deal type',
        impact: 'Manual review required'
      });
      return result;
    }

    // Check against policy limits
    if (discountPercent > policy.max) {
      result.compliant = false;
      result.score = 20;
      result.violations.push({
        type: 'discount_limit_exceeded',
        severity: 'high',
        message: `Requested ${discountPercent}% exceeds policy limit of ${policy.max}% for ${segment} ${dealType}`,
        policyLimit: policy.max,
        requestedValue: discountPercent,
        impact: 'Requires exception approval'
      });
    } else if (discountPercent > policy.autoApproved) {
      result.warnings.push({
        type: 'approval_required',
        severity: 'medium',
        message: `${discountPercent}% discount requires manager approval (auto-approved up to ${policy.autoApproved}%)`,
        approvalRequired: true,
        impact: 'Additional approval needed'
      });
      result.score = 70;
    }

    // Regional adjustments
    if (policy.regionalAdjustment > 0) {
      result.recommendations.push({
        type: 'regional_adjustment',
        priority: 'info',
        message: `Regional adjustment of +${policy.regionalAdjustment}% available (effective limit: ${policy.effectiveMax}%)`,
        benefit: 'May allow higher discount within policy'
      });
    }

    return result;
  }

  minimumRequirements(caseData) {
    const result = {
      type: 'minimum_requirements',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const segment = this.inferSegment(caseData);
    const dealValue = parseFloat(caseData.dealValue) || 0;
    const dealType = this.inferDealType(caseData);

    // Skip for add-on deals
    if (dealType === 'addon') {
      result.recommendations.push({
        type: 'addon_exemption',
        priority: 'info',
        message: 'Add-on deals are exempt from minimum requirements',
        benefit: 'No minimum seat or value restrictions'
      });
      return result;
    }

    // Check minimum value requirements
    const minValue = this.complianceRules.minimumRequirements.value[segment];
    if (minValue && dealValue > 0 && dealValue < minValue) {
      result.compliant = false;
      result.score = 30;
      result.violations.push({
        type: 'minimum_value',
        severity: 'high',
        message: `Deal value $${dealValue.toLocaleString()} below ${segment} minimum of $${minValue.toLocaleString()}`,
        policyMinimum: minValue,
        actualValue: dealValue,
        impact: 'Requires exception approval'
      });
    }

    // Check for seat requirements if mentioned
    const description = caseData.description?.toLowerCase() || '';
    const seatMatch = description.match(/(\d+)\s*seats?/);
    if (seatMatch) {
      const requestedSeats = parseInt(seatMatch[1]);
      const minSeats = this.complianceRules.minimumRequirements.seats[segment];
      
      if (minSeats && requestedSeats < minSeats) {
        result.violations.push({
          type: 'minimum_seats',
          severity: 'high',
          message: `Requested ${requestedSeats} seats below ${segment} minimum of ${minSeats}`,
          policyMinimum: minSeats,
          requestedValue: requestedSeats,
          impact: 'Requires exception approval'
        });
        result.compliant = false;
        result.score = Math.min(result.score, 30);
      }
    }

    return result;
  }

  approvalWorkflow(caseData) {
    const result = {
      type: 'approval_workflow',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const discountPercent = parseFloat(caseData.discountRequested) || 0;
    const dealValue = parseFloat(caseData.dealValue) || 0;

    if (discountPercent > 0 && dealValue > 0) {
      const approvalReq = getApprovalRequirement(discountPercent, dealValue);
      
      if (approvalReq.discountApproval) {
        result.recommendations.push({
          type: 'approval_path',
          priority: 'high',
          message: `Requires ${approvalReq.discountApproval.approver} approval (${approvalReq.discountApproval.timeframe})`,
          approver: approvalReq.discountApproval.approver,
          timeframe: approvalReq.discountApproval.timeframe,
          benefit: 'Clear approval path identified'
        });
      }

      if (approvalReq.sizeApproval && approvalReq.sizeApproval.approver !== approvalReq.discountApproval?.approver) {
        result.recommendations.push({
          type: 'dual_approval',
          priority: 'high',
          message: `Deal size also requires ${approvalReq.sizeApproval.approver} approval`,
          approver: approvalReq.sizeApproval.approver,
          timeframe: approvalReq.sizeApproval.timeframe,
          benefit: 'Ensures proper deal size approval'
        });
      }
    }

    // High-value deal warnings
    if (dealValue > 500000) {
      result.warnings.push({
        type: 'high_value_deal',
        severity: 'medium',
        message: 'Large deals may require executive and finance approval',
        impact: 'Extended approval timeline possible'
      });
    }

    return result;
  }

  dealStructure(caseData) {
    const result = {
      type: 'deal_structure',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const description = caseData.description?.toLowerCase() || '';
    
    // Check for non-standard terms
    if (description.includes('payment terms') || description.includes('net 60') || description.includes('net 90')) {
      result.warnings.push({
        type: 'payment_terms',
        severity: 'medium',
        message: 'Non-standard payment terms detected',
        impact: 'Finance team review required'
      });
      result.score = 80;
    }

    // Multi-year deal considerations
    if (description.includes('multi-year') || description.includes('3 year') || description.includes('multiple years')) {
      result.recommendations.push({
        type: 'multi_year_terms',
        priority: 'medium',
        message: 'Multi-year deals may qualify for additional discounts',
        benefit: 'Potential for better terms due to commitment'
      });
    }

    // Equity or non-cash terms
    if (description.includes('equity') || description.includes('stock') || description.includes('barter')) {
      result.violations.push({
        type: 'non_cash_payment',
        severity: 'high',
        message: 'Non-cash payment structures require special approval',
        impact: 'May not be permitted under current policy'
      });
      result.compliant = false;
      result.score = 10;
    }

    return result;
  }

  competitivePolicy(caseData) {
    const result = {
      type: 'competitive_policy',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const hasCompetitor = caseData.competitorInfo && caseData.competitorInfo.trim().length > 0;
    const description = caseData.description?.toLowerCase() || '';
    const isCompetitive = hasCompetitor || description.includes('competitive') || description.includes('competitor');

    if (isCompetitive) {
      result.recommendations.push({
        type: 'competitive_discount',
        priority: 'high',
        message: 'Competitive situations may qualify for additional 5% discount',
        benefit: 'ROE allows competitive response pricing'
      });

      result.recommendations.push({
        type: 'competitive_documentation',
        priority: 'medium',
        message: 'Document competitive intelligence and win/loss factors',
        benefit: 'Required for post-deal analysis'
      });

      if (caseData.priority === 'critical') {
        result.recommendations.push({
          type: 'expedited_approval',
          priority: 'high',
          message: 'Critical competitive situations qualify for expedited approval',
          benefit: 'Faster response time to competitive threats'
        });
      }
    }

    return result;
  }

  pilotProgramRules(caseData) {
    const result = {
      type: 'pilot_program',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const description = caseData.description?.toLowerCase() || '';
    const isPilot = description.includes('pilot') || description.includes('trial') || description.includes('poc');

    if (isPilot) {
      const segment = this.inferSegment(caseData);
      
      // Standard pilot durations
      const standardDurations = {
        smb: 30,
        midmarket: 30,
        enterprise: 60,
        largeEnterprise: 90,
        globalAccounts: 90
      };

      const standardDuration = standardDurations[segment] || 30;
      
      result.recommendations.push({
        type: 'pilot_duration',
        priority: 'medium',
        message: `Standard pilot duration for ${segment}: ${standardDuration} days`,
        benefit: 'Aligns with ROE pilot policies'
      });

      // Extended pilot warnings
      if (description.includes('6 month') || description.includes('extended') || description.includes('long')) {
        result.warnings.push({
          type: 'extended_pilot',
          severity: 'medium',
          message: 'Extended pilots (6+ months) require VP approval',
          impact: 'Higher approval level needed'
        });
        result.score = 70;
      }
    }

    return result;
  }

  paymentTerms(caseData) {
    const result = {
      type: 'payment_terms',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const description = caseData.description?.toLowerCase() || '';
    
    // Standard terms are Net 30
    if (description.includes('net 60')) {
      result.warnings.push({
        type: 'extended_terms',
        severity: 'medium',
        message: 'Net 60 terms require finance approval',
        impact: 'Finance team review needed'
      });
      result.score = 80;
    }

    if (description.includes('net 90') || description.includes('net 120')) {
      result.violations.push({
        type: 'excessive_terms',
        severity: 'high',
        message: 'Payment terms beyond Net 60 require executive approval',
        impact: 'Executive and finance approval required'
      });
      result.compliant = false;
      result.score = 40;
    }

    return result;
  }

  technicalCompliance(caseData) {
    const result = {
      type: 'technical_compliance',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    if (caseData.category !== 'technical') {
      return result; // Not applicable
    }

    const description = caseData.description?.toLowerCase() || '';
    
    // Custom development requests
    if (description.includes('custom') || description.includes('integration') || description.includes('api')) {
      result.warnings.push({
        type: 'custom_development',
        severity: 'medium',
        message: 'Custom development requests require engineering review',
        impact: 'Engineering team assessment needed'
      });
      
      result.recommendations.push({
        type: 'development_premium',
        priority: 'medium',
        message: 'Custom development typically includes 15-25% premium',
        benefit: 'Covers additional development costs'
      });
    }

    // Security requirements
    if (description.includes('security') || description.includes('compliance') || description.includes('soc') || description.includes('gdpr')) {
      result.recommendations.push({
        type: 'security_review',
        priority: 'high',
        message: 'Security requirements may need certification team review',
        benefit: 'Ensures compliance capabilities'
      });
    }

    return result;
  }

  legalCompliance(caseData) {
    const result = {
      type: 'legal_compliance',
      compliant: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: []
    };

    if (caseData.category !== 'legal') {
      return result; // Not applicable unless legal category
    }

    const description = caseData.description?.toLowerCase() || '';
    
    // Contract modifications
    if (description.includes('contract') || description.includes('terms') || description.includes('msa')) {
      result.warnings.push({
        type: 'contract_review',
        severity: 'high',
        message: 'Contract modifications require legal team review',
        impact: 'Legal review timeline required'
      });
      result.score = 60;
    }

    // Data privacy considerations
    if (description.includes('gdpr') || description.includes('privacy') || description.includes('data residency')) {
      result.recommendations.push({
        type: 'privacy_compliance',
        priority: 'high',
        message: 'Data privacy requirements need compliance team input',
        benefit: 'Ensures regulatory compliance'
      });
    }

    return result;
  }

  // Helper methods

  determineOverallCompliance(results) {
    if (results.violations.length > 0) {
      const highSeverityViolations = results.violations.filter(v => v.severity === 'high');
      return highSeverityViolations.length > 0 ? 'non_compliant' : 'conditional';
    }
    
    if (results.warnings.length > 0) {
      return 'conditional';
    }
    
    return 'compliant';
  }

  getApprovalRequirements(caseData, complianceResults) {
    const requirements = {
      level: 'manager',
      approvers: ['Sales Manager'],
      timeline: '24-48 hours',
      conditions: []
    };

    // High-value deals
    const dealValue = parseFloat(caseData.dealValue) || 0;
    if (dealValue > 500000) {
      requirements.level = 'executive';
      requirements.approvers.push('VP Sales', 'Finance');
      requirements.timeline = '3-5 days';
    } else if (dealValue > 100000) {
      requirements.level = 'director';
      requirements.approvers.push('Regional Director');
      requirements.timeline = '48-72 hours';
    }

    // Policy violations require higher approval
    if (complianceResults.violations.length > 0) {
      requirements.level = 'executive';
      if (!requirements.approvers.includes('VP Sales')) {
        requirements.approvers.push('VP Sales');
      }
      requirements.conditions.push('Exception approval required for policy violations');
    }

    // Category-specific requirements
    if (caseData.category === 'legal') {
      requirements.approvers.push('Legal Team');
      requirements.timeline = '5-7 days';
    }

    if (caseData.category === 'technical') {
      requirements.approvers.push('Engineering Manager');
    }

    return requirements;
  }

  analyzePrecedents(caseData) {
    try {
      const segment = this.inferSegment(caseData);
      const dealType = this.inferDealType(caseData);
      const dealValue = parseFloat(caseData.dealValue) || 50000;

      // Find similar cases
      const similarCases = getSimilarCases(dealValue, dealType, segment, 'namer').slice(0, 5);
      
      const analysis = {
        foundSimilar: similarCases.length > 0,
        caseCount: similarCases.length,
        outcomes: {},
        recommendations: []
      };

      if (similarCases.length > 0) {
        // Analyze outcomes
        similarCases.forEach(case_ => {
          const outcome = case_.outcome.toLowerCase();
          if (outcome.includes('won')) analysis.outcomes.won = (analysis.outcomes.won || 0) + 1;
          else if (outcome.includes('lost')) analysis.outcomes.lost = (analysis.outcomes.lost || 0) + 1;
          else if (outcome.includes('retained')) analysis.outcomes.retained = (analysis.outcomes.retained || 0) + 1;
        });

        const totalOutcomes = Object.values(analysis.outcomes).reduce((a, b) => a + b, 0);
        const successRate = ((analysis.outcomes.won || 0) + (analysis.outcomes.retained || 0)) / totalOutcomes;

        analysis.successRate = Math.round(successRate * 100);
        
        if (successRate > 0.8) {
          analysis.recommendations.push('High success rate for similar cases - good precedent');
        } else if (successRate < 0.5) {
          analysis.recommendations.push('Lower success rate for similar cases - strengthen justification');
        }

        // Extract common success factors
        const commonFactors = {};
        similarCases.forEach(case_ => {
          if (case_.outcome.includes('Won') && case_.keyFactors) {
            case_.keyFactors.forEach(factor => {
              commonFactors[factor] = (commonFactors[factor] || 0) + 1;
            });
          }
        });

        analysis.commonSuccessFactors = Object.entries(commonFactors)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([factor]) => factor);
      }

      return analysis;
    } catch (error) {
      console.error('Precedent analysis error:', error);
      return { foundSimilar: false, error: error.message };
    }
  }

  assessRisk(caseData, complianceResults) {
    let riskScore = 0;
    const riskFactors = [];

    // Policy violations increase risk
    if (complianceResults.violations.length > 0) {
      riskScore += complianceResults.violations.length * 20;
      riskFactors.push('Policy violations present');
    }

    // High discount percentage
    const discountPercent = parseFloat(caseData.discountRequested) || 0;
    if (discountPercent > 25) {
      riskScore += 15;
      riskFactors.push('High discount percentage');
    }

    // Large deal size
    const dealValue = parseFloat(caseData.dealValue) || 0;
    if (dealValue > 500000) {
      riskScore += 10;
      riskFactors.push('Large deal size');
    }

    // Competitive situation
    if (caseData.competitorInfo || caseData.description?.toLowerCase().includes('competitive')) {
      riskScore += 5;
      riskFactors.push('Competitive situation');
    }

    // Custom terms or non-standard requests
    if (caseData.category === 'legal' || caseData.category === 'technical') {
      riskScore += 10;
      riskFactors.push('Non-standard terms requested');
    }

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';

    return {
      level: riskLevel,
      score: riskScore,
      factors: riskFactors,
      mitigation: this.generateRiskMitigation(riskLevel, riskFactors)
    };
  }

  generateRiskMitigation(riskLevel, riskFactors) {
    const mitigation = [];

    if (riskLevel === 'high') {
      mitigation.push('Require executive approval');
      mitigation.push('Include legal and finance review');
      mitigation.push('Document all risk factors and mitigation strategies');
    } else if (riskLevel === 'medium') {
      mitigation.push('Require director-level approval');
      mitigation.push('Document business justification thoroughly');
    }

    if (riskFactors.includes('Policy violations present')) {
      mitigation.push('Provide strong exception justification');
    }

    if (riskFactors.includes('Competitive situation')) {
      mitigation.push('Include competitive intelligence and win/loss analysis');
    }

    return mitigation;
  }

  inferSegment(caseData) {
    const dealValue = parseFloat(caseData.dealValue) || 0;
    const description = caseData.description?.toLowerCase() || '';
    const customerInfo = caseData.customerInfo?.toLowerCase() || '';

    // Direct mentions
    if (description.includes('smb') || customerInfo.includes('smb')) return 'smb';
    if (description.includes('midmarket') || customerInfo.includes('midmarket')) return 'midmarket';
    if (description.includes('enterprise') || customerInfo.includes('enterprise')) return 'enterprise';
    if (description.includes('global') || customerInfo.includes('global')) return 'globalAccounts';

    // Infer from deal value
    if (dealValue >= 500000) return 'globalAccounts';
    if (dealValue >= 250000) return 'largeEnterprise';
    if (dealValue >= 50000) return 'enterprise';
    if (dealValue >= 15000) return 'midmarket';
    return 'smb';
  }

  inferDealType(caseData) {
    const description = caseData.description?.toLowerCase() || '';
    const title = caseData.title?.toLowerCase() || '';

    if (description.includes('renewal') || title.includes('renewal')) return 'renewal';
    if (description.includes('add-on') || description.includes('addon') || title.includes('add-on')) return 'addon';
    if (description.includes('upsell') || title.includes('upsell')) return 'upsell';
    return 'newBusiness';
  }

  generateFallbackCompliance(caseData) {
    return {
      overallCompliance: 'unknown',
      score: 50,
      violations: [],
      warnings: [{
        type: 'system_error',
        severity: 'medium',
        message: 'Unable to complete compliance check - manual review required',
        impact: 'Full compliance verification needed'
      }],
      recommendations: [{
        type: 'manual_review',
        priority: 'high',
        message: 'Submit for manual policy compliance review',
        benefit: 'Ensures proper approval process'
      }]
    };
  }
}

// Create singleton instance
const policyChecker = new PolicyChecker();

export default policyChecker;
