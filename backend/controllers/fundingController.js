import pool from '../db.js';

export const getAllFunding = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM funding_sources ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all funding:', error);
    res.status(500).json({ error: 'Failed to fetch funding' });
  }
};

export const getFundingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM funding_sources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching funding by ID:', error);
    res.status(500).json({ error: 'Failed to fetch funding' });
  }
};

export const createFunding = async (req, res) => {
  try {
    const { project_id, source_name, amount } = req.body;
    const result = await pool.query(
      'INSERT INTO funding_sources (project_id, source_name, amount) VALUES ($1, $2, $3) RETURNING *',
      [project_id, source_name, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating funding:', error);
    res.status(500).json({ error: 'Failed to create funding' });
  }
};

export const updateFunding = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, source_name, amount } = req.body;
    const result = await pool.query(
      'UPDATE funding_sources SET project_id = $1, source_name = $2, amount = $3 WHERE id = $4 RETURNING *',
      [project_id, source_name, amount, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating funding:', error);
    res.status(500).json({ error: 'Failed to update funding' });
  }
};

export const deleteFunding = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM funding_sources WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting funding:', error);
    res.status(500).json({ error: 'Failed to delete funding' });
  }
};
