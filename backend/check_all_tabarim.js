import db from './db.js';

async function checkAllTabarim() {
  try {
    console.log('🔍 בודק כל התב"רים...');
    
    const result = await db.query(`
      SELECT id, year, tabar_number, name, total_authorized, status, department, open_date, close_date
      FROM tabarim 
      ORDER BY year DESC, tabar_number
    `);
    
    console.log('\n📋 כל התב"רים:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | תב"ר ${row.tabar_number}/${row.year} | ${row.name} | ${row.total_authorized?.toLocaleString()} ש"ח | ${row.status} | ${row.department} | ${row.open_date} - ${row.close_date}`);
    });
    
    console.log(`\n📊 סה"כ ${result.rows.length} תב"רים`);
    
    // בדיקת התב"רים לפי סטטוס
    const statusCheck = await db.query(`
      SELECT status, COUNT(*) as count
      FROM tabarim 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('\n📊 פילוח לפי סטטוס:');
    statusCheck.rows.forEach(row => {
      console.log(`${row.status}: ${row.count} תב"רים`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

checkAllTabarim(); 