/**
 * Modular Schema Configuration for Smart Report Generator
 * This configuration defines all available domains, fields, and their properties
 * Can be easily extended for different systems and use cases
 */

export const cityBudgetSchema = {
  version: '2.0',
  name: 'City Budget Management System',
  description: 'Schema for municipal budget and transaction reporting',
  lastUpdated: '2024-01-15',
  
  // Global configuration
  config: {
    defaultLanguage: 'hebrew',
    maxResults: 100,
    supportedActions: ['list', 'count', 'sum', 'average', 'group'],
    supportedOperators: ['equals', 'contains', 'greater_than', 'less_than', 'between']
  },
  
  // Domain definitions
  domains: [
    {
      key: 'transactions',
      label: 'תנועות כספיות',
      description: 'חשבוניות ותשלומים',
      table: 'tabar_transactions',
      primaryKey: 'transaction_id',
      
      // Available fields for this domain
      fields: [
        {
          key: 'transaction_id',
          label: 'מספר עסקה',
          type: 'integer',
          required: false,
          searchable: true,
          sortable: true
        },
        {
          key: 'transaction_type',
          label: 'סוג עסקה',
          type: 'enum',
          enumValues: ['חשבונית', 'תשלום', 'זיכוי', 'חיוב'],
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'order_number',
          label: 'מספר הזמנה',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'direction',
          label: 'כיוון',
          type: 'enum',
          enumValues: ['חיוב', 'זיכוי', 'כניסה'],
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'description',
          label: 'תיאור',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'amount',
          label: 'סכום',
          type: 'currency',
          required: false,
          searchable: false,
          filterable: true,
          aggregatable: true
        },
        {
          key: 'status',
          label: 'סטטוס תשלום',
          type: 'enum',
          enumValues: ['שולם', 'לא שולם', 'בתהליך', 'בוטל'],
          required: false,
          searchable: false,
          filterable: true
        },
        {
          key: 'transaction_date',
          label: 'תאריך עסקה',
          type: 'date',
          required: false,
          searchable: false,
          filterable: true,
          sortable: true
        },
        {
          key: 'transaction_year',
          label: 'שנת עסקה',
          type: 'integer',
          required: false,
          searchable: false,
          filterable: true,
          derivedFrom: 'transaction_date'
        },
        {
          key: 'document_url',
          label: 'מסמך',
          type: 'text',
          required: false,
          searchable: false,
          filterable: false
        },
        {
          key: 'tabar_id',
          label: 'מזהה תב״ר',
          type: 'integer',
          required: false,
          searchable: false,
          filterable: true,
          foreignKey: 'tabarim.tabar_id'
        }
      ],
      
      // Default display fields
      defaultFields: ['transaction_type', 'order_number', 'amount', 'status', 'transaction_date'],
      
      // Keywords for domain detection
      keywords: {
        primary: ['חשבונית', 'חשבוניות', 'תשלום', 'תשלומים', 'תנועה', 'תנועות'],
        secondary: ['ספק', 'ספקים', 'שולם', 'דווח', 'זיכוי', 'חיוב', 'כסף']
      }
    },
    
    {
      key: 'tabarim',
      label: 'תב״רים',
      description: 'פרויקטים ותכניות',
      table: 'tabarim',
      primaryKey: 'tabar_id',
      
      fields: [
        {
          key: 'tabar_id',
          label: 'מזהה תב״ר',
          type: 'integer',
          required: false,
          searchable: true,
          sortable: true
        },
        {
          key: 'tabar_number',
          label: 'מספר תב״ר',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true,
          sortable: true
        },
        {
          key: 'name',
          label: 'שם הפרויקט',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'ministry',
          label: 'משרד',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'department',
          label: 'מחלקה',
          type: 'enum',
          enumValues: ['חינוך', 'תחבורה', 'בריאות', 'רווחה', 'תרבות', 'ספורט'],
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'total_authorized',
          label: 'תקציב מאושר',
          type: 'currency',
          required: false,
          searchable: false,
          filterable: true,
          aggregatable: true
        },
        {
          key: 'status',
          label: 'סטטוס פרויקט',
          type: 'enum',
          enumValues: ['פעיל', 'סגור', 'בתכנון', 'מושהה', 'בוטל'],
          required: false,
          searchable: false,
          filterable: true
        },
        {
          key: 'year',
          label: 'שנה',
          type: 'integer',
          required: false,
          searchable: false,
          filterable: true,
          sortable: true
        },
        {
          key: 'start_date',
          label: 'תאריך התחלה',
          type: 'date',
          required: false,
          searchable: false,
          filterable: true
        },
        {
          key: 'end_date',
          label: 'תאריך סיום',
          type: 'date',
          required: false,
          searchable: false,
          filterable: true
        }
      ],
      
      defaultFields: ['tabar_number', 'name', 'ministry', 'total_authorized', 'status', 'year'],
      
      keywords: {
        primary: ['תבר', 'תב"ר', 'תב״ר', 'פרויקט', 'פרויקטים', 'תכנית'],
        secondary: ['משרד', 'מחלקה', 'סטטוס', 'פעיל', 'סגור', 'תקציב']
      }
    },
    
    {
      key: 'budget_items',
      label: 'סעיפי תקציב',
      description: 'פירוט סעיפי תקציב לפרויקטים',
      table: 'tabar_items',
      primaryKey: 'item_id',
      
      fields: [
        {
          key: 'item_id',
          label: 'מזהה סעיף',
          type: 'integer',
          required: false,
          searchable: true,
          sortable: true
        },
        {
          key: 'item_name',
          label: 'שם הסעיף',
          type: 'text',
          required: false,
          searchable: true,
          filterable: true
        },
        {
          key: 'authorized_amount',
          label: 'סכום מאושר',
          type: 'currency',
          required: false,
          searchable: false,
          filterable: true,
          aggregatable: true
        },
        {
          key: 'executed_amount',
          label: 'סכום מבוצע',
          type: 'currency',
          required: false,
          searchable: false,
          filterable: true,
          aggregatable: true
        },
        {
          key: 'execution_percentage',
          label: 'אחוז ביצוע',
          type: 'percentage',
          required: false,
          searchable: false,
          filterable: true,
          derivedFrom: ['executed_amount', 'authorized_amount']
        },
        {
          key: 'tabar_id',
          label: 'מזהה תב״ר',
          type: 'integer',
          required: false,
          searchable: false,
          filterable: true,
          foreignKey: 'tabarim.tabar_id'
        }
      ],
      
      defaultFields: ['item_name', 'authorized_amount', 'executed_amount', 'execution_percentage'],
      
      keywords: {
        primary: ['תקציב', 'סעיף', 'סעיפים', 'ניצול', 'הוצאה', 'הוצאות'],
        secondary: ['מאושר', 'מבוצע', '%', 'אחוז', 'ביצוע']
      }
    },
    
    {
      key: 'comprehensive',
      label: 'דוח מקיף',
      description: 'חיפוש מקיף בכל הטבלאות',
      table: 'tabarim', // Main table for JOINs
      primaryKey: 'tabar_id',
      
      // Includes fields from all domains
      fields: [
        // Tabarim fields
        {
          key: 'tabar_number',
          label: 'מספר תב״ר',
          type: 'text',
          source: 'tabarim'
        },
        {
          key: 'name',
          label: 'שם הפרויקט',
          type: 'text',
          source: 'tabarim'
        },
        {
          key: 'ministry',
          label: 'משרד',
          type: 'text',
          source: 'tabarim'
        },
        {
          key: 'total_authorized',
          label: 'תקציב מאושר',
          type: 'currency',
          source: 'tabarim'
        },
        {
          key: 'status',
          label: 'סטטוס',
          type: 'text',
          source: 'tabarim'
        },
        // Transaction fields
        {
          key: 'transaction_count',
          label: 'מספר עסקאות',
          type: 'integer',
          source: 'transactions',
          aggregated: true
        },
        {
          key: 'total_transactions',
          label: 'סכום עסקאות',
          type: 'currency',
          source: 'transactions',
          aggregated: true
        },
        {
          key: 'paid_amount',
          label: 'סכום ששולם',
          type: 'currency',
          source: 'transactions',
          aggregated: true
        },
        {
          key: 'unpaid_amount',
          label: 'סכום שלא שולם',
          type: 'currency',
          source: 'transactions',
          aggregated: true
        }
      ],
      
      defaultFields: ['tabar_number', 'name', 'ministry', 'total_authorized', 'transaction_count', 'total_transactions'],
      
      keywords: {
        primary: ['דוח', 'דוחות', 'כל', 'הכל', 'רשימה', 'הצג'],
        secondary: ['נרחב', 'מכל', 'כללי', 'מלא', 'מקיף']
      }
    }
  ],
  
  // Common filters that apply across domains
  commonFilters: [
    {
      key: 'search',
      label: 'חיפוש כללי',
      type: 'text',
      description: 'חיפוש חופשי בכל השדות הרלוונטיים'
    },
    {
      key: 'year',
      label: 'שנה',
      type: 'integer',
      description: 'פילטר לפי שנה'
    },
    {
      key: 'date_from',
      label: 'מתאריך',
      type: 'date',
      description: 'תאריך התחלה'
    },
    {
      key: 'date_to',
      label: 'עד תאריך',
      type: 'date',
      description: 'תאריך סיום'
    }
  ],
  
  // Hebrew language support
  language: {
    prepositions: ['של', 'מ', 'ל', 'ב', 'על', 'עם', 'אל', 'מן', 'עד'],
    comparatives: ['מעל', 'מתחת', 'יותר מ', 'פחות מ', 'בין', 'גדול מ', 'קטן מ'],
    quantifiers: ['כל', 'הכל', 'כמה', 'מספר', 'סכום', 'ממוצע'],
    timeWords: ['שנה', 'חודש', 'יום', 'השנה', 'שנה שעברה', 'השנה הנוכחית'],
    statusWords: ['פעיל', 'סגור', 'שולם', 'לא שולם', 'בתהליך', 'מושהה']
  },
  
  // Example queries for user guidance
  examples: [
    {
      query: 'חשבוניות של חברת אלקטרה',
      domain: 'transactions',
      description: 'מציאת חשבוניות לפי שם ספק'
    },
    {
      query: 'תב״רים של משרד החינוך',
      domain: 'tabarim',
      description: 'רשימת פרויקטים לפי משרד'
    },
    {
      query: 'כמה פרויקטים פעילים יש',
      domain: 'tabarim',
      description: 'ספירת פרויקטים לפי סטטוס'
    },
    {
      query: 'סכום חשבוניות מעל 10,000 שקל',
      domain: 'transactions',
      description: 'סיכום סכומים לפי תנאי'
    },
    {
      query: 'דוח מקיף של תב״ר 2211',
      domain: 'comprehensive',
      description: 'מידע מקיף על פרויקט ספציפי'
    }
  ]
};

