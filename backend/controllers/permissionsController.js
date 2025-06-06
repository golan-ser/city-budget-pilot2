import pool from '../db.js';

export const getAllPermissions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permissions ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const getPermissionsById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM permissions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching permission:', error);
    res.status(500).json({ error: 'Failed to fetch permission' });
  }
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
  try {
    await pool.query('DELETE FROM permissions WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting permission:', error);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
};
