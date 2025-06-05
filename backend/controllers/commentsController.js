import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllComments = async (req, res) => {
  const result = await pool.query('SELECT * FROM comments ORDER BY id DESC');
  res.json(result.rows);
};

export const getCommentsById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Comments not found' });
  }
  res.json(result.rows[0]);
};

export const createComments = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Comments not implemented' });
};

export const updateComments = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Comments not implemented' });
};

export const deleteComments = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
  res.status(204).send();
};
