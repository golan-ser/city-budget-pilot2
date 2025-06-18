import dotenv from 'dotenv';

dotenv.config();

// OpenAI will be initialized only when needed and available
let openai = null;

/**
 * Parse user query to structured intent - Stage 1 of two-stage architecture
 * @param {string} query - Natural language query in Hebrew
 * @param {object} schema - Controlled schema with domains and fields
 * @returns {Promise<object>} Structured intent with validation
 */
export async function parseUserQuery(query, schema) {
  console.log('🔍 Stage 1: parseUserQuery started', { query, domains: schema.domains.map(d => d.key) });
  
  try {
    // Validate input
    if (!query || !query.trim()) {
      throw new Error('Query cannot be empty');
    }
    
    if (!schema || !schema.domains || schema.domains.length === 0) {
      throw new Error('Invalid schema provided');
    }

    // Try OpenAI parsing first (if configured)
    if (isOpenAIConfigured()) {
      console.log('🤖 Attempting OpenAI parsing...');
      const openaiResult = await parseWithOpenAI(query, schema);
      
      if (openaiResult && validateParsedIntent(openaiResult, schema)) {
        console.log('✅ OpenAI parsing successful');
        return {
          ...openaiResult,
          source: 'openai',
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('⚠️ OpenAI parsing failed or invalid, falling back to rules');
    }

    // Fallback to enhanced rule-based parsing
    console.log('🔧 Using enhanced rule-based parsing...');
    const ruleResult = parseWithEnhancedRules(query, schema);
    
    if (validateParsedIntent(ruleResult, schema)) {
      console.log('✅ Rule-based parsing successful');
      return {
        ...ruleResult,
        source: 'rules',
        timestamp: new Date().toISOString()
      };
    }
    
    // Last resort - general search
    console.log('🔄 Creating fallback general search');
    return createFallbackIntent(query, schema);
    
  } catch (error) {
    console.error('❌ Error in parseUserQuery:', error);
    throw new Error(`Parsing failed: ${error.message}`);
  }
}

/**
 * Parse with OpenAI using controlled function calling
 */
async function parseWithOpenAI(query, schema) {
  try {
    // Initialize OpenAI only when needed
    if (!openai) {
      const OpenAI = await import('openai');
      openai = new OpenAI.default({
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      });
    }
    
    // Create controlled system prompt
    const systemPrompt = createControlledSystemPrompt(schema);
    
    // Prepare function schema for OpenAI
    const functionSchema = createOpenAIFunctionSchema(schema);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-1106',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `פרש את השאילתה הבאה לתחום ופילטרים מתאימים: "${query}"`
        }
      ],
      functions: [functionSchema],
      function_call: { name: 'parse_budget_query' },
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 800,
      temperature: 0.1 // Very low for consistent parsing
    });

    const functionCall = completion.choices[0]?.message?.function_call;
    if (!functionCall || functionCall.name !== 'parse_budget_query') {
      return null;
    }

    const result = JSON.parse(functionCall.arguments);
    console.log('🤖 OpenAI raw result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ OpenAI parsing error:', error);
    return null;
  }
}

/**
 * Create controlled system prompt for OpenAI
 */
function createControlledSystemPrompt(schema) {
  const domains = schema.domains.map(d => 
    `- ${d.key}: ${d.description} (שדות: ${d.fields.map(f => f.key).join(', ')})`
  ).join('\n');
  
  return `
אתה מפרש בקשות בעברית לדוחות במערכת תקציב עירוני.

תחומים זמינים:
${domains}

כללים קריטיים:
1. החזר רק JSON תקני במבנה המוגדר בפונקציה
2. אל תמציא שדות שלא קיימים בסכמה
3. אל תמציא ערכים שלא מופיעים ב-enumValues
4. אם לא בטוח - החזר confidence נמוך (מתחת ל-0.7)
5. תמיכה מלאה בעברית: "של", "מעל", "לפני", "אחרי", "בין"
6. זיהוי מספרי תב"ר: "תב״ר XXXX", "מתב״ר XXXX", "תבר XXXX"
7. זיהוי מחלקות: "חינוך", "תחבורה", "בריאות", "רווחה"
8. זיהוי סכומים: "מעל 10,000", "מתחת ל-5000", "בין 1000 ל-5000"
9. זיהוי תאריכים: "2024", "השנה", "שנה שעברה"
10. זיהוי סטטוס: "שולם", "לא שולם", "פעיל", "סגור"

דוגמאות:
- "דוח חשבוניות" → domain: "transactions", action: "list"
- "תב״רים של חינוך" → domain: "tabarim", filters: {"department": "חינוך"}
- "כמה פרויקטים פעילים יש" → domain: "tabarim", action: "count", filters: {"status": "פעיל"}
- "חשבוניות מעל 10,000 שקל" → domain: "transactions", filters: {"amount_gt": 10000}

השתמש בפונקציה parse_budget_query בלבד.
אל תוסיף הסברים או טקסט נוסף.
`;
}

