import pool from '../db.js';

// שליפת כל התב"רים
export const getAllTabarim = async (req, res) => {
  const result = await pool.query('SELECT * FROM tabarim ORDER BY year DESC, tabar_number DESC');
  res.json(result.rows);
};

// שליפת תב"ר בודד כולל הכל
export const getTabarDetails = async (req, res) => {
  const { id } = req.params;
  const tabarRes = await pool.query('SELECT * FROM tabarim WHERE id = $1', [id]);
  if (tabarRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const itemsRes = await pool.query('SELECT * FROM tabar_items WHERE tabar_id = $1', [id]);
  const transRes = await pool.query('SELECT * FROM tabar_transactions WHERE tabar_id = $1 ORDER BY transaction_date DESC', [id]);
  const permsRes = await pool.query('SELECT * FROM tabar_permissions WHERE tabar_id = $1', [id]);
  const fundersRes = await pool.query('SELECT * FROM tabar_funding WHERE tabar_id = $1', [id]);
  const docsRes = await pool.query('SELECT * FROM tabar_documents WHERE tabar_id = $1', [id]);

  res.json({
    tabar: tabarRes.rows[0],
    items: itemsRes.rows,
    transactions: transRes.rows,
    permissions: permsRes.rows,
    funders: fundersRes.rows,
    documents: docsRes.rows,
  });
};

// יצירת תב"ר חדש
export const createTabar = async (req, res) => {
  try {
    const {
      year,
      tabar_number,
      name,
      ministry,
      total_authorized,
      municipal_participation,
      additional_funders,
      open_date,
      close_date,
      status,
    } = req.body;
    const result = await pool.query(
      `INSERT INTO tabarim 
      (year, tabar_number, name, ministry, total_authorized, municipal_participation, additional_funders, open_date, close_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [year, tabar_number, name, ministry, total_authorized, municipal_participation, additional_funders, open_date, close_date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// עדכון תב"ר קיים
export const updateTabar = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const setStr = Object.keys(fields)
      .map((k, i) => `${k} = $${i + 1}`)
      .join(', ');
    const values = Object.values(fields);
    const query = `UPDATE tabarim SET ${setStr} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// הוספת מקור מימון
export const addFundingSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { funder_name, amount, percent, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO tabar_funding (tabar_id, funder_name, amount, percent, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, funder_name, amount, percent, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// הוספת הרשאה
export const addPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      permission_number,
      ministry,
      amount,
      start_date,
      end_date,
      document_url
    } = req.body;
    const result = await pool.query(
      `INSERT INTO tabar_permissions (tabar_id, permission_number, ministry, amount, start_date, end_date, document_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, permission_number, ministry, amount, start_date, end_date, document_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// הוספת מסמך (עם upload)
export const addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const fileUrl = req.file ? req.file.path : null;
    const result = await pool.query(
      `INSERT INTO tabar_documents (tabar_id, description, file_url)
      VALUES ($1, $2, $3) RETURNING *`,
      [id, description, fileUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
