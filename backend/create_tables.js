import db from './db.js';

async function createMissingTables() {
  try {
    console.log('Creating missing tables...');

    // Update projects table
    await db.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS managers TEXT[],
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);
    console.log('✅ Updated projects table');

    // Create milestones table
    await db.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'not_started',
        responsible TEXT,
        completion_percent NUMERIC(5,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created milestones table');

    // Create project_documents table
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_documents (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        is_required BOOLEAN DEFAULT FALSE,
        upload_date TIMESTAMP,
        file_url TEXT,
        status TEXT DEFAULT 'missing',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created project_documents table');

    // Create execution_reports table
    await db.query(`
      CREATE TABLE IF NOT EXISTS execution_reports (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        report_date DATE NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        documents_attached TEXT[],
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created execution_reports table');

    // Update reports table
    await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);
    console.log('✅ Updated reports table');

    // Insert sample data
    console.log('Inserting sample data...');

    // Sample milestones
    await db.query(`
      INSERT INTO milestones (project_id, title, due_date, status, responsible, completion_percent) VALUES 
      (1, 'Getting building permits', '2024-03-01', 'completed', 'City Engineer', 100),
      (1, 'Start excavation work', '2024-04-15', 'in_progress', 'Main Contractor', 75),
      (1, 'Complete construction', '2024-08-30', 'not_started', 'Main Contractor', 0)
      ON CONFLICT DO NOTHING
    `);

    // Sample documents
    await db.query(`
      INSERT INTO project_documents (project_id, type, name, is_required, status) VALUES 
      (1, 'Building Permit', 'Building permit no. 12345', true, 'uploaded'),
      (1, 'Technical Specification', 'Updated technical specification', true, 'missing'),
      (1, 'Engineer Opinion', 'Structural engineer opinion', false, 'uploaded')
      ON CONFLICT DO NOTHING
    `);

    // Sample execution reports
    await db.query(`
      INSERT INTO execution_reports (project_id, report_date, amount, status, notes, created_by) VALUES 
      (1, '2024-01-15', 150000, 'approved', 'Report on preparation work progress', 'Project Manager'),
      (1, '2024-02-15', 200000, 'pending', 'Report on excavation work', 'Project Manager')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample data inserted');
    console.log('🎉 All tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    process.exit();
  }
}

createMissingTables(); 