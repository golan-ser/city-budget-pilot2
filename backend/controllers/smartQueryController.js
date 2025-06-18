import { parseUserQuery, getParsingStats } from '../services/parseUserQuery.js';
import { executeReportQuery, getExecutionStats } from '../services/executeReportQuery.js';
import cityBudgetSchema from '../config/schemaConfig.js';

/**
 * Smart Query Controller - Two-Stage Architecture Implementation
 * Stage 1: Natural Language → Structured Intent (parseUserQuery)
 * Stage 2: Structured Intent → SQL Execution (executeReportQuery)
 */

/**
 * Process natural language query using two-stage architecture
 */
export const processSmartQuery = async (req, res) => {
  console.log('🚀 Smart Query Processing Started');
  const startTime = Date.now();
  
  try {
    const { query, options = {} } = req.body;
    
    // Debug: Check if schema is loaded
    console.log('📋 Schema status:', {
      schemaExists: !!cityBudgetSchema,
      domainsCount: cityBudgetSchema?.domains?.length || 0,
      version: cityBudgetSchema?.version || 'unknown'
    });
    
    // Validate input
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        message: 'נא להזין שאילתה'
      });
    }
    
    console.log('📝 Processing query:', query);
    
    // Stage 1: Parse natural language to structured intent
    console.log('🔍 Stage 1: Parsing natural language...');
    let parsedIntent;
    try {
      parsedIntent = await parseUserQuery(query, cityBudgetSchema);
      console.log('✅ Stage 1 Complete:', {
        intent: parsedIntent.intent,
        domain: parsedIntent.domain,
        confidence: parsedIntent.confidence,
        source: parsedIntent.source
      });
    } catch (stage1Error) {
      console.error('❌ Stage 1 Error:', stage1Error);
      throw new Error(`Stage 1 parsing failed: ${stage1Error.message}`);
    }
    
    // Check confidence threshold
    const minConfidence = options.minConfidence || 0.3;
    if (parsedIntent.confidence < minConfidence) {
      return res.status(200).json({
        success: true,
        stage: 'parsing',
        lowConfidence: true,
        parsedIntent,
        message: `זוהה בביטחון נמוך (${Math.round(parsedIntent.confidence * 100)}%). האם התכוונת ל: ${parsedIntent.explanation}?`,
        suggestedAction: 'confirm_or_refine'
      });
    }
    
    // Stage 2: Execute structured query
    console.log('🔧 Stage 2: Executing structured query...');
    let queryResult;
    try {
      queryResult = await executeReportQuery(parsedIntent, cityBudgetSchema);
      console.log('✅ Stage 2 Complete:', {
        rowCount: queryResult.rows.length,
        columns: queryResult.columns.length,
        success: queryResult.success
      });
    } catch (stage2Error) {
      console.error('❌ Stage 2 Error:', stage2Error);
      throw new Error(`Stage 2 execution failed: ${stage2Error.message}`);
    }
    
    // Calculate total processing time
    const processingTime = Date.now() - startTime;
    
    // Return complete result
    return res.status(200).json({
      success: true,
      stage: 'complete',
      processingTime: `${processingTime}ms`,
      
      // Stage 1 output
      parsedIntent: {
        intent: parsedIntent.intent,
        domain: parsedIntent.domain,
        action: parsedIntent.action,
        filters: parsedIntent.filters,
        confidence: parsedIntent.confidence,
        explanation: parsedIntent.explanation,
        source: parsedIntent.source
      },
      
      // Stage 2 output
      queryResult: {
        success: queryResult.success,
        columns: queryResult.columns,
        rows: queryResult.rows,
        summary: queryResult.summary,
        metadata: queryResult.metadata
      },
      
      // Additional metadata
      originalQuery: query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Smart Query Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'שגיאה בעיבוד השאילתה',
      originalQuery: req.body.query,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Confirm and execute low-confidence query
 */
export const confirmQuery = async (req, res) => {
  console.log('✅ Confirming low-confidence query');
  
  try {
    const { parsedIntent, originalQuery } = req.body;
    
    if (!parsedIntent) {
      return res.status(400).json({
        success: false,
        error: 'Parsed intent is required for confirmation'
      });
    }
    
    // Execute the confirmed intent
    console.log('🔧 Executing confirmed intent...');
    const queryResult = await executeReportQuery(parsedIntent, cityBudgetSchema);
    
    return res.status(200).json({
      success: true,
      stage: 'confirmed_execution',
      parsedIntent,
      queryResult,
      originalQuery,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Confirmation Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'שגיאה באישור השאילתה'
    });
  }
};

/**
 * Get available domains and their configurations
 */
export const getDomains = async (req, res) => {
  try {
    const domains = cityBudgetSchema.domains.map(domain => ({
      key: domain.key,
      label: domain.label,
      description: domain.description,
      fieldsCount: domain.fields.length,
      defaultFields: domain.defaultFields,
      keywords: domain.keywords,
      examples: cityBudgetSchema.examples.filter(ex => ex.domain === domain.key)
    }));
    
    return res.status(200).json({
      success: true,
      domains,
      totalDomains: domains.length,
      schemaVersion: cityBudgetSchema.version
    });
    
  } catch (error) {
    console.error('❌ Get Domains Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get fields for specific domain
 */
export const getDomainFields = async (req, res) => {
  try {
    const { domain } = req.params;
    
    const domainConfig = cityBudgetSchema.domains.find(d => d.key === domain);
    
    if (!domainConfig) {
      return res.status(404).json({
        success: false,
        error: `Domain '${domain}' not found`
      });
    }
    
    return res.status(200).json({
      success: true,
      domain: domainConfig.key,
      label: domainConfig.label,
      description: domainConfig.description,
      fields: domainConfig.fields,
      defaultFields: domainConfig.defaultFields,
      keywords: domainConfig.keywords
    });
    
  } catch (error) {
    console.error('❌ Get Domain Fields Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get system status and capabilities
 */
export const getSystemStatus = async (req, res) => {
  try {
    const parsingStats = getParsingStats();
    const executionStats = getExecutionStats();
    
    return res.status(200).json({
      success: true,
      status: 'operational',
      architecture: 'two-stage',
      
      // Stage 1 capabilities
      parsing: {
        ...parsingStats,
        supportedLanguages: ['hebrew', 'english'],
        confidenceRange: '0.0 - 1.0',
        fallbackEnabled: true
      },
      
      // Stage 2 capabilities  
      execution: {
        ...executionStats,
        validationEnabled: true,
        securityMode: 'strict'
      },
      
      // Schema information
      schema: {
        version: cityBudgetSchema.version,
        name: cityBudgetSchema.name,
        domains: cityBudgetSchema.domains.length,
        totalFields: cityBudgetSchema.domains.reduce((sum, d) => sum + d.fields.length, 0),
        lastUpdated: cityBudgetSchema.lastUpdated
      },
      
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ System Status Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
};

/**
 * Get example queries for user guidance
 */
export const getExamples = async (req, res) => {
  try {
    const { domain } = req.query;
    
    let examples = cityBudgetSchema.examples;
    
    // Filter by domain if specified
    if (domain) {
      examples = examples.filter(ex => ex.domain === domain);
    }
    
    // Group examples by domain
    const groupedExamples = examples.reduce((acc, example) => {
      if (!acc[example.domain]) {
        acc[example.domain] = [];
      }
      acc[example.domain].push(example);
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      examples: groupedExamples,
      totalExamples: examples.length,
      domains: Object.keys(groupedExamples)
    });
    
  } catch (error) {
    console.error('❌ Get Examples Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate query before processing (optional endpoint)
 */
export const validateQuery = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Query cannot be empty'
      });
    }
    
    // Basic validation
    const validation = {
      valid: true,
      length: query.length,
      hasHebrewCharacters: /[א-ת]/.test(query),
      hasNumbers: /\d/.test(query),
      estimatedDomain: null,
      suggestions: []
    };
    
    // Try to estimate domain without full parsing
    const lowerQuery = query.toLowerCase();
    for (const domain of cityBudgetSchema.domains) {
      const primaryKeywords = domain.keywords.primary;
      const hasKeyword = primaryKeywords.some(keyword => lowerQuery.includes(keyword));
      
      if (hasKeyword) {
        validation.estimatedDomain = domain.key;
        break;
      }
    }
    
    // Add suggestions if no domain detected
    if (!validation.estimatedDomain) {
      validation.suggestions = [
        'נסה להשתמש במילות מפתח כמו "חשבוניות", "תב״רים", או "תקציב"',
        'ציין מספר תב״ר או שם ספק לחיפוש מדויק יותר',
        'השתמש בביטויים כמו "דוח כל" לחיפוש מקיף'
      ];
    }
    
    return res.status(200).json({
      success: true,
      validation,
      query
    });
    
  } catch (error) {
    console.error('❌ Validate Query Error:', error);
    
    return res.status(500).json({
      success: false,
      valid: false,
      error: error.message
    });
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = async (req, res) => {
  try {
    // Test database connection
    const pool = (await import('../db.js')).default;
    
    const dbTest = await pool.query('SELECT 1 as test');
    
    return res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      parsing: getParsingStats().openaiConfigured ? 'openai-enabled' : 'rules-only',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Health Check Error:', error);
    
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 