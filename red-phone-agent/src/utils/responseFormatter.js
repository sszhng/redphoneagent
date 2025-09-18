// Response Formatter for Red Phone Agent
// Formats AI responses into structured, readable formats with rich content types

class ResponseFormatter {
  constructor() {
    this.formatters = {
      text: this.formatText.bind(this),
      policy: this.formatPolicyResponse.bind(this),
      case: this.formatCaseResponse.bind(this),
      table: this.formatTable.bind(this),
      list: this.formatList.bind(this),
      form: this.formatForm.bind(this),
      guidance: this.formatGuidance.bind(this),
      approval: this.formatApprovalResponse.bind(this),
      precedent: this.formatPrecedentResponse.bind(this),
      error: this.formatError.bind(this)
    };
    
    this.contentTypes = {
      TEXT: 'text',
      POLICY: 'policy',
      CASE: 'case',
      TABLE: 'table',
      LIST: 'list',
      FORM: 'form',
      GUIDANCE: 'guidance',
      APPROVAL: 'approval',
      PRECEDENT: 'precedent',
      ERROR: 'error'
    };
  }

  // Main formatting function
  formatResponse(responseData, responseType = 'text', context = {}) {
    try {
      const formatter = this.formatters[responseType] || this.formatters.text;
      const formatted = formatter(responseData, context);
      
      return {
        success: true,
        content: formatted.content,
        contentType: responseType,
        metadata: {
          ...formatted.metadata,
          formattedAt: new Date().toISOString(),
          context: context
        },
        actions: formatted.actions || [],
        followUpSuggestions: formatted.followUpSuggestions || []
      };
    } catch (error) {
      console.error('Response formatting error:', error);
      return this.formatError({
        message: 'Error formatting response',
        originalData: responseData,
        error: error.message
      });
    }
  }

