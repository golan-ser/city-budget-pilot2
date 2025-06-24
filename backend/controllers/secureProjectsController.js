import db from '../db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// שליפת כל הפרויקטים של הרשות
export const getAllProjects = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    console.log(`🔄 Fetching projects for tenant ${tenantId}...`);
    
    // שאילתה מאובטחת עם סינון לפי tenant_id
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
    console.log(`📊 Found ${result.rows.length} projects for tenant ${tenantId}`);
    
    const projects = result.rows.map(tabar => {
      const utilizedAmount = parseFloat(tabar.utilized_amount || 0);
      const totalBudget = parseFloat(tabar.total_authorized || 0);
      const utilizationPercentage = parseInt(tabar.utilization_percentage_calculated || 0);
      
      return {
        id: tabar.id,
        name: tabar.name,
        type: 'תב"ר',
        department: tabar.department || tabar.ministry,
        tabar_number: tabar.tabar_number,
        year: tabar.year,
        total_budget: totalBudget,
        used_budget: utilizedAmount,
        utilization_percent: utilizationPercentage,
        status: tabar.status,
        start_date: tabar.open_date,
        end_date: tabar.close_date,
        description: tabar.description || '',
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

    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// שליפת פרויקט לפי ID
export const getProjectById = async (req, res) => {
  try {
    const tabarId = req.params.id;
    const tenantId = req.user.tenant_id;
    
    console.log(`🔍 Fetching project ${tabarId} for tenant ${tenantId}...`);
    
    // שאילתה מאובטחת עם סינון לפי tenant_id
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
    
    // שליפת מקורות מימון (מסונן לפי tenant_id)
    const fundingQuery = 'SELECT * FROM tabar_funding WHERE tabar_id = $1 AND tenant_id = $2';
    const fundingResult = await db.query(fundingQuery, [tabarId, tenantId]);
    
    // שליפת מסמכים (מסונן לפי tenant_id)
    const documentsQuery = 'SELECT * FROM tabar_documents WHERE tabar_id = $1 AND tenant_id = $2';
    const documentsResult = await db.query(documentsQuery, [tabarId, tenantId]);
    
    // שליפת עסקאות (מסונן לפי tenant_id)
    const transactionsQuery = `
      SELECT * FROM tabar_transactions 
      WHERE tabar_id = $1 AND tenant_id = $2
      ORDER BY transaction_date DESC
    `;
    const transactionsResult = await db.query(transactionsQuery, [tabarId, tenantId]);
    
    const utilizedAmount = parseFloat(tabar.utilized_amount || 0);
    const totalBudget = parseFloat(tabar.total_authorized || 0);
    const utilizationPercentage = parseInt(tabar.utilization_percentage_calculated || 0);
    
    const fullProject = {
      id: tabar.id,
      name: tabar.name,
      tabar_number: tabar.tabar_number,
      type: 'תב"ר',
      department: tabar.department || tabar.ministry,
      year: tabar.year,
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
    
    res.json(fullProject);
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// יצירת פרויקט חדש
export const createProject = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const projectData = req.body;
    
    // הוספת tenant_id לנתונים
    projectData.tenant_id = tenantId;
    
    const query = `
      INSERT INTO tabarim (
        name, year, ministry, department, total_authorized, municipal_participation,
        additional_funders, open_date, close_date, permission_number, status, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      projectData.name,
      projectData.year,
      projectData.ministry,
      projectData.department,
      projectData.total_authorized,
      projectData.municipal_participation,
      projectData.additional_funders,
      projectData.open_date,
      projectData.close_date,
      projectData.permission_number,
      projectData.status || 'פעיל',
      tenantId
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// מחיקת פרויקט
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const tenantId = req.user.tenant_id;
    
    // בדיקה שהפרויקט שייך לרשות
    const checkQuery = 'SELECT id FROM tabarim WHERE id = $1 AND tenant_id = $2';
    const checkResult = await db.query(checkQuery, [projectId, tenantId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // מחיקת הפרויקט
    const deleteQuery = 'DELETE FROM tabarim WHERE id = $1 AND tenant_id = $2';
    await db.query(deleteQuery, [projectId, tenantId]);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// חיפוש פרויקטים
export const searchProjects = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { q, year, ministry, status } = req.query;
    
    let query = 'SELECT * FROM tabarim WHERE tenant_id = $1';
    const params = [tenantId];
    let paramCount = 1;
    
    if (q) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR tabar_number::text ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }
    
    if (year) {
      paramCount++;
      query += ` AND year = $${paramCount}`;
      params.push(year);
    }
    
    if (ministry) {
      paramCount++;
      query += ` AND ministry ILIKE $${paramCount}`;
      params.push(`%${ministry}%`);
    }
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY tabar_number';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Error searching projects:', error);
    res.status(500).json({ error: 'Failed to search projects' });
  }
};