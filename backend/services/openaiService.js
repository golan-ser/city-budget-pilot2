import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

/**
 * Controlled GPT parsing for budget queries
 * @param {string} query - User query in Hebrew
 * @param {object} schema - Controlled schema with allowed domains and fields
 * @returns {Promise<object|null>} Parsed intent or null if failed
 */
export async function parseQueryWithGPT(query, schema) {
  try {
    // Skip if no API key configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      console.log('⚠️ OpenAI API key not configured, skipping GPT parsing');
      return null;
    }

    console.log('🤖 Calling OpenAI for query:', query);

    // Prepare controlled system prompt
    const systemPrompt = createControlledPrompt(schema);
    
    // Call OpenAI with function calling for structured output
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-1106',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `פרש את השאילתה הבאה: "${query}"`
        }
      ],
      functions: [
        {
          name: 'parse_budget_query',
          description: 'Parse Hebrew budget query into structured format',
          parameters: {
            type: 'object',
            properties: {
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
                description: 'Filters to apply to the query'
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Confidence level in the parsing'
              },
              explanation: {
                type: 'string',
                description: 'Brief explanation in Hebrew'
              }
            },
            required: ['domain', 'action', 'filters', 'confidence', 'explanation']
          }
        }
      ],
      function_call: { name: 'parse_budget_query' },
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: 0.1 // Low temperature for consistent parsing
    });

    const functionCall = completion.choices[0]?.message?.function_call;
    if (!functionCall || functionCall.name !== 'parse_budget_query') {
      console.warn('❌ OpenAI did not return expected function call');
      return null;
    }

    const result = JSON.parse(functionCall.arguments);
    console.log('✅ OpenAI parsing result:', result);

    // Validate result
    if (validateOpenAIResponse(result, schema)) {
      return result;
    } else {
      console.warn('❌ OpenAI response validation failed');
      return null;
    }

  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    return null;
  }
}

/**
 * Create controlled system prompt for GPT
 */
function createControlledPrompt(schema) {
  const domains = schema.domains.map(d => `- ${d.key}: ${d.description}`).join('\n');
  
  return `
אתה מפרש בקשות בעברית לדוחות במערכת תקציב עירוני.

תחומים זמינים:
${domains}

כללים קריטיים:
1. החזר רק JSON תקני במבנה המוגדר
2. אל תמציא שדות שלא קיימים בסכמה
3. אל תמציא ערכים שלא מופיעים ב-enumValues
4. אם לא בטוח - החזר confidence נמוך (מתחת ל-0.7)
5. עבור מספרי תב"ר - חפש דפוסים כמו "תב״ר XXXX" או "מתב״ר XXXX"
6. עבור מחלקות - זהה משרדים כמו "חינוך", "תחבורה", "בריאות"
7. עבור סטטוס - זהה "שולם", "לא שולם", "פעיל", "סגור"

דוגמאות:
- "דוח חשבוניות" → domain: "transactions", action: "list"
- "תב״רים של חינוך" → domain: "tabarim", filters: {"department": "חינוך"}
- "כמה פרויקטים פעילים" → domain: "tabarim", action: "count", filters: {"status": "פעיל"}

השתמש בפונקציה parse_budget_query בלבד.
`;
}

/**
 * Validate OpenAI response
 */
function validateOpenAIResponse(response, schema) {
  if (!response || typeof response !== 'object') return false;
  if (!response.domain || !response.action || !response.filters) return false;
  
  // Check if domain exists
  const domainExists = schema.domains.some(d => d.key === response.domain);
  if (!domainExists) return false;
  
  // Check if action is valid
  const validActions = ['list', 'count', 'sum', 'average', 'group'];
  if (!validActions.includes(response.action)) return false;
  
  // Check confidence range
  if (typeof response.confidence !== 'number' || 
      response.confidence < 0 || response.confidence > 1) return false;
  
  return true;
}

/**
 * Get OpenAI usage statistics
 */
export function getOpenAIStats() {
  return {
    apiKeyConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here'),
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-1106',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000
  };
} 