import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllDocuments = async (req, res) => {
  const result = await pool.query('SELECT * FROM documents ORDER BY id DESC');
  res.json(result.rows);
};

export const getDocumentsById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Documents not found' });
  }
  res.json(result.rows[0]);
};

export const createDocuments = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Documents not implemented' });
};

export const updateDocuments = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Documents not implemented' });
};

export const deleteDocuments = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM documents WHERE id = $1', [id]);
  res.status(204).send();
};
