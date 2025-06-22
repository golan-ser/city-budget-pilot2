import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function checkTableStructure() {
  try {
    console.log('🔍 CHECKING TABLE STRUCTURES\n');
    
    // Check tabarim table structure
    console.log('📋 TABARIM TABLE STRUCTURE:');
    const tabarimStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tabarim' 
      ORDER BY ordinal_position
    `);
    console.table(tabarimStructure.rows);
    
    // Check projects table structure
    console.log('\n📊 PROJECTS TABLE STRUCTURE:');
    const projectsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    console.table(projectsStructure.rows);
    
    // Check if projects table exists
    const projectsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      )
    `);
    
    console.log('\n🔍 TABLE STATUS:');
    console.log('Projects table exists:', projectsExists.rows[0].exists);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure(); 