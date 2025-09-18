import React, { useState, useEffect } from 'react';
import { extractSolutionBuilderData, getCaseRequiredFields, generateCaseTitle } from '../utils/pageDataExtractor';
import '../styles/Chat.css';

const SmartCaseCreationForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [requiredFields, setRequiredFields] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Extract data from the Solution Builder page
    const pageData = extractSolutionBuilderData();
    setExtractedData(pageData);

    // Get required fields for this case category
    const category = initialData?.category || 'General';
    const fields = getCaseRequiredFields(category);
    setRequiredFields(fields);

    // Pre-populate form with extracted data and initial data
    const prePopulatedData = {
      title: generateCaseTitle(category, pageData.customer.name, pageData.deal.totalValue),
      category: category,
      customerName: pageData.customer.name,
      dealValue: pageData.deal.totalValue,
      dealType: pageData.deal.dealType,
      segment: pageData.deal.segment,
      region: pageData.deal.region,
      primaryContact: pageData.customer.primaryContact.name,
      contactEmail: pageData.customer.primaryContact.email,
      contactPhone: pageData.customer.primaryContact.phone,
      quoteId: pageData.quote.id,
      ...initialData
    };

    setFormData(prePopulatedData);
  }, [initialData]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Validate basic information
      const basicFields = ['title', 'description', 'businessJustification', 'priority', 'timeline'];
      basicFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
          newErrors[field] = 'This field is required';
        }
      });
    } else if (step === 2) {
      // Validate category-specific fields
      const categoryFields = requiredFields.filter(field => 
        !['title', 'description', 'businessJustification', 'priority', 'timeline'].includes(field.id) && field.required
      );
      
      categoryFields.forEach(field => {
        if (!formData[field.id] || formData[field.id].toString().trim() === '') {
          newErrors[field.id] = 'This field is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const caseData = {
        ...formData,
        caseId: `CASE-${Date.now()}`,
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        extractedData: extractedData
      };

      onSubmit(caseData);
    } catch (error) {
      console.error('Error submitting case:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const hasError = errors[field.id];

    if (field.type === 'select') {
      return (
        <div key={field.id} className="form-field">
          <label className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          <select
            className={`form-input ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {hasError && <span className="form-error">{hasError}</span>}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className="form-field">
          <label className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          <textarea
            className={`form-input ${hasError ? 'error' : ''}`}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={3}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
          {hasError && <span className="form-error">{hasError}</span>}
        </div>
      );
    }

    return (
      <div key={field.id} className="form-field">
        <label className="form-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        <input
          type={field.type}
          className={`form-input ${hasError ? 'error' : ''}`}
          value={value}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
        {hasError && <span className="form-error">{hasError}</span>}
      </div>
    );
  };

  const renderStep1 = () => {
    const basicFields = requiredFields.filter(field => 
      ['title', 'description', 'businessJustification', 'priority', 'timeline'].includes(field.id)
    );

    return (
      <div className="case-form-step">
        <h3>📋 Case Information</h3>
        <p className="step-description">I've pre-filled information from your current quote. Please review and add details:</p>
        
        <div className="extracted-data-summary">
          <div className="summary-row">
            <strong>Customer:</strong> {extractedData?.customer.name}
          </div>
          <div className="summary-row">
            <strong>Deal Value:</strong> ${extractedData?.deal.totalValue?.toLocaleString()} USD
          </div>
          <div className="summary-row">
            <strong>Quote ID:</strong> {extractedData?.quote.id}
          </div>
        </div>

        {basicFields.map(renderField)}
      </div>
    );
  };

  const renderStep2 = () => {
    const categoryFields = requiredFields.filter(field => 
      !['title', 'description', 'businessJustification', 'priority', 'timeline'].includes(field.id)
    );

    return (
      <div className="case-form-step">
        <h3>📝 Additional Information</h3>
        <p className="step-description">Please provide the following details specific to your {formData.category} request:</p>
        
        {categoryFields.length > 0 ? (
          categoryFields.map(renderField)
        ) : (
          <p className="no-additional-fields">No additional information required for this case type.</p>
        )}
      </div>
    );
  };

  return (
    <div className="case-form-overlay">
      <div className="case-form-container">
        <div className="case-form-header">
          <h2>🚨 Create Required Case</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="case-form">
          <div className="form-progress">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Case Details</span>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Additional Info</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            <div className="form-actions">
              {currentStep === 2 && (
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  ← Back
                </button>
              )}
              
              {currentStep === 1 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Submitting Case...
                    </>
                  ) : (
                    'Submit Case'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SmartCaseCreationForm;
