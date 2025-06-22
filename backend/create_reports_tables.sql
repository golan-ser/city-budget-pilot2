-- יצירת טבלאות למודול דיווחים
-- ==================================

-- טבלת משרדי ממשלה
CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- הוספת נתונים בסיסיים למשרדי ממשלה
INSERT INTO ministries (name, code, contact_person, email, phone) VALUES
('משרד החינוך', 'EDU', 'יוסי כהן', 'yossi@education.gov.il', '02-5555001'),
('משרד הבריאות', 'HEALTH', 'רחל לוי', 'rachel@health.gov.il', '02-5555002'),
('משרד התחבורה', 'TRANS', 'דוד משה', 'david@transport.gov.il', '02-5555003'),
('משרד הפנים', 'INTERIOR', 'מירי אברהם', 'miri@interior.gov.il', '02-5555004'),
('משרד הביטחון', 'DEFENSE', 'אבי יוסף', 'avi@defense.gov.il', '02-5555005')
ON CONFLICT (code) DO NOTHING;

-- טבלת סעיפי תקציב מפורטת
CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    ministry_id INTEGER REFERENCES ministries(id),
    category VARCHAR(100),
    budget_amount NUMERIC(15,2) DEFAULT 0,
    executed_amount NUMERIC(15,2) DEFAULT 0,
    utilization_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN budget_amount > 0 THEN (executed_amount / budget_amount) * 100
            ELSE 0 
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- נתוני דמו לסעיפי תקציב
INSERT INTO budget_items (code, description, ministry_id, category, budget_amount, executed_amount) VALUES
('EDU-001', 'בנייה ותשתית חינוכית', 1, 'בנייה ותשתית', 5000000, 3200000),
('EDU-002', 'ציוד וטכנולוגיה לבתי ספר', 1, 'ציוד וטכנולוגיה', 2000000, 1800000),
('EDU-003', 'תכנון ופיקוח פרויקטי חינוך', 1, 'תכנון ופיקוח', 500000, 450000),
('HEALTH-001', 'בנייה ותשתית רפואית', 2, 'בנייה ותשתית', 8000000, 4500000),
('HEALTH-002', 'ציוד רפואי מתקדם', 2, 'ציוד וטכנולוגיה', 3000000, 2100000),
('TRANS-001', 'פיתוח כבישים ותשתיות', 3, 'בנייה ותשתית', 12000000, 7800000),
('TRANS-002', 'ציוד ותחזוקה', 3, 'ציוד וטכנולוגיה', 1500000, 900000),
('INTERIOR-001', 'פרויקטי פיתוח עירוני', 4, 'בנייה ותשתית', 6000000, 3600000),
('DEFENSE-001', 'תשתיות ביטחון', 5, 'בנייה ותשתית', 15000000, 8200000)
ON CONFLICT DO NOTHING;

