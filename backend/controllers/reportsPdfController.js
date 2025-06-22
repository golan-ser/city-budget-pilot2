import pool from '../db.js';
import puppeteer from 'puppeteer';

// ייצוא PDF לדוח סעיפי תקציב
export const exportBudgetItemsPDF = async (req, res) => {
  try {
    console.log('📄 Generating Budget Items PDF export...');
    
    const { department, status, fiscal_year, utilization_range, search } = req.query;
    
    // שליפת נתוני סעיפי התקציב
    let sql = `
      SELECT 
        bi.*,
        COALESCE(SUM(tt.amount), 0) as executed_budget
      FROM budget_items bi
      LEFT JOIN tabar_transactions tt ON bi.tabar_id = tt.tabar_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department && department !== 'all') {
      sql += ' AND bi.department = $' + (params.length + 1);
      params.push(department);
    }
    if (status && status !== 'all') {
      sql += ' AND bi.status = $' + (params.length + 1);
      params.push(status);
    }
    if (fiscal_year && fiscal_year !== 'all') {
      sql += ' AND bi.fiscal_year = $' + (params.length + 1);
      params.push(fiscal_year);
    }
    if (search) {
      sql += ' AND (bi.name ILIKE $' + (params.length + 1) + ' OR bi.notes ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }
    
    sql += ' GROUP BY bi.id ORDER BY bi.name';
    
    const result = await pool.query(sql, params);
    const budgetItems = result.rows;
    
    // סינון לפי טווח ניצול
    let filteredItems = budgetItems;
    if (utilization_range && utilization_range !== 'all') {
      filteredItems = budgetItems.filter(item => {
        const percent = item.approved_budget > 0 ? (item.executed_budget / item.approved_budget) * 100 : 0;
        switch (utilization_range) {
          case 'over_100': return percent > 100;
          case '90_100': return percent >= 90 && percent <= 100;
          case 'under_50': return percent < 50;
          case 'zero': return percent === 0;
          default: return true;
        }
      });
    }
    
    // הכנת נתונים לתבנית
    const reportData = {
      title: 'דוח סעיפי תקציב',
      subtitle: 'מערכת ניהול תב"רים',
      reportDate: new Date().toLocaleDateString('he-IL'),
      reportTime: new Date().toLocaleTimeString('he-IL'),
      totalItems: filteredItems.length,
      totalApproved: filteredItems.reduce((sum, item) => sum + parseFloat(item.approved_budget || 0), 0),
      totalExecuted: filteredItems.reduce((sum, item) => sum + parseFloat(item.executed_budget || 0), 0),
      filters: {
        department: department && department !== 'all' ? department : 'כל המחלקות',
        status: status && status !== 'all' ? status : 'כל הסטטוסים',
        fiscal_year: fiscal_year && fiscal_year !== 'all' ? fiscal_year : 'כל השנים',
        utilization_range: getUtilizationRangeLabel(utilization_range),
        search: search || 'ללא חיפוש'
      },
      items: filteredItems.map(item => ({
        ...item,
        approved_budget: parseFloat(item.approved_budget || 0).toLocaleString(),
        executed_budget: parseFloat(item.executed_budget || 0).toLocaleString(),
        utilization_percentage: item.approved_budget > 0 ? 
          ((item.executed_budget / item.approved_budget) * 100).toFixed(1) : '0',
        statusClass: getStatusClass(item.status),
        created_at: new Date(item.created_at).toLocaleDateString('he-IL')
      }))
    };
    
    // יצירת HTML לדוח
    const htmlContent = generateBudgetItemsHTML(reportData);
    
    // יצירת PDF
    const pdfBuffer = await generatePDF(htmlContent, 'A4', 'portrait');
    
    // שליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="budget-items-report-${new Date().getTime()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
    console.log('✅ Budget Items PDF report generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating Budget Items PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
  }
};

// ייצוא PDF לדוח תב"רים מלא
export const exportFullTabarPDF = async (req, res) => {
  try {
    console.log('📄 Generating Full Tabar PDF export...');
    
    const { status, ministry, year } = req.query;
    
    // שליפת נתוני התב"רים המלאים
    let sql = `
      SELECT 
        t.*,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as spent,
        t.total_authorized as budget
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      sql += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }
    if (ministry) {
      sql += ' AND t.ministry = $' + (params.length + 1);
      params.push(ministry);
    }
    if (year) {
      sql += ' AND t.year = $' + (params.length + 1);
      params.push(year);
    }
    
    sql += ' GROUP BY t.id ORDER BY t.tabar_number';
    
    const result = await pool.query(sql, params);
    const tabarim = result.rows;
    
    // הכנת נתונים לתבנית
    const reportData = {
      title: 'דוח תב"רים מלא',
      subtitle: 'מערכת ניהול תב"רים',
      reportDate: new Date().toLocaleDateString('he-IL'),
      reportTime: new Date().toLocaleTimeString('he-IL'),
      totalTabarim: tabarim.length,
      totalBudget: tabarim.reduce((sum, t) => sum + parseFloat(t.budget || 0), 0),
      totalSpent: tabarim.reduce((sum, t) => sum + parseFloat(t.spent || 0), 0),
      filters: {
        status: status || 'כל הסטטוסים',
        ministry: ministry || 'כל המשרדים',
        year: year || 'כל השנים'
      },
      tabarim: tabarim.map(t => ({
        ...t,
        budget: parseFloat(t.budget || 0).toLocaleString(),
        spent: parseFloat(t.spent || 0).toLocaleString(),
        utilization_percentage: t.budget > 0 ? ((t.spent / t.budget) * 100).toFixed(1) : '0',
        statusClass: getStatusClass(t.status),
        open_date: new Date(t.open_date).toLocaleDateString('he-IL')
      }))
    };
    
    // יצירת HTML לדוח
    const htmlContent = generateFullTabarHTML(reportData);
    
    // יצירת PDF
    const pdfBuffer = await generatePDF(htmlContent, 'A3', 'landscape');
    
    // שליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="full-tabar-report-${new Date().getTime()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
    console.log('✅ Full Tabar PDF report generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating Full Tabar PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
  }
};

