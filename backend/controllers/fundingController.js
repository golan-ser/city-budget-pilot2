import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllFunding = async (req, res) => {
  const result = await pool.query('SELECT * FROM funding ORDER BY id DESC');
  res.json(result.rows);
};

export const getFundingById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM funding WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Funding not found' });
  }
  res.json(result.rows[0]);
};

export const createFunding = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Funding not implemented' });
};

export const updateFunding = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Funding not implemented' });
};

export const deleteFunding = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM funding WHERE id = $1', [id]);
  res.status(204).send();
};
