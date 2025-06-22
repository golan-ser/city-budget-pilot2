import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

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

// דיווח ביצוע תקציבי לפי תב"ר
export const getBudgetExecutionReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.tabar_id,
        t.name as project_name,
        t.tabar_number,
        m.name as ministry_name,
        COUNT(r.id) AS report_count,
        SUM(r.amount) AS total_reported_amount,
        b.budget AS total_budget,
        ROUND(SUM(r.amount) * 100.0 / b.budget, 2) AS execution_percent,
        MAX(r.report_date) as last_report_date,
        STRING_AGG(DISTINCT r.status, ', ') as report_statuses
      FROM reports r
      JOIN budget_items b ON r.budget_item_id = b.id
      JOIN tabarim t ON r.tabar_id = t.id
      LEFT JOIN ministries m ON t.ministry_id = m.id
      GROUP BY r.tabar_id, t.name, t.tabar_number, m.name, b.budget
      ORDER BY execution_percent DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_projects: result.rows.length,
        total_reported: result.rows.reduce((sum, row) => sum + parseFloat(row.total_reported_amount), 0),
        average_execution: result.rows.length > 0 
          ? (result.rows.reduce((sum, row) => sum + parseFloat(row.execution_percent), 0) / result.rows.length).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching budget execution report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// דיווח חשבוניות ותשלומים
