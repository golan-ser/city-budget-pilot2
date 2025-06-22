import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function debugSyncIssue() {
  try {
    console.log('🔍 DEBUGGING SYNCHRONIZATION ISSUE\n');
    
    // 1. Check what the tabarim endpoint returns
    console.log('📋 1. TABARIM ENDPOINT DATA:');
    const tabarimQuery = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.total_authorized,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_from_transactions,
        COALESCE(SUM(CASE WHEN tt.direction = 'זיכוי' THEN tt.amount ELSE 0 END), 0) as credited_from_transactions
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name, t.total_authorized
      ORDER BY t.tabar_number
    `;
    const tabarimResult = await pool.query(tabarimQuery);
    console.table(tabarimResult.rows);
    
    // 2. Check what the projects endpoint returns
    console.log('\n📋 2. PROJECTS ENDPOINT DATA (same calculation):');
    const projectsQuery = `
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
          END, 0
        ) as utilization_percentage_calculated
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name, t.total_authorized
      ORDER BY t.tabar_number
    `;
    const projectsResult = await pool.query(projectsQuery);
    console.table(projectsResult.rows);
    
    // 3. Check individual tabar transactions
    console.log('\n📊 3. DETAILED TRANSACTIONS PER TABAR:');
    for (const tabar of tabarimResult.rows) {
      if (parseFloat(tabar.utilized_from_transactions) > 0) {
        console.log(`\n🔍 Tabar ${tabar.tabar_number} (${tabar.name}):`);
        const transactionsQuery = `
          SELECT 
            transaction_type,
            direction,
            amount,
            status,
            transaction_date,
            description
          FROM tabar_transactions 
          WHERE tabar_id = $1 
          ORDER BY transaction_date DESC
        `;
        const transactions = await pool.query(transactionsQuery, [tabar.id]);
        console.table(transactions.rows);
      }
    }
    
    // 4. Check if there's a mismatch in tabar controllers
    console.log('\n🔍 4. CHECKING TABAR CONTROLLER VS PROJECTS CONTROLLER:');
    console.log('Tabarim showing utilized amounts:', tabarimResult.rows.filter(r => parseFloat(r.utilized_from_transactions) > 0).map(r => ({
      tabar_number: r.tabar_number,
      utilized: r.utilized_from_transactions
    })));
    
    console.log('Projects showing utilized amounts:', projectsResult.rows.filter(r => parseFloat(r.utilized_amount) > 0).map(r => ({
      tabar_number: r.tabar_number,
      utilized: r.utilized_amount
    })));
    
    // 5. Test API endpoints directly
    console.log('\n🌐 5. TESTING API ENDPOINTS:');
    try {
      // Test tabarim endpoint
      const tabarimResponse = await fetch('http://localhost:3000/api/tabarim');
      const tabarimData = await tabarimResponse.json();
      console.log('Tabarim API first item utilization:', tabarimData[0]?.utilized || 'No utilization field');
      
      // Test projects endpoint
      const projectsResponse = await fetch('http://localhost:3000/api/projects');
      const projectsData = await projectsResponse.json();
      console.log('Projects API first item utilization:', projectsData[0]?.utilized || 'No utilization field');
      console.log('Projects API first item utilization_percentage:', projectsData[0]?.utilization_percentage || 'No percentage field');
      
    } catch (apiError) {
      console.error('API Error:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugSyncIssue(); 