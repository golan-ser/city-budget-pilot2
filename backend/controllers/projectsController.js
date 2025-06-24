import db from '../db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export const getAllProjects = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    console.log(`🔄 Fetching projects for tenant ${tenantId} with precise utilization calculation...`);
    
    // 🔐 SECURITY: Query with tenant_id filtering
    const query = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.year,
        t.ministry,
        t.total_authorized,
        t.municipal_participation,
        t.additional_funders,
        t.open_date,
        t.close_date,
        t.status,
        t.permission_number,
        t.department,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
        COUNT(DISTINCT tt.id) as transaction_count,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 0
        ) as utilization_percentage_calculated
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id AND tt.tenant_id = $1
      WHERE t.tenant_id = $1
      GROUP BY t.id, t.tabar_number, t.name, t.year, t.ministry, t.total_authorized, 
               t.municipal_participation, t.additional_funders, t.open_date, t.close_date, 
               t.status, t.permission_number, t.department
      ORDER BY t.tabar_number
    `;

    const result = await db.query(query, [tenantId]);
    console.log(`📊 Found ${result.rows.length} tabarim/projects`);
    
    const projects = result.rows.map(tabar => {
      const utilizedAmount = parseFloat(tabar.utilized_amount || 0);
      const totalBudget = parseFloat(tabar.total_authorized || 0);
      const utilizationPercentage = parseInt(tabar.utilization_percentage_calculated || 0);
      
      console.log(`📋 Tabar ${tabar.tabar_number}: ${utilizedAmount} / ${totalBudget} = ${utilizationPercentage}%`);
      
      return {
        id: tabar.id,
        name: tabar.name,
        type: 'תב"ר',
        department: tabar.department || tabar.ministry,
        tabar_number: tabar.tabar_number,
        year: tabar.year,
        // Frontend expects these specific field names:
        total_budget: totalBudget,
        used_budget: utilizedAmount,
        utilization_percent: utilizationPercentage,
        status: tabar.status,
        start_date: tabar.open_date,
        end_date: tabar.close_date,
        description: tabar.description || '',
        // Legacy compatibility:
        tabar: {
          year: tabar.year,
          number: tabar.tabar_number,
          name: tabar.name,
          budget: tabar.total_authorized,
          municipal_participation: tabar.municipal_participation,
          additional_funders: tabar.additional_funders,
          permission_number: tabar.permission_number,
          status: tabar.status
        },
        budget: totalBudget,
        utilized: utilizedAmount,
        utilization_percentage: utilizationPercentage,
        milestone_count: 0,
        report_count: 0,
        last_report_date: null,
        transaction_count: parseInt(tabar.transaction_count || 0),
        created_at: tabar.open_date
      };
    });

    console.log(`✅ Returning ${projects.length} projects with accurate utilization data`);
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const tabarId = req.params.id;
    console.log(`🔍 Fetching project ${tabarId} for tenant ${tenantId} with precise data...`);
    
    // 🔐 SECURITY: Query with tenant_id filtering
    const tabarQuery = `
      SELECT 
        t.*,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
        COUNT(DISTINCT tt.id) as transaction_count,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 0
        ) as utilization_percentage_calculated
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id AND tt.tenant_id = $2
      WHERE t.id = $1 AND t.tenant_id = $2
      GROUP BY t.id
    `;
    
    const tabarResult = await db.query(tabarQuery, [tabarId, tenantId]);
    
    if (tabarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const tabar = tabarResult.rows[0];
    
    // 🔐 SECURITY: All related queries with tenant_id filtering
    const fundingQuery = 'SELECT * FROM tabar_funding WHERE tabar_id = $1 AND tenant_id = $2';
    const fundingResult = await db.query(fundingQuery, [tabarId, tenantId]);
    
    const documentsQuery = 'SELECT * FROM tabar_documents WHERE tabar_id = $1 AND tenant_id = $2';
    const documentsResult = await db.query(documentsQuery, [tabarId, tenantId]);
    
    const transactionsQuery = `
      SELECT * FROM tabar_transactions 
      WHERE tabar_id = $1 AND tenant_id = $2
      ORDER BY transaction_date DESC
    `;
    const transactionsResult = await db.query(transactionsQuery, [tabarId, tenantId]);
    
    const utilizedAmount = parseFloat(tabar.utilized_amount || 0);
    const totalBudget = parseFloat(tabar.total_authorized || 0);
    const utilizationPercentage = parseInt(tabar.utilization_percentage_calculated || 0);
    
    console.log(`📊 Project ${tabarId} utilization: ${utilizedAmount} / ${totalBudget} = ${utilizationPercentage}%`);
    
    // בניית האובייקט המלא - עם שמות שדות שמתאימים לפרונטאנד
    const fullProject = {
      id: tabar.id,
      name: tabar.name,
      tabar_number: tabar.tabar_number,
      type: 'תב"ר',
      department: tabar.department || tabar.ministry,
      year: tabar.year,
      // Frontend expects these field names:
      total_budget: totalBudget,
      used_budget: utilizedAmount,
      remaining_budget: totalBudget - utilizedAmount,
      utilization_percent: utilizationPercentage,
      status: tabar.status,
      start_date: tabar.open_date,
      end_date: tabar.close_date,
      description: tabar.description || '',
      milestones: [],
      reports: [],
      contacts: [],
      funding_sources: fundingResult.rows || [],
      documents: documentsResult.rows || [],
      // Legacy fields for backward compatibility:
      budget: totalBudget,
      utilized: utilizedAmount,
      utilization_percentage: utilizationPercentage,
      created_at: tabar.open_date,
      transactions: transactionsResult.rows,
      transaction_count: parseInt(tabar.transaction_count || 0),
      tabar: {
        id: tabar.id,
        year: tabar.year,
        number: tabar.tabar_number,
        name: tabar.name,
        budget: tabar.total_authorized,
        municipal_participation: tabar.municipal_participation,
        additional_funders: tabar.additional_funders,
        open_date: tabar.open_date,
        close_date: tabar.close_date,
        permission_number: tabar.permission_number,
        status: tabar.status,
        ministry: tabar.ministry
      }
    };
    
    console.log(`✅ Returning project ${tabarId} with accurate financial data`);
    res.json(fullProject);
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { name, type, department_id, tabar_id, tabar_number, start_date, end_date, budget_amount } = req.body;
    
    // 🔐 SECURITY: Always set tenant_id from authenticated user (ignore client input)
    const result = await db.query(
      'INSERT INTO projects (name, type, department_id, tabar_id, tabar_number, start_date, end_date, budget_amount, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, type, department_id, tabar_id, tabar_number, start_date, end_date, budget_amount, tenantId]
    );
    
    console.log(`✅ Created project for tenant ${tenantId}:`, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    const { name, type, department_id, tabar_id, tabar_number, start_date, end_date, budget_amount, status } = req.body;
    
    // 🔐 SECURITY: Update only projects belonging to user's tenant
    const result = await db.query(
      'UPDATE projects SET name = $1, type = $2, department_id = $3, tabar_id = $4, tabar_number = $5, start_date = $6, end_date = $7, budget_amount = $8, status = $9 WHERE id = $10 AND tenant_id = $11 RETURNING *',
      [name, type, department_id, tabar_id, tabar_number, start_date, end_date, budget_amount, status, id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    console.log(`✅ Updated project ${id} for tenant ${tenantId}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    
    // 🔐 SECURITY: Delete only projects belonging to user's tenant
    const result = await db.query('DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id', [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    console.log(`✅ Deleted project ${id} for tenant ${tenantId}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// === פונקציות ניהול פרויקטים מתקדמות ===

// שליפת אבני דרך לפרויקט
export const getProjectMilestones = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM milestones WHERE project_id = $1 AND tenant_id = $2 ORDER BY due_date ASC',
      [id, tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching project milestones:', error);
    res.status(500).json({ error: 'Failed to fetch project milestones' });
  }
};

// שליפת מסמכים לפרויקט
export const getProjectDocuments = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM project_documents WHERE project_id = $1 AND tenant_id = $2 ORDER BY upload_date DESC',
      [id, tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching project documents:', error);
    res.status(500).json({ error: 'Failed to fetch project documents' });
  }
};

// שליפת דיווחי ביצוע לפרויקט
export const getProjectExecutionReports = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM execution_reports WHERE project_id = $1 AND tenant_id = $2 ORDER BY report_date DESC',
      [id, tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching project execution reports:', error);
    res.status(500).json({ error: 'Failed to fetch project execution reports' });
  }
};

// שליפת גורמי מימון לפרויקט
export const getProjectFunding = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM funding_sources WHERE project_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching project funding:', error);
    res.status(500).json({ error: 'Failed to fetch project funding' });
  }
};

// יצירת פרויקט מתב"ר קיים
export const createProjectFromTabar = async (req, res) => {
  try {
    const { tabar_id, name, description, start_date, end_date, managers } = req.body;
    
    // בדיקה שהתב"ר קיים
    const tabarCheck = await db.query('SELECT * FROM tabarim WHERE id = $1', [tabar_id]);
    if (tabarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tabar not found' });
    }
    
    const tabar = tabarCheck.rows[0];
    
    // יצירת הפרויקט
    const result = await db.query(
      `INSERT INTO projects (name, type, tabar_id, start_date, end_date, budget_amount, description, managers, status) 
       VALUES ($1, 'תבר', $2, $3, $4, $5, $6, $7, 'פעיל') RETURNING *`,
      [name || tabar.name, tabar_id, start_date, end_date, tabar.total_authorized, description, managers]
    );
    
    const newProject = result.rows[0];
    const projectId = newProject.id;
    
    // העתקת מסמכים מהתב"ר לפרויקט החדש
    try {
      const tabarDocuments = await db.query(
        'SELECT * FROM project_documents WHERE tabar_number = $1',
        [tabar.tabar_number]
      );
      
      console.log(`📋 Found ${tabarDocuments.rows.length} documents to copy from tabar ${tabar.tabar_number}`);
      
      // העתקת כל מסמך לפרויקט החדש
      for (const doc of tabarDocuments.rows) {
        await db.query(
          `INSERT INTO project_documents (project_id, tabar_number, name, title, type, date, supplier, amount, reported, file_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            projectId, // project_id החדש
            doc.tabar_number,
            doc.name,
            doc.title,
            doc.type,
            doc.date,
            doc.supplier,
            doc.amount,
            doc.reported,
            doc.file_url
          ]
        );
      }
      
      console.log(`✅ Copied ${tabarDocuments.rows.length} documents to project ${projectId}`);
    } catch (docError) {
      console.error('⚠️ Error copying documents:', docError);
      // לא נעצור את התהליך בגלל שגיאה במסמכים
    }
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('❌ Error creating project from tabar:', error);
    res.status(500).json({ error: 'Failed to create project from tabar' });
  }
};

