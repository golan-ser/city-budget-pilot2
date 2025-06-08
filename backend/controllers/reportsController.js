import pool from '../db.js';

// שליפת כל הדוחות (עם אפשרות לסינון)
export const getReports = async (req, res) => {
  try {
    const { status, project_id, ministry_id, year } = req.query;
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (project_id) {
      params.push(project_id);
      query += ` AND project_id = $${params.length}`;
    }
    if (ministry_id) {
      params.push(ministry_id);
      query += ` AND ministry_id = $${params.length}`;
    }
    if (year) {
      params.push(`${year}%`);
      query += ` AND TO_CHAR(report_date, 'YYYY') LIKE $${params.length}`;
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// שליפת דוח בודד
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// יצירת דוח
export const createReport = async (req, res) => {
  try {
    const {
      project_id, report_date, status, notes, created_by, order_id, order_description, amount,
      budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
      ministry_id, tabar_id, project_stage, requesting_department_id
    } = req.body;
    const result = await pool.query(
      `INSERT INTO reports (
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      )
      RETURNING *`,
      [
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// עדכון דוח
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_id, report_date, status, notes, created_by, order_id, order_description, amount,
      budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
      ministry_id, tabar_id, project_stage, requesting_department_id
    } = req.body;
    const result = await pool.query(
      `UPDATE reports SET
        project_id=$1, report_date=$2, status=$3, notes=$4, created_by=$5, order_id=$6,
        order_description=$7, amount=$8, budget_item_id=$9, budget_item_name=$10, supply_date=$11,
        supply_location=$12, contract_id=$13, quote=$14, ministry_id=$15, tabar_id=$16,
        project_stage=$17, requesting_department_id=$18, created_at=NOW()
      WHERE id=$19
      RETURNING *`,
      [
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// מחיקת דוח
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