  // Text response formatting
  formatText(data, context) {
    let content = '';
    
    if (typeof data === 'string') {
      content = data;
    } else if (data.content) {
      content = data.content;
    } else if (data.answer) {
      content = data.answer;
    } else {
      content = 'I apologize, but I couldn\'t format this response properly.';
    }

    // Apply user style preferences
    if (context.responseStyle?.style === 'brief') {
      content = this.makeBrief(content);
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        wordCount: content.split(/\s+/).length,
        estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200) // words per minute
      }
    };
  }

  // Policy response formatting
  formatPolicyResponse(data, context) {
    const { policy, guidance, source } = data;
    
    let content = '';
    
    if (policy) {
      content += this.formatPolicySection(policy);
    }
    
    if (guidance && guidance.length > 0) {
      content += '\n\n**Guidance:**\n';
      guidance.forEach(item => {
        content += `• ${item}\n`;
      });
    }

    const actions = [];
    if (policy && policy.maxDiscount && context.userQuery?.includes('%')) {
      actions.push({
        type: 'check_approval',
        label: 'Check Approval Requirements',
        data: { discountPercent: policy.maxDiscount }
      });
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        source: source || 'Rules of Engagement',
        policyType: policy ? Object.keys(policy)[0] : 'general'
      },
      actions,
      followUpSuggestions: [
        'Check approval requirements',
        'Find similar cases',
        'Get case creation guidance'
      ]
    };
  }

  formatPolicySection(policy) {
    let section = '';
    
    if (policy.segment && policy.dealType) {
      section += `**${policy.segment} ${policy.dealType} Policy:**\n\n`;
    }
    
    if (policy.maxDiscount !== undefined) {
      section += `• **Maximum Discount**: ${policy.maxDiscount}%\n`;
    }
    
    if (policy.typicalDiscount !== undefined) {
      section += `• **Typical Discount**: ${policy.typicalDiscount}%\n`;
    }
    
    if (policy.autoApprovedLimit !== undefined) {
      section += `• **Auto-approved up to**: ${policy.autoApprovedLimit}%\n`;
    }
    
    if (policy.minimumSeats !== undefined) {
      section += `• **Minimum Seats**: ${policy.minimumSeats}\n`;
    }
    
    if (policy.minimumValue !== undefined) {
      section += `• **Minimum Value**: $${policy.minimumValue.toLocaleString()}\n`;
    }
    
    if (policy.regionalAdjustment && policy.regionalAdjustment > 0) {
      section += `• **Regional Adjustment**: +${policy.regionalAdjustment}%\n`;
    }
    
    return section;
  }

  // Case response formatting
  formatCaseResponse(data, context) {
    const { cases, recommendations, analysis } = data;
    
    let content = '';
    
    if (cases && cases.length > 0) {
      content += '**Relevant Cases:**\n\n';
      cases.forEach((case_, index) => {
        content += this.formatCasePreview(case_, index + 1);
        content += '\n';
      });
    }
    
    if (recommendations && recommendations.length > 0) {
      content += '\n**Recommendations:**\n';
      recommendations.forEach(rec => {
        content += `• ${rec}\n`;
      });
    }

    const actions = [{
      type: 'create_case',
      label: 'Create New Case',
      data: { template: 'similar_cases', cases: cases?.slice(0, 3) }
    }];

    return {
      content: this.formatMarkdown(content),
      metadata: {
        caseCount: cases?.length || 0,
        source: 'Historical Cases'
      },
      actions,
      followUpSuggestions: [
        'Create a similar case',
        'Get case creation template',
        'Check approval requirements'
      ]
    };
  }

  formatCasePreview(case_, index) {
    let preview = `**${index}. ${case_.title}**\n`;
    preview += `   *${case_.category} • ${case_.segment || 'N/A'} • ${case_.outcome}*\n`;
    preview += `   ${case_.description?.substring(0, 150)}${case_.description?.length > 150 ? '...' : ''}\n`;
    
    if (case_.precedent) {
      preview += `   **Precedent**: ${case_.precedent}\n`;
    }
    
    return preview;
  }

  // Table formatting
  formatTable(data, context) {
    const { headers, rows, title, description } = data;
    
    let content = '';
    
    if (title) {
      content += `**${title}**\n\n`;
    }
    
    if (description) {
      content += `${description}\n\n`;
    }

    // Create markdown table
    if (headers && rows) {
      content += this.createMarkdownTable(headers, rows);
    } else if (Array.isArray(data)) {
      // Auto-detect table structure from data
      content += this.autoFormatTable(data);
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        rowCount: rows?.length || 0,
        columnCount: headers?.length || 0
      }
    };
  }

  createMarkdownTable(headers, rows) {
    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    rows.forEach(row => {
      table += '| ' + row.join(' | ') + ' |\n';
    });
    
    return table + '\n';
  }

  autoFormatTable(data) {
    if (data.length === 0) return '';
    
    // Extract headers from first object
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header] || ''));
    
    return this.createMarkdownTable(headers, rows);
  }

  // List formatting
  formatList(data, context) {
    const { items, title, type = 'bullet', description } = data;
    
    let content = '';
    
    if (title) {
      content += `**${title}**\n\n`;
    }
    
    if (description) {
      content += `${description}\n\n`;
    }

    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        if (type === 'numbered') {
          content += `${index + 1}. ${item}\n`;
        } else {
          content += `• ${item}\n`;
        }
      });
    } else if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (type === 'numbered') {
          content += `${index + 1}. ${item}\n`;
        } else {
          content += `• ${item}\n`;
        }
      });
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        itemCount: (items || data)?.length || 0,
        listType: type
      }
    };
  }

  // Form formatting (for case creation)
  formatForm(data, context) {
    const { fields, title, description, template } = data;
    
    let content = '';
    
    if (title) {
      content += `**${title}**\n\n`;
    }
    
    if (description) {
      content += `${description}\n\n`;
    }

    if (template) {
      content += this.formatCaseTemplate(template);
    } else if (fields) {
      content += this.formatFormFields(fields);
    }

    const actions = [{
      type: 'open_case_form',
      label: 'Open Case Creation Form',
      data: { template, fields }
    }];

    return {
      content: this.formatMarkdown(content),
      metadata: {
        fieldCount: fields?.length || 0,
        formType: template?.type || 'custom'
      },
      actions,
      followUpSuggestions: [
        'Fill out case form',
        'Get help with requirements',
        'Preview case before submission'
      ]
    };
  }

  formatCaseTemplate(template) {
    const { structure, title } = template;
    
    let content = `**${title || 'Case Template'}**\n\n`;
    
    if (Array.isArray(structure)) {
      structure.forEach(line => {
        content += `${line}\n`;
      });
    }
    
    return content;
  }

  formatFormFields(fields) {
    let content = '**Required Information:**\n\n';
    
    fields.forEach(field => {
      content += `• **${field.field}**: ${field.description || 'Required field'}\n`;
      if (field.type === 'select' && field.options) {
        content += `  Options: ${field.options.join(', ')}\n`;
      }
    });
    
    return content;
  }

  // Guidance formatting
  formatGuidance(data, context) {
    const { steps, tips, bestPractices, title } = data;
    
    let content = '';
    
    if (title) {
      content += `**${title}**\n\n`;
    }

    if (steps && steps.length > 0) {
      content += '**Steps:**\n';
      steps.forEach((step, index) => {
        content += `${index + 1}. ${step}\n`;
      });
      content += '\n';
    }

    if (tips && tips.length > 0) {
      content += '**Tips:**\n';
      tips.forEach(tip => {
        content += `💡 ${tip}\n`;
      });
      content += '\n';
    }

    if (bestPractices && bestPractices.length > 0) {
      content += '**Best Practices:**\n';
      bestPractices.forEach(practice => {
        content += `✅ ${practice}\n`;
      });
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        stepCount: steps?.length || 0,
        tipCount: tips?.length || 0,
        source: 'Guidance System'
      },
      followUpSuggestions: [
        'Get more detailed steps',
        'See examples',
        'Ask specific questions'
      ]
    };
  }

  // Approval response formatting
  formatApprovalResponse(data, context) {
    const { requirements, guidance, timeline, approver } = data;
    
    let content = '**Approval Requirements:**\n\n';
    
    if (approver) {
      content += `• **Approver**: ${approver}\n`;
    }
    
    if (timeline) {
      content += `• **Timeline**: ${timeline}\n`;
    }
    
    if (requirements) {
      if (requirements.discount) {
        content += `• **Discount Approval**: ${requirements.discount.approver} (${requirements.discount.timeframe})\n`;
      }
      if (requirements.dealSize) {
        content += `• **Deal Size Approval**: ${requirements.dealSize.approver} (${requirements.dealSize.timeframe})\n`;
      }
    }
    
    if (guidance && guidance.length > 0) {
      content += '\n**Process:**\n';
      guidance.forEach(item => {
        content += `• ${item}\n`;
      });
    }

    const actions = [{
      type: 'create_approval_case',
      label: 'Create Approval Case',
      data: { requirements, approver }
    }];

    return {
      content: this.formatMarkdown(content),
      metadata: {
        approver: approver,
        timeline: timeline,
        source: 'Approval Workflow'
      },
      actions,
      followUpSuggestions: [
        'Create approval case',
        'Check approval status',
        'Get submission tips'
      ]
    };
  }

  // Precedent response formatting
  formatPrecedentResponse(data, context) {
    const { cases, analysis, patterns } = data;
    
    let content = '**Historical Precedents:**\n\n';
    
    if (cases && cases.length > 0) {
      cases.forEach((case_, index) => {
        content += this.formatPrecedentCase(case_, index + 1);
        content += '\n';
      });
    }
    
    if (patterns && patterns.length > 0) {
      content += '**Patterns:**\n';
      patterns.forEach(pattern => {
        content += `📊 ${pattern}\n`;
      });
      content += '\n';
    }
    
    if (analysis) {
      content += `**Analysis**: ${analysis}\n`;
    }

    return {
      content: this.formatMarkdown(content),
      metadata: {
        precedentCount: cases?.length || 0,
        source: 'Historical Analysis'
      },
      followUpSuggestions: [
        'Get more similar cases',
        'Analyze success factors',
        'Create based on precedent'
      ]
    };
  }

  formatPrecedentCase(case_, index) {
    let precedent = `**${index}. ${case_.title}**\n`;
    precedent += `   *Outcome: ${case_.outcome} • Timeline: ${case_.resolutionTime}*\n`;
    precedent += `   **Key Factors**: ${case_.keyFactors?.slice(0, 2).join(', ')}${case_.keyFactors?.length > 2 ? '...' : ''}\n`;
    
    if (case_.precedent) {
      precedent += `   **Precedent**: ${case_.precedent}\n`;
    }
    
    return precedent;
  }

  // Error formatting
  formatError(data, context) {
    const { message, error, originalData } = data;
    
    let content = `⚠️ **${message || 'An error occurred'}**\n\n`;
    
    if (error) {
      content += `Technical details: ${error}\n\n`;
    }
    
    content += 'Please try:\n';
    content += '• Rephrasing your question\n';
    content += '• Being more specific about your request\n';
    content += '• Contacting your sales manager for immediate assistance\n';

    return {
      content: this.formatMarkdown(content),
      metadata: {
        errorType: 'formatting_error',
        hasOriginalData: !!originalData
      },
      followUpSuggestions: [
        'Try a different question',
        'Get help from manager',
        'Report this issue'
      ]
    };
  }

  // Utility functions
  formatMarkdown(content) {
    // Ensure proper spacing and formatting
    return content
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
      .replace(/^\s+/gm, '') // Remove leading whitespace
      .trim();
  }

  makeBrief(content) {
    // Simplify content for brief style
    return content
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
      .replace(/•\s*/g, '- ') // Simplify bullet points
      .replace(/\n{2,}/g, '\n') // Single line breaks
      .split('\n')
      .slice(0, 5) // Limit to 5 lines for brief responses
      .join('\n');
  }

  // Enhanced formatting for complex responses
  formatComplexResponse(responseData, context) {
    const { type, data, metadata, confidence } = responseData;
    
    // Determine best format based on data structure
    let contentType = type;
    
    if (data.policy) contentType = this.contentTypes.POLICY;
    else if (data.cases) contentType = this.contentTypes.CASE;
    else if (data.requirements) contentType = this.contentTypes.APPROVAL;
    else if (data.steps) contentType = this.contentTypes.GUIDANCE;
    else if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'object') contentType = this.contentTypes.TABLE;
      else contentType = this.contentTypes.LIST;
    }
    
    const formatted = this.formatResponse(data, contentType, context);
    
    // Add confidence indicator
    if (confidence !== undefined) {
      formatted.metadata.confidence = confidence;
      if (confidence < 0.7) {
        formatted.content += '\n\n*Note: This response has lower confidence. Please verify with your manager if needed.*';
      }
    }
    
    return formatted;
  }

  // Format for different channels (if needed for integrations)
  formatForChannel(responseData, channel = 'web') {
    switch (channel) {
      case 'slack':
        return this.formatForSlack(responseData);
      case 'email':
        return this.formatForEmail(responseData);
      case 'web':
      default:
        return responseData;
    }
  }

  formatForSlack(responseData) {
    // Convert markdown to Slack format
    const content = responseData.content
      .replace(/\*\*([^*]+)\*\*/g, '*$1*') // Bold to Slack bold
      .replace(/^•/gm, '•') // Keep bullets
      .replace(/#{1,6}\s*/g, ''); // Remove markdown headers
    
    return {
      ...responseData,
      content,
      channel: 'slack'
    };
  }

  formatForEmail(responseData) {
    // Convert to plain text with minimal formatting
    const content = responseData.content
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/^•/gm, '-') // Bullets to dashes
      .replace(/#{1,6}\s*/g, ''); // Remove headers
    
    return {
      ...responseData,
      content,
      channel: 'email'
    };
  }
}

// Create singleton instance
const responseFormatter = new ResponseFormatter();

export default responseFormatter;
