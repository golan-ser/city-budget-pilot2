import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function simpleTest() {
  try {
    console.log('🔍 Simple test - checking data...\n');
    
    // First check if we have tabarim
    console.log('📋 Checking tabarim count:');
    const countResult = await pool.query('SELECT COUNT(*) FROM tabarim');
    console.log('Total tabarim:', countResult.rows[0].count);
    
    // Get basic tabarim data
    console.log('\n📋 Basic tabarim data:');
    const tabarimResult = await pool.query('SELECT id, tabar_number, name, status FROM tabarim ORDER BY tabar_number LIMIT 3');
    console.table(tabarimResult.rows);
    
    // Test the simplified query
    console.log('\n🔄 Testing simplified query:');
    const simpleQuery = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.status,
        t.total_authorized
      FROM tabarim t
      ORDER BY t.tabar_number
      LIMIT 5
    `;
    
    const result = await pool.query(simpleQuery);
    console.table(result.rows);
    
    console.log('\n✅ Data looks good! The issue might be in the API response or frontend connection.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

simpleTest(); 