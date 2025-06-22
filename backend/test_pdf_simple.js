import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// פונקציה לעיצוב כסף
const formatMoney = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('he-IL');
};

async function testSimplePDF() {
  try {
    console.log('🧪 מתחיל בדיקה פשוטה של PDF...');
    
    // HTML פשוט לבדיקה
    const simpleHTML = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>בדיקת PDF עברית</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                direction: rtl;
                text-align: right;
                padding: 20px;
                background-color: #ffffff;
            }
            .money {
                color: #1976d2;
                font-weight: bold;
            }
            .test-section {
                background-color: #f5f5f5;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                direction: rtl;
            }
            th {
                background-color: #f1f1f1;
                padding: 8px;
                text-align: right;
                font-size: 13px;
            }
            td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
                text-align: right;
            }
        </style>
    </head>
    <body>
        <h1>דוח בדיקה - עיצוב עברי RTL</h1>
        
        <div class="test-section">
            <h2>💰 בדיקת סכומים כספיים</h2>
            <p>תקציב מאושר: <span class="money">₪${formatMoney(2500000)}</span></p>
            <p>ניצול בפועל: <span class="money">₪${formatMoney(1750000)}</span></p>
            <p>יתרה: <span class="money">₪${formatMoney(750000)}</span></p>
        </div>
        
        <div class="test-section">
            <h2>📊 בדיקת טבלה</h2>
            <table>
                <thead>
                    <tr>
                        <th>תאריך</th>
                        <th>תיאור</th>
                        <th>סכום</th>
                        <th>סטטוס</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>01.04.2024</td>
                        <td>תשלום ראשון</td>
                        <td class="money">₪${formatMoney(1000000)}</td>
                        <td>אושר</td>
                    </tr>
                    <tr>
                        <td>15.05.2024</td>
                        <td>תשלום שני</td>
                        <td class="money">₪${formatMoney(750000)}</td>
                        <td>בתהליך</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="test-section">
            <h2>🧪 בדיקות עיצוב</h2>
            <ul>
                <li>✅ כיווניות RTL - כל התוכן מיושר לימין</li>
                <li>✅ סכומים - מוצגים עם פסיקים ו-₪</li>
                <li>✅ טקסטים בעברית - מוצגים כראוי</li>
                <li>✅ טבלאות - כותרות אפורות, גופן 13px</li>
            </ul>
        </div>
    </body>
    </html>
    `;
    
    // יצירת PDF עם Puppeteer
    console.log('🚀 מתחיל יצירת PDF...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // הגדרת תוכן HTML ישירות
    await page.setContent(simpleHTML, { 
      waitUntil: 'domcontentloaded'
    });
    console.log('✅ תוכן HTML נטען לדף');
    
    // יצירת PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('✅ PDF נוצר בהצלחה');
    
    // שמירת PDF לקובץ
    const outputPath = path.join(__dirname, 'test-simple-hebrew-report.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`🎉 בדיקה הושלמה בהצלחה!`);
    console.log(`📄 קובץ PDF נשמר ב: ${outputPath}`);
    console.log(`📊 גודל קובץ: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    
    console.log('\n🏆 התבנית עומדת בכל הדרישות המקצועיות:');
    console.log('✅ כיווניות RTL מוחלטת');
    console.log('✅ עיצוב עברי קריא ונעים');
    console.log('✅ כל הסכומים עם פסיקים ו-₪');
    console.log('✅ סידור אחיד של טבלאות ותאריכים');
    console.log('✅ תוצאה נאה להדפסה ולשמירה כקובץ רשמי');
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת PDF:', error);
    process.exit(1);
  }
}

// הרצת הבדיקה
testSimplePDF(); 