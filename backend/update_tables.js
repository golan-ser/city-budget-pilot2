import db from './db.js';

async function updateTables() {
  try {
    console.log('Updating existing tables...');

    // Add missing columns to milestones table
    try {
      await db.query(`ALTER TABLE milestones ADD COLUMN IF NOT EXISTS responsible TEXT`);
      console.log('✅ Added responsible column to milestones');
    } catch (err) {
      console.log('⚠️ Column responsible already exists or error:', err.message);
    }

    try {
      await db.query(`ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completion_percent NUMERIC(5,2) DEFAULT 0`);
      console.log('✅ Added completion_percent column to milestones');
    } catch (err) {
      console.log('⚠️ Column completion_percent already exists or error:', err.message);
    }

    try {
      await db.query(`ALTER TABLE milestones ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
      console.log('✅ Added created_at column to milestones');
    } catch (err) {
      console.log('⚠️ Column created_at already exists or error:', err.message);
    }

    try {
      await db.query(`ALTER TABLE milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
      console.log('✅ Added updated_at column to milestones');
    } catch (err) {
      console.log('⚠️ Column updated_at already exists or error:', err.message);
    }

    // Insert sample data with correct column names
    console.log('Inserting sample data...');

    // Sample milestones
    await db.query(`
      INSERT INTO milestones (project_id, title, due_date, status, responsible, completion_percent) VALUES 
      (1, 'Getting building permits', '2024-03-01', 'completed', 'City Engineer', 100),
      (1, 'Start excavation work', '2024-04-15', 'in_progress', 'Main Contractor', 75),
      (1, 'Complete construction', '2024-08-30', 'not_started', 'Main Contractor', 0)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample milestones inserted');

    // Sample documents
    await db.query(`
      INSERT INTO project_documents (project_id, type, name, is_required, status) VALUES 
      (1, 'Building Permit', 'Building permit no. 12345', true, 'uploaded'),
      (1, 'Technical Specification', 'Updated technical specification', true, 'missing'),
      (1, 'Engineer Opinion', 'Structural engineer opinion', false, 'uploaded')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample documents inserted');

    // Sample execution reports
    await db.query(`
      INSERT INTO execution_reports (project_id, report_date, amount, status, notes, created_by) VALUES 
      (1, '2024-01-15', 150000, 'approved', 'Report on preparation work progress', 'Project Manager'),
      (1, '2024-02-15', 200000, 'pending', 'Report on excavation work', 'Project Manager')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample execution reports inserted');

    console.log('🎉 All tables updated successfully!');

  } catch (error) {
    console.error('❌ Error updating tables:', error);
  } finally {
    process.exit();
  }
}

updateTables(); 