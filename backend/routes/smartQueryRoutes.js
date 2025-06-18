import express from 'express';
import { 
  processSmartQuery,
  confirmQuery,
  getDomains,
  getDomainFields,
  getSystemStatus,
  getExamples,
  validateQuery,
  healthCheck
} from '../controllers/smartQueryController.js';

const router = express.Router();

/**
 * Smart Query Routes - Two-Stage Architecture
 * 
 * Main Endpoints:
 * - POST /process - Main query processing (two-stage)
 * - POST /confirm - Confirm low-confidence queries
 * 
 * Configuration Endpoints:
 * - GET /domains - Get available domains
 * - GET /domains/:domain/fields - Get fields for specific domain
 * - GET /examples - Get example queries
 * 
 * System Endpoints:
 * - GET /status - System status and capabilities
 * - POST /validate - Validate query before processing
 * - GET /health - Health check
 */

// ===== MAIN PROCESSING ENDPOINTS =====

/**
 * POST /api/smart-query/process
 * Main endpoint for two-stage query processing
 * 
 * Body: {
 *   query: string (required) - Natural language query in Hebrew
 *   options?: {
 *     minConfidence?: number - Minimum confidence threshold (default: 0.3)
 *     timeout?: number - Processing timeout in ms
 *   }
 * }
 * 
 * Response: {
 *   success: boolean,
 *   stage: 'parsing' | 'complete',
 *   parsedIntent?: object,
 *   queryResult?: object,
 *   lowConfidence?: boolean,
 *   message?: string,
 *   processingTime?: string
 * }
 */
router.post('/process', processSmartQuery);

/**
 * POST /api/smart-query/confirm
 * Confirm and execute low-confidence parsed intent
 * 
 * Body: {
 *   parsedIntent: object (required) - Previously parsed intent
 *   originalQuery: string - Original user query
 * }
 */
router.post('/confirm', confirmQuery);

// ===== CONFIGURATION ENDPOINTS =====

/**
 * GET /api/smart-query/domains
 * Get all available domains with their configurations
 * 
 * Response: {
 *   success: boolean,
 *   domains: Array<{
 *     key: string,
 *     label: string,
 *     description: string,
 *     fieldsCount: number,
 *     defaultFields: string[],
 *     keywords: object,
 *     examples: object[]
 *   }>,
 *   totalDomains: number,
 *   schemaVersion: string
 * }
 */
router.get('/domains', getDomains);

/**
 * GET /api/smart-query/domains/:domain/fields
 * Get detailed field information for specific domain
 * 
 * Params: {
 *   domain: string - Domain key (transactions, tabarim, budget_items, comprehensive)
 * }
 * 
 * Response: {
 *   success: boolean,
 *   domain: string,
 *   label: string,
 *   description: string,
 *   fields: Array<FieldDefinition>,
 *   defaultFields: string[],
 *   keywords: object
 * }
 */
router.get('/domains/:domain/fields', getDomainFields);

/**
 * GET /api/smart-query/examples
 * Get example queries for user guidance
 * 
 * Query params: {
 *   domain?: string - Filter examples by domain
 * }
 * 
 * Response: {
 *   success: boolean,
 *   examples: object, // Grouped by domain
 *   totalExamples: number,
 *   domains: string[]
 * }
 */
router.get('/examples', getExamples);

// ===== SYSTEM ENDPOINTS =====

/**
 * GET /api/smart-query/status
 * Get system status and capabilities
 * 
 * Response: {
 *   success: boolean,
 *   status: 'operational' | 'degraded' | 'error',
 *   architecture: 'two-stage',
 *   parsing: object, // Stage 1 capabilities
 *   execution: object, // Stage 2 capabilities
 *   schema: object, // Schema information
 *   timestamp: string
 * }
 */
router.get('/status', getSystemStatus);

/**
 * POST /api/smart-query/validate
 * Validate query before processing (optional pre-check)
 * 
 * Body: {
 *   query: string (required)
 * }
 * 
 * Response: {
 *   success: boolean,
 *   valid: boolean,
 *   validation: {
 *     length: number,
 *     hasHebrewCharacters: boolean,
 *     hasNumbers: boolean,
 *     estimatedDomain: string | null,
 *     suggestions: string[]
 *   },
 *   query: string
 * }
 */
router.post('/validate', validateQuery);

/**
 * GET /api/smart-query/health
 * Health check endpoint for monitoring
 * 
 * Response: {
 *   success: boolean,
 *   status: 'healthy' | 'unhealthy',
 *   database: 'connected' | 'error',
 *   parsing: 'openai-enabled' | 'rules-only',
 *   timestamp: string
 * }
 */
