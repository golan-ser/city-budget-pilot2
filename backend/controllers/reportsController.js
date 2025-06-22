import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// הגדרת multer לטיפול בהעלאת קבצים לדיווחי ביצוע
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadReportFile = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// שליפת כל הדוחות (עם אפשרות לסינון)
export const getReports = async (req, res) => {
  try {
    const { status, project_id, ministry_id, year } = req.query;
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (project_id) {
      params.push(project_id);
      query += ` AND project_id = $${params.length}`;
    }
    if (ministry_id) {
      params.push(ministry_id);
      query += ` AND ministry_id = $${params.length}`;
    }
    if (year) {
      params.push(`${year}%`);
      query += ` AND TO_CHAR(report_date, 'YYYY') LIKE $${params.length}`;
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// שליפת דוח בודד
export const getReportById = async (req, res) => {
  try {
    console.log('🔍 getReportById called with params:', req.params, 'query:', req.query);
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// יצירת דוח
export const createReport = async (req, res) => {
  try {
    const {
      project_id, report_date, status, notes, created_by, order_id, order_description, amount,
      budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
      ministry_id, tabar_id, project_stage, requesting_department_id
    } = req.body;
    const result = await pool.query(
      `INSERT INTO reports (
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      )
      RETURNING *`,
      [
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// עדכון דוח
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_id, report_date, status, notes, created_by, order_id, order_description, amount,
      budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
      ministry_id, tabar_id, project_stage, requesting_department_id
    } = req.body;
    const result = await pool.query(
      `UPDATE reports SET
        project_id=$1, report_date=$2, status=$3, notes=$4, created_by=$5, order_id=$6,
        order_description=$7, amount=$8, budget_item_id=$9, budget_item_name=$10, supply_date=$11,
        supply_location=$12, contract_id=$13, quote=$14, ministry_id=$15, tabar_id=$16,
        project_stage=$17, requesting_department_id=$18, updated_at=NOW()
      WHERE id=$19
      RETURNING *`,
      [
        project_id, report_date, status, notes, created_by, order_id, order_description, amount,
        budget_item_id, budget_item_name, supply_date, supply_location, contract_id, quote,
        ministry_id, tabar_id, project_stage, requesting_department_id, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// מחיקת דוח
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

// === דיווחי ביצוע (Execution Reports) ===

// שליפת כל דיווחי הביצוע
export const getExecutionReports = async (req, res) => {
  try {
    console.log('🔍 getExecutionReports called with query:', req.query);
    const { tabar_number, project_id, status } = req.query;
    const filterValue = tabar_number || project_id; // Support both for backward compatibility
    console.log('🔍 filterValue:', filterValue);
    
    let query = 'SELECT * FROM execution_reports WHERE 1=1';
    const params = [];
    
    if (filterValue) {
      params.push(filterValue);
      query += ` AND tabar_number = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY report_date DESC, created_at DESC';
    console.log('🔍 Executing query:', query, 'with params:', params);
    
    const result = await pool.query(query, params);
    console.log('✅ Query result:', result.rows.length, 'rows');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching execution reports:', error);
    res.status(500).json({ error: 'Failed to fetch execution reports' });
  }
};

// שליפת דיווח ביצוע בודד
export const getExecutionReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM execution_reports WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching execution report:', error);
    res.status(500).json({ error: 'Failed to fetch execution report' });
  }
};

// יצירת דיווח ביצוע חדש
export const createExecutionReport = async (req, res) => {
  try {
    const { tabar_number, project_id, report_date, amount, status = 'ממתין לאישור', notes, created_by } = req.body;
    const finalTabarNumber = tabar_number || project_id; // Support both for backward compatibility
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const documents_attached = file_url ? [file_url] : [];
    
    // Validation
    if (!finalTabarNumber || !report_date || !amount) {
      return res.status(400).json({ error: 'Missing required fields: tabar_number (or project_id), report_date, amount' });
    }
    
    const result = await pool.query(
      `INSERT INTO execution_reports (tabar_number, report_date, amount, status, notes, documents_attached, created_by, file_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [finalTabarNumber, report_date, amount, status, notes, documents_attached, created_by, file_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating execution report:', error);
    res.status(500).json({ error: 'Failed to create execution report' });
  }
};

// עדכון דיווח ביצוע
export const updateExecutionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { report_date, amount, status, notes, documents_attached, created_by } = req.body;
    
    const result = await pool.query(
      `UPDATE execution_reports 
       SET report_date = COALESCE($1, report_date), 
           amount = COALESCE($2, amount), 
           status = COALESCE($3, status),
           notes = COALESCE($4, notes),
           documents_attached = COALESCE($5, documents_attached),
           created_by = COALESCE($6, created_by),
           updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [report_date, amount, status, notes, documents_attached, created_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating execution report:', error);
    res.status(500).json({ error: 'Failed to update execution report' });
  }
};

// מחיקת דיווח ביצוע
export const deleteExecutionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM execution_reports WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution report not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting execution report:', error);
    res.status(500).json({ error: 'Failed to delete execution report' });
  }
};
