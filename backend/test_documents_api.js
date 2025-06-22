import db from './db.js';

async function testDocumentsQuery() {
  try {
    console.log('🔍 Testing documents query...');
    
    // Test the exact query that's failing
    const tabar_number = 5;
    let query = 'SELECT * FROM project_documents WHERE 1=1';
    const params = [];
    
    // Handle tabar_number filter (integer)
    if (tabar_number) {
      params.push(parseInt(tabar_number));
      query += ` AND tabar_number = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC, id DESC';
    
    console.log('📋 Query:', query);
    console.log('📋 Params:', params);
    
    const result = await db.query(query, params);
    console.log('✅ Query successful!');
    console.log('📊 Results:', result.rows.length, 'documents found');
    
    if (result.rows.length > 0) {
      console.log('📄 First document:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

testDocumentsQuery(); 