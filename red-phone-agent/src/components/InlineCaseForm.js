import React, { useState, useEffect } from 'react';
import { extractSolutionBuilderData, generateCaseTitle } from '../utils/pageDataExtractor';
import '../styles/Chat.css';

const InlineCaseForm = ({ caseCategory, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Extract data from Solution Builder and pre-populate form
    const pageData = extractSolutionBuilderData();
    
    const prePopulatedData = {
      // Basic case information
      title: generateCaseTitle(caseCategory, pageData.customer.name, pageData.deal.totalValue),
      category: caseCategory,
      priority: 'High', // Default for most sales issues
      timeline: 'Within 24 hours', // Typical urgency
      
      // Customer and deal information
      customerName: pageData.customer.name,
      dealValue: pageData.deal.totalValue,
      dealType: pageData.deal.dealType,
      segment: pageData.deal.segment,
      region: pageData.deal.region,
      quoteId: pageData.quote.id,
      
      // Contact information
      primaryContact: pageData.customer.primaryContact.name,
      contactEmail: pageData.customer.primaryContact.email,
      contactPhone: pageData.customer.primaryContact.phone,
      
      // Pre-filled descriptions based on category
      description: getDefaultDescription(caseCategory, pageData),
      businessJustification: getDefaultJustification(caseCategory, pageData),
      
      // Category-specific fields with dummy data
      ...getCategorySpecificDefaults(caseCategory, pageData)
    };

    setFormData(prePopulatedData);
  }, [caseCategory]);

  const getDefaultDescription = (category, pageData) => {
    const descriptions = {
      'Pricing': `Request for pricing exception on ${pageData.customer.name} deal (${pageData.quote.id}). Customer requires competitive pricing to move forward with ${pageData.deal.totalValue?.toLocaleString()} USD ${pageData.deal.dealType} opportunity.`,
      'Deal Structure': `Request for deal structure modification on ${pageData.customer.name} (${pageData.quote.id}). Standard terms need adjustment for ${pageData.deal.totalValue?.toLocaleString()} USD ${pageData.deal.dealType} deal.`,
      'Legal': `Legal review required for non-standard terms on ${pageData.customer.name} contract (${pageData.quote.id}). Customer has specific legal requirements for ${pageData.deal.totalValue?.toLocaleString()} USD deal.`,
      'System Issues': `System error preventing progress on ${pageData.customer.name} opportunity (${pageData.quote.id}). Unable to complete standard workflow for ${pageData.deal.totalValue?.toLocaleString()} USD deal.`,
      'General': `Support request for ${pageData.customer.name} (${pageData.quote.id}). Assistance needed with ${pageData.deal.totalValue?.toLocaleString()} USD ${pageData.deal.dealType} opportunity.`
    };
    
    return descriptions[category] || descriptions['General'];
  };

  const getDefaultJustification = (category, pageData) => {
    const justifications = {
      'Pricing': 'Customer is evaluating competitive proposals and requires pricing alignment to proceed. Deal is strategic for Q4 targets and customer has expressed strong interest pending pricing approval.',
      'Deal Structure': 'Customer has unique operational requirements that necessitate modified terms. Standard structure prevents deal progression and customer has indicated this is a key decision factor.',
      'Legal': 'Customer\'s legal team requires specific contractual language to meet their compliance requirements. Terms are reasonable and align with company policies.',
      'System Issues': 'System error is blocking deal progression and preventing timely closure. Technical issue needs immediate resolution to maintain customer confidence.',
      'General': 'Customer situation requires specialized attention to ensure successful deal completion and maintain positive customer relationship.'
    };
    
    return justifications[category] || justifications['General'];
  };

  const getCategorySpecificDefaults = (category, pageData) => {
    const defaults = {
      'Pricing': {
        requestedDiscount: '15',
        competitorInfo: 'Customer has received competitive proposals from Workday and BambooHR with 15-20% discounts.',
        customerPressure: 'High'
      },
      'Deal Structure': {
        requestedTerms: 'Customer requires monthly payment terms instead of annual upfront payment.',
        standardTermsDeviation: 'Request deviates from standard annual payment structure to accommodate customer cash flow preferences.'
      },
      'Legal': {
        legalRequirements: 'Customer requires additional data processing clauses and specific liability limitations.',
        urgencyReason: 'Customer legal team needs approval before month-end to proceed with implementation.'
      },
      'System Issues': {
        errorMessage: 'Unable to update opportunity stage - receiving validation error on required fields.',
        stepsToReproduce: '1. Navigate to opportunity, 2. Attempt to change stage to Closed Won, 3. Error appears preventing save.'
      }
    };
    
    return defaults[category] || {};
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user modifies field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Simplified validation for demo - only essential fields
    const requiredFields = ['title', 'description', 'priority', 'maxFirstYearSpend', 'dealLength'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Required field';
      }
    });

    // Additional validation for numeric fields
    if (formData.maxFirstYearSpend && isNaN(Number(formData.maxFirstYearSpend))) {
      newErrors.maxFirstYearSpend = 'Must be a valid number';
    }
    
    if (formData.dealLength && isNaN(Number(formData.dealLength))) {
      newErrors.dealLength = 'Must be a valid number';
    }

    if (formData.dealLength && Number(formData.dealLength) <= 0) {
      newErrors.dealLength = 'Deal length must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const caseData = {
        ...formData,
        caseId: `CASE-${Date.now()}`,
        status: 'Submitted',
        submittedAt: new Date().toISOString()
      };

      onSubmit(caseData);
    } catch (error) {
      console.error('Error submitting case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (label, field, type = 'text', options = null) => {
    const value = formData[field] || '';
    const hasError = errors[field];

    if (type === 'select') {
      return (
        <div className="inline-form-field" key={field}>
          <label className="inline-form-label">{label}</label>
          <select
            className={`inline-form-input ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {hasError && <span className="inline-form-error">{hasError}</span>}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="inline-form-field" key={field}>
          <label className="inline-form-label">{label}</label>
          <textarea
            className={`inline-form-input ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
          />
          {hasError && <span className="inline-form-error">{hasError}</span>}
        </div>
      );
    }

    // Add appropriate placeholders for specific fields
    const getPlaceholder = (field, type) => {
      if (field === 'maxFirstYearSpend') return 'Enter amount in USD';
      if (field === 'dealLength') return 'Enter number of years';
      if (type === 'number') return 'Enter amount';
      return '';
    };

    return (
      <div className="inline-form-field" key={field}>
        <label className="inline-form-label">{label}</label>
        <input
          type={type}
          className={`inline-form-input ${hasError ? 'error' : ''}`}
          value={value}
          placeholder={getPlaceholder(field, type)}
          onChange={(e) => handleInputChange(field, e.target.value)}
        />
        {hasError && <span className="inline-form-error">{hasError}</span>}
      </div>
    );
  };

  return (
    <div className="inline-case-form">
      <div className="inline-form-header">
        <h4>Create {caseCategory} Case</h4>
        <p>Pre-filled with your quote data - review and submit:</p>
      </div>

      <div className="inline-form-content">
        <div className="inline-form-summary">
          <strong>Customer:</strong> {formData.customerName}<br/>
          <strong>Deal Value:</strong> ${formData.dealValue?.toLocaleString()} USD<br/>
          <strong>Quote ID:</strong> {formData.quoteId}
        </div>

        <div className="inline-form-row">
          {renderField('Case Title', 'title', 'text')}
        </div>

        <div className="inline-form-row">
          {renderField('Priority', 'priority', 'select', ['High', 'Critical', 'Medium', 'Low'])}
        </div>

        <div className="inline-form-row">
          {renderField('Description', 'description', 'textarea')}
        </div>

        <div className="inline-form-row">
          {renderField('Max First Year Spend', 'maxFirstYearSpend', 'number')}
        </div>

        <div className="inline-form-row">
          {renderField('Deal Length (years)', 'dealLength', 'number')}
        </div>

        {/* Simplified category-specific field - just one key field per category */}
        {caseCategory === 'Pricing' && (
          <div className="inline-form-row">
            {renderField('Requested Discount %', 'requestedDiscount', 'number')}
          </div>
        )}

        {caseCategory === 'Deal Structure' && (
          <div className="inline-form-row">
            {renderField('Requested Terms Change', 'requestedTerms', 'textarea')}
          </div>
        )}

        {caseCategory === 'Legal' && (
          <div className="inline-form-row">
            {renderField('Legal Requirements', 'legalRequirements', 'textarea')}
          </div>
        )}

        {caseCategory === 'System Issues' && (
          <div className="inline-form-row">
            {renderField('Error Description', 'errorMessage', 'textarea')}
          </div>
        )}
      </div>

      <div className="inline-form-actions">
        <button 
          type="button" 
          className="inline-form-btn secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="inline-form-btn primary" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-small"></span>
              Submitting...
            </>
          ) : (
            'Submit Case'
          )}
        </button>
      </div>
    </div>
  );
};

export default InlineCaseForm;
