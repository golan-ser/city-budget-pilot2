import db from './db.js';

async function checkSchema() {
  try {
    console.log('🔍 Checking project_documents table schema...');
    
    // Check column types
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'project_documents' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 project_documents columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if table exists and has data
    const countResult = await db.query('SELECT COUNT(*) as count FROM project_documents');
    console.log(`\n📈 Total records: ${countResult.rows[0].count}`);
    
    // Check sample data
    const sampleResult = await db.query('SELECT * FROM project_documents LIMIT 3');
    console.log('\n📋 Sample data:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  Row ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema(); 