/**
 * Create OpenAI function schema
 */
function createOpenAIFunctionSchema(schema) {
  return {
    name: 'parse_budget_query',
    description: 'Parse Hebrew budget query into structured format',
    parameters: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description: 'Type of intent (fetch_data, count_items, sum_amounts, etc.)'
        },
        domain: {
          type: 'string',
          enum: schema.domains.map(d => d.key),
          description: 'The domain/table to query'
        },
        action: {
          type: 'string',
          enum: ['list', 'count', 'sum', 'average', 'group'],
          description: 'The type of action to perform'
        },
        filters: {
          type: 'object',
          description: 'Filters to apply to the query',
          properties: {
            tabar_number: { type: 'string', description: 'Tabar number (4 digits)' },
            year: { type: 'integer', description: 'Year filter' },
            transaction_year: { type: 'integer', description: 'Transaction year' },
            department: { type: 'string', description: 'Department name' },
            ministry: { type: 'string', description: 'Ministry name' },
            status: { type: 'string', description: 'Status (פעיל/סגור/שולם/לא שולם)' },
            order_number: { type: 'string', description: 'Order number' },
            amount_gt: { type: 'number', description: 'Amount greater than' },
            amount_lt: { type: 'number', description: 'Amount less than' },
            search: { type: 'string', description: 'General search term' }
          }
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to return (optional)'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence level in the parsing (0-1)'
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation in Hebrew of what was parsed'
        }
      },
      required: ['intent', 'domain', 'action', 'filters', 'confidence', 'explanation']
    }
  };
}

/**
 * Enhanced rule-based parsing with full Hebrew support
 */
function parseWithEnhancedRules(query, schema) {
  const lowerQuery = query.toLowerCase();
  
  // Enhanced domain detection with scoring
  const domainScores = calculateDomainScores(lowerQuery, schema);
  const topDomain = domainScores[0];
  
  if (!topDomain || topDomain.score < 0.3) {
    return createFallbackIntent(query, schema);
  }

  // Extract comprehensive filters
  const filters = extractComprehensiveFilters(query, topDomain.domain.key);
  
  // Detect action with Hebrew support
  const action = detectActionWithHebrew(lowerQuery);
  
  // Determine intent
  const intent = determineIntent(action, topDomain.domain.key, filters);
  
  console.log('🔍 Final filters before return:', filters);
  
  return {
    intent,
    domain: topDomain.domain.key,
    action,
    filters,
    fields: [], // Will be filled by default fields in execution stage
    confidence: Math.min(topDomain.score + (Object.keys(filters).length * 0.1), 0.95),
    explanation: `זיהוי אוטומטי: ${topDomain.domain.label} - ${action} עם ${Object.keys(filters).length} פילטרים`
  };
}

/**
 * Calculate domain scores with enhanced Hebrew keyword detection
 */
