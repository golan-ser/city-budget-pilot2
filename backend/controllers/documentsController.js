import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// הגדרת multer לטיפול בהעלאת קבצים
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
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

export const upload = multer({ 
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

// מביא מסמכים לפי פרויקט (למודול המתקדם)
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Convert projectId to integer since we're working with tabarim table IDs
    const tabarId = parseInt(projectId);
    if (isNaN(tabarId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid project ID format' 
      });
    }
    
    // ראשית, נמצא את tabar_number של הפרויקט מטבלת tabarim
    const projectQuery = 'SELECT tabar_number FROM tabarim WHERE id = $1';
    const projectResult = await db.query(projectQuery, [tabarId]);
    
    let tabar_number = null;
    if (projectResult.rows.length > 0) {
      tabar_number = projectResult.rows[0].tabar_number;
      console.log(`🔍 Found tabar_number ${tabar_number} for project ${tabarId}`);
    } else {
      // אם לא מצאנו בטבלת tabarim, ננסה עם המזהה עצמו
      tabar_number = tabarId;
      console.log(`⚠️ No tabar found for project ${tabarId}, using project ID as tabar_number`);
    }
    
    const query = `
      SELECT 
        id,
        project_id,
        tabar_number,
        type,
        title,
        name,
        date,
        supplier,
        amount,
        reported,
        file_url,
        created_at,
        updated_at
      FROM project_documents 
      WHERE tabar_number = $1
      ORDER BY type, date DESC, created_at DESC
    `;
    
    console.log(`📋 Searching for documents with tabar_number: ${tabar_number}`);
    const result = await db.query(query, [tabar_number]);
    console.log(`📊 Found ${result.rows.length} documents`);
    
    // קיבוץ לפי קטגוריות
    const categorizedDocuments = {
      permit: [],
      invoice: [],
      contract: [],
      permission: [],
      other: []
    };
    
    result.rows.forEach(doc => {
      // המרת שדות ישנים לחדשים
      const normalizedDoc = {
        ...doc,
        title: doc.title || doc.name, // תמיכה בשדות ישנים
        type: mapOldTypeToNew(doc.type) // המרת סוגי מסמכים ישנים
      };
      
      if (categorizedDocuments[normalizedDoc.type]) {
        categorizedDocuments[normalizedDoc.type].push(normalizedDoc);
      } else {
        categorizedDocuments.other.push(normalizedDoc);
      }
    });
    
    res.json({
      success: true,
      documents: result.rows.map(doc => ({
        ...doc,
        title: doc.title || doc.name,
        type: mapOldTypeToNew(doc.type)
      })),
      categorized: categorizedDocuments,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching project documents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project documents',
      message: error.message 
    });
  }
};

// פונקציה להמרת סוגי מסמכים ישנים לחדשים
function mapOldTypeToNew(oldType) {
  const typeMapping = {
    'היתר בנייה': 'permit',
    'אישור תב"ר': 'permit',
    'מפרט טכני': 'contract', 
    'חוות דעת מהנדס': 'permission',
    'הצעת מחיר': 'invoice',
    'חשבונית': 'invoice',
    'חוזה': 'contract',
    'הרשאה': 'permission'
  };
  
  return typeMapping[oldType] || 'other';
}

// יוצר מסמך חדש למודול המתקדם
export const createProjectDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, title, date, supplier, amount, reported, tabar_number } = req.body;
    
    // בדיקת שדות חובה
    if (!projectId || !type || !title || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: projectId, type, title, date' 
      });
    }
    
    // בדיקת קובץ
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'File is required' 
      });
    }
    
    const file_url = `/uploads/${req.file.filename}`;
    const documentId = uuidv4();
    
    // שימוש ב-tabar_number אם הוא קיים, אחרת projectId
    const finalTabarNumber = tabar_number || projectId;
    
    const query = `
      INSERT INTO project_documents (
        id, project_id, tabar_number, type, title, date, supplier, amount, reported, file_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
      RETURNING *
    `;
    
    const values = [
      documentId,
      projectId,
      parseInt(finalTabarNumber), // וידוא שזה מספר שלם
      type,
      title,
      date,
      supplier || null,
      amount ? parseFloat(amount) : null,
      reported === 'true' || reported === true,
      file_url
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      document: result.rows[0],
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error creating project document:', error);
    
    // מחיקת הקובץ אם נכשל השמירה במסד הנתונים
    if (req.file && fs.existsSync(`./uploads/${req.file.filename}`)) {
      fs.unlinkSync(`./uploads/${req.file.filename}`);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create document',
      message: error.message 
    });
  }
};

