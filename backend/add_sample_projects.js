import db from './db.js';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sampleProjects = [
  {
    name: 'שיפוץ בית ספר יסודי',
    type: 'תבר',
    department_id: 2, // חינוך
    start_date: '2024-01-01',
    end_date: '2025-12-31',
    budget_amount: 500000,
    status: 'פעיל'
  },
  {
    name: 'הקמת גן ילדים חדש',
    type: 'תבר',
    department_id: 2, // חינוך
    start_date: '2024-06-01',
    end_date: '2025-08-31',
    budget_amount: 800000,
    status: 'בתכנון'
  },
  {
    name: 'שדרוג מערכת תאורה',
    type: 'תבר',
    department_id: 1, // הנדסה
    start_date: '2024-01-01',
    end_date: '2024-11-30',
    budget_amount: 300000,
    status: 'הסתיים'
  },
  {
    name: 'פארק חדש במרכז העיר',
    type: 'תבר',
    department_id: 6, // איכות הסביבה
    start_date: '2024-03-01',
    end_date: '2025-06-30',
    budget_amount: 1200000,
    status: 'מושהה'
  },
  {
    name: 'מרכז קהילתי חדש',
    type: 'תבר',
    department_id: 3, // רווחה
    start_date: '2024-02-01',
    end_date: '2025-01-31',
    budget_amount: 950000,
    status: 'פעיל'
  }
];

const sampleMilestones = [
  { project_id: 1, title: 'תכנון והיתרים', due_date: '2024-12-15', status: 'הושלם', description: 'השלמת תכנון והשגת היתרים' },
  { project_id: 1, title: 'ביצוע שלב א', due_date: '2025-06-01', status: 'בתהליך', description: 'ביצוע עבודות השיפוץ הראשוניות' },
  { project_id: 1, title: 'ביצוע שלב ב', due_date: '2025-09-01', status: 'לא התחיל', description: 'השלמת עבודות השיפוץ' },
  
  { project_id: 2, title: 'בחירת מקום', due_date: '2024-07-01', status: 'הושלם', description: 'בחירת מקום לגן הילדים' },
  { project_id: 2, title: 'תכנון אדריכלי', due_date: '2024-10-01', status: 'בתהליך', description: 'הכנת תוכניות אדריכליות' },
  
  { project_id: 3, title: 'רכישת ציוד', due_date: '2024-03-01', status: 'הושלם', description: 'רכישת תאורת LED' },
  { project_id: 3, title: 'התקנה', due_date: '2024-10-01', status: 'הושלם', description: 'התקנת התאורה החדשה' }
];

const sampleReports = [
  { project_id: 1, report_date: '2024-03-10', status: 'מאושר', notes: 'דיווח רבעון ראשון' },
  { project_id: 1, report_date: '2024-06-10', status: 'מאושר', notes: 'דיווח רבעון שני' },
  { project_id: 1, report_date: '2024-09-10', status: 'טיוטה', notes: 'דיווח רבעון שלישי' },
  
  { project_id: 2, report_date: '2024-08-15', status: 'מאושר', notes: 'דיווח התקדמות ראשוני' },
  
  { project_id: 3, report_date: '2024-05-01', status: 'מאושר', notes: 'דיווח סיום פרויקט' },
  
  { project_id: 5, report_date: '2024-04-20', status: 'מאושר', notes: 'דיווח התקדמות' }
];

const sampleFundingSources = [
  { project_id: 1, source_name: 'משרד החינוך', amount: 300000 },
  { project_id: 1, source_name: 'עירייה', amount: 200000 },
  
  { project_id: 2, source_name: 'משרד החינוך', amount: 600000 },
  { project_id: 2, source_name: 'עירייה', amount: 200000 },
  
  { project_id: 3, source_name: 'משרד התחבורה', amount: 200000 },
  { project_id: 3, source_name: 'עירייה', amount: 100000 },
  
  { project_id: 4, source_name: 'משרד איכות הסביבה', amount: 800000 },
  { project_id: 4, source_name: 'עירייה', amount: 400000 },
  
  { project_id: 5, source_name: 'משרד הרווחה', amount: 700000 },
  { project_id: 5, source_name: 'עירייה', amount: 250000 }
];