// עדכון סטטוס פרויקט
export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const result = await db.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // רישום התראה על שינוי סטטוס
    if (notes) {
      await db.query(
        'INSERT INTO alerts (project_id, message, alert_date, alert_type) VALUES ($1, $2, NOW(), $3)',
        [id, `סטטוס פרויקט שונה ל: ${status}. ${notes}`, 'status_change']
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};

// סיכום פיננסי מפורט לפרויקט
export const getProjectFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    // שליפת נתוני התב"ר הקשור
    const tabarQuery = `
      SELECT t.*, 
             COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as total_spent,
             COUNT(tt.id) as transaction_count
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const tabarResult = await db.query(tabarQuery, [id]);
    if (tabarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const tabar = tabarResult.rows[0];
    
    // שליפת דיווחי ביצוע
    const executionReports = await db.query(
      'SELECT SUM(amount) as total_reported FROM execution_reports WHERE project_id = $1 AND status = $2',
      [id, 'אושר']
    );
    
    // שליפת מקורות מימון
    const funding = await db.query(
      'SELECT * FROM tabar_funding WHERE tabar_id = $1',
      [id]
    );
    
    const summary = {
      project_id: id,
      total_budget: parseFloat(tabar.total_authorized || 0),
      municipal_participation: parseFloat(tabar.municipal_participation || 0),
      external_funding: parseFloat(tabar.total_authorized || 0) - parseFloat(tabar.municipal_participation || 0),
      total_spent: parseFloat(tabar.total_spent || 0),
      total_reported: parseFloat(executionReports.rows[0]?.total_reported || 0),
      remaining_budget: parseFloat(tabar.total_authorized || 0) - parseFloat(tabar.total_spent || 0),
      utilization_percentage: tabar.total_authorized > 0 ? 
        Math.round((parseFloat(tabar.total_spent || 0) / parseFloat(tabar.total_authorized)) * 100) : 0,
      transaction_count: parseInt(tabar.transaction_count || 0),
      funding_sources: funding.rows,
      last_updated: new Date()
    };
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching project financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch project financial summary' });
  }
};

// חיפוש פרויקטים
export const searchProjects = async (req, res) => {
  try {
    const { q, status, ministry, year, min_budget, max_budget } = req.query;
    
    let query = `
      SELECT t.*, 
             COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE 1=1
    `;
    const params = [];
    
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (t.name ILIKE $${params.length} OR t.ministry ILIKE $${params.length} OR t.department ILIKE $${params.length})`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    
    if (ministry) {
      params.push(`%${ministry}%`);
      query += ` AND t.ministry ILIKE $${params.length}`;
    }
    
    if (year) {
      params.push(year);
      query += ` AND t.year = $${params.length}`;
    }
    
    if (min_budget) {
      params.push(min_budget);
      query += ` AND t.total_authorized >= $${params.length}`;
    }
    
    if (max_budget) {
      params.push(max_budget);
      query += ` AND t.total_authorized <= $${params.length}`;
    }
    
    query += ` GROUP BY t.id ORDER BY t.tabar_number DESC LIMIT 50`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error searching projects:', error);
    res.status(500).json({ error: 'Failed to search projects' });
  }
};

