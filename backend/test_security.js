import axios from 'axios';
import db from './db.js';

const BASE_URL = 'http://localhost:3000';
const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';

console.log('🔍 בוחן אבטחת המערכת...\n');

// בדיקה 1: גישה ללא אימות
async function testUnauthorizedAccess() {
  console.log('📋 בדיקה 1: גישה ללא אימות');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/projects`);
    console.log('❌ שגיאה: גישה מורשת ללא אימות!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ גישה נחסמה כמצופה - 401 Unauthorized');
      return true;
    } else {
      console.log('❌ שגיאה לא צפויה:', error.message);
      return false;
    }
  }
}

// בדיקה 2: גישה עם demo token
async function testDemoTokenAccess() {
  console.log('\n📋 בדיקה 2: גישה עם demo token');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/projects`, {
      headers: {
        'x-demo-token': DEMO_TOKEN
      }
    });
    
    console.log('✅ גישה מאושרת עם demo token');
    console.log(`📊 נמצאו ${response.data.length} פרויקטים`);
    
    // בדיקה שכל הפרויקטים שייכים לרשות דמו
    const hasNonTenantData = response.data.some(project => 
      project.tenant_id && project.tenant_id !== 1
    );
    
    if (hasNonTenantData) {
      console.log('❌ שגיאה: נמצאו נתונים של רשויות אחרות!');
      return false;
    }
    
    console.log('✅ כל הנתונים שייכים לרשות הדמו');
    return true;
  } catch (error) {
    console.log('❌ שגיאה בגישה עם demo token:', error.message);
    return false;
  }
}

// בדיקה 3: התחברות עם משתמש דמו
async function testDemoLogin() {
  console.log('\n📋 בדיקה 3: התחברות עם משתמש דמו');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'demo@demo.com',
      password: 'demo123'
    });
    
    if (response.data.success && response.data.token) {
      console.log('✅ התחברות הצליחה');
      console.log(`👤 משתמש: ${response.data.user.full_name}`);
      console.log(`🏢 רשות: ${response.data.user.tenant_name}`);
      console.log(`🔑 Token התקבל: ${response.data.token.substring(0, 20)}...`);
      return { success: true, token: response.data.token };
    } else {
      console.log('❌ התחברות נכשלה');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ שגיאה בהתחברות:', error.response?.data?.error || error.message);
    return { success: false };
  }
}

// בדיקה 4: גישה עם JWT token
async function testJWTAccess(token) {
  console.log('\n📋 בדיקה 4: גישה עם JWT token');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ גישה מאושרת עם JWT token');
      console.log(`👤 פרופיל: ${response.data.user.full_name}`);
      console.log(`🆔 Tenant ID: ${response.data.user.tenant_id}`);
      return true;
    } else {
      console.log('❌ גישה נדחתה');
      return false;
    }
  } catch (error) {
    console.log('❌ שגיאה בגישה עם JWT:', error.response?.data?.error || error.message);
    return false;
  }
}

// בדיקה 5: בדיקת מסד הנתונים - tenant_id
async function testDatabaseSecurity() {
  console.log('\n📋 בדיקה 5: בדיקת מבנה מסד הנתונים');
  
  try {
    // בדיקה שטבלת tenants קיימת
    const tenantsResult = await db.query('SELECT COUNT(*) FROM tenants');
    console.log(`✅ טבלת tenants: ${tenantsResult.rows[0].count} רשויות`);
    
    // בדיקה שטבלת users קיימת
    const usersResult = await db.query('SELECT COUNT(*) FROM users');
    console.log(`✅ טבלת users: ${usersResult.rows[0].count} משתמשים`);
    
    // בדיקה שיש tenant_id בטבלת tabarim
    const tabarimResult = await db.query(`
      SELECT COUNT(*) as total, COUNT(tenant_id) as with_tenant_id 
      FROM tabarim
    `);
    
    const total = parseInt(tabarimResult.rows[0].total);
    const withTenantId = parseInt(tabarimResult.rows[0].with_tenant_id);
    
    console.log(`📊 טבלת tabarim: ${total} רשומות, ${withTenantId} עם tenant_id`);
    
    if (total === withTenantId) {
      console.log('✅ כל הרשומות כולל tenant_id');
      return true;
    } else {
      console.log('❌ יש רשומות ללא tenant_id!');
      return false;
    }
  } catch (error) {
    console.log('❌ שגיאה בבדיקת מסד הנתונים:', error.message);
    return false;
  }
}

// הרצת כל הבדיקות
async function runAllTests() {
  const results = [];
  
  console.log('🚀 מתחיל בדיקות אבטחה...\n');
  
  // בדיקה 1
  results.push(await testUnauthorizedAccess());
  
  // בדיקה 2
  results.push(await testDemoTokenAccess());
  
  // בדיקה 3
  const loginResult = await testDemoLogin();
  results.push(loginResult.success);
  
  // בדיקה 4 (רק אם ההתחברות הצליחה)
  if (loginResult.success && loginResult.token) {
    results.push(await testJWTAccess(loginResult.token));
  } else {
    results.push(false);
  }
  
  // בדיקה 5
  results.push(await testDatabaseSecurity());
  
  // סיכום תוצאות
  console.log('\n' + '='.repeat(50));
  console.log('📊 סיכום בדיקות אבטחה:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`✅ עברו: ${passed}/${total} בדיקות`);
  
  if (passed === total) {
    console.log('🎉 כל הבדיקות עברו בהצלחה! המערכת מאובטחת.');
  } else {
    console.log('⚠️  חלק מהבדיקות נכשלו. יש לבדוק את ההגדרות.');
  }
  
  console.log('\n📋 פירוט תוצאות:');
  console.log(`1. חסימת גישה ללא אימות: ${results[0] ? '✅' : '❌'}`);
  console.log(`2. גישה עם demo token: ${results[1] ? '✅' : '❌'}`);
  console.log(`3. התחברות משתמש דמו: ${results[2] ? '✅' : '❌'}`);
  console.log(`4. גישה עם JWT token: ${results[3] ? '✅' : '❌'}`);
  console.log(`5. מבנה מסד נתונים: ${results[4] ? '✅' : '❌'}`);
  
  process.exit(passed === total ? 0 : 1);
}

// הפעלת הבדיקות
runAllTests().catch(error => {
  console.error('❌ שגיאה כללית בהרצת הבדיקות:', error);
  process.exit(1);
}); 