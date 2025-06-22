import db from './db.js';

async function connectProjectsToTabarim() {
  try {
    console.log('🔗 מחבר פרויקטים לתב"רים...');
    
    // חיבור הפרויקטים הקיימים לתב"רים
    await db.query('UPDATE projects SET tabar_id = 1, type = \'תבר\' WHERE id = 14'); // שדרוג מערכת תאורה -> הרחבת גן ילדים
    await db.query('UPDATE projects SET tabar_id = 3, type = \'תבר\' WHERE id = 15'); // פארק חדש -> הרחבת גן ילדים השני
    await db.query('UPDATE projects SET tabar_id = 2, type = \'תבר\' WHERE id = 16'); // מרכז קהילתי -> שדרוג כבישים
    
    console.log('✅ חיבור פרויקטים קיימים הושלם');
    
    // יצירת פרויקטים חדשים המחוברים לתב"רים
    const newProjects = [
      {
        name: 'שיפוץ בית ספר יסודי',
        type: 'תבר',
        tabar_id: 1,
        department_id: 2, // חינוך
        start_date: '2024-01-15',
        end_date: '2024-12-31',
        budget_amount: 800000,
        status: 'פעיל'
      },
      {
        name: 'פיתוח פארק שכונתי',
        type: 'תבר',
        tabar_id: 3,
        department_id: 4, // תרבות
        start_date: '2024-03-01',
        end_date: '2024-11-30',
        budget_amount: 800000,
        status: 'פעיל'
      },
      {
        name: 'שדרוג מערכת ביוב',
        type: 'תבר',
        tabar_id: 2,
        department_id: 1, // הנדסה
        start_date: '2023-08-15',
        end_date: '2024-06-30',
        budget_amount: 1200000,
        status: 'בביצוע'
      }
    ];
    
    for (const project of newProjects) {
      const result = await db.query(`
        INSERT INTO projects (name, type, department_id, tabar_id, start_date, end_date, budget_amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name
      `, [
        project.name,
        project.type,
        project.department_id,
        project.tabar_id,
        project.start_date,
        project.end_date,
        project.budget_amount,
        project.status
      ]);
      
      console.log(`✅ נוצר פרויקט: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }
    
    // הוספת אבני דרך לפרויקטים
    const milestones = [
      { project_id: 14, title: 'אישור תכנון', due_date: '2024-02-15', status: 'הושלם' },
      { project_id: 14, title: 'התחלת עבודות', due_date: '2024-03-01', status: 'בתהליך' },
      { project_id: 15, title: 'סקר קרקע', due_date: '2024-04-01', status: 'לא התחיל' },
      { project_id: 16, title: 'אישורי בנייה', due_date: '2024-05-01', status: 'לא התחיל' }
    ];
    
    for (const milestone of milestones) {
      await db.query(`
        INSERT INTO milestones (project_id, title, due_date, status)
        VALUES ($1, $2, $3, $4)
      `, [milestone.project_id, milestone.title, milestone.due_date, milestone.status]);
    }
    
    console.log('✅ אבני דרך נוספו');
    
    // הוספת דיווחים
    const reports = [
      { project_id: 14, report_date: '2024-01-31', status: 'אושר', notes: 'התקדמות טובה' },
      { project_id: 15, report_date: '2024-02-28', status: 'טיוטה', notes: 'ממתין לאישור' },
      { project_id: 16, report_date: '2024-03-31', status: 'אושר', notes: 'בזמן' }
    ];
    
    for (const report of reports) {
      await db.query(`
        INSERT INTO reports (project_id, report_date, status, notes)
        VALUES ($1, $2, $3, $4)
      `, [report.project_id, report.report_date, report.status, report.notes]);
    }
    
    console.log('✅ דיווחים נוספו');
    
    // בדיקה סופית
    const finalCheck = await db.query(`
      SELECT 
        p.id, p.name, p.type, p.status,
        t.tabar_number, t.year, t.name as tabar_name,
        d.name as department_name
      FROM projects p
      LEFT JOIN tabarim t ON p.tabar_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY p.id
    `);
    
    console.log('\n📋 פרויקטים מחוברים:');
    finalCheck.rows.forEach(row => {
      console.log(`ID: ${row.id} | ${row.name} | תב"ר ${row.tabar_number}/${row.year} | ${row.department_name} | ${row.status}`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

connectProjectsToTabarim(); 