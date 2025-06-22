import db from '../db.js';

/**
 * 📖 משמעות סטטוסים בתב"רים:
 * 
 * 🟢 נפתח - התב"ר נפתח וניתן להתחיל בעבודה
 * 🟡 אושר - עבר אישור במליאת המועצה 
 * 🔵 סגור - התב"ר הושלם, נוצל לגמרי והתקבל כל הכסף (מאוזן הוצאות=הכנסות=תקציב)
 * 
 * הלוגיקה:
 * - נפתח: פרויקט חדש שיכול להתחיל
 * - אושר: פרויקט שעבר את כל האישורים
 * - סגור: פרויקט שהושלם לחלוטין וכל הכסף נוצל
 */

// 🎨 פונקציה לקבלת מידע על סטטוס לממשק המשתמש
const getStatusInfo = (status) => {
  switch (status) {
    case 'נפתח':
      return {
        label: 'נפתח',
        description: 'התב"ר נפתח וניתן להתחיל בעבודה',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        badgeColor: 'success'
      };
    case 'אושר':
      return {
        label: 'אושר במליאה',
        description: 'עבר אישור במליאת המועצה',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        badgeColor: 'warning'
      };
    case 'סגור':
      return {
        label: 'הושלם במלואו',
        description: 'התב"ר הושלם, נוצל לגמרי והתקבל כל הכסף',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        badgeColor: 'info'
      };
    default:
      return {
        label: status || 'לא מוגדר',
        description: 'סטטוס לא מוכר',
        color: 'gray',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        badgeColor: 'secondary'
      };
  }
};

