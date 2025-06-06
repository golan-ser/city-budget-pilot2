import pool from '../db.js';

export const getAllComments = async (req, res) => {
  const result = await pool.query('SELECT * FROM comments ORDER BY id DESC');
  res.json(result.rows);
};

export const getCommentById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  res.json(result.rows[0]);
};

export const createComment = async (req, res) => {
  const { report_id, content, created_by } = req.body;
  const result = await pool.query(
    'INSERT INTO comments (report_id, content, created_by) VALUES ($1, $2, $3) RETURNING *',
    [report_id, content, created_by]
  );
  res.status(201).json(result.rows[0]);
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const result = await pool.query(
    'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
    [content, id]
  );
  res.json(result.rows[0]);
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
  res.status(204).send();
};
