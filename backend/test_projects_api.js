import db from './db.js';

async function testProjectsAPI() {
  try {
    console.log('🧪 בודק API של פרויקטים...');
    
    // בדיקת הנתונים בדאטאבייס
    const result = await db.query(`
      SELECT 
        p.id, p.name, p.tabar_number, p.status,
        t.year, t.tabar_number as t_tabar_number, t.name as tabar_name,
        COUNT(DISTINCT m.id) as milestone_count,
        COUNT(DISTINCT r.id) as report_count
      FROM projects p
      LEFT JOIN tabarim t ON p.tabar_id = t.id
      LEFT JOIN milestones m ON p.id = m.project_id
      LEFT JOIN reports r ON p.id = r.project_id
      GROUP BY p.id, p.name, p.tabar_number, p.status, t.year, t.tabar_number, t.name
      ORDER BY t.year DESC, p.tabar_number
    `);
    
    console.log('\n📋 פרויקטים בדאטאבייס:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | פרויקט: ${row.name} | תב"ר ${row.tabar_number}/${row.year} | ${row.status} | ${row.milestone_count} אבני דרך | ${row.report_count} דיווחים`);
    });
    
    console.log(`\n📊 סה"כ ${result.rows.length} פרויקטים`);
    
    // בדיקת התאמה בין מספרי התב"רים
    const mismatchCheck = await db.query(`
      SELECT 
        p.id, p.name, p.tabar_number as project_tabar, t.tabar_number as tabar_tabar
      FROM projects p
      LEFT JOIN tabarim t ON p.tabar_id = t.id
      WHERE p.tabar_number != t.tabar_number OR p.tabar_number IS NULL OR t.tabar_number IS NULL
    `);
    
    if (mismatchCheck.rows.length > 0) {
      console.log('\n⚠️  אי התאמות במספרי תב"ר:');
      mismatchCheck.rows.forEach(row => {
        console.log(`פרויקט ${row.id}: ${row.project_tabar} vs תב"ר: ${row.tabar_tabar}`);
      });
    } else {
      console.log('\n✅ כל מספרי התב"ר תואמים!');
    }
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

testProjectsAPI(); 