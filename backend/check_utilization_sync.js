import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function checkUtilizationSync() {
  try {
    console.log('🔍 Checking utilization data synchronization...\n');
    
    // Check tabar_transactions table
    console.log('📊 TABAR_TRANSACTIONS DATA:');
    const transactionsResult = await pool.query(`
      SELECT 
        tabar_id,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN direction = 'חיוב' THEN amount ELSE 0 END) as total_utilized,
        SUM(CASE WHEN direction = 'זיכוי' THEN amount ELSE 0 END) as total_credit
      FROM tabar_transactions 
      GROUP BY tabar_id 
      ORDER BY tabar_id
    `);
    console.table(transactionsResult.rows);
    
    // Check tabarim with utilization calculation
    console.log('\n📋 TABARIM WITH CALCULATED UTILIZATION:');
    const tabarimResult = await pool.query(`
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.total_authorized,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 2
        ) as utilization_percentage
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name, t.total_authorized
      ORDER BY t.tabar_number
    `);
    console.table(tabarimResult.rows);
    
    // Check what the API returns
    console.log('\n🌐 WHAT API SHOULD RETURN:');
    const apiQuery = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.total_authorized as budget,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 0
        ) as utilization_percentage
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name, t.total_authorized
      ORDER BY t.tabar_number
    `;
    
    const apiResult = await pool.query(apiQuery);
    console.table(apiResult.rows);
    
    console.log('\n💡 SOLUTION: Update projectsController to use this exact calculation');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUtilizationSync(); 