// 📁 דוח תב"רים משופר עם השדות החדשות
export const getEnhancedTabarimReport = async (req, res) => {
  try {
    console.log('🔄 Fetching enhanced Tabarim report...');
    
    const query = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.short_description,
        t.ministry,
        t.status,
        t.total_authorized,
        t.total_executed,
        t.latest_report_sent,
        
        -- סכום שבוצע בשנה הנוכחית
        COALESCE(eby.current_year_executed, 0) as current_year_executed,
        
        -- סטטוס משרד ובנק
        pps.ministry_status,
        pps.bank_status,
        pps.approval_date,
        
        -- סטייה מתקציב
        (t.total_authorized - t.total_executed) as budget_deviation,
        
        -- אחוזי ביצוע
        CASE 
          WHEN t.total_authorized > 0 THEN 
            ROUND((t.total_executed / t.total_authorized) * 100, 1)
          ELSE 0 
        END as execution_percentage,
        
        -- מספר ימים מאז דיווח אחרון
        CASE 
          WHEN t.latest_report_sent IS NOT NULL THEN 
            CURRENT_DATE - t.latest_report_sent
          ELSE NULL 
        END as days_since_last_report,
        
        -- התרעות
        CASE 
          WHEN t.latest_report_sent IS NULL OR (CURRENT_DATE - t.latest_report_sent) > 90 THEN 'לא דווח מעל 90 יום'
          WHEN t.total_executed > t.total_authorized THEN 'חריגה מתקציב'
          WHEN pps.ministry_status = 'נדחה' THEN 'נדחה במשרד'
          WHEN pps.bank_status = 'נדחה' THEN 'נדחה בבנק'
          WHEN t.status = 'סגור' AND t.total_executed = t.total_authorized THEN 'הושלם במלואו'
          WHEN t.status = 'אושר' THEN 'אושר במליאה'
          WHEN t.status = 'נפתח' THEN 'נפתח וממתין לפעולה'
          ELSE 'תקין'
        END as alert_status
        
      FROM tabarim t
      LEFT JOIN (
        SELECT 
          tabar_id, 
          SUM(executed_amount) as current_year_executed
        FROM execution_by_year 
        WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY tabar_id
      ) eby ON t.id = eby.tabar_id
      LEFT JOIN project_process_status pps ON t.id = pps.tabar_id
      ORDER BY t.tabar_number
    `;
    
    const result = await db.query(query);
    
    const enhancedReport = result.rows.map(row => ({
      id: row.id,
      tabar_number: row.tabar_number,
      name: row.name,
      short_description: row.short_description,
      ministry: row.ministry,
      status: row.status,
      
      // מידע על הסטטוס
      status_info: getStatusInfo(row.status),
      
      // תקציב ופיננסים
      budget: {
        authorized: parseFloat(row.total_authorized || 0),
        executed: parseFloat(row.total_executed || 0),
        current_year_executed: parseFloat(row.current_year_executed || 0),
        deviation: parseFloat(row.budget_deviation || 0),
        execution_percentage: parseFloat(row.execution_percentage || 0)
      },
      
      // סטטוס תהליכים
      process_status: {
        ministry: row.ministry_status,
        bank: row.bank_status,
        approval_date: row.approval_date
      },
      
      // דיווחים
      reporting: {
        latest_report_sent: row.latest_report_sent,
        days_since_last_report: row.days_since_last_report,
        alert_status: row.alert_status
      },
      
      // פורמט עברי
      formatted: {
        authorized_budget: `₪${parseFloat(row.total_authorized || 0).toLocaleString('he-IL')}`,
        executed_budget: `₪${parseFloat(row.total_executed || 0).toLocaleString('he-IL')}`,
        current_year_executed: `₪${parseFloat(row.current_year_executed || 0).toLocaleString('he-IL')}`,
        deviation: `₪${parseFloat(row.budget_deviation || 0).toLocaleString('he-IL')}`,
        execution_percentage: `${parseFloat(row.execution_percentage || 0)}%`,
        latest_report_date: row.latest_report_sent ? 
          new Date(row.latest_report_sent).toLocaleDateString('he-IL') : 'לא דווח'
      }
    }));
    
    console.log('✅ Enhanced Tabarim report fetched successfully');
    res.json({
      report_type: 'enhanced_tabarim',
      total_projects: enhancedReport.length,
      generated_at: new Date().toISOString(),
      data: enhancedReport
    });
    
  } catch (error) {
    console.error('❌ Error fetching enhanced Tabarim report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch enhanced Tabarim report',
      details: error.message 
    });
  }
};

// 📁 דוח תתי־סעיפים מטבלת budget_lines
export const getBudgetLinesReport = async (req, res) => {
  try {
    console.log('🔄 Fetching budget lines report...');
    
    const query = `
      SELECT 
        bl.id,
        bl.tabar_id,
        t.tabar_number,
        t.name as project_name,
        bl.code,
        bl.description,
        bl.allocated_amount,
        bl.executed_amount,
        bl.percentage_executed,
        
        -- קטגוריה לפי קוד
        CASE 
          WHEN bl.code LIKE '%-001' THEN 'בנייה ותשתית'
          WHEN bl.code LIKE '%-002' THEN 'ציוד וטכנולוגיה'
          WHEN bl.code LIKE '%-003' THEN 'תכנון ופיקוח'
          ELSE 'אחר'
        END as category
        
      FROM budget_lines bl
      JOIN tabarim t ON bl.tabar_id = t.id
      ORDER BY t.tabar_number, bl.code
    `;
    
    const result = await db.query(query);
    
    const budgetLinesReport = result.rows.map(row => ({
      id: row.id,
      tabar_id: row.tabar_id,
      project: {
        number: row.tabar_number,
        name: row.project_name
      },
      budget_line: {
        code: row.code,
        description: row.description,
        category: row.category,
        allocated_amount: parseFloat(row.allocated_amount || 0),
        executed_amount: parseFloat(row.executed_amount || 0),
        percentage_executed: parseFloat(row.percentage_executed || 0)
      },
      formatted: {
        allocated: `₪${parseFloat(row.allocated_amount || 0).toLocaleString('he-IL')}`,
        executed: `₪${parseFloat(row.executed_amount || 0).toLocaleString('he-IL')}`,
        percentage: `${parseFloat(row.percentage_executed || 0).toFixed(1)}%`
      }
    }));
    
    console.log('✅ Budget lines report fetched successfully');
    res.json({
      report_type: 'budget_lines',
      total_lines: budgetLinesReport.length,
      generated_at: new Date().toISOString(),
      data: budgetLinesReport
    });
    
  } catch (error) {
    console.error('❌ Error fetching budget lines report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget lines report',
      details: error.message 
    });
  }
};

// 📚 API endpoint למידע על כל הסטטוסים
export const getStatusInformation = async (req, res) => {
  try {
    const statusInfo = {
      explanation: "משמעות סטטוסים בתב\"רים",
      statuses: {
        'נפתח': getStatusInfo('נפתח'),
        'אושר': getStatusInfo('אושר'),
        'סגור': getStatusInfo('סגור')
      },
      workflow: [
        { step: 1, status: 'נפתח', description: 'התב"ר נפתח - ניתן להתחיל בעבודה' },
        { step: 2, status: 'אושר', description: 'עבר אישור במליאת המועצה - מאושר לביצוע' },
        { step: 3, status: 'סגור', description: 'הושלם במלואו - כל הכסף נוצל והתקבל' }
      ]
    };
    
    res.json(statusInfo);
  } catch (error) {
    console.error('❌ Error fetching status information:', error);
    res.status(500).json({ 
      error: 'Failed to fetch status information',
      details: error.message 
    });
  }
}; 