// ייצוא PDF לדוח תב"רים תקציבי
export const exportTabarBudgetPDF = async (req, res) => {
  try {
    console.log('📄 Generating Tabar Budget PDF export...');
    
    const { status, ministry, year, search } = req.query;
    
    // שליפת נתוני התב"רים
    let sql = `
      SELECT 
        t.*
      FROM tabarim t
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      sql += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }
    if (ministry && ministry !== 'all') {
      sql += ' AND t.ministry = $' + (params.length + 1);
      params.push(ministry);
    }
    if (year && year !== 'all') {
      sql += ' AND t.year = $' + (params.length + 1);
      params.push(year);
    }
    if (search) {
      sql += ' AND (t.name ILIKE $' + (params.length + 1) + ' OR t.tabar_number ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }
    
    sql += ' ORDER BY t.tabar_number';
    
    const result = await pool.query(sql, params);
    const tabarim = result.rows;
    
    // הכנת נתונים לתבנית
    const reportData = {
      title: 'דוח תב"רים תקציבי',
      subtitle: 'מערכת ניהול תב"רים',
      reportDate: new Date().toLocaleDateString('he-IL'),
      reportTime: new Date().toLocaleTimeString('he-IL'),
      totalTabarim: tabarim.length,
      totalBudget: tabarim.reduce((sum, t) => sum + parseFloat(t.total_authorized || 0), 0),
      filters: {
        status: status && status !== 'all' ? status : 'כל הסטטוסים',
        ministry: ministry && ministry !== 'all' ? ministry : 'כל המשרדים',
        year: year && year !== 'all' ? year : 'כל השנים',
        search: search || 'ללא חיפוש'
      },
      tabarim: tabarim.map(t => ({
        ...t,
        total_authorized: parseFloat(t.total_authorized || 0).toLocaleString(),
        statusClass: getStatusClass(t.status),
        open_date: new Date(t.open_date).toLocaleDateString('he-IL')
      }))
    };
    
    // יצירת HTML לדוח
    const htmlContent = generateTabarBudgetHTML(reportData);
    
    // יצירת PDF
    const pdfBuffer = await generatePDF(htmlContent, 'A4', 'portrait');
    
    // שליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tabar-budget-report-${new Date().getTime()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
    console.log('✅ Tabar Budget PDF report generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating Tabar Budget PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
  }
};

// פונקציות עזר
function getUtilizationRangeLabel(range) {
  switch (range) {
    case 'over_100': return 'מעל 100%';
    case '90_100': return '90%-100%';
    case 'under_50': return 'מתחת ל-50%';
    case 'zero': return '0%';
    default: return 'כל הטווחים';
  }
}

function getStatusClass(status) {
  if (!status) return 'pending';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('פעיל') || statusLower.includes('active')) return 'active';
  if (statusLower.includes('הושלם') || statusLower.includes('completed')) return 'completed';
  if (statusLower.includes('מושהה') || statusLower.includes('delayed')) return 'delayed';
  return 'pending';
}

async function generatePDF(htmlContent, format = 'A4', orientation = 'portrait') {
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
    format,
    orientation,
    printBackground: true,
    margin: {
      top: '15mm',
      right: '10mm',
      bottom: '15mm',
      left: '10mm'
    }
  });
  
  await browser.close();
  return pdfBuffer;
}

function generateBudgetItemsHTML(reportData) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>${reportData.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Alef', 'Arial Hebrew', 'David', sans-serif;
            direction: rtl; text-align: right; line-height: 1.6;
            color: #333; background: #fff; font-size: 12px;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 15mm; }
        .header { text-align: center; border-bottom: 3px solid #1565c0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; font-weight: bold; color: #1565c0; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; color: #666; }
        .header .meta { font-size: 11px; color: #888; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); padding: 15px; border-radius: 8px; text-align: center; }
        .summary-card .number { font-size: 18px; font-weight: bold; color: #1565c0; margin-bottom: 5px; }
        .summary-card .label { font-size: 10px; color: #666; }
        .filters { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .filters h3 { font-size: 14px; margin-bottom: 10px; color: #1565c0; }
        .filter-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .filter-item { font-size: 11px; }
        .filter-label { font-weight: bold; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #1565c0; color: white; padding: 8px 4px; font-weight: bold; }
        td { padding: 6px 4px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) { background: #f8f9fa; }
        .status { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
        .status.active { background: #e8f5e8; color: #2e7d32; }
        .status.pending { background: #fff3e0; color: #f57c00; }
        .status.completed { background: #e3f2fd; color: #1565c0; }
        .status.delayed { background: #ffebee; color: #d32f2f; }
        .utilization { font-weight: bold; }
        .utilization.high { color: #d32f2f; }
        .utilization.medium { color: #f57c00; }
        .utilization.low { color: #1565c0; }
        .utilization.zero { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle}</div>
            <div class="meta">דוח נוצר בתאריך: ${reportData.reportDate} | ${reportData.reportTime}</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.totalItems}</div>
                <div class="label">סה"כ סעיפים</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalApproved.toLocaleString()}</div>
                <div class="label">תקציב מאושר</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalExecuted.toLocaleString()}</div>
                <div class="label">תקציב מבוצע</div>
            </div>
        </div>

        <div class="filters">
            <h3>פילטרים שהוחלו:</h3>
            <div class="filter-row">
                <div class="filter-item"><span class="filter-label">מחלקה:</span> ${reportData.filters.department}</div>
                <div class="filter-item"><span class="filter-label">סטטוס:</span> ${reportData.filters.status}</div>
                <div class="filter-item"><span class="filter-label">שנה:</span> ${reportData.filters.fiscal_year}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>שם סעיף</th>
                    <th>מחלקה</th>
                    <th>סטטוס</th>
                    <th>תקציב מאושר</th>
                    <th>תקציב מבוצע</th>
                    <th>אחוז ניצול</th>
                    <th>שנת תקציב</th>
                    <th>תאריך יצירה</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.items.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.department || 'לא הוגדר'}</td>
                        <td><span class="status ${item.statusClass}">${item.status || 'לא הוגדר'}</span></td>
                        <td style="font-family: monospace;">₪${item.approved_budget}</td>
                        <td style="font-family: monospace;">₪${item.executed_budget}</td>
                        <td>
                            <span class="utilization ${
                              parseFloat(item.utilization_percentage) >= 90 ? 'high' :
                              parseFloat(item.utilization_percentage) >= 70 ? 'medium' :
                              parseFloat(item.utilization_percentage) > 0 ? 'low' : 'zero'
                            }">
                                ${item.utilization_percentage}%
                            </span>
                        </td>
                        <td>${item.fiscal_year || 'לא הוגדר'}</td>
                        <td>${item.created_at}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

function generateFullTabarHTML(reportData) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>${reportData.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Alef', 'Arial Hebrew', 'David', sans-serif;
            direction: rtl; text-align: right; line-height: 1.6;
            color: #333; background: #fff; font-size: 11px;
        }
        .container { max-width: 297mm; margin: 0 auto; padding: 15mm; }
        .header { text-align: center; border-bottom: 3px solid #1565c0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; font-weight: bold; color: #1565c0; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; color: #666; }
        .header .meta { font-size: 11px; color: #888; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); padding: 15px; border-radius: 8px; text-align: center; }
        .summary-card .number { font-size: 18px; font-weight: bold; color: #1565c0; margin-bottom: 5px; }
        .summary-card .label { font-size: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { background: #1565c0; color: white; padding: 6px 3px; font-weight: bold; }
        td { padding: 4px 3px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) { background: #f8f9fa; }
        .status { display: inline-block; padding: 2px 4px; border-radius: 6px; font-size: 8px; font-weight: bold; }
        .status.active { background: #e8f5e8; color: #2e7d32; }
        .status.pending { background: #fff3e0; color: #f57c00; }
        .status.completed { background: #e3f2fd; color: #1565c0; }
        .status.delayed { background: #ffebee; color: #d32f2f; }
        .utilization { font-weight: bold; }
        .utilization.high { color: #d32f2f; }
        .utilization.medium { color: #f57c00; }
        .utilization.low { color: #1565c0; }
        .utilization.zero { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle}</div>
            <div class="meta">דוח נוצר בתאריך: ${reportData.reportDate} | ${reportData.reportTime}</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.totalTabarim}</div>
                <div class="label">סה"כ תב"רים</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalBudget.toLocaleString()}</div>
                <div class="label">סה"כ תקציב</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalSpent.toLocaleString()}</div>
                <div class="label">סה"כ בוצע</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>מס' תב"ר</th>
                    <th>שם תב"ר</th>
                    <th>שנה</th>
                    <th>משרד</th>
                    <th>סטטוס</th>
                    <th>תקציב</th>
                    <th>בוצע</th>
                    <th>אחוז ניצול</th>
                    <th>תאריך פתיחה</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.tabarim.map(tabar => `
                    <tr>
                        <td style="font-family: monospace;">${tabar.tabar_number}</td>
                        <td><strong>${tabar.name}</strong></td>
                        <td>${tabar.year || 'לא הוגדר'}</td>
                        <td>${tabar.ministry || 'לא הוגדר'}</td>
                        <td><span class="status ${tabar.statusClass}">${tabar.status || 'לא הוגדר'}</span></td>
                        <td style="font-family: monospace;">₪${tabar.budget}</td>
                        <td style="font-family: monospace;">₪${tabar.spent}</td>
                        <td>
                            <span class="utilization ${
                              parseFloat(tabar.utilization_percentage) >= 90 ? 'high' :
                              parseFloat(tabar.utilization_percentage) >= 70 ? 'medium' :
                              parseFloat(tabar.utilization_percentage) > 0 ? 'low' : 'zero'
                            }">
                                ${tabar.utilization_percentage}%
                            </span>
                        </td>
                        <td>${tabar.open_date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

function generateTabarBudgetHTML(reportData) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>${reportData.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Alef', 'Arial Hebrew', 'David', sans-serif;
            direction: rtl; text-align: right; line-height: 1.6;
            color: #333; background: #fff; font-size: 12px;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 15mm; }
        .header { text-align: center; border-bottom: 3px solid #1565c0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; font-weight: bold; color: #1565c0; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; color: #666; }
        .header .meta { font-size: 11px; color: #888; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); padding: 15px; border-radius: 8px; text-align: center; }
        .summary-card .number { font-size: 18px; font-weight: bold; color: #1565c0; margin-bottom: 5px; }
        .summary-card .label { font-size: 10px; color: #666; }
        .filters { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .filters h3 { font-size: 14px; margin-bottom: 10px; color: #1565c0; }
        .filter-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .filter-item { font-size: 11px; }
        .filter-label { font-weight: bold; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #1565c0; color: white; padding: 8px 4px; font-weight: bold; }
        td { padding: 6px 4px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) { background: #f8f9fa; }
        .status { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
        .status.active { background: #e8f5e8; color: #2e7d32; }
        .status.pending { background: #fff3e0; color: #f57c00; }
        .status.completed { background: #e3f2fd; color: #1565c0; }
        .status.delayed { background: #ffebee; color: #d32f2f; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle}</div>
            <div class="meta">דוח נוצר בתאריך: ${reportData.reportDate} | ${reportData.reportTime}</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.totalTabarim}</div>
                <div class="label">סה"כ תב"רים</div>
            </div>
            <div class="summary-card">
                <div class="number">₪${reportData.totalBudget.toLocaleString()}</div>
                <div class="label">סה"כ תקציב</div>
            </div>
        </div>

        <div class="filters">
            <h3>פילטרים שהוחלו:</h3>
            <div class="filter-row">
                <div class="filter-item"><span class="filter-label">סטטוס:</span> ${reportData.filters.status}</div>
                <div class="filter-item"><span class="filter-label">משרד:</span> ${reportData.filters.ministry}</div>
                <div class="filter-item"><span class="filter-label">שנה:</span> ${reportData.filters.year}</div>
                <div class="filter-item"><span class="filter-label">חיפוש:</span> ${reportData.filters.search}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>מספר תב"ר</th>
                    <th>שם פרויקט</th>
                    <th>שנה</th>
                    <th>סטטוס</th>
                    <th>משרד</th>
                    <th>תקציב מאושר</th>
                    <th>תאריך פתיחה</th>
                    <th>מספר הרשאה</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.tabarim.map(tabar => `
                    <tr>
                        <td style="font-family: monospace;">${tabar.tabar_number}</td>
                        <td><strong>${tabar.name}</strong></td>
                        <td>${tabar.year || 'לא הוגדר'}</td>
                        <td><span class="status ${tabar.statusClass}">${tabar.status || 'לא הוגדר'}</span></td>
                        <td>${tabar.ministry || 'לא הוגדר'}</td>
                        <td style="font-family: monospace;">₪${tabar.total_authorized}</td>
                        <td>${tabar.open_date}</td>
                        <td style="font-family: monospace;">${tabar.permission_number || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
} 