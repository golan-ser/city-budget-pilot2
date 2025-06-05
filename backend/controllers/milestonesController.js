import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllMilestones = async (req, res) => {
  const result = await pool.query('SELECT * FROM milestones ORDER BY id DESC');
  res.json(result.rows);
};

export const getMilestonesById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM milestones WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Milestones not found' });
  }
  res.json(result.rows[0]);
};

export const createMilestones = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Milestones not implemented' });
};

export const updateMilestones = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Milestones not implemented' });
};

export const deleteMilestones = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM milestones WHERE id = $1', [id]);
  res.status(204).send();
};