export const getInvoicesReport = async (req, res) => {
  try {
    const { status, date_from, date_to } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status) {
      whereClause += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (date_from) {
      whereClause += ` AND i.invoice_date >= $${params.length + 1}`;
      params.push(date_from);
    }
    
    if (date_to) {
      whereClause += ` AND i.invoice_date <= $${params.length + 1}`;
      params.push(date_to);
    }
    
    const query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.amount,
        i.invoice_date,
        i.due_date,
        i.status,
        i.reported,
        i.payment_date,
        o.order_number,
        o.supplier_name,
        t.name as project_name,
        t.tabar_number,
        m.name as ministry_name,
        CASE 
          WHEN i.due_date < CURRENT_DATE AND i.status != 'שולמה' THEN 'פיגור'
          WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' AND i.status != 'שולמה' THEN 'דחוף'
          ELSE 'רגיל'
        END as priority
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN tabarim t ON o.project_id = t.id
      LEFT JOIN ministries m ON t.ministry_id = m.id
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN i.due_date < CURRENT_DATE AND i.status != 'שולמה' THEN 1
          WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' AND i.status != 'שולמה' THEN 2
          ELSE 3
        END,
        i.due_date ASC
    `;
    
    const result = await pool.query(query, params);
    
    // חישוב סטטיסטיקות
    const stats = {
      total_invoices: result.rows.length,
      total_amount: result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0),
      overdue: result.rows.filter(row => row.priority === 'פיגור').length,
      urgent: result.rows.filter(row => row.priority === 'דחוף').length,
      by_status: {}
    };
    
    // קיבוץ לפי סטטוס
    result.rows.forEach(row => {
      if (!stats.by_status[row.status]) {
        stats.by_status[row.status] = { count: 0, amount: 0 };
      }
      stats.by_status[row.status].count++;
      stats.by_status[row.status].amount += parseFloat(row.amount);
    });
    
    res.json({
      success: true,
      data: result.rows,
      stats
    });
  } catch (error) {
    console.error('Error fetching invoices report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// דיווח לפי משרדים
export const getMinistryReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.name as ministry_name,
        m.code as ministry_code,
        COUNT(DISTINCT t.id) as total_projects,
        COUNT(DISTINCT CASE WHEN t.status = 'נפתח' THEN t.id END) as active_projects,
        COUNT(DISTINCT CASE WHEN t.status = 'סגור' THEN t.id END) as completed_projects,
        SUM(t.total_authorized) as total_budget,
        SUM(t.total_executed) as total_executed,
        ROUND(
          CASE 
            WHEN SUM(t.total_authorized) > 0 
            THEN (SUM(t.total_executed) / SUM(t.total_authorized)) * 100
            ELSE 0 
          END, 2
        ) as execution_percentage,
        COUNT(DISTINCT r.id) as total_reports,
        SUM(r.amount) as total_reported_amount,
        MAX(r.report_date) as last_report_date
      FROM ministries m
      LEFT JOIN tabarim t ON m.id = t.ministry_id
      LEFT JOIN reports r ON t.id = r.tabar_id
      GROUP BY m.id, m.name, m.code
      ORDER BY total_budget DESC NULLS LAST
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_ministries: result.rows.length,
        total_projects: result.rows.reduce((sum, row) => sum + parseInt(row.total_projects || 0), 0),
        total_budget: result.rows.reduce((sum, row) => sum + parseFloat(row.total_budget || 0), 0),
        total_executed: result.rows.reduce((sum, row) => sum + parseFloat(row.total_executed || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching ministry report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// דיווח תזרים מזומנים
export const getCashFlowReport = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const dateFormat = period === 'week' ? 'YYYY-"W"WW' : 
                      period === 'month' ? 'YYYY-MM' : 'YYYY';
    
    const query = `
      WITH cash_flow AS (
        SELECT 
          TO_CHAR(r.report_date, '${dateFormat}') as period,
          SUM(r.amount) as reported_amount,
          SUM(r.amount_received) as received_amount,
          COUNT(*) as report_count
        FROM reports r
        WHERE r.report_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(r.report_date, '${dateFormat}')
        
        UNION ALL
        
        SELECT 
          TO_CHAR(i.payment_date, '${dateFormat}') as period,
          0 as reported_amount,
          SUM(i.amount) as received_amount,
          0 as report_count
        FROM invoices i
        WHERE i.payment_date IS NOT NULL 
          AND i.payment_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(i.payment_date, '${dateFormat}')
      )
      SELECT 
        period,
        SUM(reported_amount) as total_reported,
        SUM(received_amount) as total_received,
        SUM(report_count) as total_reports,
        SUM(received_amount) - SUM(reported_amount) as cash_flow_difference
      FROM cash_flow
      GROUP BY period
      ORDER BY period DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      chart_data: {
        labels: result.rows.map(row => row.period).reverse(),
        datasets: [
          {
            label: 'סכום דווח',
            data: result.rows.map(row => parseFloat(row.total_reported)).reverse(),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          },
          {
            label: 'סכום התקבל',
            data: result.rows.map(row => parseFloat(row.total_received)).reverse(),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching cash flow report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ייצוא דיווח לאקסל
export const exportReportToExcel = async (req, res) => {
  try {
    const { reportType, filters } = req.body;
    
    let query = '';
    let filename = '';
    
    switch (reportType) {
      case 'budget_execution':
        query = `
          SELECT 
            t.tabar_number as "מספר תב״ר",
            t.name as "שם הפרויקט",
            m.name as "משרד",
            SUM(r.amount) as "סכום דווח",
            b.budget as "תקציב כולל",
            ROUND(SUM(r.amount) * 100.0 / b.budget, 2) as "אחוז ביצוע"
          FROM reports r
          JOIN budget_items b ON r.budget_item_id = b.id
          JOIN tabarim t ON r.tabar_id = t.id
          LEFT JOIN ministries m ON t.ministry_id = m.id
          GROUP BY t.tabar_number, t.name, m.name, b.budget
          ORDER BY "אחוז ביצוע" DESC
        `;
        filename = 'דיווח_ביצוע_תקציבי';
        break;
        
      case 'invoices':
        query = `
          SELECT 
            i.invoice_number as "מספר חשבונית",
            t.tabar_number as "מספר תב״ר",
            t.name as "שם הפרויקט",
            i.amount as "סכום",
            i.invoice_date as "תאריך חשבונית",
            i.due_date as "תאריך פירעון",
            i.status as "סטטוס",
            o.supplier_name as "ספק"
          FROM invoices i
          JOIN orders o ON i.order_id = o.id
          JOIN tabarim t ON o.project_id = t.id
          ORDER BY i.invoice_date DESC
        `;
        filename = 'דיווח_חשבוניות';
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Invalid report type' });
    }
    
    const result = await pool.query(query);
    
    // כאן תוכל להוסיף לוגיקה ליצירת קובץ אקסל
    // לעת עתה נחזיר את הנתונים בפורמט JSON
    
    res.json({
      success: true,
      data: result.rows,
      filename: `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
    });
    
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get budget items data
export const getBudgetItems = async (req, res) => {
  try {
    console.log('📊 getBudgetItems called');
    
    const query = `
      SELECT 
        bi.id,
        bi.description as name,
        COALESCE(m.name, 'לא מוגדר') as department,
        'פעיל' as status,
        bi.budget_amount as approved_budget,
        bi.executed_amount as executed_budget,
        EXTRACT(YEAR FROM bi.created_at) as fiscal_year,
        NULL as tabar_id,
        bi.created_at,
        bi.code as notes
      FROM budget_items bi
      LEFT JOIN ministries m ON bi.ministry_id = m.id
      ORDER BY bi.created_at DESC
    `;
    
    console.log('📊 Executing query:', query);
    
    const result = await pool.query(query);
    console.log('📊 Query result:', result.rows.length, 'rows');
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching budget items:', error);
    res.status(500).json({ error: 'Failed to fetch budget items', details: error.message });
  }
};

// Export budget items as PDF
export const exportBudgetItemsPDF = async (req, res) => {
  try {
    const { filters } = req.body;
    
    let query = `
      SELECT 
        bi.id,
        bi.description as name,
        COALESCE(m.name, 'לא מוגדר') as department,
        'פעיל' as status,
        bi.budget_amount as approved_budget,
        bi.executed_amount as executed_budget,
        EXTRACT(YEAR FROM bi.created_at) as fiscal_year,
        NULL as tabar_id,
        bi.created_at,
        bi.code as notes
      FROM budget_items bi
      LEFT JOIN ministries m ON bi.ministry_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Apply filters
    if (filters?.department) {
      query += ` AND m.name = $${paramIndex}`;
      params.push(filters.department);
      paramIndex++;
    }
    
    if (filters?.status) {
      // All items are active for now, so we don't filter by status
    }
    
    if (filters?.fiscal_year) {
      query += ` AND EXTRACT(YEAR FROM bi.created_at) = $${paramIndex}`;
      params.push(parseInt(filters.fiscal_year));
      paramIndex++;
    }
    
    if (filters?.search) {
      query += ` AND (bi.description ILIKE $${paramIndex} OR m.name ILIKE $${paramIndex} OR bi.code ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY bi.created_at DESC`;
    
    const result = await pool.query(query, params);
    const budgetItems = result.rows;
    
    // Calculate totals
    const totalApproved = budgetItems.reduce((sum, item) => sum + parseFloat(item.approved_budget || 0), 0);
    const totalExecuted = budgetItems.reduce((sum, item) => sum + parseFloat(item.executed_budget || 0), 0);
    const overallUtilization = totalApproved > 0 ? (totalExecuted / totalApproved) * 100 : 0;
    
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>דוח סעיפי תקציב</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .table-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #4f46e5;
            color: white;
            padding: 15px 10px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
            text-align: right;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-active { background: #d4edda; color: #155724; }
          .status-frozen { background: #f8d7da; color: #721c24; }
          .status-closed { background: #d1ecf1; color: #0c5460; }
          .currency {
            font-weight: bold;
            color: #2563eb;
          }
          .utilization {
            font-weight: bold;
          }
          .utilization.high { color: #dc2626; }
          .utilization.medium { color: #f59e0b; }
          .utilization.low { color: #10b981; }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>דוח סעיפי תקציב</h1>
          <p>נוצר ב-${new Date().toLocaleDateString('he-IL')} | סה"כ ${budgetItems.length} סעיפים</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>סה"כ תקציב מאושר</h3>
            <div class="value currency">${totalApproved.toLocaleString('he-IL')} ₪</div>
          </div>
          <div class="summary-card">
            <h3>סה"כ ניצול בפועל</h3>
            <div class="value currency">${totalExecuted.toLocaleString('he-IL')} ₪</div>
          </div>
          <div class="summary-card">
            <h3>אחוז ניצול כולל</h3>
            <div class="value">${overallUtilization.toFixed(1)}%</div>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>שם סעיף</th>
                <th>מחלקה</th>
                <th>סטטוס</th>
                <th>תקציב מאושר</th>
                <th>ניצול בפועל</th>
                <th>אחוז ניצול</th>
                <th>שנת תקציב</th>
                <th>הערות</th>
              </tr>
            </thead>
            <tbody>
              ${budgetItems.map(item => {
                const utilization = item.approved_budget > 0 ? (item.executed_budget / item.approved_budget) * 100 : 0;
                const utilizationClass = utilization > 100 ? 'high' : utilization >= 90 ? 'medium' : 'low';
                const statusClass = item.status === 'פעיל' ? 'status-active' : 
                                  item.status === 'מוקפא' ? 'status-frozen' : 'status-closed';
                
                return `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.department}</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                    <td class="currency">${parseFloat(item.approved_budget || 0).toLocaleString('he-IL')} ₪</td>
                    <td class="currency">${parseFloat(item.executed_budget || 0).toLocaleString('he-IL')} ₪</td>
                    <td class="utilization ${utilizationClass}">${utilization.toFixed(1)}%</td>
                    <td>${item.fiscal_year}</td>
                    <td>${item.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>דוח זה נוצר אוטומטית על ידי מערכת ניהול התקציב העירוני</p>
        </div>
      </body>
      </html>
    `;
    
    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="budget-items-report.pdf"');
    res.send(pdf);
    
  } catch (error) {
    console.error('Error exporting budget items PDF:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};
