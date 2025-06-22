import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Admin0697812@localhost:5432/city_budget'
});

async function createLinkedProjects() {
  try {
    console.log('🔗 Creating projects linked to existing tabarim...\n');
    
    // Get all existing tabarim
    const tabarimResult = await pool.query('SELECT id, tabar_number, name, status, total_authorized, open_date FROM tabarim ORDER BY tabar_number');
    console.log('📋 Available tabarim:');
    console.table(tabarimResult.rows);
    
    // Create projects for each tabar
    console.log('\n➕ Creating linked projects...');
    
    for (const tabar of tabarimResult.rows) {
      // Create project linked to this tabar
      const projectResult = await pool.query(`
        INSERT INTO projects (name, type, start_date, budget_amount, status, tabar_id, tabar_number, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, tabar_id, tabar_number
      `, [
        tabar.name, // Use tabar name as project name
        'תב"ר',
        tabar.open_date,
        tabar.total_authorized,
        tabar.status === 'פעיל' ? 'פעיל' : tabar.status === 'אושרה' ? 'מאושר' : 'הסתיים',
        tabar.id, // Link to tabar ID
        tabar.tabar_number, // Store tabar number for reference
        `פרויקט תב"ר ${tabar.tabar_number} - ${tabar.name}`
      ]);
      
      const project = projectResult.rows[0];
      console.log(`✅ Created project ${project.id}: ${project.name} → Tabar ${project.tabar_number}`);
      
      // Add sample milestone for each project
      await pool.query(`
        INSERT INTO milestones (project_id, title, description, target_date, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        project.id,
        'תחילת פרויקט',
        'אישור והתחלת ביצוע הפרויקט',
        tabar.open_date,
        'הושלם'
      ]);
      
      // Add sample report for each project
      await pool.query(`
        INSERT INTO reports (project_id, title, content, report_date)
        VALUES ($1, $2, $3, $4)
      `, [
        project.id,
        'דוח התקדמות ראשוני',
        `דוח התקדמות עבור תב"ר ${tabar.tabar_number} - ${tabar.name}`,
        new Date()
      ]);
      
      // Add funding source
      await pool.query(`
        INSERT INTO funding_sources (project_id, source_name, amount, percentage)
        VALUES ($1, $2, $3, $4)
      `, [
        project.id,
        'תקציב ממשלתי',
        tabar.total_authorized,
        100
      ]);
    }
    
    // Verify the relationships
    console.log('\n🔗 Verifying project-tabar relationships:');
    const relationshipResult = await pool.query(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.tabar_id,
        p.tabar_number as project_tabar_number,
        t.id as tabar_id,
        t.tabar_number as tabar_tabar_number,
        t.name as tabar_name,
        CASE 
          WHEN p.tabar_id = t.id AND p.tabar_number = t.tabar_number THEN '✅ Perfect match'
          ELSE '❌ Mismatch'
        END as relationship_status
      FROM projects p
      JOIN tabarim t ON p.tabar_id = t.id
      ORDER BY p.id
    `);
    
    console.table(relationshipResult.rows);
    
    console.log('\n✅ All projects created and linked successfully!');
    console.log(`Total projects: ${relationshipResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createLinkedProjects(); 