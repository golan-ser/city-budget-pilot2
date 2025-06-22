import db from './db.js';

async function checkTabarNumbers() {
  try {
    console.log('🔍 Checking tabar_numbers in database...');
    
    const result = await db.query(`
      SELECT tabar_number, COUNT(*) as count 
      FROM project_documents 
      GROUP BY tabar_number 
      ORDER BY tabar_number
    `);
    
    console.log('\n📊 Documents by tabar_number:');
    result.rows.forEach(row => {
      console.log(`  ${row.tabar_number}: ${row.count} documents`);
    });
    
    // Also check what's in the projects table
    const projectsResult = await db.query(`
      SELECT id, name, tabar_number 
      FROM projects 
      WHERE id = 5 OR tabar_number = 5
      LIMIT 5
    `);
    
    console.log('\n📋 Projects with ID 5 or tabar_number 5:');
    projectsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Tabar: ${row.tabar_number}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTabarNumbers(); 