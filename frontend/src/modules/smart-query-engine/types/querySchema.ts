export interface QueryField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  searchable?: boolean;
  filterable?: boolean;
  aggregatable?: boolean;
  enumValues?: Array<{ value: string; label: string }>;
  format?: 'currency' | 'percentage' | 'date' | 'datetime';
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
  filters: Record<string, any>;
  groupBy?: string[];
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  fields?: string[];
  confidence: number;
  explanation?: string;
}

export interface QuerySchema {
  domains: QueryDomain[];
  labels: {
    systemName: string;
    searchPlaceholder: string;
    noResults: string;
    loading: string;
    error: string;
  };
  intentToQueryMapping: Record<string, (intent: ParsedIntent) => any>;
}

export interface SmartQueryResult {
  data: any[];
  parsed: ParsedIntent;
  suggestedGraphs: Array<{
    type: 'bar' | 'pie' | 'line' | 'area';
    xField: string;
    yField: string;
    title: string;
  }>;
  insights?: string[];
  totalCount: number;
  executionTime: number;
} 