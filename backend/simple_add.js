import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function addSimpleUnpaidInvoices() {
  try {
    console.log('🔄 מוסיף חשבוניות לא שולמות פשוטות...');
    
    // קודם נבדוק איזה טורים יש בטבלה
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tabar_transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 טורים בטבלה:');
    columnsResult.rows.forEach(row => console.log('- ' + row.column_name));
    
    // נוסיף נתונים פשוטים
    const query = `
      INSERT INTO tabar_transactions (tabar_id, transaction_type, amount, direction, status, transaction_date, description) VALUES
      ($1, $2, $3, $4, $5, $6, $7),
      ($8, $9, $10, $11, $12, $13, $14),
      ($15, $16, $17, $18, $19, $20, $21)
    `;
    
    const values = [
      // חשבונית 1
      1, 'חשבונית', 25000.00, 'חיוב', 'לא שולם', '2024-02-15', 'עבודות חשמל נוספות',
      // חשבונית 2  
      1, 'חשבונית', 15000.00, 'חיוב', 'לא שולם', '2024-02-20', 'מחשבים נוספים לכיתות',
      // חשבונית 3
      1, 'חשבונית', 32000.00, 'חיוב', 'לא שולם', '2024-02-22', 'ציוד רפואי דחוף'
    ];
    
    await pool.query(query, values);
    console.log('✅ נתונים נוספו בהצלחה!');
    
    // בדיקה
    const checkResult = await pool.query("SELECT COUNT(*) as count FROM tabar_transactions WHERE status = 'לא שולם'");
    console.log(`📊 יש כעת ${checkResult.rows[0].count} חשבוניות לא שולמות`);
    
    // הצגת הנתונים החדשים
    const newData = await pool.query("SELECT transaction_type, amount, status, description FROM tabar_transactions WHERE status = 'לא שולם'");
    console.log('📋 חשבוניות לא שולמות:');
    newData.rows.forEach(row => {
      console.log(`- ${row.description}: ${row.amount} ₪ (${row.status})`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await pool.end();
  }
}

addSimpleUnpaidInvoices(); 