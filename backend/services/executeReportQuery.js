import db from '../db.js';

/**
 * Execute structured report query - Stage 2 of two-stage architecture
 * @param {object} intent - Structured intent from parseUserQuery
 * @param {object} schema - Schema configuration
 * @returns {Promise<object>} Query results with columns, rows, and summary
 */
export async function executeReportQuery(intent, schema) {
  console.log('🔧 Stage 2: executeReportQuery started', { 
    intent: intent.intent, 
    domain: intent.domain, 
    action: intent.action,
    filters: intent.filters
  });

  try {
    // Validate intent structure
    validateIntent(intent, schema);
    
    // Get domain configuration
    const domainConfig = getDomainConfig(intent.domain, schema);
    
    // Build SQL query based on intent
    const sqlQuery = buildSQLQuery(intent, domainConfig);
    
    // Execute query with validation
    const queryResult = await executeValidatedQuery(sqlQuery, intent);
    
    // Format results
    const formattedResult = formatQueryResult(queryResult, intent, domainConfig);
    
    console.log('✅ Query executed successfully', { 
      rowCount: formattedResult.rows.length,
      columns: formattedResult.columns.length 
    });
    
    return formattedResult;
    
  } catch (error) {
    console.error('❌ Error in executeReportQuery:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

/**
 * Validate intent structure and fields
 */
function validateIntent(intent, schema) {
  // Check required fields
  if (!intent.intent || !intent.domain || !intent.action || !intent.filters) {
    throw new Error('Intent missing required fields');
  }
  
  // Check domain exists
  const domainExists = schema.domains.some(d => d.key === intent.domain);
  if (!domainExists) {
    throw new Error(`Unknown domain: ${intent.domain}`);
  }
  
  // Check action is valid
  const validActions = ['list', 'count', 'sum', 'average', 'group'];
  if (!validActions.includes(intent.action)) {
    throw new Error(`Invalid action: ${intent.action}`);
  }
  
  // Validate filters against domain schema
  const domainConfig = schema.domains.find(d => d.key === intent.domain);
  const validFilterKeys = domainConfig.fields.map(f => f.key);
  
  for (const filterKey of Object.keys(intent.filters)) {
    if (!validFilterKeys.includes(filterKey) && filterKey !== 'search') {
      console.warn(`Unknown filter field: ${filterKey} for domain ${intent.domain}`);
    }
  }
}

/**
 * Get domain configuration from schema
 */
function getDomainConfig(domainKey, schema) {
  const config = schema.domains.find(d => d.key === domainKey);
  if (!config) {
    throw new Error(`Domain configuration not found: ${domainKey}`);
  }
  return config;
}

/**
 * Build SQL query based on structured intent
 */
function buildSQLQuery(intent, domainConfig) {
  const { domain, action, filters, fields } = intent;
  
  // Determine base table and fields
  const tableInfo = getTableInfo(domain);
  const selectFields = determineSelectFields(action, fields, domainConfig, tableInfo);
  
  // Build SELECT clause
  let selectClause;
  if (action === 'count') {
    selectClause = 'COUNT(*) as count';
  } else if (action === 'sum') {
    const amountField = getAmountField(domain);
    selectClause = `SUM(${amountField}) as total_sum`;
  } else if (action === 'average') {
    const amountField = getAmountField(domain);
    selectClause = `AVG(${amountField}) as average_amount`;
  } else {
    selectClause = selectFields.join(', ');
  }
  
  // Build FROM clause with JOINs
  const fromClause = buildFromClause(domain, tableInfo);
  
  // Build WHERE clause
  console.log('🔍 Building WHERE clause with filters:', filters);
  const whereClause = buildWhereClause(filters, domain, tableInfo);
  console.log('🔍 Generated WHERE clause:', whereClause);
  
  // Build GROUP BY clause (for group action)
  const groupByClause = buildGroupByClause(action, filters, domainConfig);
  
  // Build ORDER BY clause
  const orderByClause = buildOrderByClause(domain, action);
  
  // Combine query parts
  let query = `SELECT ${selectClause} FROM ${fromClause}`;
  
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  
  if (groupByClause) {
    query += ` GROUP BY ${groupByClause}`;
  }
  
  if (orderByClause) {
    query += ` ORDER BY ${orderByClause}`;
  }
  
  // Add LIMIT for list queries
  if (action === 'list') {
    query += ' LIMIT 100';
  }
  
  console.log('🔍 Generated SQL:', query);
  return query;
}

/**
 * Get table information for domain
 */
function getTableInfo(domain) {
  const tableMap = {
    transactions: {
      main: 'tabar_transactions',
      alias: 'tt',
      joins: [
        'LEFT JOIN tabarim t ON tt.tabar_id = t.id'
      ]
    },
    tabarim: {
      main: 'tabarim',
      alias: 't',
      joins: []
    },
    budget_items: {
      main: 'tabar_items',
      alias: 'ti',
      joins: [
        'LEFT JOIN tabarim t ON ti.tabar_id = t.id'
      ]
    },
    comprehensive: {
      main: 'tabarim',
      alias: 't',
      joins: [
        'LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id',
        'LEFT JOIN tabar_items ti ON t.id = ti.tabar_id',
        'LEFT JOIN tabar_permissions tp ON t.id = tp.tabar_id'
      ]
    }
  };
  
  return tableMap[domain] || tableMap.tabarim;
}

/**
 * Determine select fields based on action and domain
 */
function determineSelectFields(action, requestedFields, domainConfig, tableInfo) {
  if (action !== 'list' && action !== 'group') {
    return []; // Aggregation queries handle their own SELECT
  }
  
  // Use requested fields if provided and valid
  if (requestedFields && requestedFields.length > 0) {
    const validFields = domainConfig.fields.map(f => f.key);
    const filteredFields = requestedFields.filter(f => validFields.includes(f));
    if (filteredFields.length > 0) {
      return filteredFields.map(f => getFieldSQL(f, domainConfig, tableInfo));
    }
  }
  
  // Default fields for each domain
  const defaultFields = getDefaultFields(domainConfig.key);
  return defaultFields.map(f => getFieldSQL(f, domainConfig, tableInfo));
}

/**
 * Get default fields for domain
 */
function getDefaultFields(domain) {
  const defaults = {
    transactions: ['transaction_type', 'order_number', 'amount', 'status', 'transaction_date'],
    tabarim: ['tabar_number', 'name', 'ministry', 'total_authorized', 'status', 'year'],
    budget_items: ['item_name', 'authorized_amount'],
    comprehensive: ['tabar_number', 'name', 'ministry', 'total_authorized', 'status']
  };
  
  return defaults[domain] || defaults.tabarim;
}

/**
 * Convert field key to SQL with proper table alias
 */
function getFieldSQL(fieldKey, domainConfig, tableInfo) {
  const domain = domainConfig.key;
  
  // Domain-specific field mappings
  const fieldMappings = {
    transactions: {
      transaction_id: 'tt.id',
      transaction_type: 'tt.transaction_type',
      order_number: 'tt.order_number',
      amount: 'tt.amount',
      direction: 'tt.direction',
      status: 'tt.status',
      transaction_date: 'tt.transaction_date',
      description: 'tt.description',
      document_url: 'tt.document_url',
      tabar_number: 't.tabar_number',
      name: 't.name'
    },
    tabarim: {
      tabar_id: 't.id',
      tabar_number: 't.tabar_number',
      name: 't.name',
      ministry: 't.ministry',
      total_authorized: 't.total_authorized',
      status: 't.status',
      year: 't.year',
      department: 't.department'
    },
    budget_items: {
      item_id: 'ti.id',
      item_name: 'ti.budget_item_name',
      authorized_amount: 'ti.amount',
      executed_amount: 'ti.amount',
      execution_percentage: '(ti.amount / t.total_authorized * 100)'
    }
  };
  
  const domainFields = fieldMappings[domain] || fieldMappings.tabarim;
  return domainFields[fieldKey] || fieldKey;
}

/**
 * Build FROM clause with appropriate JOINs
 */
function buildFromClause(domain, tableInfo) {
  let fromClause = `${tableInfo.main} ${tableInfo.alias}`;
  
  if (tableInfo.joins && tableInfo.joins.length > 0) {
    fromClause += ' ' + tableInfo.joins.join(' ');
  }
  
  return fromClause;
}

/**
 * Build WHERE clause from filters
 */
function buildWhereClause(filters, domain, tableInfo) {
  const conditions = [];
  
  // Handle each filter type
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    const condition = buildFilterCondition(key, value, domain, tableInfo);
    if (condition) {
      conditions.push(condition);
    }
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : null;
}

/**
 * Build individual filter condition
 */
function buildFilterCondition(key, value, domain, tableInfo) {
  const alias = tableInfo.alias;
  
  switch (key) {
    case 'tabar_number':
      return `t.tabar_number = '${value}'`;
      
    case 'year':
      return `t.year = ${value}`;
      
    case 'transaction_year':
      return `EXTRACT(YEAR FROM tt.transaction_date) = ${value}`;
      
    case 'department':
    case 'ministry':
      return `t.ministry LIKE '%${value}%'`;
      
    case 'status':
      if (domain === 'transactions') {
        return `tt.status = '${value}'`;
      } else {
        return `t.status = '${value}'`;
      }
      
    case 'order_number':
      return `tt.order_number LIKE '%${value}%'`;
      
    case 'amount_gt':
      return `tt.amount > ${value}`;
      
    case 'amount_lt':
      return `tt.amount < ${value}`;
      
    case 'total_authorized_gt':
      return `t.total_authorized > ${value}`;
      
    case 'total_authorized_lt':
      return `t.total_authorized < ${value}`;
      
    case 'direction':
      return `tt.direction = '${value}'`;
      
    case 'transaction_type':
      return `tt.transaction_type = '${value}'`;
      
    case 'search':
      return buildSearchCondition(value, domain);
      
    default:
      console.warn(`Unknown filter key: ${key}`);
      return null;
  }
}

/**
 * Build search condition across multiple fields
 */
function buildSearchCondition(searchTerm, domain) {
  const searchConditions = [];
  
  if (domain === 'transactions' || domain === 'comprehensive') {
    searchConditions.push(`tt.order_number LIKE '%${searchTerm}%'`);
    searchConditions.push(`tt.transaction_type LIKE '%${searchTerm}%'`);
    searchConditions.push(`tt.description LIKE '%${searchTerm}%'`);
  }
  
  if (domain === 'tabarim' || domain === 'comprehensive') {
    searchConditions.push(`t.name LIKE '%${searchTerm}%'`);
    searchConditions.push(`t.ministry LIKE '%${searchTerm}%'`);
    searchConditions.push(`t.tabar_number LIKE '%${searchTerm}%'`);
  }
  
  return searchConditions.length > 0 ? `(${searchConditions.join(' OR ')})` : null;
}

/**
 * Build GROUP BY clause for group actions
 */
function buildGroupByClause(action, filters, domainConfig) {
  if (action !== 'group') {
    return null;
  }
  
  // Default grouping based on domain
  const domain = domainConfig.key;
  
  if (domain === 'transactions') {
    return 'tt.transaction_type';
  } else if (domain === 'tabarim') {
    return 't.ministry';
  }
  
  return null;
}

/**
 * Build ORDER BY clause
 */
function buildOrderByClause(domain, action) {
  if (action === 'count' || action === 'sum' || action === 'average') {
    return null; // No ordering for single-value results
  }
  
  const orderMap = {
    transactions: 'tt.transaction_date DESC',
    tabarim: 't.tabar_number ASC',
    budget_items: 'ti.item_id ASC',
    comprehensive: 't.tabar_number ASC'
  };
  
  return orderMap[domain] || 't.tabar_number ASC';
}

/**
 * Get amount field for aggregation queries
 */
function getAmountField(domain) {
  const amountFields = {
    transactions: 'tt.amount',
    tabarim: 't.total_authorized',
    budget_items: 'ti.authorized_amount',
    comprehensive: 't.total_authorized'
  };
  
  return amountFields[domain] || 't.total_authorized';
}

/**
 * Execute query with validation and error handling
 */
async function executeValidatedQuery(sqlQuery, intent) {
  try {
    console.log('🔍 Executing SQL query...');
    const result = await db.query(sqlQuery);
    
    console.log(`✅ Query returned ${result.rows.length} rows`);
    return result.rows;
    
  } catch (error) {
    console.error('❌ SQL execution error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Format query result with metadata
 */
function formatQueryResult(queryResult, intent, domainConfig) {
  if (!queryResult || queryResult.length === 0) {
    return {
      success: true,
      columns: [],
      rows: [],
      summary: {
        totalRows: 0,
        message: 'לא נמצאו תוצאות התואמות לחיפוש',
        intent: intent.intent,
        domain: intent.domain,
        action: intent.action
      },
      metadata: {
        executedAt: new Date().toISOString(),
        querySource: intent.source || 'unknown',
        confidence: intent.confidence || 0
      }
    };
  }
  
  // Handle aggregation results
  if (intent.action === 'count') {
    return {
      success: true,
      columns: [{ key: 'count', label: 'מספר רשומות', type: 'number' }],
      rows: [{ count: queryResult[0].count }],
      summary: {
        totalRows: 1,
        message: `נמצאו ${queryResult[0].count} רשומות`,
        intent: intent.intent,
        domain: intent.domain,
        action: intent.action
      },
      metadata: {
        executedAt: new Date().toISOString(),
        querySource: intent.source || 'unknown',
        confidence: intent.confidence || 0
      }
    };
  }
  
  if (intent.action === 'sum') {
    const total = queryResult[0].total_sum || 0;
    return {
      success: true,
      columns: [{ key: 'total_sum', label: 'סכום כולל', type: 'currency' }],
      rows: [{ total_sum: total }],
      summary: {
        totalRows: 1,
        message: `סכום כולל: ${formatCurrency(total)}`,
        intent: intent.intent,
        domain: intent.domain,
        action: intent.action
      },
      metadata: {
        executedAt: new Date().toISOString(),
        querySource: intent.source || 'unknown',
        confidence: intent.confidence || 0
      }
    };
  }
  
  if (intent.action === 'average') {
    const avg = queryResult[0].average_amount || 0;
    return {
      success: true,
      columns: [{ key: 'average_amount', label: 'ממוצע', type: 'currency' }],
      rows: [{ average_amount: avg }],
      summary: {
        totalRows: 1,
        message: `ממוצע: ${formatCurrency(avg)}`,
        intent: intent.intent,
        domain: intent.domain,
        action: intent.action
      },
      metadata: {
        executedAt: new Date().toISOString(),
        querySource: intent.source || 'unknown',
        confidence: intent.confidence || 0
      }
    };
  }
  
  // Handle list results
  const columns = extractColumnsFromResult(queryResult[0], domainConfig);
  
  return {
    success: true,
    columns,
    rows: queryResult,
    summary: {
      totalRows: queryResult.length,
      message: `נמצאו ${queryResult.length} תוצאות`,
      intent: intent.intent,
      domain: intent.domain,
      action: intent.action,
      filters: intent.filters
    },
    metadata: {
      executedAt: new Date().toISOString(),
      querySource: intent.source || 'unknown',
      confidence: intent.confidence || 0
    }
  };
}

/**
 * Extract column definitions from query result
 */
function extractColumnsFromResult(sampleRow, domainConfig) {
  if (!sampleRow) return [];
  
  const columns = [];
  
  for (const [key, value] of Object.entries(sampleRow)) {
    // Find field definition in domain config
    const fieldDef = domainConfig.fields.find(f => f.key === key);
    
    let column = {
      key,
      label: fieldDef?.label || key,
      type: fieldDef?.type || inferType(value)
    };
    
    // Add Hebrew labels for common fields
    const hebrewLabels = {
      tabar_number: 'מספר תב״ר',
      name: 'שם הפרויקט',
      ministry: 'משרד',
      total_authorized: 'תקציב מאושר',
      status: 'סטטוס',
      year: 'שנה',
      id: 'מזהה',
      transaction_type: 'סוג עסקה',
      order_number: 'מספר הזמנה',
      supplier_id: 'מספר ספק',
      amount: 'סכום',
      transaction_date: 'תאריך עסקה',
      reported: 'דווח',
      budget_item_name: 'שם הסעיף',
      order_number: 'מספר הזמנה',
      description: 'תיאור',
      direction: 'כיוון'
    };
    
    if (hebrewLabels[key]) {
      column.label = hebrewLabels[key];
    }
    
    columns.push(column);
  }
  
  return columns;
}

/**
 * Infer data type from value
 */
function inferType(value) {
  if (typeof value === 'number') {
    return value % 1 === 0 ? 'integer' : 'decimal';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (value instanceof Date) {
    return 'date';
  }
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return 'date';
  }
  return 'text';
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS'
  }).format(amount);
}

/**
 * Get execution statistics
 */
export function getExecutionStats() {
  return {
    supportedDomains: ['transactions', 'tabarim', 'budget_items', 'comprehensive'],
    supportedActions: ['list', 'count', 'sum', 'average', 'group'],
    maxRows: 100,
    database: 'PostgreSQL',
    joinSupport: true
  };
} 