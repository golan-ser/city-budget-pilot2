import pool from '../db.js';

export const getAllDocuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentsById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching document by ID:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const createDocuments = async (req, res) => {
  // יש להוסיף שדות מתאימים לפי טבלה
  res.status(201).json({ message: 'createDocuments not implemented' });
};

export const updateDocuments = async (req, res) => {
  // יש להוסיף עדכון לפי מזהה
  res.json({ message: 'updateDocuments not implemented' });
};

export const deleteDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
