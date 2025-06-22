import db from '../db.js';
import puppeteer from 'puppeteer';

// פונקציה לחישוב KPI cards
export const getDashboardKPIs = async (req, res) => {
  try {
    console.log('🔄 Fetching Dashboard KPIs...');
    
    // תקציב כולל - סכום כל התב"רים הפעילים (נפתח, אושר, סגור)
    const totalBudgetQuery = `
      SELECT COALESCE(SUM(total_authorized), 0) as total_budget
      FROM tabarim
      WHERE status IN ('נפתח', 'אושר', 'סגור', 'פעיל')
    `;
    
    // תקציב מנוצל - סכום כל ההוצאות בפרויקטים הפעילים
    const utilizedBudgetQuery = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN tt.direction = 'חיוב' THEN tt.amount 
            ELSE 0 
          END
        ), 0) as utilized_budget
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.status IN ('נפתח', 'אושר', 'סגור', 'פעיל')
    `;
    
    // הכנסות חודשיות - מבוסס על tabar_transactions (כניסות)
    const monthlyIncomeQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as monthly_income,
        COUNT(*) as reports_count
      FROM tabar_transactions 
      WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND direction = 'כניסה'
      AND status = 'שולם'
    `;
    
    // הכנסות חודש קודם - לחישוב אחוז שינוי
    const prevMonthIncomeQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as prev_month_income
      FROM tabar_transactions 
      WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND transaction_date < DATE_TRUNC('month', CURRENT_DATE)
      AND direction = 'כניסה'
      AND status = 'שולם'
    `;
    
    // השלמת פרויקטים - אחוז פרויקטים שהסתיימו
    const projectCompletionQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'סגור' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'נפתח' OR status = 'פעיל' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'אושר' THEN 1 END) as approved_projects,
        COUNT(CASE WHEN status = 'מושהה' THEN 1 END) as paused_projects
      FROM tabarim
    `;
    
    const [totalBudgetResult, utilizedBudgetResult, monthlyIncomeResult, 
           prevMonthIncomeResult, projectCompletionResult] = await Promise.all([
      db.query(totalBudgetQuery),
      db.query(utilizedBudgetQuery),
      db.query(monthlyIncomeQuery),
      db.query(prevMonthIncomeQuery),
      db.query(projectCompletionQuery)
    ]);
    
    // Debug logging - let's see what's actually in the database
    const debugQuery = `
      SELECT tabar_number, name, status, total_authorized 
      FROM tabarim 
      WHERE status IN ('נפתח', 'אושר', 'סגור', 'פעיל')
      ORDER BY tabar_number
    `;
    const debugResult = await db.query(debugQuery);
    console.log('🔍 Active Tabarim in DB:');
    let manualSum = 0;
    debugResult.rows.forEach(row => {
      console.log(`  - ${row.tabar_number}: ${row.name} = ₪${row.total_authorized}`);
      manualSum += parseFloat(row.total_authorized || 0);
    });
    console.log(`🔍 Manual Sum Calculation: ₪${manualSum}`);
    console.log('🔍 Total Budget Query Result:', totalBudgetResult.rows[0]);
    console.log('🔍 Utilized Budget Query Result:', utilizedBudgetResult.rows[0]);
    
    const totalBudget = parseFloat(totalBudgetResult.rows[0].total_budget || 0);
    const utilizedBudget = parseFloat(utilizedBudgetResult.rows[0].utilized_budget || 0);
    const monthlyIncome = parseFloat(monthlyIncomeResult.rows[0].monthly_income || 0);
    const prevMonthIncome = parseFloat(prevMonthIncomeResult.rows[0].prev_month_income || 0);
    
    const stats = projectCompletionResult.rows[0];
    const totalProjects = parseInt(stats.total_projects || 0);
    const completedProjects = parseInt(stats.completed_projects || 0);
    const completionPercentage = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
    
    // חישוב אחוז שינוי הכנסות
    const incomeChangePercent = prevMonthIncome > 0 
      ? Math.round(((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100)
      : 0;
    
    // חישוב אחוז ניצול תקציב
    const utilizationPercent = totalBudget > 0 
      ? Math.round((utilizedBudget / totalBudget) * 100)
      : 0;
    
    const kpis = {
      totalBudget: {
        value: totalBudget,
        formatted: `₪${totalBudget.toLocaleString('he-IL')}`,
        change: '+8%', // מהרבעון הקודם - יכול להיות דינמי
        changeType: 'positive'
      },
      utilizedBudget: {
        value: utilizedBudget,
        formatted: `₪${utilizedBudget.toLocaleString('he-IL')}`,
        percentage: utilizationPercent,
        change: utilizationPercent > 100 ? 'חריגה מהתקציב' : '-5%',
        changeType: utilizationPercent > 100 ? 'negative' : 'negative'
      },
      monthlyIncome: {
        value: monthlyIncome,
        formatted: `₪${monthlyIncome.toLocaleString('he-IL')}`,
        change: `${incomeChangePercent >= 0 ? '+' : ''}${incomeChangePercent}%`,
        changeType: incomeChangePercent >= 0 ? 'positive' : 'negative',
        reports_count: monthlyIncomeResult.rows[0].reports_count
      },
      projectCompletion: {
        value: completionPercentage,
        formatted: `${completionPercentage}%`,
        change: '+15%', // מהחודש הקודם - יכול להיות דינמי
        changeType: 'positive',
        breakdown: {
          total: totalProjects,
          completed: completedProjects,
          active: parseInt(stats.active_projects || 0),
          paused: parseInt(stats.paused_projects || 0)
        }
      }
    };
    
    console.log('✅ Dashboard KPIs calculated successfully');
    res.json(kpis);
    
  } catch (error) {
    console.error('❌ Error fetching dashboard KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard KPIs' });
  }
};

