import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllProjects = async (req, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
  res.json(result.rows);
};

export const getProjectsById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Projects not found' });
  }
  res.json(result.rows[0]);
};

export const createProjects = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Projects not implemented' });
};

export const updateProjects = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Projects not implemented' });
};

export const deleteProjects = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  res.status(204).send();
};
