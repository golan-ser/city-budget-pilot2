import db from './db.js';

async function createAllProjectsFromTabarim() {
  try {
    console.log('🧹 מנקה פרויקטים קיימים...');
    
    // מחיקת פרויקטים קיימים
    await db.query('DELETE FROM documents WHERE report_id IN (SELECT id FROM reports WHERE project_id IN (SELECT id FROM projects))');
    await db.query('DELETE FROM comments WHERE report_id IN (SELECT id FROM reports WHERE project_id IN (SELECT id FROM projects))');
    await db.query('DELETE FROM reports WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM milestones WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM funding_sources WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM permissions WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM alerts WHERE project_id IN (SELECT id FROM projects)');
    await db.query('DELETE FROM projects');
    
    console.log('✅ פרויקטים קיימים נמחקו');
    
    // יצירת פרויקטים מכל התב"רים
    console.log('🔄 יוצר פרויקטים מכל התב"רים...');
    
    const tabarimResult = await db.query(`
      SELECT 
        t.*,
        d.id as department_id
      FROM tabarim t
      LEFT JOIN departments d ON d.name = t.department
      ORDER BY t.year DESC, t.tabar_number
    `);
    
    console.log(`📋 נמצאו ${tabarimResult.rows.length} תב"רים`);
    
    for (const tabar of tabarimResult.rows) {
      // קביעת סטטוס הפרויקט לפי סטטוס התב"ר
      let projectStatus = 'פעיל';
      if (tabar.status === 'סגור') projectStatus = 'הסתיים';
      if (tabar.status === 'אושרה') projectStatus = 'מאושר';
      
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
        projectStatus
      ]);
      
      const projectId = projectResult.rows[0].id;
      console.log(`✅ נוצר פרויקט: ${projectResult.rows[0].name} (ID: ${projectId}) - תב"ר ${tabar.tabar_number}/${tabar.year}`);
      
      // הוספת אבני דרך לפי מספר התב"ר
      let milestones = [];
      
      if (tabar.tabar_number === 101) {
        // תב"ר 101 - הרחבת גן ילדים
        milestones = [
          {
            title: 'אישור תקציב ומשרד החינוך',
            due_date: new Date(tabar.open_date),
            status: 'הושלם',
            description: 'קבלת אישור תקציבי ומקצועי ממשרד החינוך'
          },
          {
            title: 'תכנון אדריכלי וקבלת היתרים',
            due_date: new Date(new Date(tabar.open_date).getTime() + 45 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'פעיל' ? 'הושלם' : 'הושלם',
            description: 'הכנת תוכניות אדריכליות וקבלת היתרי בנייה'
          },
          {
            title: 'מכרז קבלנים',
            due_date: new Date(new Date(tabar.open_date).getTime() + 75 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'פעיל' ? 'בתהליך' : 'הושלם',
            description: 'פרסום מכרז ובחירת קבלן ביצוע'
          },
          {
            title: 'תחילת עבודות בנייה',
            due_date: new Date(new Date(tabar.open_date).getTime() + 120 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'פעיל' ? 'לא התחיל' : 'הושלם',
            description: 'התחלת עבודות הרחבה פיזיות'
          },
          {
            title: 'השלמת בנייה וגימור',
            due_date: new Date(new Date(tabar.open_date).getTime() + 300 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'סגור' ? 'הושלם' : 'לא התחיל',
            description: 'השלמת עבודות הבנייה והגימור'
          }
        ];
      } else if (tabar.tabar_number === 202) {
        // תב"ר 202 - שדרוג כבישים
        milestones = [
          {
            title: 'אישור תקציב ממשרד התחבורה',
            due_date: new Date(tabar.open_date),
            status: 'הושלם',
            description: 'קבלת אישור תקציבי ממשרד התחבורה'
          },
          {
            title: 'סקר תנועה ותכנון מסלולים',
            due_date: new Date(new Date(tabar.open_date).getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'הושלם',
            description: 'ביצוע סקר תנועה ותכנון מסלולי עבודה'
          },
          {
            title: 'רכישת חומרים ואישור ספקים',
            due_date: new Date(new Date(tabar.open_date).getTime() + 60 * 24 * 60 * 60 * 1000),
            status: 'הושלם',
            description: 'רכישת אספלט וחומרי בנייה'
          },
          {
            title: 'ביצוע עבודות שדרוג',
            due_date: new Date(new Date(tabar.open_date).getTime() + 120 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'סגור' ? 'הושלם' : 'בתהליך',
            description: 'ביצוע עבודות השדרוג בשלבים'
          },
          {
            title: 'בדיקות איכות וסיום',
            due_date: new Date(new Date(tabar.open_date).getTime() + 180 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'סגור' ? 'הושלם' : 'לא התחיל',
            description: 'בדיקות איכות וסיום הפרויקט'
          }
        ];
      } else if (tabar.tabar_number === 1211) {
        // תב"ר 1211 - פרויקט מיוחד
        milestones = [
          {
            title: 'אישור ועדת היגוי',
            due_date: new Date(tabar.open_date),
            status: 'הושלם',
            description: 'קבלת אישור מועדת ההיגוי העירונית'
          },
          {
            title: 'הכנת תכנית עבודה מפורטת',
            due_date: new Date(new Date(tabar.open_date).getTime() + 14 * 24 * 60 * 60 * 1000),
            status: tabar.status === 'אושרה' ? 'בתהליך' : 'לא התחיל',
            description: 'הכנת תכנית עבודה מפורטת וציר זמנים'
          },
          {
            title: 'גיוס צוות פרויקט',
            due_date: new Date(new Date(tabar.open_date).getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'לא התחיל',
            description: 'גיוס והכשרת צוות הפרויקט'
          },
          {
            title: 'השלמת יעד ביניים',
            due_date: tabar.close_date ? new Date(tabar.close_date) : new Date(new Date(tabar.open_date).getTime() + 41 * 24 * 60 * 60 * 1000),
            status: 'לא התחיל',
            description: 'השלמת יעדי הביניים של הפרויקט'
          }
        ];
      }
      
      // הוספת אבני הדרך
      for (const milestone of milestones) {
        await db.query(`
          INSERT INTO milestones (project_id, title, due_date, status, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [projectId, milestone.title, milestone.due_date, milestone.status, milestone.description]);
      }
      
      // הוספת דיווחים לפי סטטוס התב"ר
      const reports = [];
      
      if (tabar.status === 'פעיל' || tabar.status === 'סגור') {
        reports.push({
          report_date: new Date(new Date(tabar.open_date).getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'אושר',
          notes: `דיווח התחלת פרויקט תב"ר ${tabar.tabar_number}/${tabar.year} - התחלה מוצלחת`
        });
        
        if (tabar.status === 'סגור') {
          reports.push({
            report_date: new Date(new Date(tabar.open_date).getTime() + 90 * 24 * 60 * 60 * 1000),
            status: 'אושר',
            notes: 'דיווח סיום פרויקט - הושלם בהצלחה'
          });
        } else {
          reports.push({
            report_date: new Date(new Date(tabar.open_date).getTime() + 60 * 24 * 60 * 60 * 1000),
            status: 'אושר',
            notes: 'דיווח חודשי - התקדמות כמתוכנן'
          });
        }
      } else if (tabar.status === 'אושרה') {
        reports.push({
          report_date: new Date(tabar.open_date),
          status: 'טיוטה',
          notes: 'דיווח ראשוני - פרויקט מאושר וממתין להתחלה'
        });
      }
      
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
    
    console.log('\n📋 פרויקטים חדשים (מכל התב"רים):');
    finalCheck.rows.forEach(row => {
      console.log(`ID: ${row.id} | תב"ר ${row.tabar_number}/${row.year} | ${row.name} | ${row.total_authorized?.toLocaleString()} ש"ח | ${row.department_name || 'לא מוגדר'} | ${row.status} | ${row.milestone_count} אבני דרך | ${row.report_count} דיווחים`);
    });
    
    console.log('\n🎉 יצירת פרויקטים מכל התב"רים הושלמה בהצלחה!');
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

createAllProjectsFromTabarim(); 