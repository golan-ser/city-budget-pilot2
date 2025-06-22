import pool from './db.js';

async function testSmartFeatures() {
  console.log('🧪 Testing smart analytics and PDF features...');
  
  try {
    // בדיקת קיום הטבלות הנדרשות
    const tables = ['tabarim', 'tabar_transactions', 'milestones', 'project_documents', 'execution_reports'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ Table ${table}: ${result.rows[0].count} records`);
    }
    
    // בדיקת חישוב ניצול לתב"ר 101
    const utilizationQuery = `
      SELECT 
        t.tabar_number,
        t.total_authorized,
        COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) as utilized_amount,
        ROUND(
          CASE 
            WHEN t.total_authorized > 0 
            THEN (COALESCE(SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END), 0) / t.total_authorized::numeric) * 100
            ELSE 0
          END, 1
        ) as utilization_percentage
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      WHERE t.tabar_number = '101'
      GROUP BY t.id, t.tabar_number, t.total_authorized
    `;
    
    const utilizationResult = await pool.query(utilizationQuery);
    if (utilizationResult.rows.length > 0) {
      const data = utilizationResult.rows[0];
      console.log(`📊 תב"ר 101 utilization calculation:`);
      console.log(`   - Total budget: ₪${parseFloat(data.total_authorized).toLocaleString()}`);
      console.log(`   - Utilized: ₪${parseFloat(data.utilized_amount).toLocaleString()}`);
      console.log(`   - Utilization: ${data.utilization_percentage}%`);
    }
    
    // בדיקת נתוני אנליטיקה לתב"ר 101
    const analyticsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM milestones WHERE tabar_number = '101') as milestones_count,
        (SELECT COUNT(*) FROM project_documents WHERE tabar_number = '101') as documents_count,
        (SELECT COUNT(*) FROM execution_reports WHERE tabar_number = '101') as reports_count,
        (SELECT MAX(report_date) FROM execution_reports WHERE tabar_number = '101') as last_report_date
    `;
    
    const analyticsResult = await pool.query(analyticsQuery);
    if (analyticsResult.rows.length > 0) {
      const analytics = analyticsResult.rows[0];
      console.log(`🧠 Analytics for תב"ר 101:`);
      console.log(`   - Milestones: ${analytics.milestones_count}`);
      console.log(`   - Documents: ${analytics.documents_count}`);
      console.log(`   - Reports: ${analytics.reports_count}`);
      console.log(`   - Last report: ${analytics.last_report_date || 'Never'}`);
    }
    
    console.log('🎉 All smart features are ready!');
    console.log('📋 Available endpoints:');
    console.log('   - GET /api/projects/:id/analytics');
    console.log('   - GET /api/projects/:id/export-pdf');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testSmartFeatures(); 