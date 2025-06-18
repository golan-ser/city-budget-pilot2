export default function tabarFullSchema(fields, filters) {
  const conditions = [];

  if (filters.status) {
    conditions.push(`t.status = '${filters.status}'`);
  }
  if (filters.year) {
    conditions.push(`t.year = ${filters.year}`);
  }
  if (filters.ministry) {
    conditions.push(`t.ministry = '${filters.ministry}'`);
  }
  if (filters.search) {
    conditions.push(`(t.name ILIKE '%${filters.search}%' OR t.tabar_number::text ILIKE '%${filters.search}%' OR bi.name ILIKE '%${filters.search}%')`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  return `
    SELECT 
      t.id,
      t.tabar_number,
      t.name,
      t.year,
      t.ministry,
      t.department,
      t.status,
      t.total_authorized,
      t.municipal_participation,
      t.additional_funders,
      t.open_date,
      t.close_date,
      t.permission_number,
      bi.name as budget_item,
      bi.budget,
      bi.spent,
      t.updated_at
    FROM tabarim t
    LEFT JOIN budget_items bi ON t.id = bi.tabar_id
    ${whereClause}
    ORDER BY t.updated_at DESC
  `;
} 