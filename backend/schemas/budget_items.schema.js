export default function budgetItemsSchema(fields, filters) {
  const conditions = [];

  if (filters.status) {
    conditions.push(`t.status = '${filters.status}'`);
  }
  if (filters.fiscal_year) {
    conditions.push(`t.year = ${filters.fiscal_year}`);
  }
  if (filters.department) {
    conditions.push(`t.department = '${filters.department}'`);
  }
  if (filters.search) {
    conditions.push(`(
      ti.budget_item_name ILIKE '%${filters.search}%' OR 
      t.name ILIKE '%${filters.search}%' OR
      t.ministry ILIKE '%${filters.search}%' OR
      ti.budget_item_code ILIKE '%${filters.search}%'
    )`);
  }
  if (filters.utilization_range) {
    switch (filters.utilization_range) {
      case 'over_100':
        conditions.push(`(
          ti.amount > 0 AND 
          COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) / ti.amount > 1.0
        )`);
        break;
      case '90_100':
        conditions.push(`(
          ti.amount > 0 AND 
          COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) / ti.amount >= 0.9 AND
          COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) / ti.amount <= 1.0
        )`);
        break;
      case 'under_50':
        conditions.push(`(
          ti.amount > 0 AND 
          COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) / ti.amount < 0.5
        )`);
        break;
      case 'zero':
        conditions.push(`(
          ti.amount = 0 OR 
          COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) = 0
        )`);
        break;
    }
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  return `
    SELECT 
      ti.id,
      ti.budget_item_name AS "name",
      COALESCE(t.department, t.ministry, 'לא מוגדר') AS "department",
      COALESCE(t.status, 'פעיל') AS "status",
      COALESCE(ti.amount, 0) AS "approved_budget",
      COALESCE((SELECT SUM(tt.amount) FROM tabar_transactions tt WHERE tt.item_id = ti.id AND tt.direction = 'חיוב'), 0) AS "executed_budget",
      COALESCE(t.year, EXTRACT(YEAR FROM CURRENT_DATE)) AS "fiscal_year",
      t.id AS "tabar_id",
      COALESCE(t.created_at, CURRENT_DATE) AS "created_at",
      COALESCE(ti.notes, t.name) AS "notes"
    FROM tabar_items ti
    LEFT JOIN tabarim t ON ti.tabar_id = t.id
    ${whereClause}
    ORDER BY t.created_at DESC, ti.id DESC
  `;
}
