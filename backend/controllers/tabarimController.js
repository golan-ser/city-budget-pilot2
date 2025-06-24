import db, { pool } from '../db.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// שליפת כל התב"רים (כולל סינון) עם חישוב ניצול מדויק
export const getAllTabarim = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    console.log(`🔄 Fetching tabarim for tenant ${tenantId} with precise utilization calculation...`);
    
    const { q, ministry, year, status } = req.query;
    
    // 🔐 SECURITY: Query with tenant_id filtering
    let sql = `
      SELECT 
        t.*,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized,
        COALESCE(SUM(CASE WHEN tt.direction = 'זיכוי' THEN tt.amount ELSE 0 END), 0) as credited,
        COUNT(DISTINCT tt.id) as transaction_count,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 0
        ) as utilization_percentage
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id AND tt.tenant_id = $1
      WHERE t.tenant_id = $1
    `;
    
    const params = [tenantId]; // Start with tenant_id as first parameter
    
    if (q) {
      sql += ' AND (CAST(t.tabar_number AS TEXT) ILIKE $' + (params.length + 1) +
        ' OR t.name ILIKE $' + (params.length + 1) +
        ' OR t.permission_number ILIKE $' + (params.length + 1) +
        ' OR t.ministry ILIKE $' + (params.length + 1) + ')';
      params.push(`%${q}%`);
    }
    if (ministry) {
      sql += ' AND t.ministry = $' + (params.length + 1);
      params.push(ministry);
    }
    if (year) {
      sql += ' AND t.year = $' + (params.length + 1);
      params.push(year);
    }
    if (status) {
      sql += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }
    
    sql += ` 
      GROUP BY t.id
      ORDER BY t.id DESC
    `;

    console.log('📝 Executing SQL query...');
    const tabarimRes = await pool.query(sql, params);
    console.log(`📊 Found ${tabarimRes.rows.length} tabarim from database`);
    
    // Format the response with calculated utilization data
    const formattedTabarim = tabarimRes.rows.map(tabar => {
      const utilizedAmount = parseFloat(tabar.utilized || 0);
      const totalBudget = parseFloat(tabar.total_authorized || 0);
      const utilizationPercentage = parseInt(tabar.utilization_percentage || 0);
      
      console.log(`📋 Tabar ${tabar.tabar_number}: ${utilizedAmount} / ${totalBudget} = ${utilizationPercentage}%`);
      
      return {
        ...tabar,
        utilized: utilizedAmount,
        credited: parseFloat(tabar.credited || 0),
        utilization_percentage: utilizationPercentage,
        transaction_count: parseInt(tabar.transaction_count || 0)
      };
    });
    
    console.log(`✅ Returning ${formattedTabarim.length} tabarim with accurate utilization data`);
    res.json(formattedTabarim);
  } catch (err) {
    console.error('❌ Error fetching tabarim:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to fetch tabarim', details: err.message });
  }
};

