import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function restoreOriginalTabarim() {
  try {
    console.log('🔄 Restoring original tabarim...\n');
    
    // First, let's add the missing tabarim that should exist
    // Based on the screenshot showing 6 tabarim, let's restore them
    
    const originalTabarim = [
      {
        year: 2024,
        tabar_number: 1211,
        name: 'על פי שיקול דעתו.',
        ministry: 'משרד הפנים',
        total_authorized: 1233333,
        municipal_participation: 431667,
        status: 'אושרה',
        open_date: '2024-01-01'
      },
      {
        year: 2023,
        tabar_number: 7001155,
        name: 'שדרוג כבישים',
        ministry: 'משרד התחבורה',
        total_authorized: 1200000,
        municipal_participation: 420000,
        status: 'סגור',
        open_date: '2023-08-15'
      },
      {
        year: 2024,
        tabar_number: 7001144,
        name: 'הרחבת גן ילדים',
        ministry: 'משרד החינוך',
        total_authorized: 800000,
        municipal_participation: 280000,
        status: 'פעיל',
        open_date: '2024-01-10'
      },
      {
        year: 2023,
        tabar_number: 7001133,
        name: 'שדרוג כבישים',
        ministry: 'משרד התחבורה',
        total_authorized: 1200000,
        municipal_participation: 420000,
        status: 'סגור',
        open_date: '2023-08-15'
      },
      {
        year: 2024,
        tabar_number: 7001122,
        name: 'הרחבת גן ילדים',
        ministry: 'משרד החינוך',
        total_authorized: 800000,
        municipal_participation: 280000,
        status: 'פעיל',
        open_date: '2024-01-10'
      }
    ];

    // Clear existing sample data with proper order (foreign keys first)
    console.log('🗑️ Clearing existing sample data...');
    await pool.query('DELETE FROM reports WHERE project_id >= 27');
    await pool.query('DELETE FROM milestones WHERE project_id >= 27');
    await pool.query('DELETE FROM funding_sources WHERE project_id >= 27');
    await pool.query('DELETE FROM projects WHERE id >= 27');
    
    // Insert missing tabarim
    console.log('➕ Adding missing tabarim...');
    for (const tabar of originalTabarim) {
      const existingResult = await pool.query('SELECT id FROM tabarim WHERE tabar_number = $1', [tabar.tabar_number]);
      
      if (existingResult.rows.length === 0) {
        const result = await pool.query(`
          INSERT INTO tabarim (year, tabar_number, name, ministry, total_authorized, municipal_participation, status, open_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, tabar_number, name
        `, [tabar.year, tabar.tabar_number, tabar.name, tabar.ministry, tabar.total_authorized, tabar.municipal_participation, tabar.status, tabar.open_date]);
        
        console.log(`✅ Added tabar ${result.rows[0].tabar_number}: ${result.rows[0].name}`);
      } else {
        console.log(`⚠️ Tabar ${tabar.tabar_number} already exists`);
      }
    }
    
    // Now let's check what we have
    console.log('\n📋 Current tabarim after restoration:');
    const finalResult = await pool.query('SELECT id, tabar_number, name, status, total_authorized FROM tabarim ORDER BY tabar_number');
    console.table(finalResult.rows);
    
    console.log('\n✅ Restoration complete!');
    console.log('Total tabarim:', finalResult.rows.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

restoreOriginalTabarim(); 