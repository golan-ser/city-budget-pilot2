import pool from '../db.js';

export const getAllProjects = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectsById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching project by ID:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProjects = async (req, res) => {
  const { name, department_id, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, department_id, description) VALUES ($1, $2, $3) RETURNING *',
      [name, department_id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProjects = async (req, res) => {
  const { id } = req.params;
  const { name, department_id, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, department_id = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, department_id, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProjects = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
