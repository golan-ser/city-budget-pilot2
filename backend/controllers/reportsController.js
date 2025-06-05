import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllReports = async (req, res) => {
  const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
  res.json(result.rows);
};

export const getReportsById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Reports not found' });
  }
  res.json(result.rows[0]);
};

export const createReports = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Reports not implemented' });
};

export const updateReports = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Reports not implemented' });
};

export const deleteReports = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM reports WHERE id = $1', [id]);
  res.status(204).send();
};
