export interface QueryField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  filterable?: boolean;
  searchable?: boolean;
  aggregatable?: boolean;
  format?: 'currency' | 'percentage' | 'date';
  enumValues?: Array<{ value: string; label: string }>;
}

export interface QueryDomain {
  key: string;
  label: string;
  description: string;
  table: string;
  fields: QueryField[];
  defaultFields: string[];
  relationships?: Array<{
    table: string;
    foreignKey: string;
    displayField: string;
  }>;

}

export interface ParsedIntent {
  domain: string;
  action: 'list' | 'count' | 'sum' | 'average' | 'group';
  fields?: string[];
  filters: Record<string, any>;
  groupBy?: string[];
  orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  limit?: number;
  confidence: number;
  explanation: string;
}

export interface QuerySchema {
  domains: QueryDomain[];
  labels: {
    systemName: string;
    actions: Record<string, string>;
  };
  intentToQueryMapping: Record<string, (intent: ParsedIntent) => any>;
}

export interface SmartQueryResult {
  data: any[];
  insights: string[];
  chartSuggestions: Array<{
    type: string;
    title: string;
    xField: string;
    yField: string;
  }>;
  totalCount: number;
  executionTime: number;
}

// Comprehensive cross-database domain
const comprehensiveDomain: QueryDomain = {
  key: 'comprehensive',
  label: 'חיפוש כללי במסד הנתונים',
  description: 'חיפוש מתקדם בכל הטבלאות עם שילוב נתונים',
  table: 'tabarim', // Base table

  fields: [
    // תב"ר fields
    {
      key: 'tabar_id',
      label: 'מזהה תב"ר',
      type: 'number',
      filterable: true
    },
    {
      key: 'tabar_number',
      label: 'מספר תב"ר',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'tabar_name',
      label: 'שם תב"ר',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'ministry',
      label: 'משרד',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'department',
      label: 'מחלקה',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'tabar_status',
      label: 'סטטוס תב"ר',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'פעיל', label: 'פעיל' },
        { value: 'סגור', label: 'סגור' }
      ]
    },
    {
      key: 'total_authorized',
      label: 'תקציב מאושר',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'year',
      label: 'שנה',
      type: 'number',
      filterable: true
    },
    
    // Transaction fields
    {
      key: 'transaction_id',
      label: 'מזהה תנועה',
      type: 'number',
      filterable: true
    },
    {
      key: 'transaction_type',
      label: 'סוג תנועה',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'חשבונית', label: 'חשבונית' },
        { value: 'תשלום', label: 'תשלום' },
        { value: 'זיכוי', label: 'זיכוי' },
        { value: 'העברה', label: 'העברה' }
      ]
    },
    {
      key: 'supplier_name',
      label: 'שם ספק',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'supplier_id',
      label: 'מספר ספק',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'order_number',
      label: 'מספר הזמנה/חשבונית',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'transaction_amount',
      label: 'סכום תנועה',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'transaction_status',
      label: 'סטטוס תשלום',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'שולם', label: 'שולם' },
        { value: 'לא שולם', label: 'לא שולם' },
        { value: 'בתהליך', label: 'בתהליך' },
        { value: 'מופסק', label: 'מופסק' }
      ]
    },
    {
      key: 'transaction_date',
      label: 'תאריך תנועה',
      type: 'date',
      filterable: true,
      format: 'date'
    },
    {
      key: 'reported',
      label: 'דווח',
      type: 'boolean',
      filterable: true
    },
    
    // Budget items fields
    {
      key: 'item_name',
      label: 'שם פריט תקציב',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'budget_item_code',
      label: 'קוד סעיף תקציב',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'item_amount',
      label: 'סכום פריט',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    
    // Permission fields
    {
      key: 'permission_number',
      label: 'מספר הרשאה',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'permission_amount',
      label: 'סכום הרשאה',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    
    // Funding fields
    {
      key: 'funder_name',
      label: 'שם מממן',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'funding_amount',
      label: 'סכום מימון',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'funding_percent',
      label: 'אחוז מימון',
      type: 'number',
      filterable: true,
      format: 'percentage'
    }
  ],
  defaultFields: [
    'tabar_number', 
    'tabar_name', 
    'ministry', 
    'supplier_name', 
    'transaction_type', 
    'transaction_amount', 
    'transaction_status', 
    'transaction_date',
    'reported'
  ]
};

