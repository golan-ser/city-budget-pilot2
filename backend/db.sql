-- טבלת פרויקטים (תב"ר / קולות קוראים)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('תבר', 'קול קורא')),
    department_id INTEGER,
    tabar_id INTEGER REFERENCES tabarim(id),
    start_date DATE,
    end_date DATE,
    budget_amount NUMERIC,
    status TEXT DEFAULT 'טיוטה',
    description TEXT,
    managers TEXT[], -- מערך של אנשי קשר
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- אבני דרך מעודכנות
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

-- מסמכי פרויקט מעודכנים
CREATE TABLE IF NOT EXISTS project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- כתב התחייבות, מפרט, וכו'
    name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP,
    file_url TEXT,
    status TEXT DEFAULT 'חסר' CHECK (status IN ('חסר', 'הועלה', 'אושר', 'נדחה')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- דיווחי ביצוע
CREATE TABLE IF NOT EXISTS execution_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status TEXT DEFAULT 'ממתין לאישור' CHECK (status IN ('ממתין לאישור', 'אושר', 'נדחה', 'הועבר')),
    notes TEXT,
    documents_attached TEXT[], -- מערך של URLs למסמכים
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- דיווחים (קיים - מעודכן)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    report_date DATE NOT NULL,
    status TEXT DEFAULT 'טיוטה',
    notes TEXT,
    created_by INTEGER,
    order_id TEXT,
    order_description TEXT,
    amount NUMERIC(15,2),
    budget_item_id INTEGER,
    budget_item_name TEXT,
    supply_date DATE,
    supply_location TEXT,
    contract_id TEXT,
    quote TEXT,
    ministry_id INTEGER,
    tabar_id INTEGER,
    project_stage TEXT,
    requesting_department_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- מסמכים (קיים - משאיר לתאימות לאחור)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- תגובות/הערות
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id),
    user_id INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- התראות
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    message TEXT,
    alert_date DATE,
    alert_type TEXT
);

-- הרשאות
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    year INTEGER,
    ministry TEXT,
    amount NUMERIC,
    valid_until DATE
);

-- גורמי מימון
CREATE TABLE IF NOT EXISTS funding_sources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    source_name TEXT,
    amount NUMERIC
);

