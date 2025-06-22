import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function checkTabarimData() {
  try {
    console.log('🔍 Checking current tabarim data...\n');
    
    // Check all tabarim
    console.log('📋 ALL TABARIM:');
    const tabarimResult = await pool.query('SELECT id, tabar_number, name, status, total_authorized FROM tabarim ORDER BY id');
    console.table(tabarimResult.rows);
    
    // Check relationship issues
    console.log('\n🔗 RELATIONSHIP ISSUES:');
    const relationshipResult = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.tabar_id as project_tabar_id,
        p.tabar_number as project_tabar_number,
        t.id as actual_tabar_id,
        t.tabar_number as actual_tabar_number,
        t.name as actual_tabar_name,
        CASE 
          WHEN p.tabar_id = t.id AND p.tabar_number = t.tabar_number THEN '✅ OK'
          WHEN p.tabar_id = t.id AND p.tabar_number != t.tabar_number THEN '⚠️ Number mismatch'
          WHEN p.tabar_id != t.id AND p.tabar_number = t.tabar_number THEN '⚠️ ID mismatch'
          ELSE '❌ Complete mismatch'
        END as status
      FROM projects p
      LEFT JOIN tabarim t ON p.tabar_id = t.id
      ORDER BY p.id
    `);
    console.table(relationshipResult.rows);
    
    console.log('\n💡 SUGGESTED FIXES:');
    console.log('1. Restore missing tabarim from original data');
    console.log('2. Fix project relationships to match actual tabar_numbers');
    console.log('3. Ensure tabar_id points to correct tabar record');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTabarimData(); 