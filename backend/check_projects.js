import db from './db.js';

async function checkProjects() {
  try {
    console.log('🔍 Checking projects table...');
    
    // Check table structure
    const schemaResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Projects table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check projects data
    const projectsResult = await db.query(`
      SELECT id, name, tabar_number 
      FROM projects 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n📋 Projects data:');
    projectsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Tabar: ${row.tabar_number}`);
    });
    
    // Check if there's a project with integer ID 5
    const project5Result = await db.query(`
      SELECT id, name, tabar_number 
      FROM projects 
      WHERE CAST(id AS TEXT) = '5'
    `);
    
    console.log('\n🔍 Project with ID matching "5":');
    if (project5Result.rows.length > 0) {
      project5Result.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.name}, Tabar: ${row.tabar_number}`);
      });
    } else {
      console.log('  No project found with ID matching "5"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProjects(); 