import pool from '../db.js';

// מביא את כל אבני הדרך (עם אפשרות לסינון לפי פרויקט)
export const getAllMilestones = async (req, res) => {
  try {
    const { tabar_number, project_id } = req.query;
    const filterValue = tabar_number || project_id; // Support both for backward compatibility
    let query = 'SELECT * FROM milestones';
    const params = [];
    
    if (filterValue) {
      query += ' WHERE tabar_number = $1';
      params.push(filterValue);
    }
    
    query += ' ORDER BY due_date ASC, id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
};

// מביא אבן דרך לפי מזהה
export const getMilestoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM milestones WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching milestone:', error);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  }
};

// יוצר אבן דרך חדשה
export const createMilestone = async (req, res) => {
  try {
    const { tabar_number, project_id, title, due_date, status = 'לא התחיל', responsible, completion_percent = 0, description } = req.body;
    const finalTabarNumber = tabar_number || project_id; // Support both for backward compatibility
    
    // Validation
    if (!finalTabarNumber || !title || !due_date) {
      return res.status(400).json({ error: 'Missing required fields: tabar_number (or project_id), title, due_date' });
    }
    
    const result = await pool.query(
      `INSERT INTO milestones (tabar_number, title, due_date, status, responsible, completion_percent, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [finalTabarNumber, title, due_date, status, responsible, completion_percent, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
};

// מעדכן אבן דרך
export const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, due_date, status, responsible, completion_percent, description } = req.body;
    
    const result = await pool.query(
      `UPDATE milestones 
       SET title = COALESCE($1, title), 
           due_date = COALESCE($2, due_date), 
           status = COALESCE($3, status),
           responsible = COALESCE($4, responsible),
           completion_percent = COALESCE($5, completion_percent),
           description = COALESCE($6, description),
           updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [title, due_date, status, responsible, completion_percent, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
};

// מוחק אבן דרך
export const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM milestones WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
};