// פונקציה לסטטוס פרויקטים (Pie Chart)
export const getProjectStatusStats = async (req, res) => {
  try {
    console.log('🔄 Fetching project status statistics...');
    
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_authorized), 0) as total_budget
      FROM tabarim
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await db.query(query);
    
    const statusStats = result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      budget: parseFloat(row.total_budget),
      formatted_budget: `₪${parseFloat(row.total_budget).toLocaleString('he-IL')}`
    }));
    
    console.log('✅ Project status stats fetched successfully');
    res.json(statusStats);
    
  } catch (error) {
    console.error('❌ Error fetching project status stats:', error);
    res.status(500).json({ error: 'Failed to fetch project status stats' });
  }
};

// פונקציה להתראות חכמות
export const getSmartAlerts = async (req, res) => {
  try {
    console.log('🔄 Generating smart alerts...');
    
    const alerts = [];
    
    // התראה: חוסר בדיווח - פרויקטים ללא תנועות במעל 60 יום
    const noReportsQuery = `
      SELECT t.id, t.name, t.tabar_number
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.status IN ('נפתח', 'אושר')
      AND (tt.transaction_date IS NULL OR tt.transaction_date < CURRENT_DATE - INTERVAL '60 days')
      GROUP BY t.id, t.name, t.tabar_number
    `;
    
    // התראה: ניצול יתר - פרויקטים שחורגים מהתקציב
    const overBudgetQuery = `
      SELECT 
        t.id, t.name, t.tabar_number, t.total_authorized,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.status IN ('נפתח', 'אושר', 'סגור')
      GROUP BY t.id, t.name, t.tabar_number, t.total_authorized
      HAVING COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) > t.total_authorized
    `;
    
    // התראה: ללא מסמכי אישור
    const noPermitsQuery = `
      SELECT t.id, t.name, t.tabar_number
      FROM tabarim t
      LEFT JOIN tabar_permissions tp ON t.id = tp.tabar_id
      WHERE t.status IN ('נפתח', 'אושר')
      AND tp.id IS NULL
    `;
    
    // התראה: חשבוניות לא שולמו
    const unpaidInvoicesQuery = `
      SELECT 
        t.name, t.tabar_number,
        COUNT(tt.id) as unpaid_count,
        SUM(tt.amount) as unpaid_amount
      FROM tabarim t
      JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE tt.direction = 'חיוב'
      AND tt.status = 'לא שולם'
      AND t.status IN ('נפתח', 'אושר')
      GROUP BY t.id, t.name, t.tabar_number
      HAVING COUNT(tt.id) > 0
    `;
    
    const [noReportsResult, overBudgetResult, noPermitsResult, unpaidInvoicesResult] = await Promise.all([
      db.query(noReportsQuery),
      db.query(overBudgetQuery),
      db.query(noPermitsQuery),
      db.query(unpaidInvoicesQuery)
    ]);
    
    // בניית התראות
    if (noReportsResult.rows.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '🔶',
        title: 'חוסר בדיווח',
        message: `${noReportsResult.rows.length} פרויקטים לא עודכנו מעל 60 יום`,
        count: noReportsResult.rows.length,
        action: 'עבור לדוחות',
        projects: noReportsResult.rows
      });
    }
    
    if (overBudgetResult.rows.length > 0) {
      alerts.push({
        type: 'danger',
        icon: '🔴',
        title: 'חריגה מתקציב',
        message: `${overBudgetResult.rows.length} פרויקטים חורגים מהתקציב המאושר`,
        count: overBudgetResult.rows.length,
        action: 'בדוק חריגות',
        projects: overBudgetResult.rows
      });
    }
    
    if (noPermitsResult.rows.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '📋',
        title: 'ללא אישורים',
        message: `${noPermitsResult.rows.length} פרויקטים ללא מסמכי אישור`,
        count: noPermitsResult.rows.length,
        action: 'עבור לאישורים',
        projects: noPermitsResult.rows
      });
    }
    
    if (unpaidInvoicesResult.rows.length > 0) {
      const totalUnpaid = unpaidInvoicesResult.rows.reduce((sum, row) => sum + parseFloat(row.unpaid_amount), 0);
      alerts.push({
        type: 'info',
        icon: '💳',
        title: 'חשבוניות לא שולמו',
        message: `${unpaidInvoicesResult.rows.length} חשבוניות בסך ₪${totalUnpaid.toLocaleString('he-IL')}`,
        count: unpaidInvoicesResult.rows.length,
        action: 'עבור לתשלומים',
        projects: unpaidInvoicesResult.rows
      });
    }
    
    console.log('✅ Smart alerts generated successfully');
    res.json(alerts);
    
  } catch (error) {
    console.error('❌ Error generating smart alerts:', error);
    res.status(500).json({ error: 'Failed to generate smart alerts' });
  }
};

