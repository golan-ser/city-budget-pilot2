import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function updateProjectsController() {
  try {
    console.log('🔧 Updating projects controller to use proper tabar relationships...\n');
    
    // Let's check the current state and update the controller
    console.log('📋 Current tabarim and their relationships:');
    const tabarimResult = await pool.query(`
      SELECT 
        t.id as tabar_id,
        t.tabar_number,
        t.name,
        t.status,
        t.total_authorized,
        COUNT(p.id) as project_count
      FROM tabarim t
      LEFT JOIN projects p ON p.tabar_id = t.id
      GROUP BY t.id, t.tabar_number, t.name, t.status, t.total_authorized
      ORDER BY t.tabar_number
    `);
    console.table(tabarimResult.rows);
    
    console.log('\n🎯 The solution is to update the projects controller to:');
    console.log('1. Create projects dynamically from tabarim data');
    console.log('2. Use JOIN queries to combine tabar and project data');
    console.log('3. Return consistent data structure to frontend');
    
    console.log('\n📝 Updated controller logic needed:');
    console.log(`
    // In projectsController.js - getAllProjects function:
    const query = \`
      SELECT 
        t.id as tabar_id,
        t.tabar_number,
        t.name,
        t.status,
        t.total_authorized as budget,
        t.open_date as start_date,
        t.close_date as end_date,
        COALESCE(SUM(tt.amount), 0) as utilized_amount,
        COUNT(DISTINCT m.id) as milestone_count,
        COUNT(DISTINCT r.id) as report_count,
        MAX(r.report_date) as last_report_date
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON tt.tabar_id = t.id
      LEFT JOIN milestones m ON m.project_id = t.id  
      LEFT JOIN reports r ON r.project_id = t.id
      GROUP BY t.id, t.tabar_number, t.name, t.status, t.total_authorized, t.open_date, t.close_date
      ORDER BY t.tabar_number
    \`;
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateProjectsController(); 