-- טבלת הזמנות (orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    project_id INTEGER REFERENCES tabarim(id),
    budget_item_id INTEGER REFERENCES budget_items(id),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    order_date DATE NOT NULL,
    supplier_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'פעילה',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלת חשבוניות
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    amount NUMERIC(15,2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'התקבלה', -- התקבלה, אושרה, דווחה, שולמה
    reported BOOLEAN DEFAULT FALSE,
    reported_date DATE,
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלת דיווחים מרכזית
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_identifier VARCHAR(20) UNIQUE NOT NULL, -- 251, 252, etc.
    project_id INTEGER REFERENCES tabarim(id) NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    budget_item_id INTEGER REFERENCES budget_items(id),
    amount NUMERIC(15,2) NOT NULL,
    report_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'הוגש', -- הוגש, בטיפול, אושר, שולם
    marcava_id VARCHAR(100), -- מזהה מערכת מרכבה
    amount_received NUMERIC(15,2) DEFAULT 0,
    received_date DATE,
    notes TEXT,
    created_by INTEGER, -- user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלת קישור דיווחים לחשבוניות
CREATE TABLE IF NOT EXISTS report_invoices (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, invoice_id)
);

-- פונקציה ליצירת מזהה דיווח אוטומטי
CREATE OR REPLACE FUNCTION generate_report_identifier()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    running_number INTEGER;
    new_identifier TEXT;
BEGIN
    -- קבלת השנה הנוכחית (2 ספרות אחרונות)
    current_year := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
    
    -- חיפוש המספר הרץ הבא לשנה הנוכחית
    SELECT COALESCE(MAX(CAST(RIGHT(report_identifier, LENGTH(report_identifier) - 2) AS INTEGER)), 0) + 1
    INTO running_number
    FROM reports 
    WHERE LEFT(report_identifier, 2) = current_year;
    
    -- יצירת המזהה החדש
    new_identifier := current_year || LPAD(running_number::TEXT, 3, '0');
    
    NEW.report_identifier := new_identifier;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת טריגר למזהה אוטומטי
DROP TRIGGER IF EXISTS trigger_generate_report_identifier ON reports;
CREATE TRIGGER trigger_generate_report_identifier
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_identifier();

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_identifier ON reports(report_identifier);
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_ministry_id ON budget_items(ministry_id);

-- עדכון טבלת tabarim להוספת שדות חסרים
ALTER TABLE tabarim 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS ministry_id INTEGER REFERENCES ministries(id);

-- עדכון נתונים קיימים
UPDATE tabarim SET 
    start_date = created_at::DATE,
    ministry_id = CASE 
        WHEN ministry = 'משרד החינוך' THEN 1
        WHEN ministry = 'משרד הבריאות' THEN 2  
        WHEN ministry = 'משרד התחבורה' THEN 3
        WHEN ministry = 'משרד הפנים' THEN 4
        WHEN ministry = 'משרד הביטחון' THEN 5
        ELSE 1
    END
WHERE start_date IS NULL OR ministry_id IS NULL;

-- יצירת נתוני דמו להזמנות וחשבוניות
INSERT INTO orders (order_number, project_id, budget_item_id, description, amount, order_date, supplier_name, status) VALUES
('ORD-2025-001', 1, 1, 'הזמנה לציוד גן ילדים', 250000, '2025-01-15', 'חברת ציוד חינוכי בע״מ', 'פעילה'),
('ORD-2025-002', 1, 1, 'עבודות בנייה גן ילדים', 550000, '2025-02-01', 'קבלן בנייה ושותפים', 'פעילה'),
('ORD-2025-003', 2, 6, 'שדרוג כבישים - שלב א', 800000, '2025-01-20', 'חברת כבישים מהירים', 'הושלמה'),
('ORD-2025-004', 2, 6, 'שדרוג כבישים - שלב ב', 400000, '2025-02-15', 'חברת כבישים מהירים', 'פעילה')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO invoices (invoice_number, order_id, amount, invoice_date, due_date, status, reported, reported_date) VALUES
('INV-001-2025', 1, 125000, '2025-02-01', '2025-03-01', 'דווחה', TRUE, '2025-02-05'),
('INV-002-2025', 1, 125000, '2025-02-15', '2025-03-15', 'התקבלה', FALSE, NULL),
('INV-003-2025', 2, 275000, '2025-02-10', '2025-03-10', 'דווחה', TRUE, '2025-02-12'),
('INV-004-2025', 2, 275000, '2025-02-20', '2025-03-20', 'אושרה', FALSE, NULL),
('INV-005-2025', 3, 800000, '2025-02-05', '2025-03-05', 'שולמה', TRUE, '2025-02-07'),
('INV-006-2025', 4, 200000, '2025-02-25', '2025-03-25', 'התקבלה', FALSE, NULL),
('INV-007-2025', 4, 200000, '2025-03-01', '2025-04-01', 'התקבלה', FALSE, NULL)
ON CONFLICT DO NOTHING;

-- יצירת דיווחים לדמו
INSERT INTO reports (project_id, order_id, budget_item_id, amount, report_date, status, amount_received, received_date, notes) VALUES
(1, 1, 1, 125000, '2025-02-05', 'שולם', 125000, '2025-02-20', 'דיווח ראשון לגן ילדים - ציוד'),
(2, 3, 6, 800000, '2025-02-07', 'שולם', 800000, '2025-02-25', 'שדרוג כבישים - שלב א הושלם'),
(1, 2, 1, 275000, '2025-02-12', 'בטיפול', 0, NULL, 'עבודות בנייה גן ילדים - שלב א')
ON CONFLICT DO NOTHING;

-- קישור דיווחים לחשבוניות
INSERT INTO report_invoices (report_id, invoice_id) VALUES
(1, 1),
(2, 5),
(3, 3)
ON CONFLICT DO NOTHING;

-- הודעת סיום
SELECT 'טבלאות מודול דיווחים נוצרו בהצלחה!' as message; 