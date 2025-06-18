import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function addUnpaidInvoices() {
  try {
    console.log('🔄 מוסיף חשבוניות לא שולמות...');
    
    const query = `
      INSERT INTO tabar_transactions (tabar_id, transaction_type, supplier_name, supplier_id, order_number, amount, direction, status, transaction_date, description, reported) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
      ($12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22),
      ($23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
    `;
    
    const values = [
      // חשבונית 1
      1, 'חשבונית', 'ספק חשמל מתקדם', '515999001', 'INV-2024-100', 25000.00, 'חיוב', 'לא שולם', '2024-02-15', 'עבודות חשמל נוספות', false,
      // חשבונית 2  
      2, 'חשבונית', 'ספקי ציוד מחשבים', '515999003', 'EDU-2024-100', 15000.00, 'חיוב', 'לא שולם', '2024-02-20', 'מחשבים נוספים לכיתות', false,
      // חשבונית 3
      3, 'חשבונית', 'ציוד רפואי חירום', '515999004', 'MED-2024-100', 32000.00, 'חיוב', 'לא שולם', '2024-02-22', 'ציוד רפואי דחוף', false
    ];
    
    await pool.query(query, values);
    console.log('✅ נתונים נוספו בהצלחה!');
    
    // בדיקה
    const checkResult = await pool.query("SELECT COUNT(*) as count FROM tabar_transactions WHERE status = 'לא שולם'");
    console.log(`📊 יש כעת ${checkResult.rows[0].count} חשבוניות לא שולמות`);
    
    // הצגת הנתונים החדשים
    const newData = await pool.query("SELECT transaction_type, supplier_name, amount, status FROM tabar_transactions WHERE status = 'לא שולם'");
    console.log('📋 חשבוניות לא שולמות:');
    newData.rows.forEach(row => {
      console.log(`- ${row.supplier_name}: ${row.amount} (${row.status})`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await pool.end();
  }
}

addUnpaidInvoices(); 