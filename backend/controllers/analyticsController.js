import pool from '../db.js';

export const getAnalytics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_reports,
        COUNT(DISTINCT project_id) as total_projects,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reports
      FROM reports
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
