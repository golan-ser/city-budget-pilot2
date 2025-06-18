// Transactions Schema - for invoices, payments and financial movements
export default function transactionsSchema(fields = [], filters = {}) {
  console.log('🔍 Transactions Schema - Input:', { fields, filters });
  
  try {
    // Default fields based on actual database schema
    const defaultFields = [
      'tt.id',
      't.tabar_number',
      't.name AS tabar_name',
      'tt.transaction_type',
      'tt.order_number',
      'tt.amount',
      'tt.direction',
      'tt.status',
      'tt.transaction_date',
      'tt.description'
    ];

    const selectedFields = fields.length > 0 ? mapFields(fields) : defaultFields;
    
    let query = `
      SELECT
        ${selectedFields.join(',\n        ')}
      FROM tabar_transactions tt
      LEFT JOIN tabarim t ON tt.tabar_id = t.id
    `;

    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // Filter by tabar number
    if (filters.tabar_number) {
      paramCount++;
      conditions.push(`t.tabar_number = $${paramCount}`);
      params.push(filters.tabar_number);
      console.log('🔍 Adding tabar_number filter:', filters.tabar_number);
    }

    // Filter by transaction type
    if (filters.transaction_type) {
      paramCount++;
      conditions.push(`tt.transaction_type = $${paramCount}`);
      params.push(filters.transaction_type);
    }

    // Filter by status
    if (filters.status) {
      paramCount++;
      conditions.push(`tt.status = $${paramCount}`);
      params.push(filters.status);
    }

    // Filter by direction
    if (filters.direction) {
      paramCount++;
      conditions.push(`tt.direction = $${paramCount}`);
      params.push(filters.direction);
    }

    // Filter by amount range
    if (filters.amount_gt) {
      paramCount++;
      conditions.push(`tt.amount > $${paramCount}`);
      params.push(filters.amount_gt);
    }

    if (filters.amount_lt) {
      paramCount++;
      conditions.push(`tt.amount < $${paramCount}`);
      params.push(filters.amount_lt);
    }

    // Filter by year
    if (filters.transaction_year) {
      paramCount++;
      conditions.push(`EXTRACT(YEAR FROM tt.transaction_date) = $${paramCount}`);
      params.push(filters.transaction_year);
    }

    // Filter by date range
    if (filters.date_from) {
      paramCount++;
      conditions.push(`tt.transaction_date >= $${paramCount}`);
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      conditions.push(`tt.transaction_date <= $${paramCount}`);
      params.push(filters.date_to);
    }

    // General search across multiple fields (using actual fields)
    if (filters.search) {
      paramCount++;
      conditions.push(`(
        tt.description ILIKE $${paramCount} OR 
        tt.order_number ILIKE $${paramCount} OR
        tt.transaction_type ILIKE $${paramCount} OR
        t.name ILIKE $${paramCount} OR
        t.tabar_number::text ILIKE $${paramCount}
      )`);
      params.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += `\n    WHERE ${conditions.join(' AND ')}`;
    }

    // Order by transaction date (newest first)
    query += `\n    ORDER BY tt.transaction_date DESC, tt.id DESC`;

    // Add limit if specified
    if (filters.limit) {
      paramCount++;
      query += `\n    LIMIT $${paramCount}`;
      params.push(filters.limit);
    } else {
      // Default limit to prevent huge result sets
      query += `\n    LIMIT 100`;
    }

    console.log('✅ Generated Query:', query);
    console.log('✅ Query Params:', params);

    return query;
    
  } catch (error) {
    console.error('❌ Error in transactions schema:', error);
    throw error;
  }
}

function mapFields(requestedFields) {
  // Updated field mapping based on actual database schema
  const fieldMapping = {
    'id': 'tt.id',
    'tabar_number': 't.tabar_number',
    'tabar_name': 't.name AS tabar_name',
    'transaction_type': 'tt.transaction_type',
    'order_number': 'tt.order_number',
    'amount': 'tt.amount',
    'direction': 'tt.direction',
    'status': 'tt.status',
    'transaction_date': 'tt.transaction_date',
    'description': 'tt.description',
    'document_url': 'tt.document_url',
    'tabar_ministry': 't.ministry',
    'tabar_department': 't.department',
    'tabar_total_authorized': 't.total_authorized',
    'item_id': 'tt.item_id'
  };

  return requestedFields.map(field => fieldMapping[field] || field);
} 