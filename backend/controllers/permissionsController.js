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
  try {
    const { project_id, year, ministry, amount, valid_until } = req.body;
    const result = await pool.query(
      'INSERT INTO permissions (project_id, year, ministry, amount, valid_until) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, year, ministry, amount, valid_until]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
};

export const updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, year, ministry, amount, valid_until } = req.body;
    const result = await pool.query(
      'UPDATE permissions SET project_id = $1, year = $2, ministry = $3, amount = $4, valid_until = $5 WHERE id = $6 RETURNING *',
      [project_id, year, ministry, amount, valid_until, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating permission:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
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