-- טבלת מחלקות
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- טבלת תב"רים
CREATE TABLE IF NOT EXISTS tabarim (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    tabar_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    ministry TEXT,
    department TEXT,
    total_authorized NUMERIC(15,2) DEFAULT 0,
    municipal_participation NUMERIC(15,2) DEFAULT 0,
    additional_funders TEXT,
    open_date DATE,
    close_date DATE,
    permission_number TEXT,
    status TEXT DEFAULT 'פעיל',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- טבלת פריטי תב"ר (סעיפי תקציב)
CREATE TABLE IF NOT EXISTS tabar_items (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    item_type TEXT,
    budget_item_code TEXT,
    budget_item_name TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- טבלת תנועות כספיות
CREATE TABLE IF NOT EXISTS tabar_transactions (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    item_id INTEGER REFERENCES tabar_items(id),
    transaction_type VARCHAR(50) NOT NULL, -- חשבונית, תשלום, זיכוי, העברה
    supplier_name VARCHAR(255),
    supplier_id VARCHAR(50),
    order_number VARCHAR(100),
    amount NUMERIC(15,2) NOT NULL,
    direction TEXT CHECK (direction IN ('חיוב', 'זיכוי', 'כניסה')),
    status VARCHAR(50) NOT NULL DEFAULT 'ממתין', -- שולם, לא שולם, בתהליך, מופסק
    transaction_date DATE NOT NULL,
    description TEXT,
    reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- טבלת הרשאות תב"ר
CREATE TABLE IF NOT EXISTS tabar_permissions (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    permission_number TEXT NOT NULL,
    ministry TEXT,
    amount NUMERIC(15,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    document_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- טבלת מקורות מימון תב"ר
CREATE TABLE IF NOT EXISTS tabar_funding (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    funder_name TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    percent NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- טבלת מסמכי תב"ר
CREATE TABLE IF NOT EXISTS tabar_documents (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- טבלת סעיפי תקציב (לתאימות לאחור)
CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(15,2) NOT NULL,
    spent NUMERIC(15,2) DEFAULT 0 NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    updated_at DATE DEFAULT CURRENT_DATE NOT NULL
);

-- נתוני דמו למחלקות
INSERT INTO departments (name) VALUES 
('הנדסה'),
('חינוך'),
('רווחה'),
('תרבות'),
('ביטחון'),
('איכות הסביבה')
ON CONFLICT DO NOTHING;

-- נתוני דמו לתב"רים
INSERT INTO tabarim (year, tabar_number, name, ministry, department, total_authorized, municipal_participation, additional_funders, open_date, status) VALUES 
(2024, 101, 'הרחבת גן ילדים', 'משרד החינוך', 'חינוך', 800000, 200000, 'תרומות פרטיות', '2024-01-10', 'פעיל'),
(2023, 202, 'שדרוג כבישים', 'משרד התחבורה', 'הנדסה', 1200000, 500000, 'קרן ממשלתית', '2023-08-15', 'סגור'),
(2024, 303, 'מרכז קהילתי', 'משרד הרווחה', 'רווחה', 950000, 300000, 'תרומות עירוניות', '2024-03-01', 'פעיל'),
(2024, 404, 'שיפוץ ספרייה', 'משרד התרבות', 'תרבות', 600000, 150000, NULL, '2024-02-15', 'פעיל'),
(2023, 505, 'מערכת אבטחה', 'משרד הביטחון הפנים', 'ביטחון', 1500000, 0, 'תקציב ממשלתי מלא', '2023-12-01', 'פעיל'),
(2024, 2211, 'פרויקט דוגמה', 'משרד הפנים', 'הנדסה', 5000000, 1000000, 'מימון ממשלתי', '2024-01-01', 'פעיל')
ON CONFLICT DO NOTHING;

-- נתוני דמו לפריטי תב"ר
INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes) VALUES 
(1, 'בינוי', '201-22-001', 'קירות ותשתית', 400000, 'קבלן: ע.ב.ד. עבודות'),
(1, 'ציוד', '201-22-002', 'ציוד משחקים', 80000, NULL),
(1, 'תכנון', '201-22-003', 'שירותי אדריכל', 120000, 'כולל פיקוח'),
(2, 'סלילה', '302-11-013', 'אספלט ואבנים משתלבות', 900000, 'כולל תאורה'),
(2, 'תאורה', '302-11-014', 'עמודי תאורה LED', 200000, 'חיסכון באנרגיה'),
(3, 'בינוי', '401-33-001', 'בניית מבנה', 650000, 'קבלן מוסמך'),
(3, 'ציוד', '401-33-002', 'ריהוט ומתקנים', 200000, 'כיסאות, שולחנות, מתקני ספורט'),
(4, 'שיפוץ', '501-44-001', 'עבודות צבע ותחזוקה', 350000, 'כולל חומרים'),
(4, 'ציוד', '501-44-002', 'מדפים וריהוט', 150000, 'עץ איכותי'),
(5, 'טכנולוgia', '601-55-001', 'מצלמות אבטחה', 800000, '50 מצלמות HD'),
(5, 'התקנה', '601-55-002', 'עבודות התקנה וחיווט', 400000, 'כולל תחזוקה שנתיים'),
(5, 'תוכנה', '601-55-003', 'מערכת ניהול אבטחה', 300000, 'רישיון 5 שנים'),
-- פריטים לתב"ר 2211 (דוגמה)
(6, 'הכנסה', '2211-INC-001', 'הכנסה - פרויקט דוגמה', 5000000, 'סעיף הכנסה אוטומטי'),
(6, 'הוצאה', '2211-EXP-001', 'הוצאה - פרויקט דוגמה', 5000000, 'סעיף הוצאה אוטומטי'),
(6, 'הכנסה', '2211-MUN-001', 'השתתפות עירונית - פרויקט דוגמה', 1000000, 'השתתפות עירונית')
ON CONFLICT DO NOTHING;

-- נתוני דמו לתנועות כספיות עם השדות החדשים
INSERT INTO tabar_transactions (tabar_id, item_id, transaction_type, supplier_name, supplier_id, order_number, amount, direction, status, transaction_date, description, reported) VALUES 
-- Transactions for תב"ר 2211
(6, 14, 'חשבונית', 'חברת הבנייה המובילה בע"מ', '515123456', 'INV-2024-001', 125000, 'חיוב', 'שולם', '2024-01-15', 'עבודות בנייה - שלב א', true),
(6, 14, 'חשבונית', 'ספקי ציוד חשמל בע"מ', '515789012', 'INV-2024-002', 45000, 'חיוב', 'לא שולם', '2024-01-20', 'התקנת מערכות חשמל', false),
(6, 14, 'תשלום', 'חברת הבנייה המובילה בע"מ', '515123456', 'PAY-2024-001', 125000, 'זיכוי', 'שולם', '2024-01-25', 'תשלום עבור חשבונית INV-2024-001', true),
(6, 14, 'חשבונית', 'קבלני גמר בע"מ', '515345678', 'INV-2024-003', 78000, 'חיוב', 'בתהליך', '2024-02-01', 'עבודות גמר ושיפוץ', false),

-- Transactions for תב"ר 101 (חינוך)
(1, 1, 'חשבונית', 'ספקי ציוד לימודי בע"מ', '515456789', 'EDU-2024-001', 35000, 'חיוב', 'שולם', '2024-01-10', 'ספרי לימוד ומחשבים', true),
(1, 1, 'חשבונית', 'חברת תחזוקה חינוכית', '515567890', 'EDU-2024-002', 18500, 'חיוב', 'שולם', '2024-01-25', 'תחזוקת מבני בית ספר', true),
(1, 1, 'תשלום', 'ספקי ציוד לימודי בע"מ', '515456789', 'PAY-EDU-001', 35000, 'זיכוי', 'שולם', '2024-01-15', 'תשלום עבור ציוד לימודי', true),
(1, 2, 'חשבונית', 'מערכות מחשוב חינוכי', '515678901', 'EDU-2024-003', 67000, 'חיוב', 'לא שולם', '2024-02-10', 'מערכת ניהול דיגיטלית', false),

-- Transactions for תב"ר 303 (רווחה)
(3, 6, 'חשבונית', 'ציוד רפואי מתקדם בע"מ', '515789123', 'MED-2024-001', 180000, 'חיוב', 'שולם', '2024-01-05', 'מכשור רפואי חדש', true),
(3, 6, 'חשבונית', 'חברת תחזוקת מכשור רפואי', '515890234', 'MED-2024-002', 25000, 'חיוב', 'בתהליך', '2024-01-30', 'תחזוקה שנתית למכשור', false),
(3, 6, 'תשלום', 'ציוד רפואי מתקדם בע"מ', '515789123', 'PAY-MED-001', 180000, 'זיכוי', 'שולם', '2024-01-12', 'תשלום עבור ציוד רפואי', true),

-- Transactions for תב"ר 202 (תחבורה)
(2, 4, 'חשבונית', 'חברת כבישים ותשתיות', '515901345', 'ROAD-2024-001', 450000, 'חיוב', 'לא שולם', '2024-02-01', 'סלילת כבישים חדשים', false),
(2, 4, 'חשבונית', 'ספקי תמרור ושילוט', '515012456', 'ROAD-2024-002', 85000, 'חיוב', 'שולם', '2024-01-28', 'התקנת תמרורים ושילוט', true),
(2, 4, 'תשלום', 'ספקי תמרור ושילוט', '515012456', 'PAY-ROAD-001', 85000, 'זיכוי', 'שולם', '2024-02-03', 'תשלום עבור שילוט', true),

-- Transactions for תב"ר 404 (תרבות)
(4, 8, 'חשבונית', 'ציוד תרבותי ואמנות', '515123567', 'CUL-2024-001', 32000, 'חיוב', 'שולם', '2024-01-12', 'ציוד לאירועי תרבות', true),
(4, 8, 'חשבונית', 'הפקת אירועים תרבותיים', '515234678', 'CUL-2024-002', 75000, 'חיוב', 'לא שולם', '2024-02-05', 'הפקת פסטיבל תרבות', false),
(4, 8, 'תשלום', 'ציוד תרבותי ואמנות', '515123567', 'PAY-CUL-001', 32000, 'זיכוי', 'שולם', '2024-01-18', 'תשלום עבור ציוד תרבותי', true),

-- Additional unpaid invoices for testing
(6, 14, 'חשבונית', 'חומרי בנייה מתקדמים', '515987654', 'INV-2024-010', 95000, 'חיוב', 'לא שולם', '2024-02-15', 'חומרי גמר מיוחדים', false),
(1, 2, 'חשבונית', 'ספקי טכנולוגיה חינוכית', '515876543', 'EDU-2024-010', 42000, 'חיוב', 'לא שולם', '2024-02-12', 'לוחות אינטראקטיביים', false),
(3, 7, 'חשבונית', 'תרופות ואביזרים רפואיים', '515765432', 'MED-2024-010', 38000, 'חיוב', 'לא שולם', '2024-02-08', 'מלאי תרופות חירום', false),

-- Some unreported transactions
(2, 5, 'חשבונית', 'חברת תחזוקת כבישים', '515654321', 'ROAD-2024-010', 28000, 'חיוב', 'שולם', '2024-02-10', 'תיקוני כבישים חורף', false),
(4, 9, 'חשבונית', 'ספקי קישוטים ותפאורה', '515543210', 'CUL-2024-010', 15000, 'חיוב', 'שולם', '2024-02-14', 'קישוטים לאירוע חג', false)
ON CONFLICT DO NOTHING;

-- נתוני דמו להרשאות
INSERT INTO tabar_permissions (tabar_id, permission_number, ministry, amount, start_date, end_date, document_url) VALUES 
(1, '2024/456/12', 'משרד החינוך', 600000, '2024-01-01', '2025-01-01', '/uploads/permission1.pdf'),
(2, '2023/783/01', 'משרד התחבורה', 1200000, '2023-08-01', '2024-06-01', '/uploads/permission2.pdf'),
(6, '2024/2211/01', 'משרד הפנים', 5000000, '2024-01-01', '2025-12-31', '/uploads/permission_2211.pdf')
ON CONFLICT DO NOTHING;

-- נתוני דמו למקורות מימון
INSERT INTO tabar_funding (tabar_id, funder_name, amount, percent, notes) VALUES 
(1, 'עיריית מצפה מנות', 200000, 25, 'תקציב עירוני'),
(1, 'תרומות פרטיות', 100000, 12.5, NULL),
(1, 'משרד החינוך', 500000, 62.5, NULL),
(2, 'משרד התחבורה', 1200000, 70, NULL),
(2, 'קרן ממשלתית', 500000, 30, NULL),
(6, 'משרד הפנים', 4000000, 80, 'מימון ממשלתי'),
(6, 'עיריית מצפה מנות', 1000000, 20, 'השתתפות עירונית')
ON CONFLICT DO NOTHING;

-- נתוני דמו למסמכים
INSERT INTO tabar_documents (tabar_id, description, file_url) VALUES 
(1, 'סיכום ישיבת תקציב', '/uploads/meeting1.pdf'),
(2, 'צילום מצב התקדמות', '/uploads/photo1.jpg'),
(6, 'אישור תקציבי לתב"ר 2211', '/uploads/approval_2211.pdf')
ON CONFLICT DO NOTHING;
