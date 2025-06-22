import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function checkAllData() {
  try {
    console.log('🔍 CHECKING ALL DATA\n');
    
    // 1. Check all tabarim
    console.log('📋 ALL TABARIM:');
    const tabarimQuery = `SELECT id, tabar_number, name, status FROM tabarim ORDER BY tabar_number`;
    const tabarimResult = await pool.query(tabarimQuery);
    console.table(tabarimResult.rows);
    
    // 2. Check all projects
    console.log('\n📊 ALL PROJECTS:');
    const projectsQuery = `SELECT id, tabar_number, name, status FROM projects ORDER BY tabar_number`;
    const projectsResult = await pool.query(projectsQuery);
    console.table(projectsResult.rows);
    
    // 3. Check if projects table exists and has data
    console.log('\n🔍 PROJECTS TABLE STATUS:');
    const projectsCountQuery = `SELECT COUNT(*) as count FROM projects`;
    const projectsCount = await pool.query(projectsCountQuery);
    console.log(`Projects count: ${projectsCount.rows[0].count}`);
    
    // 4. Check if the frontend is using projects or tabarim endpoint
    console.log('\n🌐 ENDPOINT COMPARISON:');
    console.log('Tabarim count:', tabarimResult.rows.length);
    console.log('Projects count:', projectsResult.rows.length);
    
    if (projectsResult.rows.length === 0) {
      console.log('⚠️  ISSUE: Projects table is empty! Frontend might be showing projects instead of tabarim.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllData(); 