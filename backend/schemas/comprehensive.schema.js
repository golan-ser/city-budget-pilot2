// Comprehensive Schema - searches across all database tables with JOINs
export default function comprehensiveSchema(fields = [], filters = {}) {
  // Build the base query with all necessary JOINs
  let query = `
    SELECT DISTINCT
      t.id as tabar_id,
      t.tabar_number,
      t.name as tabar_name,
      t.ministry,
      t.department,
      t.status as tabar_status,
      t.total_authorized,
      t.year,
      t.open_date,
      t.close_date,
      
      -- Transaction fields
      tt.id as transaction_id,
      tt.transaction_type,
      tt.order_number,
      tt.amount as transaction_amount,
      tt.direction,
      tt.status as transaction_status,
      tt.transaction_date,
      tt.description as transaction_description,
      tt.document_url,
      
      -- Item fields
      ti.id as item_id,
      ti.budget_item_name as item_name,
      ti.budget_item_code,
      ti.amount as item_amount,
      
      -- Permission fields
      tp.permission_number,
      tp.amount as permission_amount,
      tp.start_date as permission_start_date,
      tp.end_date as permission_end_date,
      
      -- Funding fields
      tf.funder_name,
      tf.amount as funding_amount,
      tf.percent as funding_percent
      
    FROM tabarim t
    LEFT JOIN tabar_transactions tt ON tt.tabar_id = t.id
    LEFT JOIN tabar_items ti ON ti.tabar_id = t.id
    LEFT JOIN tabar_permissions tp ON tp.tabar_id = t.id
    LEFT JOIN tabar_funding tf ON tf.tabar_id = t.id
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
  }

  // Filter by tabar name
  if (filters.tabar_name) {
    paramCount++;
    conditions.push(`t.name ILIKE $${paramCount}`);
    params.push(`%${filters.tabar_name}%`);
  }

  // Filter by ministry
  if (filters.ministry) {
    paramCount++;
    conditions.push(`t.ministry ILIKE $${paramCount}`);
    params.push(`%${filters.ministry}%`);
  }

  // Filter by department
  if (filters.department) {
    paramCount++;
    conditions.push(`t.department ILIKE $${paramCount}`);
    params.push(`%${filters.department}%`);
  }

  // Filter by tabar status
  if (filters.tabar_status) {
    paramCount++;
    conditions.push(`t.status = $${paramCount}`);
    params.push(filters.tabar_status);
  }

  // Filter by year
  if (filters.year) {
    paramCount++;
    conditions.push(`t.year = $${paramCount}`);
    params.push(filters.year);
  }

  // Transaction filters
  if (filters.transaction_type) {
    paramCount++;
    conditions.push(`tt.transaction_type = $${paramCount}`);
    params.push(filters.transaction_type);
  }

  if (filters.order_number) {
    paramCount++;
    conditions.push(`tt.order_number ILIKE $${paramCount}`);
    params.push(`%${filters.order_number}%`);
  }

  if (filters.direction) {
    paramCount++;
    conditions.push(`tt.direction = $${paramCount}`);
    params.push(filters.direction);
  }

  if (filters.transaction_status) {
    paramCount++;
    conditions.push(`tt.status = $${paramCount}`);
    params.push(filters.transaction_status);
  }

  if (filters.description) {
    paramCount++;
    conditions.push(`tt.description ILIKE $${paramCount}`);
    params.push(`%${filters.description}%`);
  }

  // Amount filters
  if (filters.transaction_amount_gt) {
    paramCount++;
    conditions.push(`tt.amount > $${paramCount}`);
    params.push(filters.transaction_amount_gt);
  }

  if (filters.transaction_amount_lt) {
    paramCount++;
    conditions.push(`tt.amount < $${paramCount}`);
    params.push(filters.transaction_amount_lt);
  }

  if (filters.total_authorized_gt) {
    paramCount++;
    conditions.push(`t.total_authorized > $${paramCount}`);
    params.push(filters.total_authorized_gt);
  }

  if (filters.total_authorized_lt) {
    paramCount++;
    conditions.push(`t.total_authorized < $${paramCount}`);
    params.push(filters.total_authorized_lt);
  }

  // Date filters
  if (filters.transaction_date_from) {
    paramCount++;
    conditions.push(`tt.transaction_date >= $${paramCount}`);
    params.push(filters.transaction_date_from);
  }

  if (filters.transaction_date_to) {
    paramCount++;
    conditions.push(`tt.transaction_date <= $${paramCount}`);
    params.push(filters.transaction_date_to);
  }

  // Transaction year filter
  if (filters.transaction_year) {
    paramCount++;
    conditions.push(`EXTRACT(YEAR FROM tt.transaction_date) = $${paramCount}`);
    params.push(filters.transaction_year);
  }

  // Permission filters
  if (filters.permission_number) {
    paramCount++;
    conditions.push(`tp.permission_number ILIKE $${paramCount}`);
    params.push(`%${filters.permission_number}%`);
  }

  // Funding filters
  if (filters.funder_name) {
    paramCount++;
    conditions.push(`tf.funder_name ILIKE $${paramCount}`);
    params.push(`%${filters.funder_name}%`);
  }

  // General search across multiple fields
  if (filters.search) {
    paramCount++;
    conditions.push(`(
      t.name ILIKE $${paramCount} OR
      t.ministry ILIKE $${paramCount} OR
      t.department ILIKE $${paramCount} OR
      tt.order_number ILIKE $${paramCount} OR
      tt.description ILIKE $${paramCount} OR
      tt.order_number ILIKE $${paramCount} OR
      ti.budget_item_name ILIKE $${paramCount} OR
      tp.permission_number ILIKE $${paramCount} OR
      tf.funder_name ILIKE $${paramCount}
    )`);
    params.push(`%${filters.search}%`);
  }

  // Add conditions to query
  if (conditions.length > 0) {
    query += `\n    WHERE ${conditions.join(' AND ')}`;
  }

  // Filter out NULL transactions if we're specifically looking for transaction data
  if (filters.transaction_type || filters.order_number || filters.transaction_status || filters.description) {
    if (conditions.length > 0) {
      query += ` AND tt.id IS NOT NULL`;
    } else {
      query += `\n    WHERE tt.id IS NOT NULL`;
    }
  }

  // Order by relevance and date
  query += `\n    ORDER BY 
    CASE 
      WHEN tt.transaction_date IS NOT NULL THEN tt.transaction_date 
      ELSE t.open_date 
    END DESC,
    t.tabar_number ASC,
    tt.id DESC`;

  // Add limit if specified
  if (filters.limit) {
    paramCount++;
    query += `\n    LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  console.log('🔍 Comprehensive Query:', query);
  console.log('📊 Parameters:', params);

  return query;
} 