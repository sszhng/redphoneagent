import React from 'react';
import '../styles/SolutionBuilder.css';

const SolutionBuilder = () => {
  return (
    <div className="solution-builder">
      {/* Header */}
      <header className="sb-header">
        <div className="sb-header-left">
          <div className="linkedin-logo">
            <span className="logo-icon">in</span>
            <span className="logo-text">SOLUTION BUILDER</span>
          </div>
        </div>
        <div className="sb-header-right">
          <span className="user-role">Sarah Chen</span>
          <div className="help-icon">?</div>
          <div className="user-avatar">👤</div>
        </div>
      </header>

      {/* Quote Header */}
      <div className="quote-header">
        <div className="quote-info">
          <div className="quote-id">
            <span className="quote-icon">📋</span>
            <span className="quote-name">Pellegrino E2E Test 2fcol3xsi8ljg</span>
          </div>
          <div className="quote-title">
            <h1>Pellegrino E2E Test 2fcol3xsi8ljg-Abacus test opport...</h1>
            <span className="oracle-badge">Oracle</span>
          </div>
        </div>
        <div className="quote-status">
          <div className="amount-section">
            <div className="amount-label">Amount in CRM</div>
            <div className="amount-values">
              <span className="amount">$0.00</span>
              <span className="outlook">$0.00 Outlook</span>
            </div>
          </div>
          <button className="saved-btn">Saved</button>
        </div>
      </div>


      {/* Main Content */}
      <div className="main-content">
        {/* Left Section - Quote Details */}
        <div className="quote-section">
          <div className="quote-tabs">
            <div className="tab-item active">
              <span className="tab-amount">$0.00</span>
              <span className="tab-label">New Abacus Quote</span>
            </div>
            <div className="tab-item">
              <span className="tab-amount">$487,500.00</span>
              <span className="tab-label">HEP new Enterprise Agreem...</span>
            </div>
            <button className="add-tab">+</button>
          </div>

          <div className="quote-content">
            <h2>Quote details</h2>
            
            <div className="warning-banner">
              <span className="warning-icon">⚠️</span>
              Price is pending and subject to change until approvals are complete. Do not share with customers.
            </div>

            <div className="quote-form">
              <div className="form-row">
                <div className="form-group form-group-small">
                  <label>Req start date</label>
                  <input type="date" value="2025-07-21" className="date-input" />
                </div>
                <div className="form-group form-group-small">
                  <label>Subscription term</label>
                  <select className="select-input">
                    <option>3 years</option>
                  </select>
                </div>
                <div className="form-group form-group-small">
                  <label>End date</label>
                  <span className="end-date">7/20/2028</span>
                </div>
              </div>

              <div className="product-table">
                <div className="table-header">
                  <div className="col-product">Product</div>
                  <div className="col-quantity">Quantity</div>
                  <div className="col-discount">Rep discount</div>
                  <div className="col-unit-price">Unit price</div>
                  <div className="col-net-price">Net price</div>
                </div>

                <div className="product-row">
                  <div className="product-info">
                    <div className="product-name">Hiring Enterprise Program</div>
                    <div className="product-status">Price adjustment applied</div>
                    <div className="subsidiary">1 subsidiary included</div>
                    <button className="review-config">📝 Review configuration</button>
                  </div>
                  <div className="quantity">1</div>
                  <div className="discount">N/A</div>
                  <div className="unit-price">$487,500.00</div>
                  <div className="net-price">$487,500.00</div>
                </div>

                <div className="product-features">
                  <div className="feature-row">
                    <span className="feature-icon">└</span>
                    <span className="feature-name">Job Slot</span>
                    <span className="feature-value">Unlimited</span>
                  </div>
                  <div className="feature-row">
                    <span className="feature-icon">└</span>
                    <span className="feature-name">Recruiter Corporate</span>
                    <span className="feature-value">Unlimited</span>
                  </div>
                  <div className="feature-row">
                    <span className="feature-icon">└</span>
                    <span className="feature-name">Career Pages - Enterprise basic package</span>
                    <span className="feature-quantity">1</span>
                  </div>
                </div>

                <button className="add-product">+ Add a product</button>
              </div>

              <div className="pricing-summary">
                <div className="pricing-row">
                  <span>Year 1 (12 months) before tax</span>
                  <span>$162,500.00</span>
                </div>
                <div className="pricing-row">
                  <span>Year 2 (12 months) before tax</span>
                  <span>$162,500.00</span>
                </div>
                <div className="pricing-row">
                  <span>Year 3 (12 months) before tax</span>
                  <span>$162,500.00</span>
                </div>
                <div className="pricing-row total">
                  <span>Total before tax</span>
                  <span>$487,500.00</span>
                </div>
                <div className="pricing-row adjustment">
                  <span>- Price adjustment applied</span>
                  <span></span>
                </div>
                <div className="pricing-row">
                  <span>Estimated tax</span>
                  <span>$0.00</span>
                </div>
                <div className="pricing-row final">
                  <span>Total after tax (USD)</span>
                  <span className="pending-badge">Pending</span>
                  <span>$487,500.00</span>
                </div>
              </div>
            </div>

            <div className="quote-advisor">
              <h3>📋 Quote advisor</h3>
              <div className="advisor-sections">
                <div className="advisor-section">
                  <span>Enterprise Program annual target pricing</span>
                  <button className="manage-btn">Manage price adjustment</button>
                </div>
                <div className="advisor-section">
                  <span>Enterprise Program pricing information</span>
                  <button className="download-btn">📥 Download pricing data</button>
                </div>
                <div className="advisor-section">
                  <span>HEP Manual Pricing Review</span>
                  <span className="review-required">Pricing Team review required</span>
                  <button className="request-btn">Request approval</button>
                </div>
                <div className="advisor-section">
                  <span>Start date in the past</span>
                  <span className="must-resolve">Must be resolved</span>
                  <span>Deal Desk approval required</span>
                </div>
                <div className="advisor-section">
                  <span>CRM Opportunity info required</span>
                  <span>Add info before preparing order</span>
                  <button className="crm-btn">Open CRM Opportunity</button>
                </div>
                <div className="advisor-section">
                  <span>EP price adjustment request</span>
                  <span className="info-only">Information only</span>
                  <span>Request completed</span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary">Update CRM ▼</button>
              <button className="btn-primary">Review order form</button>
            </div>
          </div>
        </div>

        {/* Right Section - Contact & Billing */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <h3>Currency, Tax & Credit</h3>
              <button className="edit-btn">Edit ▼</button>
            </div>
            <div className="section-content">
              <div className="field">
                <span className="label">USD $</span>
              </div>
              <div className="field">
                <span className="label">Taxable</span>
                <span className="info-icon">ℹ️</span>
              </div>
              <div className="field">
                <span className="label">Manual credit review required</span>
                <span className="refresh-icon">🔄</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>Primary contact</h3>
              <button className="edit-btn">Edit</button>
            </div>
            <div className="section-content">
              <div className="contact-info">
                <div>firstname lastname</div>
                <div>linkedin.ei@gmail.com</div>
                <div>363199424</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>Billing contact</h3>
              <button className="edit-btn">Edit</button>
            </div>
            <div className="section-content">
              <div className="contact-info">
                <div>firstname lastname</div>
                <div>linkedin.ei@gmail.com</div>
                <div>363199424</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>Ship to</h3>
              <button className="edit-btn">Edit ▼</button>
            </div>
            <div className="section-content">
              <div className="address-info">
                <div>Pellegrino E2E Test 2fcol3xsi8ljg</div>
                <div>999 N Mathilda Ave</div>
                <div>Sunnyvale CA 94085-3505</div>
                <div>United States</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>Bill to</h3>
              <button className="edit-btn">Edit ▼</button>
            </div>
            <div className="section-content">
              <div className="bill-to-info">
                <span>Same as ship to</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <button className="more-settings">More settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionBuilder;
