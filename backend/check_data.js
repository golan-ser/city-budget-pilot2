import db from './db.js';

async function checkData() {
  try {
    console.log('🔍 בדיקת נתונים בבסיס הנתונים...\n');
    
    // בדיקת תב"רים
    const tabarimQuery = `
      SELECT 
        tabar_number, 
        name, 
        status, 
        total_authorized,
        created_at
      FROM tabarim 
      ORDER BY tabar_number
    `;
    
    const tabarimResult = await db.query(tabarimQuery);
    console.log(`📊 נמצאו ${tabarimResult.rows.length} תב"רים:`);
    tabarimResult.rows.forEach(row => {
      console.log(`  - ${row.tabar_number}: ${row.name}`);
      console.log(`    סטטוס: ${row.status}, תקציב: ₪${row.total_authorized}`);
      console.log(`    נוצר: ${row.created_at}\n`);
    });
    
    // בדיקת עסקאות
    const transactionsQuery = `
      SELECT COUNT(*) as count, 
             SUM(CASE WHEN direction = 'חיוב' THEN amount ELSE 0 END) as total_expenses,
             SUM(CASE WHEN direction = 'כניסה' THEN amount ELSE 0 END) as total_income
      FROM tabar_transactions
    `;
    
    const transactionsResult = await db.query(transactionsQuery);
    const transData = transactionsResult.rows[0];
    console.log(`💰 עסקאות: ${transData.count} סה"כ`);
    console.log(`  הוצאות: ₪${transData.total_expenses || 0}`);
    console.log(`  הכנסות: ₪${transData.total_income || 0}\n`);
    
    // בדיקת סטטוסים
    const statusQuery = `
      SELECT status, COUNT(*) as count, SUM(total_authorized) as total_budget
      FROM tabarim 
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const statusResult = await db.query(statusQuery);
    console.log(`📈 פילוח לפי סטטוס:`);
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} פרויקטים, ₪${row.total_budget} תקציב`);
    });
    
    // בדיקת הקשר בין תב"רים לעסקאות
    const connectionQuery = `
      SELECT 
        t.tabar_number,
        t.name,
        COUNT(tt.id) as transaction_count,
        SUM(CASE WHEN tt.direction = 'חיוב' THEN tt.amount ELSE 0 END) as total_spent
      FROM tabarim t
      LEFT JOIN tabar_transactions tt ON t.id = tt.tabar_id
      GROUP BY t.id, t.tabar_number, t.name
      ORDER BY t.tabar_number
    `;
    
    const connectionResult = await db.query(connectionQuery);
    console.log(`\n🔗 קשר תב"רים לעסקאות:`);
    connectionResult.rows.forEach(row => {
      console.log(`  - ${row.tabar_number}: ${row.transaction_count} עסקאות, ₪${row.total_spent || 0} הוצאות`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת נתונים:', error);
  } finally {
    process.exit(0);
  }
}

checkData(); 