-- יצירת טבלת מסמכים מתקדמת למודול ניהול מסמכים
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    tabar_number VARCHAR(50), -- תאימות לאחור
    type VARCHAR(20) NOT NULL CHECK (type IN ('permit', 'invoice', 'contract', 'permission', 'other')),
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    supplier VARCHAR(255),
    amount DECIMAL(15,2),
    reported BOOLEAN DEFAULT false,
    file_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'חסר', -- תאימות לאחור
    name VARCHAR(255), -- תאימות לאחור
    is_required BOOLEAN DEFAULT false, -- תאימות לאחור
    description TEXT, -- תאימות לאחור
    upload_date TIMESTAMP, -- תאימות לאחור
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- יצירת אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_type ON project_documents(type);
CREATE INDEX IF NOT EXISTS idx_project_documents_date ON project_documents(date);
CREATE INDEX IF NOT EXISTS idx_project_documents_reported ON project_documents(reported);
CREATE INDEX IF NOT EXISTS idx_project_documents_tabar_number ON project_documents(tabar_number);

-- הוספת הערות לטבלה
COMMENT ON TABLE project_documents IS 'טבלה לניהול מסמכים מתקדם לפי פרויקטים';
COMMENT ON COLUMN project_documents.id IS 'מזהה ייחודי למסמך';
COMMENT ON COLUMN project_documents.project_id IS 'מזהה הפרויקט';
COMMENT ON COLUMN project_documents.type IS 'סוג המסמך: permit, invoice, contract, permission, other';
COMMENT ON COLUMN project_documents.title IS 'שם המסמך';
COMMENT ON COLUMN project_documents.date IS 'תאריך המסמך';
COMMENT ON COLUMN project_documents.supplier IS 'שם הספק (רלוונטי לחשבוניות)';
COMMENT ON COLUMN project_documents.amount IS 'סכום במסמך (רלוונטי לחשבוניות)';
COMMENT ON COLUMN project_documents.reported IS 'האם המסמך דווח';
COMMENT ON COLUMN project_documents.file_url IS 'נתיב לקובץ המסמך';

-- דוגמאות לנתונים ראשוניים
INSERT INTO project_documents (project_id, type, title, date, supplier, amount, reported, file_url) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'permit', 'אישור תב"ר 2024', '2024-01-15', NULL, NULL, true, '/uploads/permit_2024.pdf'),
('550e8400-e29b-41d4-a716-446655440000', 'invoice', 'חשבונית ש.ח. הנדסה', '2024-02-20', 'ש.ח. הנדסה', 22500.00, true, '/uploads/invoice_engineering.pdf'),
('550e8400-e29b-41d4-a716-446655440000', 'contract', 'חוזה עם קבלן ראשי', '2024-01-10', 'בנייה בע"מ', 150000.00, false, '/uploads/main_contract.pdf'),
('550e8400-e29b-41d4-a716-446655440000', 'permission', 'הרשאת ביצוע עבודות', '2024-01-25', NULL, NULL, true, '/uploads/work_permission.pdf'),
('550e8400-e29b-41d4-a716-446655440000', 'other', 'תכנית אדריכלית', '2024-01-05', 'סטודיו אדריכלות', 8000.00, false, '/uploads/architectural_plan.pdf')
ON CONFLICT (id) DO NOTHING; 