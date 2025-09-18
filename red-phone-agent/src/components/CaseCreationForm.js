import React, { useState, useEffect } from 'react';
import caseRouter from '../utils/caseRouter.js';
import casePrePopulator from '../utils/casePrePopulator.js';
import policyChecker from '../utils/policyChecker.js';
import '../styles/Chat.css';

const CaseCreationForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'pricing',
    priority: 'medium',
    description: '',
    businessJustification: '',
    customerInfo: '',
    dealValue: '',
    discountRequested: '',
    timeframe: '',
    competitorInfo: '',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [routingInfo, setRoutingInfo] = useState(null);
  const [complianceCheck, setComplianceCheck] = useState(null);

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      const { entities, context } = initialData;
      
      setFormData(prev => ({
        ...prev,
        category: initialData.category || 'pricing',
        dealValue: entities.currency?.[0] || '',
        discountRequested: entities.percentage?.[0] || '',
        customerInfo: entities.segment?.[0] ? `${entities.segment[0]} customer` : '',
        title: generateTitle(initialData.category, entities),
        description: generateDescription(context, entities)
      }));
    }
  }, [initialData]);

  const generateTitle = (category, entities) => {
    const segment = entities.segment?.[0] || 'Customer';
    const dealType = entities.dealType?.[0] || 'deal';
    const percentage = entities.percentage?.[0];
    
    if (category === 'pricing' && percentage) {
      return `${percentage}% discount request for ${segment} ${dealType}`;
    }
    
    return `${segment} ${dealType} - ${category} request`;
  };

  const generateDescription = (context, entities) => {
    const parts = [];
    
    if (entities.segment?.[0]) {
      parts.push(`Customer Segment: ${entities.segment[0]}`);
    }
    
    if (entities.dealType?.[0]) {
      parts.push(`Deal Type: ${entities.dealType[0]}`);
    }
    
    if (entities.currency?.[0]) {
      parts.push(`Deal Value: $${entities.currency[0].toLocaleString()}`);
    }
    
    if (entities.percentage?.[0]) {
      parts.push(`Discount Requested: ${entities.percentage[0]}%`);
    }
    
    if (entities.region?.[0]) {
      parts.push(`Region: ${entities.region[0]}`);
    }
    
    if (entities.urgency?.[0]) {
      parts.push(`Urgency: ${entities.urgency[0]}`);
    }
    
    return parts.join('\n');
  };

  const categories = [
    { value: 'pricing', label: 'Pricing & Discounts', icon: '💰' },
    { value: 'dealStructure', label: 'Deal Structure', icon: '📋' },
    { value: 'pilotProgram', label: 'Pilot Programs', icon: '🧪' },
    { value: 'technical', label: 'Technical Requirements', icon: '⚙️' },
    { value: 'competitive', label: 'Competitive Situations', icon: '🏆' },
    { value: 'legal', label: 'Legal & Compliance', icon: '⚖️' },
    { value: 'customerSuccess', label: 'Customer Success', icon: '🤝' },
    { value: 'general', label: 'General Request', icon: '📝' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'critical', label: 'Critical', color: '#7c3aed' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.businessJustification.trim()) {
      newErrors.businessJustification = 'Business justification is required';
    }
    
    if (formData.category === 'pricing') {
      if (!formData.dealValue.trim()) {
        newErrors.dealValue = 'Deal value is required for pricing requests';
      }
      if (!formData.discountRequested.trim()) {
        newErrors.discountRequested = 'Discount percentage is required';
      }
    }
    
    if (formData.category === 'competitive' && !formData.competitorInfo.trim()) {
      newErrors.competitorInfo = 'Competitor information is required for competitive cases';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Run compliance and routing checks when form data changes
  useEffect(() => {
    if (formData.title && formData.category && formData.description) {
      const runChecks = async () => {
        try {
          // Run policy compliance check
          const compliance = policyChecker.checkCompliance(formData);
          setComplianceCheck(compliance);

          // Run routing analysis
          const routing = caseRouter.routeCase(formData);
          setRoutingInfo(routing);
        } catch (error) {
          console.error('Error running checks:', error);
        }
      };

      const timer = setTimeout(runChecks, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const submissionData = {
        ...formData,
        routing: routingInfo?.routing,
        compliance: complianceCheck?.compliance,
        submittedAt: new Date().toISOString(),
        id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, label, type = 'text', required = false, options = null) => {
    const error = errors[field];
    
    return (
      <div className="form-field">
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`form-input ${error ? 'error' : ''}`}
            rows={4}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : type === 'select' ? (
          <select
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`form-input ${error ? 'error' : ''}`}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon ? `${option.icon} ` : ''}{option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`form-input ${error ? 'error' : ''}`}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )}
        
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  };

  return (
    <div className="case-form-overlay">
      <div className="case-form-container">
        <div className="case-form-header">
          <h2>Create New Case</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            type="button"
            aria-label="Close form"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="case-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            {renderField('title', 'Case Title', 'text', true)}
            
            <div className="form-row">
              {renderField('category', 'Category', 'select', true, categories)}
              {renderField('priority', 'Priority', 'select', true, priorities)}
            </div>
            
            {renderField('description', 'Description', 'textarea', true)}
            {renderField('businessJustification', 'Business Justification', 'textarea', true)}
          </div>
          
          <div className="form-section">
            <h3>Deal Information</h3>
            
            <div className="form-row">
              {renderField('customerInfo', 'Customer Information', 'text')}
              {renderField('timeframe', 'Timeframe', 'text')}
            </div>
            
            {formData.category === 'pricing' && (
              <div className="form-row">
                {renderField('dealValue', 'Deal Value ($)', 'number')}
                {renderField('discountRequested', 'Discount Requested (%)', 'number')}
              </div>
            )}
            
            {formData.category === 'competitive' && (
              renderField('competitorInfo', 'Competitor Information', 'textarea')
            )}
          </div>
          
          {/* Compliance and Routing Info */}
          {(complianceCheck || routingInfo) && (
            <div className="form-section">
              <h3>📋 Case Analysis</h3>
              
              {complianceCheck?.success && (
                <div className="compliance-summary">
                  <div className={`compliance-status ${complianceCheck.compliance.overallCompliance}`}>
                    <strong>Compliance: </strong>
                    {complianceCheck.compliance.overallCompliance === 'compliant' ? '✅ Compliant' :
                     complianceCheck.compliance.overallCompliance === 'conditional' ? '⚠️ Conditional' : '❌ Non-compliant'}
                  </div>
                  
                  {complianceCheck.compliance.warnings.length > 0 && (
                    <div className="compliance-warnings">
                      <strong>⚠️ Warnings:</strong>
                      <ul>
                        {complianceCheck.compliance.warnings.slice(0, 2).map((warning, index) => (
                          <li key={index}>{warning.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {routingInfo?.success && (
                <div className="routing-summary">
                  <div className="routing-info">
                    <strong>🎯 Routing: </strong>
                    {routingInfo.routing.primaryApprover} ({routingInfo.routing.expectedTimeline})
                  </div>
                  <div className="urgency-level">
                    <strong>Priority: </strong>
                    <span className={`priority-badge ${routingInfo.routing.urgency}`}>
                      {routingInfo.routing.urgency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handlePreview}
              disabled={isSubmitting}
            >
              Preview
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Case...
                </>
              ) : (
                'Create Case'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case Preview</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="preview-section">
                <h3>📋 Case Details</h3>
                <div className="preview-field">
                  <strong>Title:</strong> {formData.title}
                </div>
                <div className="preview-field">
                  <strong>Category:</strong> {categories.find(c => c.value === formData.category)?.label}
                </div>
                <div className="preview-field">
                  <strong>Priority:</strong> {formData.priority}
                </div>
                <div className="preview-field">
                  <strong>Description:</strong>
                  <div className="preview-text">{formData.description}</div>
                </div>
                <div className="preview-field">
                  <strong>Business Justification:</strong>
                  <div className="preview-text">{formData.businessJustification}</div>
                </div>
              </div>

              {routingInfo?.success && (
                <div className="preview-section">
                  <h3>🎯 Routing Analysis</h3>
                  <div className="preview-field">
                    <strong>Primary Approver:</strong> {routingInfo.routing.primaryApprover}
                  </div>
                  <div className="preview-field">
                    <strong>Expected Timeline:</strong> {routingInfo.routing.expectedTimeline}
                  </div>
                  <div className="preview-field">
                    <strong>Team Assignment:</strong> {routingInfo.routing.team}
                  </div>
                  <div className="preview-field">
                    <strong>Urgency Level:</strong> {routingInfo.routing.urgency}
                  </div>
                </div>
              )}

              {complianceCheck?.success && (
                <div className="preview-section">
                  <h3>✅ Compliance Check</h3>
                  <div className="preview-field">
                    <strong>Overall Status:</strong> 
                    <span className={`status-badge ${complianceCheck.compliance.overallCompliance}`}>
                      {complianceCheck.compliance.overallCompliance}
                    </span>
                  </div>
                  {complianceCheck.compliance.recommendations.length > 0 && (
                    <div className="preview-field">
                      <strong>Recommendations:</strong>
                      <ul className="preview-list">
                        {complianceCheck.compliance.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index}>{rec.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </button>
              <button 
                className="btn btn-primary" 
                onClick={(e) => {
                  setShowPreview(false);
                  handleSubmit(e);
                }}
              >
                Submit Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseCreationForm;
