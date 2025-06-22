import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function debugController() {
  try {
    console.log('🐛 Debugging controller logic...\n');
    
    // Test the exact query from the controller
    const query = `
      SELECT 
        t.id,
        t.tabar_number,
        t.name,
        t.year,
        t.ministry,
        t.total_authorized,
        t.municipal_participation,
        t.additional_funders,
        t.open_date,
        t.close_date,
        t.status,
        t.permission_number,
        t.department,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
        COUNT(DISTINCT tt.id) as transaction_count
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name, t.year, t.ministry, t.total_authorized, 
               t.municipal_participation, t.additional_funders, t.open_date, t.close_date, 
               t.status, t.permission_number, t.department
      ORDER BY t.tabar_number
    `;

    console.log('📋 Running controller query...');
    const result = await pool.query(query);
    console.log('Query result count:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('First row:', result.rows[0]);
      
      // Test the mapping logic
      console.log('\n🔄 Testing mapping logic...');
      const projects = result.rows.map(tabar => ({
        id: tabar.id,
        name: tabar.name,
        type: 'תב"ר',
        department: tabar.department || tabar.ministry,
        tabar: {
          year: tabar.year,
          number: tabar.tabar_number,
          name: tabar.name,
          budget: tabar.total_authorized,
          municipal_participation: tabar.municipal_participation,
          additional_funders: tabar.additional_funders,
          permission_number: tabar.permission_number,
          status: tabar.status
        },
        budget: parseFloat(tabar.total_authorized || 0),
        utilized: parseFloat(tabar.utilized_amount || 0),
        utilization_percentage: tabar.total_authorized ? 
          Math.round((parseFloat(tabar.utilized_amount || 0) / parseFloat(tabar.total_authorized)) * 100) : 0,
        status: tabar.status,
        start_date: tabar.open_date,
        end_date: tabar.close_date,
        milestone_count: 0,
        report_count: 0,
        last_report_date: null,
        transaction_count: parseInt(tabar.transaction_count || 0),
        created_at: tabar.open_date
      }));
      
      console.log('Mapped projects count:', projects.length);
      console.log('First mapped project:', JSON.stringify(projects[0], null, 2));
    } else {
      console.log('❌ No rows returned from query!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugController(); 