import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating milestones table structure...');

// Add missing columns to milestones table
const alterTableQueries = [
  `ALTER TABLE milestones ADD COLUMN start_date TEXT`,
  `ALTER TABLE milestones ADD COLUMN notes TEXT`,
  `ALTER TABLE milestones ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE milestones ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`
];

// Execute each ALTER TABLE query
alterTableQueries.forEach((query, index) => {
  db.run(query, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Column already exists (query ${index + 1})`);
      } else {
        console.error(`Error in query ${index + 1}:`, err.message);
      }
    } else {
      console.log(`Successfully executed query ${index + 1}`);
    }
  });
});

// Check the final table structure
setTimeout(() => {
  db.all("PRAGMA table_info(milestones)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      console.log('\nFinal milestones table structure:');
      rows.forEach(row => {
        console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
      });
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\nDatabase connection closed.');
      }
    });
  });
}, 1000);