router.get('/health', healthCheck);

/**
 * GET /api/smart-query/openai-status
 * Check OpenAI API status
 */
router.get('/openai-status', (req, res) => {
  try {
    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here';
    
    res.json({
      success: true,
      openaiConfigured: hasApiKey,
      status: hasApiKey ? 'מוגדר' : 'לא מוגדר',
      apiKeyPreview: hasApiKey ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'לא קיים',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-1106',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smart-query/test
 * Simple test endpoint to verify imports are working
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    
    // Test imports
    const { parseUserQuery } = await import('../services/parseUserQuery.js');
    const { executeReportQuery } = await import('../services/executeReportQuery.js');
    const cityBudgetSchema = (await import('../config/schemaConfig.js')).default;
    
    console.log('✅ All imports successful');
    
    res.json({
      success: true,
      message: 'Test successful',
      imports: {
        parseUserQuery: typeof parseUserQuery,
        executeReportQuery: typeof executeReportQuery,
        cityBudgetSchema: !!cityBudgetSchema,
        schemaVersion: cityBudgetSchema?.version || 'unknown',
        domainsCount: cityBudgetSchema?.domains?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ===== LEGACY COMPATIBILITY =====

/**
 * POST /api/smart-query/parse (DEPRECATED)
 * Legacy endpoint for backward compatibility
 * Redirects to new /process endpoint
 */
router.post('/parse', (req, res) => {
  console.log('⚠️ Legacy /parse endpoint called, redirecting to /process');
  
  try {
    // Transform legacy request format to new format
    const { query, schema, ...options } = req.body;
    
    // Create new request body in expected format
    const transformedBody = {
      query,
      options: options || {}
    };
    
    // Update request body
    req.body = transformedBody;
    
    // Call new endpoint
    processSmartQuery(req, res);
  } catch (error) {
    console.error('❌ Error in legacy parse endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'שגיאה בעיבוד השאילתה'
    });
  }
});

// ===== ERROR HANDLING MIDDLEWARE =====

/**
 * Global error handler for smart query routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Smart Query Route Error:', error);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    message: 'שגיאה במעבד השאילתות החכמות',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  });
});

// ===== ROUTE DOCUMENTATION =====

/**
 * GET /api/smart-query/docs
 * API documentation endpoint
 */
router.get('/docs', (req, res) => {
  const documentation = {
    title: 'Smart Query API - Two-Stage Architecture',
    version: '2.0',
    description: 'Natural language query processing for municipal budget system',
    
    architecture: {
      stage1: {
        name: 'parseUserQuery',
        description: 'Natural Language → Structured Intent',
        methods: ['OpenAI Function Calling', 'Enhanced Rule-based Parsing'],
        languages: ['Hebrew', 'English'],
        confidence: 'Returns confidence score 0.0-1.0'
      },
      stage2: {
        name: 'executeReportQuery',
        description: 'Structured Intent → SQL Execution',
        security: 'No GPT access, strict validation',
        database: 'PostgreSQL with JOIN support',
        maxResults: 100
      }
    },
    
    endpoints: {
      main: [
        'POST /process - Main query processing',
        'POST /confirm - Confirm low-confidence queries'
      ],
      configuration: [
        'GET /domains - Available domains',
        'GET /domains/:domain/fields - Domain fields',
        'GET /examples - Example queries'
      ],
      system: [
        'GET /status - System capabilities',
        'POST /validate - Query validation',
        'GET /health - Health check'
      ]
    },
    
    domains: [
      'transactions - חשבוניות ותנועות כספיות',
      'tabarim - תב״רים ופרויקטים',
      'budget_items - סעיפי תקציב',
      'comprehensive - חיפוש מקיף בכל הטבלאות'
    ],
    
    examples: [
      'חשבוניות של חברת אלקטרה',
      'תב״רים של משרד החינוך',
      'כמה פרויקטים פעילים יש',
      'סכום חשבוניות מעל 10,000 שקל',
      'דוח מקיף של תב״ר 2211'
    ],
    
    hebrew_support: {
      prepositions: ['של', 'מ', 'ל', 'ב', 'על', 'עם'],
      comparatives: ['מעל', 'מתחת', 'יותר מ', 'פחות מ', 'בין'],
      quantifiers: ['כל', 'הכל', 'כמה', 'מספר', 'סכום', 'ממוצע'],
      status_words: ['פעיל', 'סגור', 'שולם', 'לא שולם', 'בתהליך']
    }
  };
  
  res.json(documentation);
});

export default router; 