// יצירת תנועות כספיות לדוגמה
const sampleTransactions = [
  // פרויקט 1 - שיפוץ בית ספר
  { tabar_id: 1, transaction_type: 'חשבונית', supplier_name: 'חברת בנייה א', amount: 150000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-02-15', description: 'עבודות שיפוץ שלב ראשון' },
  { tabar_id: 1, transaction_type: 'חשבונית', supplier_name: 'חברת בנייה א', amount: 175000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-05-20', description: 'עבודות שיפוץ שלב שני' },
  
  // פרויקט 2 - גן ילדים
  { tabar_id: 2, transaction_type: 'חשבונית', supplier_name: 'אדריכל ב', amount: 50000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-07-10', description: 'שירותי תכנון' },
  { tabar_id: 2, transaction_type: 'חשבונית', supplier_name: 'חברת בנייה ג', amount: 70000, direction: 'חיוב', status: 'לא שולם', transaction_date: '2024-09-15', description: 'עבודות יסוד' },
  
  // פרויקט 3 - תאורה
  { tabar_id: 3, transaction_type: 'חשבונית', supplier_name: 'חברת תאורה ד', amount: 200000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-03-01', description: 'רכישת תאורת LED' },
  { tabar_id: 3, transaction_type: 'חשבונית', supplier_name: 'קבלן חשמל ה', amount: 95000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-08-15', description: 'התקנת תאורה' },
  
  // פרויקט 5 - מרכז קהילתי
  { tabar_id: 5, transaction_type: 'חשבונית', supplier_name: 'חברת בנייה ו', amount: 300000, direction: 'חיוב', status: 'שולם', transaction_date: '2024-04-01', description: 'עבודות בנייה ראשוניות' },
  { tabar_id: 5, transaction_type: 'חשבונית', supplier_name: 'ספק ציוד ז', amount: 80000, direction: 'חיוב', status: 'לא שולם', transaction_date: '2024-10-01', description: 'ציוד למרכז' }
];

async function addSampleData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 מוסיף פרויקטי דוגמה...');
    
    // הוספת פרויקטים
    for (const project of sampleProjects) {
      const result = await client.query(
        `INSERT INTO projects (name, type, department_id, start_date, end_date, budget_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [project.name, project.type, project.department_id, project.start_date, project.end_date, project.budget_amount, project.status]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ נוסף פרויקט: ${project.name}`);
      }
    }
    
    // הוספת אבני דרך
    console.log('📍 מוסיף אבני דרך...');
    for (const milestone of sampleMilestones) {
      await client.query(
        `INSERT INTO milestones (project_id, title, due_date, status, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [milestone.project_id, milestone.title, milestone.due_date, milestone.status, milestone.description]
      );
    }
    
    // הוספת דיווחים
    console.log('📊 מוסיף דיווחים...');
    for (const report of sampleReports) {
      await client.query(
        `INSERT INTO reports (project_id, report_date, status, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [report.project_id, report.report_date, report.status, report.notes]
      );
    }
    
    // הוספת מקורות מימון
    console.log('💰 מוסיף מקורות מימון...');
    for (const funding of sampleFundingSources) {
      await client.query(
        `INSERT INTO funding_sources (project_id, source_name, amount)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [funding.project_id, funding.source_name, funding.amount]
      );
    }
    
    // הוספת תנועות כספיות - מדלג על זה לעת עתה עד שהטבלה תתעדכן
    console.log('💸 מדלג על תנועות כספיות לעת עתה...');
    
    await client.query('COMMIT');
    console.log('🎉 הנתונים נוספו בהצלחה!');
    
    // סיכום
    const projectsCount = await client.query('SELECT COUNT(*) FROM projects');
    const milestonesCount = await client.query('SELECT COUNT(*) FROM milestones');
    const reportsCount = await client.query('SELECT COUNT(*) FROM reports');
    const transactionsCount = await client.query('SELECT COUNT(*) FROM tabar_transactions');
    
    console.log('\n📈 סיכום:');
    console.log(`- פרויקטים: ${projectsCount.rows[0].count}`);
    console.log(`- אבני דרך: ${milestonesCount.rows[0].count}`);
    console.log(`- דיווחים: ${reportsCount.rows[0].count}`);
    console.log(`- תנועות כספיות: ${transactionsCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ שגיאה בהוספת הנתונים:', error);
    throw error;
  } finally {
    client.release();
  }
}

// הרצת הסקריפט
addSampleData()
  .then(() => {
    console.log('✅ הסקריפט הסתיים בהצלחה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ הסקריפט נכשל:', error);
    process.exit(1);
  }); 