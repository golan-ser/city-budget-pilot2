import pool from '../db.js';

// מביא את כל אבני הדרך
export const getAllMilestones = async (req, res) => {
  const result = await pool.query('SELECT * FROM milestones ORDER BY id DESC');
  res.json(result.rows);
};

// מביא אבן דרך לפי מזהה
export const getMilestoneById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM milestones WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Milestone not found' });
  }
  res.json(result.rows[0]);
};

// יוצר אבן דרך חדשה
export const createMilestone = async (req, res) => {
  const { project_id, title, due_date } = req.body;
  const result = await pool.query(
    'INSERT INTO milestones (project_id, title, due_date) VALUES ($1, $2, $3) RETURNING *',
    [project_id, title, due_date]
  );
  res.status(201).json(result.rows[0]);
};

// מעדכן אבן דרך
export const updateMilestone = async (req, res) => {
  const { id } = req.params;
  const { title, due_date } = req.body;
  const result = await pool.query(
    'UPDATE milestones SET title = $1, due_date = $2 WHERE id = $3 RETURNING *',
    [title, due_date, id]
  );
  res.json(result.rows[0]);
};

// מוחק אבן דרך
export const deleteMilestone = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM milestones WHERE id = $1', [id]);
  res.status(204).send();
};
