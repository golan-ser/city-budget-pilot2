import db from './db.js';

async function addSampleData() {
  try {
    console.log('Adding sample data...');

    // Get the first tabar to use as tabar_number
    const tabarResult = await db.query('SELECT tabar_number FROM tabarim WHERE tabar_number = 101');
    if (tabarResult.rows.length === 0) {
      console.log('❌ No tabar found with number 101');
      return;
    }

    const tabarNumber = tabarResult.rows[0].tabar_number;
    console.log(`Using tabar number ${tabarNumber}`);

    // Sample milestones for tabar 101
    await db.query(`
      INSERT INTO milestones (tabar_number, title, due_date, status, responsible, completion_percent) VALUES 
      (${tabarNumber}, 'קבלת היתרי בנייה', '2024-03-01', 'הושלם', 'מהנדס העיר', 100),
      (${tabarNumber}, 'התחלת עבודות חפירה', '2024-04-15', 'בביצוע', 'קבלן ראשי', 75),
      (${tabarNumber}, 'השלמת הבנייה', '2024-08-30', 'לא התחיל', 'קבלן ראשי', 0)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample milestones inserted');

    // Sample documents for tabar 101
    await db.query(`
      INSERT INTO project_documents (tabar_number, type, name, is_required, status) VALUES 
      (${tabarNumber}, 'היתר בנייה', 'היתר בנייה מס. 12345', true, 'הועלה'),
      (${tabarNumber}, 'מפרט טכני', 'מפרט טכני מעודכן', true, 'חסר'),
      (${tabarNumber}, 'חוות דעת מהנדס', 'חוות דעת מהנדס קונסטרוקציה', false, 'הועלה')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample documents inserted');

    // Sample execution reports for tabar 101
    await db.query(`
      INSERT INTO execution_reports (tabar_number, report_date, amount, status, notes, created_by) VALUES 
      (${tabarNumber}, '2024-01-15', 150000, 'אושר', 'דיווח על התקדמות עבודות הכנה', 'מנהל פרויקט'),
      (${tabarNumber}, '2024-02-15', 200000, 'ממתין לאישור', 'דיווח על עבודות חפירה', 'מנהל פרויקט')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample execution reports inserted');

    console.log('🎉 All sample data added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    process.exit();
  }
}

addSampleData(); 