/**
 * Get domain configuration by key
 */
export function getDomainConfig(domainKey) {
  return cityBudgetSchema.domains.find(d => d.key === domainKey);
}

/**
 * Get all available domains
 */
export function getAllDomains() {
  return cityBudgetSchema.domains.map(d => ({
    key: d.key,
    label: d.label,
    description: d.description
  }));
}

/**
 * Get fields for specific domain
 */
export function getDomainFields(domainKey) {
  const domain = getDomainConfig(domainKey);
  return domain ? domain.fields : [];
}

/**
 * Get default fields for domain
 */
export function getDefaultFields(domainKey) {
  const domain = getDomainConfig(domainKey);
  return domain ? domain.defaultFields : [];
}

/**
 * Get keywords for domain detection
 */
export function getDomainKeywords(domainKey) {
  const domain = getDomainConfig(domainKey);
  return domain ? domain.keywords : { primary: [], secondary: [] };
}

/**
 * Validate field exists in domain
 */
export function validateField(domainKey, fieldKey) {
  const domain = getDomainConfig(domainKey);
  if (!domain) return false;
  
  return domain.fields.some(f => f.key === fieldKey);
}

/**
 * Get field configuration
 */
export function getFieldConfig(domainKey, fieldKey) {
  const domain = getDomainConfig(domainKey);
  if (!domain) return null;
  
  return domain.fields.find(f => f.key === fieldKey);
}

/**
 * Get schema version and metadata
 */
export function getSchemaInfo() {
  return {
    version: cityBudgetSchema.version,
    name: cityBudgetSchema.name,
    description: cityBudgetSchema.description,
    lastUpdated: cityBudgetSchema.lastUpdated,
    domainsCount: cityBudgetSchema.domains.length,
    totalFields: cityBudgetSchema.domains.reduce((sum, d) => sum + d.fields.length, 0)
  };
}

/**
 * Export for use in other modules
 */
export default cityBudgetSchema; 