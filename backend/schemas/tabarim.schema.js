// schemas/tabarim.schema.js

export default function tabarimSchema(fields, filters) {
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
    conditions.push(`(t.name ILIKE '%${filters.search}%' OR t.tabar_number::text ILIKE '%${filters.search}%')`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  return `
    SELECT 
      t.id,
      t.tabar_number,
      t.name,
      t.year,
      t.status,
      t.department,
      t.ministry,
      t.total_authorized,
      t.open_date,
      t.close_date,
      t.permission_number,
      t.created_at,
      t.municipal_participation,
      t.additional_funders
    FROM tabarim t
    ${whereClause}
    ORDER BY t.created_at DESC
  `;
}
