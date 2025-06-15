import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // טוען משתני סביבה מקובץ .env

const { Pool } = pkg;

console.log("🔌 Connecting to DB using URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// מייצא אובייקט עם פונקציה query
export default {
  query: (text, params) => pool.query(text, params),
};
