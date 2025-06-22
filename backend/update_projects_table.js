import db from './db.js';

async function updateProjectsTable() {
  try {
    console.log('🔧 מעדכן טבלת projects...');
    
    // בדיקה אם העמודה כבר קיימת
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'tabar_id'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('➕ מוסיף עמודת tabar_id...');
      await db.query('ALTER TABLE projects ADD COLUMN tabar_id INTEGER REFERENCES tabarim(id)');
      console.log('✅ עמודת tabar_id נוספה בהצלחה');
    } else {
      console.log('✅ עמודת tabar_id כבר קיימת');
    }
    
    // בדיקת המבנה החדש
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 מבנה טבלת projects:');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    process.exit(0);
  }
}

updateProjectsTable(); 