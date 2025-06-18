import pool from '../db.js';

export const getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const result = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const result = await pool.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    // בדיקה אם המחלקה בשימוש
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as count FROM budget_items WHERE department_id = $1',
      [id]
    );
    
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department - it has associated budget items' 
      });
    }

    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
}; 