const transactionsDomain: QueryDomain = {
  key: 'transactions',
  label: 'חשבוניות ותנועות כספיות',
  description: 'חשבוניות, תשלומים ותנועות כספיות של תב"רים',
  table: 'tabar_transactions',
  fields: [
    {
      key: 'id',
      label: 'מזהה',
      type: 'number',
      filterable: true
    },
    {
      key: 'tabar_number',
      label: 'מספר תב"ר',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'tabar_name',
      label: 'שם תב"ר',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'transaction_type',
      label: 'סוג תנועה',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'חשבונית', label: 'חשבונית' },
        { value: 'תשלום', label: 'תשלום' },
        { value: 'זיכוי', label: 'זיכוי' },
        { value: 'העברה', label: 'העברה' }
      ]
    },
    {
      key: 'supplier_name',
      label: 'שם ספק',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'supplier_id',
      label: 'מספר ספק',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'order_number',
      label: 'מספר הזמנה/חשבונית',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'amount',
      label: 'סכום',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'direction',
      label: 'כיוון',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'חיוב', label: 'חיוב' },
        { value: 'זיכוי', label: 'זיכוי' },
        { value: 'כניסה', label: 'כניסה' }
      ]
    },
    {
      key: 'status',
      label: 'סטטוס תשלום',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'שולם', label: 'שולם' },
        { value: 'לא שולם', label: 'לא שולם' },
        { value: 'בתהליך', label: 'בתהליך' },
        { value: 'מופסק', label: 'מופסק' }
      ]
    },
    {
      key: 'transaction_date',
      label: 'תאריך תנועה',
      type: 'date',
      filterable: true,
      format: 'date'
    },
    {
      key: 'description',
      label: 'תיאור',
      type: 'string',
      searchable: true
    },
    {
      key: 'reported',
      label: 'דווח',
      type: 'boolean',
      filterable: true
    }
  ],
  defaultFields: ['tabar_number', 'tabar_name', 'supplier_name', 'supplier_id', 'order_number', 'amount', 'status', 'transaction_date', 'reported'],
  relationships: [
    {
      table: 'tabarim',
      foreignKey: 'tabar_id',
      displayField: 'name'
    }
  ]
};

const tabarimDomain: QueryDomain = {
  key: 'tabarim',
  label: 'תב"רים ופרויקטים',
  description: 'פרויקטים עירוניים וממשלתיים (תב"רים)',
  table: 'tabarim',
  fields: [
    {
      key: 'id',
      label: 'מזהה',
      type: 'number',
      filterable: true
    },
    {
      key: 'tabar_number',
      label: 'מספר תב"ר',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'name',
      label: 'שם הפרויקט',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'ministry',
      label: 'משרד',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'department',
      label: 'מחלקה',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'status',
      label: 'סטטוס',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'פעיל', label: 'פעיל' },
        { value: 'סגור', label: 'סגור' }
      ]
    },
    {
      key: 'total_authorized',
      label: 'תקציב מאושר',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'municipal_participation',
      label: 'השתתפות עירונית',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'year',
      label: 'שנה',
      type: 'number',
      filterable: true
    },
    {
      key: 'open_date',
      label: 'תאריך פתיחה',
      type: 'date',
      filterable: true,
      format: 'date'
    },
    {
      key: 'close_date',
      label: 'תאריך סגירה',
      type: 'date',
      filterable: true,
      format: 'date'
    }
  ],
  defaultFields: ['name', 'department', 'ministry', 'status', 'total_authorized', 'year']
};

const budgetItemsDomain: QueryDomain = {
  key: 'budget_items',
  label: 'סעיפי תקציב',
  description: 'פירוט סעיפי תקציב לפי פרויקטים',
  table: 'budget_items',
  fields: [
    {
      key: 'id',
      label: 'מזהה',
      type: 'number',
      filterable: true
    },
    {
      key: 'name',
      label: 'שם הסעיף',
      type: 'string',
      filterable: true,
      searchable: true
    },
    {
      key: 'budget',
      label: 'תקציב מאושר',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'spent',
      label: 'תקציב מבוצע',
      type: 'number',
      filterable: true,
      aggregatable: true,
      format: 'currency'
    },
    {
      key: 'utilization_percent',
      label: 'אחוז ניצול',
      type: 'number',
      filterable: true,
      format: 'percentage'
    },
    {
      key: 'department_id',
      label: 'מחלקה',
      type: 'number',
      filterable: true
    },
    {
      key: 'status',
      label: 'סטטוס',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'פעיל', label: 'פעיל' },
        { value: 'סגור', label: 'סגור' }
      ]
    }
  ],
  defaultFields: ['name', 'budget', 'spent', 'utilization_percent', 'department_id', 'status']
};

export const cityBudgetSchema: QuerySchema = {
  domains: [comprehensiveDomain, tabarimDomain, budgetItemsDomain, transactionsDomain],
  labels: {
    systemName: 'מערכת תקציב עירוני',
    actions: {
      list: 'הצג רשימה',
      count: 'ספירה',
      sum: 'סיכום',
      average: 'ממוצע',
      group: 'קיבוץ'
    }
  },
  intentToQueryMapping: {
    comprehensive: (intent) => ({
      module: 'comprehensive',
      fields: intent.fields || comprehensiveDomain.defaultFields,
      filters: intent.filters,
      groupBy: intent.groupBy,
      orderBy: intent.orderBy,
      limit: intent.limit
    }),
    tabarim: (intent) => ({
      module: 'tabarim',
      fields: intent.fields || tabarimDomain.defaultFields,
      filters: intent.filters,
      groupBy: intent.groupBy,
      orderBy: intent.orderBy,
      limit: intent.limit
    }),
    budget_items: (intent) => ({
      module: 'budget_items', 
      fields: intent.fields || budgetItemsDomain.defaultFields,
      filters: intent.filters,
      groupBy: intent.groupBy,
      orderBy: intent.orderBy,
      limit: intent.limit
    }),
    transactions: (intent) => ({
      module: 'transactions',
      fields: intent.fields || transactionsDomain.defaultFields,
      filters: intent.filters,
      groupBy: intent.groupBy,
      orderBy: intent.orderBy,
      limit: intent.limit
    })
  }
}; 