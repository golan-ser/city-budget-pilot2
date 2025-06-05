import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getAllPermissions = async (req, res) => {
  const result = await pool.query('SELECT * FROM permissions ORDER BY id DESC');
  res.json(result.rows);
};

export const getPermissionsById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM permissions WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Permissions not found' });
  }
  res.json(result.rows[0]);
};

export const createPermissions = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'create Permissions not implemented' });
};

export const updatePermissions = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Permissions not implemented' });
};

export const deletePermissions = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM permissions WHERE id = $1', [id]);
  res.status(204).send();
};
