import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function syncTabarimToProjects() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 SYNCING TABARIM TO PROJECTS TABLE\n');
    
    await client.query('BEGIN');
    
    // 1. Clear existing projects
    console.log('🗑️  Clearing existing projects...');
    await client.query('DELETE FROM projects');
    
    // 2. Get all tabarim
    console.log('📋 Fetching all tabarim...');
    const tabarimResult = await client.query(`
      SELECT * FROM tabarim ORDER BY tabar_number
    `);
    
    console.log(`Found ${tabarimResult.rows.length} tabarim to sync`);
    
    // 3. Insert each tabar as a project
    for (const tabar of tabarimResult.rows) {
      console.log(`📊 Syncing Tabar ${tabar.tabar_number}: ${tabar.name}`);
      
      await client.query(`
        INSERT INTO projects (
          tabar_number, name, year, ministry, total_authorized, 
          municipal_participation, additional_funders, 
          open_date, close_date, status, permission_number, department
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        tabar.tabar_number,
        tabar.name,
        tabar.year,
        tabar.ministry,
        tabar.total_authorized,
        tabar.municipal_participation,
        tabar.additional_funders,
        tabar.open_date,
        tabar.close_date,
        tabar.status,
        tabar.permission_number,
        tabar.department
      ]);
    }
    
    await client.query('COMMIT');
    
    // 4. Verify sync
    console.log('\n✅ SYNC COMPLETED! Verifying...');
    const projectsResult = await client.query('SELECT COUNT(*) as count FROM projects');
    const projectsCount = projectsResult.rows[0].count;
    
    console.log(`📊 Projects synced: ${projectsCount}`);
    console.log(`📋 Original tabarim: ${tabarimResult.rows.length}`);
    
    if (projectsCount == tabarimResult.rows.length) {
      console.log('🎉 PERFECT SYNC! All tabarim are now available as projects.');
    } else {
      console.log('❌ SYNC MISMATCH! Some data may be missing.');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Sync Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

syncTabarimToProjects(); 