import db from './db.js';

async function checkTabarim() {
  try {
    console.log('🔍 בודק תב"רים קיימים...');
    
    const result = await db.query(`
      SELECT id, year, tabar_number, name, total_authorized, status 
      FROM tabarim 
      ORDER BY year DESC, tabar_number
    `);
    
    console.log('\n📋 תב"רים קיימים:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | תב"ר ${row.tabar_number}/${row.year} | ${row.name} | ${row.total_authorized?.toLocaleString()} ש"ח | ${row.status}`);
    });
    
    console.log(`\n📊 סה"כ ${result.rows.length} תב"רים`);
    
    // בדיקת פרויקטים קיימים
    const projectsResult = await db.query('SELECT id, name, tabar_id FROM projects');
    console.log(`\n📋 פרויקטים קיימים: ${projectsResult.rows.length}`);
    projectsResult.rows.forEach(row => {
      console.log(`ID: ${row.id} | ${row.name} | תב"ר ID: ${row.tabar_id || 'לא מחובר'}`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

checkTabarim(); 