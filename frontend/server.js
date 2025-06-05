import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// הגדרות חיבור ל-PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  });

// בדיקת חיבור למסד הנתונים
pool.connect((err, client, release) => {
  if (err) {
    console.error('שגיאה בחיבור למסד הנתונים:', err.stack);
  } else {
    console.log('מחובר בהצלחה למסד הנתונים PostgreSQL');
    release();
  }
});

// === כל שאר הקוד שלך (API endpoints וכו') נשאר זהה ===
// אין צורך לשנות שום דבר בקוד התוכן עצמו – רק את ההתחלה עם require => import

// ... [שאר הקוד שהעלית כבר תקף ואינו דורש שינוי]

app.listen(port, () => {
  console.log(`🚀 השרת רץ על http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}`);
});