// פונקציה למגמות (Trend Charts)
export const getTrendData = async (req, res) => {
  try {
    console.log('🔄 Fetching trend data...');
    
    // מגמת ניצול תקציב - 6 חודשים אחרונים
    const budgetTrendQuery = `
      SELECT 
        DATE_TRUNC('month', tt.transaction_date) as month,
        SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END) as utilized,
        COUNT(DISTINCT tt.tabar_id) as active_projects
      FROM tabar_transactions tt
      JOIN tabarim t ON tt.tabar_id = t.id
      WHERE tt.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      AND t.status = 'פעיל'
      GROUP BY DATE_TRUNC('month', tt.transaction_date)
      ORDER BY month
    `;
    
    // פרויקטים חדשים - 6 חודשים אחרונים
    const newProjectsQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_projects
      FROM tabarim
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;
    
    // דוחות ביצוע - 6 חודשים אחרונים
    const executionReportsQuery = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        COUNT(*) as reports_count,
        SUM(amount) as total_amount
      FROM tabar_transactions
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      AND status = 'שולם'
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month
    `;
    
    const [budgetTrendResult, newProjectsResult, executionReportsResult] = await Promise.all([
      db.query(budgetTrendQuery),
      db.query(newProjectsQuery),
      db.query(executionReportsQuery)
    ]);
    
    const trends = {
      budgetUtilization: budgetTrendResult.rows.map(row => ({
        month: row.month,
        utilized: parseFloat(row.utilized),
        active_projects: parseInt(row.active_projects),
        formatted_month: new Date(row.month).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' })
      })),
      newProjects: newProjectsResult.rows.map(row => ({
        month: row.month,
        new_projects: parseInt(row.new_projects),
        formatted_month: new Date(row.month).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' })
      })),
      executionReports: executionReportsResult.rows.map(row => ({
        month: row.month,
        reports_count: parseInt(row.reports_count),
        total_amount: parseFloat(row.total_amount),
        formatted_month: new Date(row.month).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' })
      }))
    };
    
    console.log('✅ Trend data fetched successfully');
    res.json(trends);
    
  } catch (error) {
    console.error('❌ Error fetching trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
};

// פונקציה לדוחות אחרונים (עדכני)
export const getRecentReports = async (req, res) => {
  try {
    console.log('🔄 Fetching recent reports...');
    
    const query = `
      SELECT 
        t.id,
        t.tabar_number as number,
        t.name,
        t.status,
        t.total_authorized,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized,
        ROUND((COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized) * 100, 1) as progress,
        t.created_at,
        MAX(tt.transaction_date) as last_transaction_date
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.status = 'פעיל'
      GROUP BY t.id, t.tabar_number, t.name, t.status, t.total_authorized, t.created_at
      ORDER BY COALESCE(MAX(tt.transaction_date), t.created_at) DESC
      LIMIT 10
    `;
    
    const result = await db.query(query);
    
    const recentReports = result.rows.map(row => ({
      id: row.id,
      number: row.number,
      name: row.name,
      status: row.status,
      progress: parseFloat(row.progress || 0),
      formatted: {
        budget: `₪${parseFloat(row.total_authorized).toLocaleString('he-IL')}`,
        actual: `₪${parseFloat(row.utilized).toLocaleString('he-IL')}`,
        date: new Date(row.created_at).toLocaleDateString('he-IL'),
        lastUpdate: row.last_transaction_date ? new Date(row.last_transaction_date).toLocaleDateString('he-IL') : 'אין עדכון'
      }
    }));
    
    console.log('✅ Recent reports fetched successfully');
    res.json(recentReports);
    
  } catch (error) {
    console.error('❌ Error fetching recent reports:', error);
    res.status(500).json({ error: 'Failed to fetch recent reports' });
  }
};

// פונקציה לנתוני מה Enhanced Dashboard עם הטבלאות החדשות
export const getAdvancedAnalytics = async (req, res) => {
  try {
    console.log('🔄 Fetching advanced analytics with new database structure...');

    // ביצוע תקציבי לפי שנים
    const yearlyExecutionQuery = await db.query(`
      SELECT 
        year,
        SUM(executed_amount) as total_executed
      FROM execution_by_year
      GROUP BY year
      ORDER BY year
    `);

    const yearlyExecution = {};
    yearlyExecutionQuery.rows.forEach(row => {
      yearlyExecution[row.year] = parseInt(row.total_executed);
    });

    // פיצול תקציב לפי קטגוריות
    const budgetBreakdownQuery = await db.query(`
      SELECT 
        CASE 
          WHEN bl.code LIKE '%-001' THEN 'בנייה ותשתית'
          WHEN bl.code LIKE '%-002' THEN 'ציוד וטכנולוגיה'
          WHEN bl.code LIKE '%-003' THEN 'תכנון ופיקוח'
          ELSE 'אחר'
        END as category,
        SUM(bl.executed_amount) as total_amount
      FROM budget_lines bl
      GROUP BY 
        CASE 
          WHEN bl.code LIKE '%-001' THEN 'בנייה ותשתית'
          WHEN bl.code LIKE '%-002' THEN 'ציוד וטכנולוגיה'
          WHEN bl.code LIKE '%-003' THEN 'תכנון ופיקוח'
          ELSE 'אחר'
        END
      ORDER BY total_amount DESC
    `);

    const totalBudget = budgetBreakdownQuery.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
    const budgetBreakdown = budgetBreakdownQuery.rows.map(row => ({
      name: row.category,
      value: totalBudget > 0 ? Math.round((parseFloat(row.total_amount) / totalBudget) * 100) : 0
    }));

    // סטטוס תהליכי פרויקטים
    const processStatusQuery = await db.query(`
      SELECT 
        COUNT(CASE WHEN ministry_status = 'מאושר' THEN 1 END) as ministry_approved,
        COUNT(CASE WHEN bank_status = 'אושר' THEN 1 END) as bank_approved,
        COUNT(CASE WHEN ministry_status = 'ממתין' OR bank_status = 'לא נבדק' THEN 1 END) as pending_approval
      FROM project_process_status
    `);

    const processStatus = processStatusQuery.rows[0] || {};

    // מנהלי פרויקטים
    const projectManagersQuery = await db.query(`
      SELECT 
        project_manager,
        COUNT(*) as project_count,
        AVG(
          CASE 
            WHEN priority_level = 'גבוה' THEN 3
            WHEN priority_level = 'בינוני' THEN 2
            WHEN priority_level = 'נמוך' THEN 1
            ELSE 0
          END
        ) as avg_priority
      FROM tabarim
      WHERE project_manager IS NOT NULL
      GROUP BY project_manager
      ORDER BY project_count DESC
    `);

    // דוחות למשרד
    const ministryReportsQuery = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reports_sent_to_ministry
      GROUP BY status
    `);

    const ministryReports = {};
    ministryReportsQuery.rows.forEach(row => {
      ministryReports[row.status] = parseInt(row.count);
    });

    const advancedData = {
      yearlyExecution,
      budgetBreakdown,
      processStatus: {
        ministryApproved: parseInt(processStatus.ministry_approved) || 0,
        bankApproved: parseInt(processStatus.bank_approved) || 0,
        pendingApproval: parseInt(processStatus.pending_approval) || 0
      },
      projectManagers: projectManagersQuery.rows.map(row => ({
        name: row.project_manager,
        projects: parseInt(row.project_count),
        averagePriority: parseFloat(row.avg_priority).toFixed(1)
      })),
      ministryReports,
      // מגמות מחושבות
      trends: {
        executionTrend: yearlyExecutionQuery.rows.length > 1 ? 
          ((yearlyExecutionQuery.rows[1].total_executed - yearlyExecutionQuery.rows[0].total_executed) / yearlyExecutionQuery.rows[0].total_executed * 100).toFixed(1) : 0,
        projectsGrowth: budgetBreakdownQuery.rows.length
      }
    };

    console.log('✅ Advanced analytics fetched successfully');
    res.json(advancedData);
  } catch (error) {
    console.error('❌ Error fetching advanced analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch advanced analytics',
      details: error.message 
    });
  }
};

