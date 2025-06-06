import pool from '../db.js';

export const getAllFunding = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM funding ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all funding:', error);
    res.status(500).json({ error: 'Failed to fetch funding' });
  }
};

export const getFundingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM funding WHERE id = $1', [id]);
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
  // יש להוסיף שדות מתאימים לפי הטבלה בפוסטגרס
  res.status(201).json({ message: 'create Funding not implemented' });
};

export const updateFunding = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'update Funding not implemented' });
};

export const deleteFunding = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM funding WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting funding:', error);
    res.status(500).json({ error: 'Failed to delete funding' });
  }
};
