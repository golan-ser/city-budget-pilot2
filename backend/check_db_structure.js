import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking current database structure...\n');
    
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
    console.log('\n📋 PROJECTS TABLE STRUCTURE:');
    const projectsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    console.table(projectsStructure.rows);
    
    // Check tabarim data
    console.log('\n📋 TABARIM DATA:');
    const tabarimResult = await pool.query('SELECT * FROM tabarim ORDER BY id LIMIT 10');
    console.table(tabarimResult.rows);
    
    // Check projects data
    console.log('\n📋 PROJECTS DATA:');
    const projectsResult = await pool.query('SELECT * FROM projects ORDER BY id LIMIT 10');
    console.table(projectsResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure(); 