// חישובים חכמים לפרויקט - התראות ותובנות
export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧠 Calculating smart analytics for project ${id}...`);
    
    // שליפת נתוני הפרויקט הבסיסיים
    const projectQuery = `
      SELECT t.*, 
             COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
             COUNT(DISTINCT tt.id) as transaction_count
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const projectResult = await db.query(projectQuery, [id]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // חישוב אחוז ניצול
    const totalBudget = parseFloat(project.total_authorized || 0);
    const utilizedAmount = parseFloat(project.utilized_amount || 0);
    const utilizationPercentage = totalBudget > 0 ? (utilizedAmount / totalBudget) * 100 : 0;
    
    // בדיקת תאריך דיווח אחרון
    const lastReportQuery = `
      SELECT MAX(report_date) as last_report_date
      FROM execution_reports 
      WHERE tabar_number = $1
    `;
    const lastReportResult = await db.query(lastReportQuery, [id]);
    const lastReportDate = lastReportResult.rows[0]?.last_report_date;
    
    // חישוב ימים מהדיווח האחרון
    let daysSinceLastReport = null;
    if (lastReportDate) {
      const today = new Date();
      const reportDate = new Date(lastReportDate);
      daysSinceLastReport = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
    }
    
    // שליפת מספר אבני דרך
    const milestonesQuery = 'SELECT COUNT(*) as count FROM milestones WHERE tabar_number = $1';
    const milestonesResult = await db.query(milestonesQuery, [id]);
    const milestonesCount = parseInt(milestonesResult.rows[0]?.count || 0);
    
    // שליפת מספר מסמכים
    const documentsQuery = 'SELECT COUNT(*) as count FROM project_documents WHERE tabar_number = $1';
    const documentsResult = await db.query(documentsQuery, [id]);
    const documentsCount = parseInt(documentsResult.rows[0]?.count || 0);
    
    // שליפת מספר דיווחי ביצוע
    const reportsQuery = 'SELECT COUNT(*) as count FROM execution_reports WHERE tabar_number = $1';
    const reportsResult = await db.query(reportsQuery, [id]);
    const reportsCount = parseInt(reportsResult.rows[0]?.count || 0);
    
    // יצירת התראות חכמות
    const alerts = [];
    
    // התראת ניצול תקציב
    if (utilizationPercentage >= 90) {
      alerts.push({
        type: 'budget_critical',
        level: 'error',
        title: 'ניצול תקציב קריטי',
        message: `נוצל ${utilizationPercentage.toFixed(1)}% מהתקציב - נדרש אישור להמשך`,
        icon: '🚨'
      });
    } else if (utilizationPercentage >= 65) {
      alerts.push({
        type: 'budget_warning',
        level: 'warning',
        title: 'ניצול תקציב גבוה',
        message: `נוצל ${utilizationPercentage.toFixed(1)}% מהתקציב - מומלץ לעקוב מקרוב`,
        icon: '⚠️'
      });
    }
    
    // התראת דיווח
    if (!lastReportDate) {
      alerts.push({
        type: 'no_reports',
        level: 'warning',
        title: 'לא דווח מעולם',
        message: 'הפרויקט לא קיבל דיווח ביצוע מעולם',
        icon: '📋'
      });
    } else if (daysSinceLastReport > 90) {
      alerts.push({
        type: 'report_overdue',
        level: 'warning',
        title: 'התראת דיווח',
        message: `הפרויקט לא קיבל דיווח כבר ${daysSinceLastReport} ימים`,
        icon: '📅'
      });
    }
    
    // התראת מסמכים חסרים
    if (documentsCount === 0) {
      alerts.push({
        type: 'no_documents',
        level: 'info',
        title: 'מסמכים חסרים',
        message: 'לא הועלו מסמכים תומכים לפרויקט',
        icon: '📄'
      });
    }
    
    // תובנות חיוביות
    const insights = [];
    
    if (utilizationPercentage > 0 && utilizationPercentage < 35) {
      insights.push({
        type: 'budget_healthy',
        level: 'success',
        title: 'סטטוס תקציב בריא',
        message: `נותרו ${(100 - utilizationPercentage).toFixed(1)}% מהתקציב - ביצוע מתון`,
        icon: '💚'
      });
    }
    
    if (reportsCount > 0) {
      insights.push({
        type: 'active_reporting',
        level: 'info',
        title: 'דיווח פעיל',
        message: `הפרויקט כולל ${reportsCount} דיווחי ביצוע`,
        icon: '📊'
      });
    }
    
    // סיכום אנליטיקה
    const analytics = {
      project_id: id,
      project_name: project.name,
      financial: {
        total_budget: totalBudget,
        utilized_amount: utilizedAmount,
        remaining_budget: totalBudget - utilizedAmount,
        utilization_percentage: parseFloat(utilizationPercentage.toFixed(1))
      },
      activity: {
        milestones_count: milestonesCount,
        documents_count: documentsCount,
        reports_count: reportsCount,
        transactions_count: parseInt(project.transaction_count || 0),
        last_report_date: lastReportDate,
        days_since_last_report: daysSinceLastReport
      },
      alerts: alerts,
      insights: insights,
      overall_health_score: calculateHealthScore(utilizationPercentage, daysSinceLastReport, reportsCount, documentsCount),
      generated_at: new Date()
    };
    
    console.log(`✅ Generated analytics for project ${id}: ${alerts.length} alerts, ${insights.length} insights`);
    res.json(analytics);
    
  } catch (error) {
    console.error('❌ Error calculating project analytics:', error);
    res.status(500).json({ error: 'Failed to calculate project analytics' });
  }
};