// פונקציה מאוחדת לכל נתוני הדשבורד
export const getDashboardData = async (req, res) => {
  try {
    console.log('🔄 Fetching complete dashboard data...');
    
    // שימוש ב-Promise.all לביצועים מיטביים
    const [kpis, projectStatus, alerts, trends, recentReports] = await Promise.all([
      new Promise((resolve, reject) => {
        const mockRes = {
          json: resolve,
          status: () => ({ json: reject })
        };
        getDashboardKPIs({ ...req }, mockRes);
      }),
      new Promise((resolve, reject) => {
        const mockRes = {
          json: resolve,
          status: () => ({ json: reject })
        };
        getProjectStatusStats({ ...req }, mockRes);
      }),
      new Promise((resolve, reject) => {
        const mockRes = {
          json: resolve,
          status: () => ({ json: reject })
        };
        getSmartAlerts({ ...req }, mockRes);
      }),
      new Promise((resolve, reject) => {
        const mockRes = {
          json: resolve,
          status: () => ({ json: reject })
        };
        getTrendData({ ...req }, mockRes);
      }),
      new Promise((resolve, reject) => {
        const mockRes = {
          json: resolve,
          status: () => ({ json: reject })
        };
        getRecentReports({ ...req }, mockRes);
      })
    ]);
    
    const dashboardData = {
      kpis,
      projectStatus,
      alerts,
      trends,
      recentReports,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ Complete dashboard data fetched successfully');
    res.json(dashboardData);
    
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// פונקציה ליציא דשבורד ל-PDF - גרסה פשוטה
export const exportDashboardPDF = async (req, res) => {
  try {
    console.log('🔄 Generating dashboard PDF export...');
    
    // קבלת נתונים בסיסיים מהדאטהבייס
    const kpisQuery = `
      SELECT 
        (SELECT COALESCE(SUM(total_authorized), 0) FROM tabarim WHERE status IN ('נפתח', 'אושר', 'סגור', 'פעיל')) as total_budget,
        (SELECT COUNT(*) FROM tabarim) as total_projects,
        (SELECT COUNT(*) FROM tabarim WHERE status = 'סגור') as completed_projects,
        (SELECT COUNT(*) FROM tabarim WHERE status IN ('נפתח', 'אושר')) as active_projects
    `;
    
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_authorized), 0) as total_budget
      FROM tabarim
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const reportsQuery = `
      SELECT 
        tabar_number,
        name,
        status,
        total_authorized,
        ministry
      FROM tabarim
      ORDER BY id DESC
      LIMIT 10
    `;

    const [kpisResult, statusResult, reportsResult] = await Promise.all([
      db.query(kpisQuery),
      db.query(statusQuery),
      db.query(reportsQuery)
    ]);

    const kpisData = kpisResult.rows[0];
    const statusData = statusResult.rows;
    const reportsData = reportsResult.rows;

    // הכנת נתונים לPDF
    const reportData = {
      generatedAt: new Date().toLocaleString('he-IL'),
      generatedBy: 'מערכת ניהול תב"ר',
      kpis: {
        totalBudget: `₪${parseFloat(kpisData.total_budget || 0).toLocaleString('he-IL')}`,
        totalProjects: parseInt(kpisData.total_projects || 0),
        completedProjects: parseInt(kpisData.completed_projects || 0),
        activeProjects: parseInt(kpisData.active_projects || 0),
        completionPercentage: kpisData.total_projects > 0 ? 
          Math.round((kpisData.completed_projects / kpisData.total_projects) * 100) : 0
      },
      statusBreakdown: statusData.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        budget: `₪${parseFloat(row.total_budget || 0).toLocaleString('he-IL')}`
      })),
      recentProjects: reportsData.map(row => ({
        number: row.tabar_number,
        name: row.name,
        status: row.status,
        ministry: row.ministry,
        budget: `₪${parseFloat(row.total_authorized || 0).toLocaleString('he-IL')}`
      }))
    };

    // בניית HTML פשוט
    const htmlContent = generateSimpleDashboardHTML(reportData);

    // יצירת PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('print');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666; direction: rtl;">
          <span>דשבורד ניהול תב"ר - עמוד <span class="pageNumber"></span> מתוך <span class="totalPages"></span></span>
        </div>
      `
    });

    await browser.close();

    // החזרת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
    
    console.log('✅ Dashboard PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating dashboard PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate dashboard PDF',
      details: error.message 
    });
  }
};

// 🎨 פונקציה פשוטה ליצירת HTML לדשבורד
const generateSimpleDashboardHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>דשבורד ניהול תב"ר</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
          direction: rtl;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .meta {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-top: 20px;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .kpi-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
          border-right: 5px solid #667eea;
        }
        
        .kpi-card.total { border-right-color: #3b82f6; }
        .kpi-card.completed { border-right-color: #10b981; }
        .kpi-card.percentage { border-right-color: #f59e0b; }
        
        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: #1f2937;
        }
        
        .kpi-label {
          font-size: 1rem;
          color: #666;
        }
        
        .section {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .status-item {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        
        .status-item.open { border-right: 4px solid #22c55e; }
        .status-item.approved { border-right: 4px solid #eab308; }
        .status-item.closed { border-right: 4px solid #3b82f6; }
        .status-item.paused { border-right: 4px solid #ef4444; }
        
        .status-count {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 5px;
          color: #1f2937;
        }
        
        .status-label {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 8px;
        }
        
        .status-budget {
          font-size: 0.8rem;
          color: #16a34a;
          font-weight: 600;
        }
        
        .projects-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .projects-table th,
        .projects-table td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .projects-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .projects-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .status-badge.open {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .status-badge.approved {
          background: #fef3c7;
          color: #d97706;
        }
        
        .status-badge.closed {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .status-badge.paused {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .summary-footer {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          margin-top: 30px;
        }
        
        .summary-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        .summary-text {
          font-size: 1rem;
          opacity: 0.9;
          line-height: 1.8;
        }
        
        @media print {
          body { background: white; }
          .section { break-inside: avoid; }
          .kpi-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>דשבורד ניהול תב"ר</h1>
          <div class="meta">
            נוצר על ידי: ${data.generatedBy}<br>
            תאריך יצירה: ${data.generatedAt}
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card total">
            <div class="kpi-value">${data.kpis.totalBudget}</div>
            <div class="kpi-label">תקציב כולל</div>
          </div>
          
          <div class="kpi-card total">
            <div class="kpi-value">${data.kpis.totalProjects}</div>
            <div class="kpi-label">סה"כ פרויקטים</div>
          </div>
          
          <div class="kpi-card completed">
            <div class="kpi-value">${data.kpis.completedProjects}</div>
            <div class="kpi-label">פרויקטים הושלמו</div>
          </div>
          
          <div class="kpi-card percentage">
            <div class="kpi-value">${data.kpis.completionPercentage}%</div>
            <div class="kpi-label">אחוז השלמה</div>
          </div>
        </div>

        <!-- Project Status Breakdown -->
        <div class="section">
          <h2>פילוח פרויקטים לפי סטטוס</h2>
          <div class="status-grid">
            ${data.statusBreakdown.map(status => {
              let statusClass = 'paused';
              if (status.status === 'נפתח') statusClass = 'open';
              else if (status.status === 'אושר') statusClass = 'approved';
              else if (status.status === 'סגור') statusClass = 'closed';
              
              return `
                <div class="status-item ${statusClass}">
                  <div class="status-count">${status.count}</div>
                  <div class="status-label">${status.status}</div>
                  <div class="status-budget">${status.budget}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recent Projects -->
        <div class="section">
          <h2>פרויקטים אחרונים</h2>
          <table class="projects-table">
            <thead>
              <tr>
                <th>מספר תב"ר</th>
                <th>שם הפרויקט</th>
                <th>משרד</th>
                <th>סטטוס</th>
                <th>תקציב מאושר</th>
              </tr>
            </thead>
            <tbody>
              ${data.recentProjects.map(project => {
                let badgeClass = 'paused';
                if (project.status === 'נפתח') badgeClass = 'open';
                else if (project.status === 'אושר') badgeClass = 'approved';
                else if (project.status === 'סגור') badgeClass = 'closed';
                
                return `
                  <tr>
                    <td>${project.number}</td>
                    <td>${project.name}</td>
                    <td>${project.ministry}</td>
                    <td>
                      <span class="status-badge ${badgeClass}">
                        ${project.status}
                      </span>
                    </td>
                    <td>${project.budget}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary Footer -->
        <div class="summary-footer">
          <div class="summary-title">סיכום נתוני דשבורד ניהול תב"ר</div>
          <div class="summary-text">
            המערכת מנהלת ${data.kpis.totalProjects} פרויקטים עם תקציב כולל של ${data.kpis.totalBudget}.<br>
            ${data.kpis.completedProjects} פרויקטים הושלמו (${data.kpis.completionPercentage}%) ו-${data.kpis.activeProjects} פרויקטים פעילים.<br>
            דוח זה נוצר במערכת ניהול תב"ר ומתעדכן בזמן אמת.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};