function calculateDomainScores(query, schema) {
  const scores = schema.domains.map(domain => {
    let score = 0;
    
    // Domain-specific keywords
    const keywords = getDomainKeywords(domain.key);
    
    // Primary keywords (high weight)
    keywords.primary.forEach(keyword => {
      if (query.includes(keyword)) score += 0.5;
    });
    
    // Secondary keywords (medium weight)
    keywords.secondary.forEach(keyword => {
      if (query.includes(keyword)) score += 0.3;
    });
    
    // Field mentions (low weight)
    domain.fields.forEach(field => {
      if (query.includes(field.label.toLowerCase())) {
        score += 0.2;
      }
    });
    
    return { domain, score };
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Enhanced keyword mapping for all domains
 */
function getDomainKeywords(domainKey) {
  const keywordMap = {
    transactions: {
      primary: ['חשבונית', 'חשבוניות', 'תשלום', 'תשלומים', 'תנועה', 'תנועות', 'חשבון'],
      secondary: ['הזמנה', 'מספר', 'שולם', 'זיכוי', 'חיוב', 'כסף', 'תשלמו', 'כניסה']
    },
    tabarim: {
      primary: ['תבר', 'תב"ר', 'תב״ר', 'פרויקט', 'פרויקטים', 'תכנית'],
      secondary: ['משרד', 'מחלקה', 'סטטוס', 'פעיל', 'סגור', 'תקציב']
    },
    budget_items: {
      primary: ['תקציב', 'סעיף', 'סעיפים', 'ניצול', 'הוצאה', 'הוצאות'],
      secondary: ['מאושר', 'מבוצע', '%', 'אחוז', 'ביצוע']
    },
    comprehensive: {
      primary: ['דוח', 'דוחות', 'כל', 'הכל', 'רשימה', 'הצג'],
      secondary: ['נרחב', 'מכל', 'כללי', 'מלא']
    }
  };
  
  return keywordMap[domainKey] || { primary: [], secondary: [] };
}

/**
 * Extract comprehensive filters with Hebrew language support
 */
function extractComprehensiveFilters(query, domain) {
  const filters = {};
  
  // Tabar number patterns (multiple formats)
  const tabarPatterns = [
    /תב[״"]\s*ר\s*(\d{3,4})/i,
    /מתב[״"]\s*ר\s*(\d{3,4})/i,
    /תבר\s*(\d{3,4})/i,
    /(?:^|\s)(\d{4})(?:\s|$)/
  ];
  
  for (const pattern of tabarPatterns) {
    const match = query.match(pattern);
    if (match) {
      filters.tabar_number = match[1];
      break;
    }
  }
  
  // Year extraction (multiple formats)
  const yearPatterns = [
    /\b(20\d{2})\b/,
    /שנת\s*(20\d{2})/,
    /מ\s*(20\d{2})/,
    /ב\s*(20\d{2})/
  ];
  
  for (const pattern of yearPatterns) {
    const match = query.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      if (domain === 'transactions') {
        filters.transaction_year = year;
      } else {
        filters.year = year;
      }
      break;
    }
  }
  
  // Department/Ministry detection
  const departments = [
    { key: 'חינוך', ministry: 'משרד החינוך' },
    { key: 'תחבורה', ministry: 'משרד התחבורה' },
    { key: 'בריאות', ministry: 'משרד הבריאות' },
    { key: 'רווחה', ministry: 'משרד הרווחה' },
    { key: 'תרבות', ministry: 'משרד התרבות' },
    { key: 'ספורט', ministry: 'משרד הספורט' }
  ];
  
  for (const dept of departments) {
    if (query.toLowerCase().includes(dept.key)) {
      filters.department = dept.key;
      if (domain === 'tabarim' || domain === 'comprehensive') {
        filters.ministry = dept.ministry;
      }
      break;
    }
  }
  
  // Amount extraction with Hebrew prepositions
  const amountPatterns = [
    /מעל\s*([\d,]+)(?:\s*שקל)?/i,
    /יותר\s*מ\s*([\d,]+)/i,
    /גדול\s*מ\s*([\d,]+)/i,
    /מתחת\s*ל\s*([\d,]+)/i,
    /פחות\s*מ\s*([\d,]+)/i,
    /קטן\s*מ\s*([\d,]+)/i
  ];
  
  for (const pattern of amountPatterns) {
    const match = query.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (pattern.source.includes('מעל') || pattern.source.includes('יותר') || pattern.source.includes('גדול')) {
        if (domain === 'transactions') {
          filters.amount_gt = amount;
        } else {
          filters.total_authorized_gt = amount;
        }
      } else {
        if (domain === 'transactions') {
          filters.amount_lt = amount;
        } else {
          filters.total_authorized_lt = amount;
        }
      }
      break;
    }
  }
  
  // Status detection with context - improved patterns
  const statusPatterns = [
    { pattern: /(?:^|\s)שולם(?:\s|$)/, value: 'שולם' },
    { pattern: /לא\s*שולם/, value: 'לא שולם' },
    { pattern: /(?:^|\s)פעיל(?:\s|$)/, value: 'פעיל' },
    { pattern: /(?:^|\s)סגור(?:\s|$)/, value: 'סגור' },
    { pattern: /בתהליך/, value: 'בתהליך' },
    // Additional patterns for better detection
    { pattern: /חשבוניות.*לא.*שולמו/, value: 'לא שולם' },
    { pattern: /תשלומים.*לא.*שולמו/, value: 'לא שולם' },
    { pattern: /חשבוניות.*שולמו/, value: 'שולם' },
    { pattern: /תשלומים.*שולמו/, value: 'שולם' }
  ];
  
  for (const statusPattern of statusPatterns) {
    if (statusPattern.pattern.test(query)) {
      filters.status = statusPattern.value;
      console.log('🎯 Status filter detected:', { pattern: statusPattern.pattern.source, value: statusPattern.value });
      break;
    }
  }
  
  // Transaction type (for transactions domain)
  if (domain === 'transactions') {
    if (query.includes('חשבונית') && !query.includes('חשבוניות')) {
      filters.transaction_type = 'חשבונית';
    } else if (query.includes('תשלום') && !query.includes('תשלומים')) {
      filters.transaction_type = 'תשלום';
    }
    
    // Direction detection
    if (query.includes('חיוב')) {
      filters.direction = 'חיוב';
    } else if (query.includes('זיכוי')) {
      filters.direction = 'זיכוי';
    } else if (query.includes('כניסה')) {
      filters.direction = 'כניסה';
    }
  }
  
  // Order number extraction
  const orderPatterns = [
    /הזמנה\s+([A-Z0-9\-]+)/i,
    /מספר\s+([A-Z0-9\-]+)/i,
    /([A-Z]{2,3}-\d+)/i
  ];
  
  for (const pattern of orderPatterns) {
    const match = query.match(pattern);
    if (match && domain === 'transactions') {
      filters.order_number = match[1].trim();
      break;
    }
  }
  
  // General search fallback - but don't search for report keywords or status queries
  if (Object.keys(filters).length === 0) {
    // Check if this is a "report" request (should return all data)
    const reportKeywords = ['דוח', 'דוחות', 'הצג', 'רשימה', 'כל', 'הכל'];
    const isReportRequest = reportKeywords.some(keyword => query.includes(keyword));
    
    // Check if this is a status query that didn't get caught
    const statusKeywords = ['שולם', 'לא שולם', 'פעיל', 'סגור', 'בתהליך'];
    const isStatusQuery = statusKeywords.some(keyword => query.includes(keyword));
    
    if (!isReportRequest && !isStatusQuery) {
      filters.search = query;
    }
    // If it's a report request or status query, leave filters empty to return all data
  }
  
  return filters;
}

/**
 * Detect action with Hebrew language support
 */
function detectActionWithHebrew(query) {
  if (query.includes('כמה') || query.includes('ספור') || query.includes('מספר')) {
    return 'count';
  }
  if (query.includes('סכום') || query.includes('סה"כ') || query.includes('סיכום')) {
    return 'sum';
  }
  if (query.includes('ממוצע') || query.includes('בממוצע')) {
    return 'average';
  }
  if (query.includes('קבץ') || query.includes('לפי') || query.includes('חלק')) {
    return 'group';
  }
  return 'list';
}

/**
 * Determine intent based on action and domain
 */
function determineIntent(action, domain, filters) {
  const baseIntent = `${action}_${domain}`;
  
  if (Object.keys(filters).length > 0) {
    return `${baseIntent}_filtered`;
  }
  
  return baseIntent;
}

/**
 * Create fallback intent for unclear queries
 */
function createFallbackIntent(query, schema) {
  return {
    intent: 'general_search',
    domain: 'comprehensive',
    action: 'list',
    filters: { search: query },
    fields: [],
    confidence: 0.5,
    explanation: 'חיפוש כללי במערכת - לא זוהה תחום ספציפי'
  };
}

/**
 * Validate parsed intent against schema
 */
function validateParsedIntent(intent, schema) {
  try {
    // Check required fields
    if (!intent.intent || !intent.domain || !intent.action || !intent.filters) {
      console.warn('Missing required fields in parsed intent');
      return false;
    }
    
    // Check domain exists
    const domainExists = schema.domains.some(d => d.key === intent.domain);
    if (!domainExists) {
      console.warn(`Domain ${intent.domain} not found in schema`);
      return false;
    }
    
    // Check action is valid
    const validActions = ['list', 'count', 'sum', 'average', 'group'];
    if (!validActions.includes(intent.action)) {
      console.warn(`Invalid action: ${intent.action}`);
      return false;
    }
    
    // Check confidence range
    if (typeof intent.confidence !== 'number' || 
        intent.confidence < 0 || intent.confidence > 1) {
      console.warn(`Invalid confidence: ${intent.confidence}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

/**
 * Check if OpenAI is configured
 */
function isOpenAIConfigured() {
  try {
    // Check if openai package is available
    require.resolve('openai');
    
    // Check if API key is configured
    return !!(process.env.OPENAI_API_KEY && 
             process.env.OPENAI_API_KEY !== 'your-api-key-here' &&
             process.env.OPENAI_API_KEY.startsWith('sk-'));
  } catch (error) {
    console.log('📦 OpenAI package not available, using rules-based parsing only');
    return false;
  }
}

/**
 * Get parsing statistics
 */
export function getParsingStats() {
  return {
    openaiConfigured: isOpenAIConfigured(),
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-1106',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 800,
    supportedLanguages: ['hebrew', 'english'],
    supportedActions: ['list', 'count', 'sum', 'average', 'group']
  };
} 