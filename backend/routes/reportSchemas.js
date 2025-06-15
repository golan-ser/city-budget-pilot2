// routes/reportSchemas.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; // הוספנו!
import db from '../db.js';

const router = express.Router();

const __dirname = path.resolve();
const schemas = {};
const schemasDir = path.join(__dirname, 'schemas'); // ודא שמסלול schemas נכון

// טעינת הסכמות ב-import דינמי (מתוקן ל-Windows/ESM)
const loadSchemas = async () => {
  const files = fs.readdirSync(schemasDir);
  for (const file of files) {
    if (file.endsWith('.schema.js')) {
      const filePath = path.join(schemasDir, file);
      const schema = await import(pathToFileURL(filePath).href); // זה הפתרון!
      schemas[schema.default.module] = schema.default;
    }
  }
};
await loadSchemas(); // טען את כל הסכמות לפני המשך

// --- שליפת סכמה לפי מודול ---
router.get('/schema', (req, res) => {
  const { module } = req.query;
  if (!module || !schemas[module]) {
    return res.status(404).json({ error: 'Schema not found' });
  }
  res.json(schemas[module]);
});

// --- פונקציה להרצת דוח דינמי לפי schema ---
router.post('/run', async (req, res) => {
  try {
    const { module, fields, filters } = req.body;
    const schema = schemas[module];
    if (!schema) return res.status(400).json({ error: 'Unknown module' });

    // בדיקת חוקיות השדות
    const allowedFields = schema.fields.map(f => f.name);
    const selectedFields = fields.filter(f => allowedFields.includes(f));
    if (selectedFields.length === 0) return res.status(400).json({ error: 'No valid fields selected' });

    // WHERE דינמי
    let where = [];
    let values = [];
    let idx = 1;
    for (const [col, val] of Object.entries(filters || {})) {
      if (!allowedFields.includes(col)) continue;
      if (typeof val === 'object') {
        if (val.gte !== undefined) { where.push(`${col} >= $${idx}`); values.push(val.gte); idx++; }
        if (val.lte !== undefined) { where.push(`${col} <= $${idx}`); values.push(val.lte); idx++; }
      } else {
        where.push(`${col} = $${idx}`); values.push(val); idx++;
      }
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `SELECT ${selectedFields.join(', ')} FROM ${module} ${whereClause}`;

    const result = await db.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to run report' });
  }
});

export default router;
