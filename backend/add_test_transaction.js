import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function addTestTransaction() {
  try {
    console.log('🧪 ADDING TEST TRANSACTION TO TABAR 1211\n');
    
    // First, get tabar 1211 details
    const tabarQuery = `SELECT id, tabar_number, name, total_authorized FROM tabarim WHERE tabar_number = 1211`;
    const tabarResult = await pool.query(tabarQuery);
    
    if (tabarResult.rows.length === 0) {
      console.log('❌ Tabar 1211 not found!');
      return;
    }
    
    const tabar = tabarResult.rows[0];
    console.log('📋 Found Tabar 1211:', {
      id: tabar.id,
      name: tabar.name,
      total_authorized: tabar.total_authorized
    });
    
    // Add a test transaction of 300,000
    const transactionAmount = 300000;
    console.log(`💰 Adding transaction of ${transactionAmount.toLocaleString()} ₪...`);
    
    await pool.query(`
      INSERT INTO tabar_transactions (
        tabar_id, 
        transaction_type, 
        direction, 
        amount, 
        status, 
        transaction_date, 
        description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      tabar.id,
      'חשבונית',
      'חיוב',
      transactionAmount,
      'שולם',
      new Date(),
      'עבודות פיתוח - בדיקת סינכרון'
    ]);
    
    console.log('✅ Transaction added successfully!');
    
    // Verify the new utilization
    console.log('\n🔍 CHECKING NEW UTILIZATION:');
    const utilizationQuery = `
      SELECT 
        t.tabar_number,
        t.name,
        t.total_authorized,
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
      WHERE t.tabar_number = 1211
      GROUP BY t.id, t.tabar_number, t.name, t.total_authorized
    `;
    
    const utilizationResult = await pool.query(utilizationQuery);
    const newUtilization = utilizationResult.rows[0];
    
    console.log('📊 NEW UTILIZATION FOR TABAR 1211:');
    console.log(`   - Total Authorized: ${Number(newUtilization.total_authorized).toLocaleString()} ₪`);
    console.log(`   - Utilized: ${Number(newUtilization.utilized).toLocaleString()} ₪`);
    console.log(`   - Utilization %: ${newUtilization.utilization_percentage}%`);
    
    console.log('\n🎯 Expected result in frontend:');
    console.log(`   - Tabar 1211 should now show ${newUtilization.utilization_percentage}% utilization`);
    console.log(`   - Refresh the projects page to see the change!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addTestTransaction(); 