import db from './db.js';

async function cleanAndSyncProjects() {
  try {
    console.log('🧹 מנקה פרויקטים קיימים...');
    
    // מחיקת כל הפרויקטים הקיימים (בסדר הנכון)
    await db.query('DELETE FROM documents WHERE report_id IN (SELECT id FROM reports WHERE project_id IN (SELECT id FROM projects))');
    await db.query('DELETE FROM comments WHERE report_id IN (SELECT id FROM reports WHERE project_id IN (SELECT id FROM projects))');
    await db.query('DELETE FROM reports WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM milestones WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM funding_sources WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM permissions WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM alerts WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM projects');
    
    console.log('✅ פרויקטים קיימים נמחקו');
    
    // יצירת פרויקטים מהתב"רים הקיימים
    console.log('🔄 יוצר פרויקטים מתב"רים...');
    
    const tabarimResult = await db.query(`
      SELECT 
        t.*,
        d.id as department_id
      FROM tabarim t
      LEFT JOIN departments d ON d.name = t.department
      WHERE t.status = 'פעיל'
      ORDER BY t.year DESC, t.tabar_number
    `);
    
    console.log(`📋 נמצאו ${tabarimResult.rows.length} תב"רים פעילים`);
    
    for (const tabar of tabarimResult.rows) {
      // יצירת פרויקט עבור כל תב"ר
      const projectResult = await db.query(`
        INSERT INTO projects (
          name, 
          type, 
          department_id, 
          tabar_id, 
          start_date, 
          end_date, 
          budget_amount, 
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name
      `, [
        tabar.name,
        'תבר',
        tabar.department_id,
        tabar.id,
        tabar.open_date,
        tabar.close_date,
        tabar.total_authorized,
        'פעיל'
      ]);
      
      const projectId = projectResult.rows[0].id;
      console.log(`✅ נוצר פרויקט: ${projectResult.rows[0].name} (ID: ${projectId})`);
      
      // הוספת אבני דרך ראליסטיות
      const milestones = [
        {
          title: 'אישור תקציב',
          due_date: new Date(tabar.open_date),
          status: 'הושלם',
          description: 'אישור תקציב התב"ר'
        },
        {
          title: 'התחלת ביצוע',
          due_date: new Date(new Date(tabar.open_date).getTime() + 30 * 24 * 60 * 60 * 1000), // +30 ימים
          status: 'הושלם',
          description: 'התחלת ביצוע הפרויקט'
        },
        {
          title: 'בדיקת התקדמות',
          due_date: new Date(new Date(tabar.open_date).getTime() + 90 * 24 * 60 * 60 * 1000), // +90 ימים
          status: 'בתהליך',
          description: 'בדיקת התקדמות והערכת מצב'
        }
      ];
      
      if (tabar.close_date) {
        milestones.push({
          title: 'סיום פרויקט',
          due_date: new Date(tabar.close_date),
          status: 'לא התחיל',
          description: 'סיום הפרויקט וסגירת התב"ר'
        });
      }
      
      for (const milestone of milestones) {
        await db.query(`
          INSERT INTO milestones (project_id, title, due_date, status, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [projectId, milestone.title, milestone.due_date, milestone.status, milestone.description]);
      }
      
      // הוספת דיווחים ראליסטיים
      const reports = [
        {
          report_date: new Date(new Date(tabar.open_date).getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'אושר',
          notes: 'דיווח התחלת פרויקט - הכל תקין'
        },
        {
          report_date: new Date(new Date(tabar.open_date).getTime() + 60 * 24 * 60 * 60 * 1000),
          status: 'אושר',
          notes: 'דיווח חודשי - התקדמות כמתוכנן'
        }
      ];
      
      for (const report of reports) {
        await db.query(`
          INSERT INTO reports (project_id, report_date, status, notes)
          VALUES ($1, $2, $3, $4)
        `, [projectId, report.report_date, report.status, report.notes]);
      }
    }
    
    // בדיקה סופית
    const finalCheck = await db.query(`
      SELECT 
        p.id, p.name, p.status,
        t.tabar_number, t.year, t.total_authorized,
        d.name as department_name,
        COUNT(DISTINCT m.id) as milestone_count,
        COUNT(DISTINCT r.id) as report_count
      FROM projects p
      LEFT JOIN tabarim t ON p.tabar_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN milestones m ON p.id = m.project_id
      LEFT JOIN reports r ON p.id = r.project_id
      GROUP BY p.id, p.name, p.status, t.tabar_number, t.year, t.total_authorized, d.name
      ORDER BY t.year DESC, t.tabar_number
    `);
    
    console.log('\n📋 פרויקטים חדשים (מתב"רים):');
    finalCheck.rows.forEach(row => {
      console.log(`ID: ${row.id} | תב"ר ${row.tabar_number}/${row.year} | ${row.name} | ${row.total_authorized?.toLocaleString()} ש"ח | ${row.department_name} | ${row.milestone_count} אבני דרך | ${row.report_count} דיווחים`);
    });
    
    console.log('\n🎉 סנכרון הושלם בהצלחה!');
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

cleanAndSyncProjects(); 