// פונקציה עזר לחישוב ציון בריאות פרויקט
function calculateHealthScore(utilization, daysSinceReport, reportsCount, documentsCount) {
  let score = 100;
  
  // ניכוי על ניצול יתר
  if (utilization > 90) score -= 30;
  else if (utilization > 65) score -= 10;
  
  // ניכוי על חוסר דיווח
  if (daysSinceReport === null) score -= 20;
  else if (daysSinceReport > 90) score -= 15;
  else if (daysSinceReport > 60) score -= 5;
  
  // ניכוי על חוסר פעילות
  if (reportsCount === 0) score -= 15;
  if (documentsCount === 0) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

// ייצוא PDF מקצועי לפרויקט
export const exportProjectPDF = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Generating PDF export for project ${id}...`);
    
    // שליפת כל נתוני הפרויקט
    const [projectResult, milestonesResult, documentsResult, reportsResult, analyticsData] = await Promise.all([
      // נתוני פרויקט בסיסיים
      db.query(`
        SELECT t.*, 
               COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount
        FROM tabarim t
        LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
        WHERE t.id = $1
        GROUP BY t.id
      `, [id]),
      
      // אבני דרך
      db.query('SELECT * FROM milestones WHERE tabar_number = $1 ORDER BY due_date', [id]),
      
      // מסמכים
      db.query('SELECT * FROM project_documents WHERE tabar_number = $1 ORDER BY upload_date DESC', [id]),
      
      // דיווחי ביצוע
      db.query('SELECT * FROM execution_reports WHERE tabar_number = $1 ORDER BY report_date DESC', [id]),
      
      // אנליטיקה
      getProjectAnalyticsData(id)
    ]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    const milestones = milestonesResult.rows;
    const documents = documentsResult.rows;
    const reports = reportsResult.rows;
    
    // חישובי תקציב
    const totalBudget = parseFloat(project.total_authorized || 0);
    const utilizedAmount = parseFloat(project.utilized_amount || 0);
    const remainingBudget = totalBudget - utilizedAmount;
    const utilizationPercentage = totalBudget > 0 ? (utilizedAmount / totalBudget) * 100 : 0;
    
    // פונקציה לעיצוב סכומים כספיים
    const formatMoney = (amount) => {
      return Number(amount).toLocaleString('he-IL');
    };

    // הכנת נתונים לתבנית
    const reportData = {
      project_name: project.name || 'פרויקט ללא שם',
      tabar_number: project.tabar_number || 'לא הוגדר',
      ministry: project.ministry || 'לא הוגדר',
      department: project.department || 'לא הוגדר',
      year: project.year || 'לא הוגדר',
      status: project.status || 'לא הוגדר',
      project_id: project.id || 'לא הוגדר',
      description: project.description || 'אין תיאור זמין',
      
      // סכומים מעוצבים
      approved_budget: totalBudget,
      used_budget: utilizedAmount,
      remaining: remainingBudget,
      approved_budget_formatted: formatMoney(totalBudget),
      used_budget_formatted: formatMoney(utilizedAmount),
      remaining_formatted: formatMoney(remainingBudget),
      utilization: utilizationPercentage.toFixed(0),
      
      // תאריכים
      generated_at: new Date().toLocaleDateString('he-IL'),
      system_version: '2.0',
      report_id: `RPT-${Date.now()}`,
      
      // נתונים מעובדים
      milestones: milestones.map(m => ({
        ...m,
        status_class: getStatusClass(m.status),
        due_date: m.due_date ? new Date(m.due_date).toLocaleDateString('he-IL') : 'לא הוגדר',
        progress: m.progress || 0,
        notes: m.notes || 'אין הערות'
      })),
      
      reports: reports.map(r => ({
        ...r,
        status_class: getStatusClass(r.status),
        report_date: r.report_date ? new Date(r.report_date).toLocaleDateString('he-IL') : 'לא הוגדר',
        amount_formatted: formatMoney(parseFloat(r.amount || 0)),
        report_type: r.report_type || 'דיווח כללי',
        notes: r.notes || 'אין הערות'
      })),
      
      documents: documents.map(d => ({
        ...d,
        status_class: getStatusClass(d.status),
        upload_date: d.upload_date ? new Date(d.upload_date).toLocaleDateString('he-IL') : 'לא הוגדר',
        name: d.name || d.document_name || 'מסמך ללא שם',
        type: d.type || d.document_type || 'לא הוגדר',
        file_size: d.file_size || 'לא זמין'
      })),
      
      alerts: (analyticsData?.alerts || []).map(alert => ({
        ...alert,
        type: alert.type || 'info'
      })),
      
      // סטטיסטיקות
      milestones_count: milestones.length,
      completed_milestones: milestones.filter(m => m.status === 'הושלם' || m.status === 'completed').length,
      reports_count: reports.length,
      documents_count: documents.length
    };
    
    // קריאת תבנית HTML
    const templatePath = path.join(process.cwd(), 'templates', 'project-report.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // החלפת משתנים בתבנית - משתמש ב-Handlebars style
    Object.keys(reportData).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = reportData[key];
      if (typeof value === 'string' || typeof value === 'number') {
        htmlTemplate = htmlTemplate.replace(regex, value);
      }
    });
    
    // החלפת רשימות מותנות
    if (reportData.milestones.length > 0) {
      htmlTemplate = htmlTemplate.replace(/\{\{#if milestones\.length\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, '<!--');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '-->');
      
      let milestonesHtml = '';
      reportData.milestones.forEach(milestone => {
        milestonesHtml += `
          <tr>
            <td class="rtl-text"><strong>${milestone.title || milestone.name || 'אבן דרך ללא שם'}</strong></td>
            <td class="date-column">${milestone.due_date}</td>
            <td><span class="status-badge status-${milestone.status_class}">${milestone.status || 'לא הוגדר'}</span></td>
            <td>
              ${milestone.progress}%
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${milestone.progress}%"></div>
              </div>
            </td>
            <td class="rtl-text">${milestone.notes}</td>
          </tr>
        `;
      });
      htmlTemplate = htmlTemplate.replace(/\{\{#each milestones\}\}[\s\S]*?\{\{\/each\}\}/g, milestonesHtml);
    } else {
      htmlTemplate = htmlTemplate.replace(/\{\{#if milestones\.length\}\}[\s\S]*?\{\{else\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '');
    }
    
    // החלפת דיווחים
    if (reportData.reports.length > 0) {
      htmlTemplate = htmlTemplate.replace(/\{\{#if reports\.length\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, '<!--');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '-->');
      
      let reportsHtml = '';
      reportData.reports.forEach(report => {
        reportsHtml += `
          <tr>
            <td class="date-column">${report.report_date}</td>
            <td class="money-column">₪${report.amount_formatted}</td>
            <td><span class="status-badge status-${report.status_class}">${report.status || 'לא הוגדר'}</span></td>
            <td class="rtl-text">${report.report_type}</td>
            <td class="rtl-text">${report.notes}</td>
          </tr>
        `;
      });
      htmlTemplate = htmlTemplate.replace(/\{\{#each reports\}\}[\s\S]*?\{\{\/each\}\}/g, reportsHtml);
    } else {
      htmlTemplate = htmlTemplate.replace(/\{\{#if reports\.length\}\}[\s\S]*?\{\{else\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '');
    }
    
    // החלפת מסמכים
    if (reportData.documents.length > 0) {
      htmlTemplate = htmlTemplate.replace(/\{\{#if documents\.length\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, '<!--');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '-->');
      
      let documentsHtml = '';
      reportData.documents.forEach(document => {
        documentsHtml += `
          <tr>
            <td class="rtl-text"><strong>${document.name}</strong></td>
            <td class="rtl-text">${document.type}</td>
            <td class="date-column">${document.upload_date}</td>
            <td><span class="status-badge status-${document.status_class}">${document.status || 'לא הוגדר'}</span></td>
            <td>${document.file_size}</td>
          </tr>
        `;
      });
      htmlTemplate = htmlTemplate.replace(/\{\{#each documents\}\}[\s\S]*?\{\{\/each\}\}/g, documentsHtml);
    } else {
      htmlTemplate = htmlTemplate.replace(/\{\{#if documents\.length\}\}[\s\S]*?\{\{else\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '');
    }
    
    // החלפת התראות
    if (reportData.alerts.length > 0) {
      htmlTemplate = htmlTemplate.replace(/\{\{#if alerts\.length\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, '<!--');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '-->');
      
      let alertsHtml = '';
      reportData.alerts.forEach(alert => {
        alertsHtml += `
          <div class="alert alert-${alert.type}">
            <strong>${alert.title}:</strong> <span class="rtl-text">${alert.message}</span>
          </div>
        `;
      });
      htmlTemplate = htmlTemplate.replace(/\{\{#each alerts\}\}[\s\S]*?\{\{\/each\}\}/g, alertsHtml);
    } else {
      htmlTemplate = htmlTemplate.replace(/\{\{#if alerts\.length\}\}[\s\S]*?\{\{else\}\}/g, '');
      htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '');
    }
    
    // יצירת PDF עם Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // הגדרת תוכן HTML
    await page.setContent(htmlTemplate, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // יצירת PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    // הגדרת headers ושליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="project-${reportData.tabar_number}-report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log(`✅ PDF report generated successfully for project ${id}`);
    
  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
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

// פונקציה עזר לשליפת נתוני אנליטיקה (ללא response)
async function getProjectAnalyticsData(projectId) {
  try {
    // כאן נשכפל את הלוגיקה מ-getProjectAnalytics אבל נחזיר את הנתונים ישירות
    const projectQuery = `
      SELECT t.*, 
             COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const projectResult = await db.query(projectQuery, [projectId]);
    if (projectResult.rows.length === 0) return null;
    
    const project = projectResult.rows[0];
    const totalBudget = parseFloat(project.total_authorized || 0);
    const utilizedAmount = parseFloat(project.utilized_amount || 0);
    const utilizationPercentage = totalBudget > 0 ? (utilizedAmount / totalBudget) * 100 : 0;
    
    const alerts = [];
    const insights = [];
    
    if (utilizationPercentage >= 90) {
      alerts.push({
        title: 'ניצול תקציב קריטי',
        message: `נוצל ${utilizationPercentage.toFixed(1)}% מהתקציב`
      });
    }
    
    return { alerts, insights };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}