// מעדכן מסמך קיים
export const updateProjectDocument = async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    const { type, title, date, supplier, amount, reported } = req.body;
    
    let query = `
      UPDATE project_documents 
      SET type = COALESCE($1, type), 
          title = COALESCE($2, title), 
          date = COALESCE($3, date),
          supplier = COALESCE($4, supplier),
          amount = COALESCE($5, amount),
          reported = COALESCE($6, reported),
          updated_at = NOW()
    `;
    
    let params = [type, title, date, supplier, amount ? parseFloat(amount) : null, reported];
    
    // אם יש קובץ חדש
    if (req.file) {
      const file_url = `/uploads/${req.file.filename}`;
      query += `, file_url = $${params.length + 1}`;
      params.push(file_url);
    }
    
    query += ` WHERE id = $${params.length + 1} AND project_id = $${params.length + 2} RETURNING *`;
    params.push(documentId, projectId);
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Document not found' 
      });
    }
    
    res.json({
      success: true,
      document: result.rows[0],
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating project document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update document',
      message: error.message 
    });
  }
};

// מוחק מסמך
export const deleteProjectDocument = async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    
    // מוצא את המסמך כדי למחוק את הקובץ הפיזי
    const docResult = await db.query(
      'SELECT file_url FROM project_documents WHERE id = $1 AND project_id = $2', 
      [documentId, projectId]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Document not found' 
      });
    }
    
    const document = docResult.rows[0];
    
    // מוחק את הרשומה מהמסד נתונים
    const result = await db.query(
      'DELETE FROM project_documents WHERE id = $1 AND project_id = $2 RETURNING *', 
      [documentId, projectId]
    );
    
    // מוחק את הקובץ הפיזי אם קיים
    if (document.file_url && fs.existsSync('.' + document.file_url)) {
      try {
        fs.unlinkSync('.' + document.file_url);
      } catch (fileError) {
        console.warn('⚠️ Could not delete physical file:', fileError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting project document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete document',
      message: error.message 
    });
  }
};

// סטטיסטיקות מסמכים לפי פרויקט
export const getProjectDocumentStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN reported = true THEN 1 END) as reported_count,
        SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount
      FROM project_documents 
      WHERE project_id = $1 
      GROUP BY type
      ORDER BY type
    `;
    
    const result = await db.query(query, [projectId]);
    
    const totalQuery = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN reported = true THEN 1 END) as total_reported,
        SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount
      FROM project_documents 
      WHERE project_id = $1
    `;
    
    const totalResult = await db.query(totalQuery, [projectId]);
    
    res.json({
      success: true,
      stats: {
        by_category: result.rows,
        totals: totalResult.rows[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching document stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch document statistics',
      message: error.message 
    });
  }
};

// מביא את כל המסמכים (עם אפשרות לסינון לפי פרויקט)
export const getAllDocuments = async (req, res) => {
  try {
    const { tabar_number, project_id, type, status } = req.query;
    let query = 'SELECT * FROM project_documents WHERE 1=1';
    const params = [];
    
    // Handle tabar_number filter (integer)
    if (tabar_number) {
      params.push(parseInt(tabar_number));
      query += ` AND tabar_number = $${params.length}`;
    }
    
    // Handle project_id filter (UUID)
    if (project_id) {
      params.push(project_id);
      query += ` AND project_id = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC, id DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// מביא מסמך לפי מזהה
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM project_documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching document by ID:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// יוצר מסמך חדש (עם או בלי העלאת קובץ)
export const createDocument = async (req, res) => {
  try {
    const { tabar_number, project_id, type, name, is_required = false, status = 'חסר', description } = req.body;
    const finalTabarNumber = tabar_number || project_id; // Support both for backward compatibility
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const upload_date = file_url ? new Date() : null;
    const actualStatus = file_url ? 'הועלה' : status;
    
    // Validation
    if (!finalTabarNumber || !type || !name) {
      return res.status(400).json({ error: 'Missing required fields: tabar_number (or project_id), type, name' });
    }
    
    const result = await db.query(
      `INSERT INTO project_documents (tabar_number, type, name, is_required, upload_date, file_url, status, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [finalTabarNumber, type, name, is_required, upload_date, file_url, actualStatus, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

// מעדכן מסמך
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, is_required, status, description } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    const upload_date = file_url ? new Date() : undefined;
    
    let query = `UPDATE project_documents 
                 SET type = COALESCE($1, type), 
                     name = COALESCE($2, name), 
                     is_required = COALESCE($3, is_required),
                     status = COALESCE($4, status),
                     description = COALESCE($5, description)`;
    let params = [type, name, is_required, status, description];
    
    if (file_url) {
      query += `, file_url = $${params.length + 1}, upload_date = $${params.length + 2}`;
      params.push(file_url, upload_date);
    }
    
    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

// מוחק מסמך
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    // מוצא את המסמך כדי למחוק את הקובץ הפיזי
    const docResult = await db.query('SELECT file_url FROM project_documents WHERE id = $1', [id]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = docResult.rows[0];
    
    // מוחק את הרשומה מהמסד נתונים
    const result = await db.query('DELETE FROM project_documents WHERE id = $1 RETURNING *', [id]);
    
    // מוחק את הקובץ הפיזי אם קיים
    if (document.file_url && fs.existsSync('.' + document.file_url)) {
      fs.unlinkSync('.' + document.file_url);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// הורדת קובץ
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT file_url, title, name FROM project_documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    const filePath = '.' + document.file_url;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    const fileName = document.title || document.name || 'document';
    res.download(filePath, fileName);
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};
