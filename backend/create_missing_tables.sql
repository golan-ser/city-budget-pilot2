-- Create missing tables for project management

-- Update projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS managers TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create milestones table (if not exists)
CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'לא התחיל' CHECK (status IN ('לא התחיל', 'בתהליך', 'הושלם', 'מתעכב')),
    responsible TEXT,
    completion_percent NUMERIC(5,2) DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP,
    file_url TEXT,
    status TEXT DEFAULT 'חסר' CHECK (status IN ('חסר', 'הועלה', 'אושר', 'נדחה')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create execution_reports table
CREATE TABLE IF NOT EXISTS execution_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status TEXT DEFAULT 'ממתין לאישור' CHECK (status IN ('ממתין לאישור', 'אושר', 'נדחה', 'הועבר')),
    notes TEXT,
    documents_attached TEXT[],
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Update reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Insert sample data for testing
INSERT INTO milestones (project_id, title, due_date, status, responsible, completion_percent) VALUES 
(1, 'קבלת היתרי בנייה', '2024-03-01', 'הושלם', 'מהנדס העיר', 100),
(1, 'התחלת עבודות חפירה', '2024-04-15', 'בתהליך', 'קבלן ראשי', 75),
(1, 'השלמת בנייה', '2024-08-30', 'לא התחיל', 'קבלן ראשי', 0)
ON CONFLICT DO NOTHING;

INSERT INTO project_documents (project_id, type, name, is_required, status) VALUES 
(1, 'היתר בנייה', 'היתר בנייה מס 12345', true, 'הועלה'),
(1, 'מפרט טכני', 'מפרט טכני מעודכן', true, 'חסר'),
(1, 'חוות דעת מהנדס', 'חוות דעת מהנדס קונסטרוקציה', false, 'הועלה')
ON CONFLICT DO NOTHING;

INSERT INTO execution_reports (project_id, report_date, amount, status, notes, created_by) VALUES 
(1, '2024-01-15', 150000, 'אושר', 'דיווח על התקדמות בעבודות הכנה', 'מנהל פרויקט'),
(1, '2024-02-15', 200000, 'ממתין לאישור', 'דיווח על עבודות חפירה', 'מנהל פרויקט')
ON CONFLICT DO NOTHING; 