// שליפת תב"ר בודד כולל הכל
export const getTabarDetails = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    
    // 🔐 SECURITY: Query with tenant_id filtering
    const tabarRes = await pool.query('SELECT * FROM tabarim WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (tabarRes.rows.length === 0)
      return res.status(404).json({ error: 'Tabar not found or access denied' });

    const itemsRes = await pool.query('SELECT * FROM tabar_items WHERE tabar_id = $1 AND tenant_id = $2', [id, tenantId]);
    const transRes = await pool.query('SELECT * FROM tabar_transactions WHERE tabar_id = $1 AND tenant_id = $2 ORDER BY transaction_date DESC', [id, tenantId]);
    const permsRes = await pool.query('SELECT * FROM tabar_permissions WHERE tabar_id = $1 AND tenant_id = $2', [id, tenantId]);
    const fundersRes = await pool.query('SELECT * FROM tabar_funding WHERE tabar_id = $1 AND tenant_id = $2', [id, tenantId]);
    const docsRes = await pool.query('SELECT * FROM tabar_documents WHERE tabar_id = $1 AND tenant_id = $2', [id, tenantId]);

    res.json({
      tabar: tabarRes.rows[0],
      items: itemsRes.rows,
      transactions: transRes.rows,
      permissions: permsRes.rows,
      funders: fundersRes.rows,
      documents: docsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching tabar details:', err);
    res.status(500).json({ error: 'Failed to fetch tabar details' });
  }
};

// יצירת תב"ר חדש עם סעיפי הכנסה והוצאה אוטומטיים
export const createTabar = async (req, res) => {
  console.log('🚀 createTabar called');
  console.log('📋 Request body:', req.body);
  
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const {
      tabar_number, name, year, ministry,
      total_authorized, permission_number, status,
      open_date, close_date,
      department, additional_funders, municipal_participation
    } = req.body;

    console.log(`📋 Creating tabar for tenant ${tenantId}:`, { tabar_number, name, year, ministry });

    const totalAuthorizedValue = total_authorized ? Number(total_authorized) : 0;
    const municipalParticipationValue = municipal_participation ? Number(municipal_participation) : 0;

    // 🔐 SECURITY: Always set tenant_id from authenticated user
    const tabarResult = await pool.query(
      `INSERT INTO tabarim (tabar_number, name, year, ministry, total_authorized, permission_number, status, open_date, close_date, department, additional_funders, municipal_participation, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        tabar_number, name, year, ministry, totalAuthorizedValue,
        permission_number, status, open_date, close_date,
        department, additional_funders, municipalParticipationValue, tenantId
      ]
    );

    const newTabar = tabarResult.rows[0];
    const tabarId = newTabar.id;

    console.log('✅ Created tabar with ID:', tabarId);

    // 🔐 SECURITY: Create automatic items with tenant_id
    if (totalAuthorizedValue > 0) {
      // סעיף הכנסה - התקציב המאושר
      await pool.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tabarId,
          'הכנסה',
          `${tabar_number}-INC-001`,
          `הכנסה - ${name}`,
          totalAuthorizedValue,
          'סעיף הכנסה אוטומטי',
          tenantId
        ]
      );

      // סעיף הוצאה - התקציב המאושר
      await pool.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tabarId,
          'הוצאה',
          `${tabar_number}-EXP-001`,
          `הוצאה - ${name}`,
          totalAuthorizedValue,
          'סעיף הוצאה אוטומטי',
          tenantId
        ]
      );
    }

    // אם יש השתתפות עירונית, יוצרים סעיף נפרד
    if (municipalParticipationValue > 0) {
      await pool.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tabarId,
          'הכנסה',
          `${tabar_number}-MUN-001`,
          `השתתפות עירונית - ${name}`,
          municipalParticipationValue,
          'השתתפות עירונית',
          tenantId
        ]
      );
    }

    // החזרת התב"ר החדש עם הפריטים
    const itemsRes = await pool.query('SELECT * FROM tabar_items WHERE tabar_id = $1', [tabarId]);
    
    console.log('✅ Tabar created successfully');
    res.status(201).json({
      ...newTabar,
      id: tabarId,
      tabar_id: tabarId,
      tabarId: tabarId,
      items: itemsRes.rows
    });

  } catch (err) {
    console.error('❌ Error creating tabar:', err);
    res.status(500).json({ error: 'Failed to create tabar', details: err.message });
  }
};

// הוספת פריט תקציב חדש
export const addTabarItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_type, budget_item_code, budget_item_name, amount, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, item_type, budget_item_code, budget_item_name, amount, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding tabar item:', err);
    res.status(500).json({ error: 'Failed to add tabar item' });
  }
};

// עדכון פריט תקציב
export const updateTabarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { item_type, budget_item_code, budget_item_name, amount, notes } = req.body;

    const result = await pool.query(
      `UPDATE tabar_items SET
        item_type = $1, budget_item_code = $2, budget_item_name = $3, amount = $4, notes = $5
       WHERE id = $6 RETURNING *`,
      [item_type, budget_item_code, budget_item_name, amount, notes, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tabar item:', err);
    res.status(500).json({ error: 'Failed to update tabar item' });
  }
};

// מחיקת פריט תקציב
export const deleteTabarItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // מחיקת תנועות קשורות לפריט
    await pool.query('DELETE FROM tabar_transactions WHERE item_id = $1', [itemId]);
    
    // מחיקת הפריט
    const result = await pool.query('DELETE FROM tabar_items WHERE id = $1 RETURNING *', [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting tabar item:', err);
    res.status(500).json({ error: 'Failed to delete tabar item' });
  }
};

// הוספת תנועה כספית
export const addTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      item_id, transaction_type, transaction_date, order_number, 
      amount, direction, status, description 
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_transactions 
       (tabar_id, item_id, transaction_type, transaction_date, order_number, amount, direction, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, item_id, transaction_type, transaction_date, order_number, amount, direction, status, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

// עדכון תנועה כספית
export const updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { 
      transaction_type, transaction_date, order_number, 
      amount, direction, status, description 
    } = req.body;

    const result = await pool.query(
      `UPDATE tabar_transactions SET
        transaction_type = $1, transaction_date = $2, order_number = $3,
        amount = $4, direction = $5, status = $6, description = $7
       WHERE id = $8 RETURNING *`,
      [transaction_type, transaction_date, order_number, amount, direction, status, description, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// מחיקת תנועה כספית
export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await pool.query('DELETE FROM tabar_transactions WHERE id = $1 RETURNING *', [transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// עדכון תב"ר
export const updateTabar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tabar_number, name, year, ministry,
      total_authorized, permission_number, status,
      open_date, close_date,
      department, additional_funders, municipal_participation
    } = req.body;

    const totalAuthorizedValue = total_authorized ? Number(total_authorized) : null;
    const municipalParticipationValue = municipal_participation ? Number(municipal_participation) : null;

    const result = await pool.query(
      `UPDATE tabarim SET
        tabar_number = $1, name = $2, year = $3, ministry = $4,
        total_authorized = $5, permission_number = $6, status = $7,
        open_date = $8, close_date = $9,
        department = $10, additional_funders = $11, municipal_participation = $12
       WHERE id = $13 RETURNING *`,
      [
        tabar_number, name, year, ministry, totalAuthorizedValue,
        permission_number, status, open_date, close_date,
        department, additional_funders, municipalParticipationValue, id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tabar:', err);
    res.status(500).json({ error: 'Failed to update tabar' });
  }
};

// ✅ פונקציה שהייתה חסרה – הוספת מקור מימון
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
    console.error('Error adding funding source:', err);
    res.status(500).json({ error: 'Failed to add funding source' });
  }
};

// הוספת הרשאה
export const addPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_number, ministry, amount, start_date, end_date, document_url } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_permissions (tabar_id, permission_number, ministry, amount, start_date, end_date, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, permission_number, ministry, amount, start_date, end_date, document_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding permission:', err);
    res.status(500).json({ error: 'Failed to add permission' });
  }
};

// הוספת מסמכים
export const addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const permissionFile = req.files?.permission_file?.[0];
    const approvalFile = req.files?.approval_file?.[0];
    const extraFile1 = req.files?.extra_file_1?.[0];
    const extraFile2 = req.files?.extra_file_2?.[0];
    const extraFile3 = req.files?.extra_file_3?.[0];

    const filesToInsert = [
      { file: permissionFile, desc: 'Permission File' },
      { file: approvalFile, desc: 'Approval File' },
      { file: extraFile1, desc: 'Extra File 1' },
      { file: extraFile2, desc: 'Extra File 2' },
      { file: extraFile3, desc: 'Extra File 3' },
    ].filter(f => f.file);

    const insertedDocs = [];

    for (const { file, desc } of filesToInsert) {
      const fileUrl = `/uploads/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO tabar_documents (tabar_id, description, file_url)
         VALUES ($1, $2, $3) RETURNING *`,
        [id, desc, fileUrl]
      );
      insertedDocs.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Documents uploaded', documents: insertedDocs });
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ error: 'Failed to add documents' });
  }
};

// ייצוא PDF לרשימת תב"רים
export const exportTabarimPDF = async (req, res) => {
  try {
    console.log('📄 Generating PDF export for Tabarim list...');
    
    const { q, ministry, year, status } = req.query;
    
    // שליפת נתוני התב"רים עם אותה לוגיקה כמו getAllTabarim
    let sql = `
      SELECT 
        t.*,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized,
        COALESCE(SUM(CASE WHEN tt.direction = 'זיכוי' THEN tt.amount ELSE 0 END), 0) as credited,
        COUNT(DISTINCT tt.id) as transaction_count,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 0
        ) as utilization_percentage
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (q) {
      sql += ' AND (CAST(t.tabar_number AS TEXT) ILIKE $' + (params.length + 1) +
        ' OR t.name ILIKE $' + (params.length + 1) +
        ' OR t.permission_number ILIKE $' + (params.length + 1) +
        ' OR t.ministry ILIKE $' + (params.length + 1) + ')';
      params.push(`%${q}%`);
    }
    if (ministry) {
      sql += ' AND t.ministry = $' + (params.length + 1);
      params.push(ministry);
    }
    if (year) {
      sql += ' AND t.year = $' + (params.length + 1);
      params.push(year);
    }
    if (status) {
      sql += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }
    
    sql += ` 
      GROUP BY t.id
      ORDER BY t.tabar_number
    `;

    const tabarimRes = await pool.query(sql, params);
    const tabarim = tabarimRes.rows;
    
    // הכנת נתונים לתבנית
    const reportData = {
      title: 'רשימת תב"רים',
      subtitle: 'מערכת ניהול תב"רים',
      reportDate: new Date().toLocaleDateString('he-IL'),
      reportTime: new Date().toLocaleTimeString('he-IL'),
      totalCount: tabarim.length,
      totalBudget: tabarim.reduce((sum, t) => sum + parseFloat(t.total_authorized || 0), 0),
      totalUtilized: tabarim.reduce((sum, t) => sum + parseFloat(t.utilized || 0), 0),
      filters: {
        ministry: ministry || 'כל המשרדים',
        year: year || 'כל השנים',
        status: status || 'כל הסטטוסים',
        search: q || 'ללא חיפוש'
      },
      tabarim: tabarim.map(t => ({
        ...t,
        statusClass: getStatusClass(t.status),
        utilized: parseFloat(t.utilized || 0).toLocaleString(),
        total_authorized: parseFloat(t.total_authorized || 0).toLocaleString(),
        utilization_percentage: parseInt(t.utilization_percentage || 0)
      }))
    };
    
    // יצירת HTML לדוח תב"רים
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>רשימת תב"רים</title>
    <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Alef', 'Arial Hebrew', 'David', sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #333;
            background: #fff;
            font-size: 12px;
        }
        
        .container {
            max-width: 297mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #1565c0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1565c0;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 16px;
            color: #666;
            font-weight: normal;
        }
        
        .header .meta {
            font-size: 11px;
            color: #888;
            margin-top: 10px;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0e0e0;
        }
        
        .summary-card .number {
            font-size: 18px;
            font-weight: bold;
            color: #1565c0;
            margin-bottom: 5px;
        }
        
        .summary-card .label {
            font-size: 10px;
            color: #666;
        }
        
        .filters {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .filters h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #1565c0;
        }
        
        .filter-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .filter-item {
            font-size: 11px;
        }
        
        .filter-label {
            font-weight: bold;
            color: #555;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 10px;
        }
        
        th {
            background: #1565c0;
            color: white;
            padding: 8px 4px;
            font-weight: bold;
            text-align: right;
        }
        
        td {
            padding: 6px 4px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: bold;
        }
        
        .status.active { background: #e8f5e8; color: #2e7d32; }
        .status.pending { background: #fff3e0; color: #f57c00; }
        .status.completed { background: #e3f2fd; color: #1565c0; }
        .status.delayed { background: #ffebee; color: #d32f2f; }
        
        .utilization {
            font-weight: bold;
        }
        
        .utilization.high { color: #d32f2f; }
        .utilization.medium { color: #f57c00; }
        .utilization.low { color: #1565c0; }
        .utilization.zero { color: #666; }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        
        @media print {
            .container { 
                padding: 10mm;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle}</div>
            <div class="meta">
                דוח נוצר בתאריך: ${reportData.reportDate} | ${reportData.reportTime}
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.totalCount}</div>
                <div class="label">סה"כ תב"רים</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalBudget.toLocaleString()}</div>
                <div class="label">סה"כ תקציב</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalUtilized.toLocaleString()}</div>
                <div class="label">סה"כ מנוצל</div>
            </div>
            <div class="summary-card">
                <div class="number">${reportData.totalBudget > 0 ? ((reportData.totalUtilized / reportData.totalBudget) * 100).toFixed(1) : 0}%</div>
                <div class="label">אחוז ניצול כללי</div>
            </div>
        </div>

        <div class="filters">
            <h3>פילטרים שהוחלו:</h3>
            <div class="filter-row">
                <div class="filter-item">
                    <span class="filter-label">משרד:</span> ${reportData.filters.ministry}
                </div>
                <div class="filter-item">
                    <span class="filter-label">שנה:</span> ${reportData.filters.year}
                </div>
                <div class="filter-item">
                    <span class="filter-label">סטטוס:</span> ${reportData.filters.status}
                </div>
                <div class="filter-item">
                    <span class="filter-label">חיפוש:</span> ${reportData.filters.search}
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>מס' תב"ר</th>
                    <th>שם תב"ר</th>
                    <th>משרד</th>
                    <th>שנה</th>
                    <th>תקציב מאושר</th>
                    <th>תקציב מנוצל</th>
                    <th>אחוז ניצול</th>
                    <th>סטטוס</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.tabarim.map(tabar => `
                    <tr>
                        <td style="font-family: monospace;">${tabar.tabar_number}</td>
                        <td><strong>${tabar.name}</strong></td>
                        <td>${tabar.ministry || 'לא הוגדר'}</td>
                        <td>${tabar.year || 'לא הוגדר'}</td>
                        <td style="font-family: monospace;">₪${tabar.total_authorized}</td>
                        <td style="font-family: monospace;">₪${tabar.utilized}</td>
                        <td>
                            <span class="utilization ${
                              tabar.utilization_percentage >= 90 ? 'high' :
                              tabar.utilization_percentage >= 70 ? 'medium' :
                              tabar.utilization_percentage > 0 ? 'low' : 'zero'
                            }">
                                ${tabar.utilization_percentage}%
                            </span>
                        </td>
                        <td>
                            <span class="status ${tabar.statusClass}">${tabar.status || 'לא הוגדר'}</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <div>מערכת ניהול תב"רים | משרד הפנים</div>
            <div>דוח זה נוצר אוטומטית ממסד הנתונים בתאריך ${reportData.reportDate}</div>
        </div>
    </div>
</body>
</html>`;
    
    // יצירת PDF עם Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A3',
      orientation: 'landscape',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      }
    });
    
    await browser.close();
    
    // הגדרת headers ושליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tabarim-report-${new Date().getTime()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('✅ Tabarim PDF report generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating Tabarim PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
  }
};

// פונקציה עזר לקביעת מחלקת CSS לפי סטטוס
function getStatusClass(status) {
  if (!status) return 'pending';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('פעיל') || statusLower.includes('active')) return 'active';
  if (statusLower.includes('הושלם') || statusLower.includes('completed')) return 'completed';
  if (statusLower.includes('מושהה') || statusLower.includes('delayed')) return 'delayed';
  return 'pending';
}

// ניהול מסמכי תב"ר - פונקציות חדשות

// שליפת מסמכי תב"ר
export const getTabarDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Fetching documents for tabar ID: ${id}`);
    
    // בדיקה אם התב"ר קיים
    const tabarCheck = await pool.query('SELECT tabar_number FROM tabarim WHERE id = $1', [id]);
    if (tabarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'תב"ר לא נמצא' });
    }
    
    const tabarNumber = tabarCheck.rows[0].tabar_number;
    
    // שליפת מסמכים לפי tabar_number
    const result = await pool.query(
      `SELECT * FROM project_documents 
       WHERE tabar_number = $1 
       ORDER BY created_at DESC`,
      [tabarNumber]
    );
    
    console.log(`📄 Found ${result.rows.length} documents for tabar ${tabarNumber}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching tabar documents:', error);
    res.status(500).json({ error: 'שגיאה בטעינת מסמכי התב"ר', details: error.message });
  }
};

// יצירת מסמך חדש לתב"ר
export const createTabarDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, date, supplier, amount, reported } = req.body;
    
    console.log(`📝 Creating new document for tabar ID: ${id}`);
    console.log('Request body:', req.body);
    
    // בדיקה אם התב"ר קיים וקבלת tabar_number
    const tabarCheck = await pool.query('SELECT tabar_number FROM tabarim WHERE id = $1', [id]);
    if (tabarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'תב"ר לא נמצא' });
    }
    
    const tabarNumber = tabarCheck.rows[0].tabar_number;
    console.log(`📋 Found tabar_number: ${tabarNumber}`);
    
    // טיפול בקובץ שהועלה
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      console.log(`📎 File uploaded: ${fileUrl}`);
    }
    
    // יצירת המסמך עם השדות הנכונים
    const result = await pool.query(
      `INSERT INTO project_documents (
        tabar_number, type, name, title, date, supplier, amount, reported, file_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        tabarNumber,
        type,
        title,
        title,
        date,
        supplier || null,
        amount ? parseFloat(amount) : null,
        reported === 'true' || reported === true,
        fileUrl
      ]
    );
    
    console.log(`✅ Document created successfully for tabar ${tabarNumber}:`, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating tabar document:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'שגיאה ביצירת המסמך', details: error.message });
  }
};

// עדכון מסמך תב"ר
export const updateTabarDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { type, title, date, supplier, amount, reported } = req.body;
    
    console.log(`📝 Updating document ID: ${documentId}`);
    
    // בדיקה אם המסמך קיים
    const docCheck = await pool.query('SELECT * FROM project_documents WHERE id = $1', [documentId]);
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'מסמך לא נמצא' });
    }
    
    // טיפול בקובץ חדש אם הועלה
    let fileUrl = docCheck.rows[0].file_url;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      console.log(`📎 New file uploaded: ${fileUrl}`);
    }
    
    // עדכון המסמך
    const result = await pool.query(
      `UPDATE project_documents 
       SET type = $1, title = $2, date = $3, supplier = $4, amount = $5, 
           reported = $6, file_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [
        type,
        title,
        date,
        supplier,
        amount ? parseFloat(amount) : null,
        reported === 'true' || reported === true,
        fileUrl,
        documentId
      ]
    );
    
    console.log(`✅ Document ${documentId} updated successfully`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating tabar document:', error);
    res.status(500).json({ error: 'שגיאה בעדכון המסמך', details: error.message });
  }
};

// מחיקת מסמך תב"ר
export const deleteTabarDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    console.log(`🗑️ Deleting document ID: ${documentId}`);
    
    // בדיקה אם המסמך קיים וקבלת נתיב הקובץ
    const docCheck = await pool.query('SELECT file_url FROM project_documents WHERE id = $1', [documentId]);
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'מסמך לא נמצא' });
    }
    
    const fileUrl = docCheck.rows[0].file_url;
    
    // מחיקה ממסד הנתונים
    await pool.query('DELETE FROM project_documents WHERE id = $1', [documentId]);
    
    // מחיקת הקובץ מהדיסק אם קיים
    if (fileUrl) {
      try {
        const filePath = path.join(process.cwd(), fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ File deleted: ${filePath}`);
        }
      } catch (fileError) {
        console.warn('⚠️ Could not delete file:', fileError.message);
      }
    }
    
    console.log(`✅ Document ${documentId} deleted successfully`);
    res.json({ message: 'המסמך נמחק בהצלחה' });
  } catch (error) {
    console.error('❌ Error deleting tabar document:', error);
    res.status(500).json({ error: 'שגיאה במחיקת המסמך', details: error.message });
  }
};
