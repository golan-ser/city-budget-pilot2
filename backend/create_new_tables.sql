-- עדכון מבנה Database - טבלאות חדשות לדשבורד ראש העיר
-- תאריך: 22/06/2025

-- 1. טבלת מעקב ביצוע תקציבי לפי שנים
CREATE TABLE IF NOT EXISTS execution_by_year (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    year INTEGER NOT NULL,
    executed_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tabar_id, year)
);

-- 2. טבלה לתתי־סעיפים תקציביים בתוך תב"ר
CREATE TABLE IF NOT EXISTS budget_lines (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    code TEXT NOT NULL, -- קוד סעיף
    description TEXT NOT NULL,
    allocated_amount NUMERIC DEFAULT 0,
    executed_amount NUMERIC DEFAULT 0,
    percentage_executed NUMERIC GENERATED ALWAYS AS 
        (CASE WHEN allocated_amount > 0 THEN 100 * executed_amount / allocated_amount ELSE 0 END) STORED,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. דיווחים שהועברו למשרד ממשלתי
CREATE TABLE IF NOT EXISTS reports_sent_to_ministry (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id),
    report_date DATE NOT NULL,
    file_url TEXT,
    status TEXT CHECK (status IN ('נשלח', 'התקבל', 'נדחה')) DEFAULT 'נשלח',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. סטטוסים ניהוליים לתהליך הפרויקט
CREATE TABLE IF NOT EXISTS project_process_status (
    id SERIAL PRIMARY KEY,
    tabar_id INTEGER REFERENCES tabarim(id) UNIQUE,
    ministry_status TEXT CHECK (ministry_status IN ('מאושר', 'ממתין', 'נדחה')) DEFAULT 'ממתין',
    bank_status TEXT CHECK (bank_status IN ('אושר', 'נדחה', 'לא נבדק')) DEFAULT 'לא נבדק',
    approval_date DATE,
    last_updated TIMESTAMP DEFAULT NOW(),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- הוספת אינדקסים לביצועים מיטביים
CREATE INDEX IF NOT EXISTS idx_execution_by_year_tabar_year ON execution_by_year(tabar_id, year);
CREATE INDEX IF NOT EXISTS idx_budget_lines_tabar_id ON budget_lines(tabar_id);
CREATE INDEX IF NOT EXISTS idx_reports_ministry_tabar_id ON reports_sent_to_ministry(tabar_id);
CREATE INDEX IF NOT EXISTS idx_reports_ministry_date ON reports_sent_to_ministry(report_date);
CREATE INDEX IF NOT EXISTS idx_project_process_tabar_id ON project_process_status(tabar_id);

-- נתוני דמו לטבלאות החדשות
-- execution_by_year - ביצוע לפי שנים
INSERT INTO execution_by_year (tabar_id, year, executed_amount) VALUES 
(1, 2024, 372000),
(1, 2023, 150000),
(2, 2023, 1200000),
(5, 2024, 180000),
(6, 2024, 107000),
(7, 2023, 800000),
(8, 2024, 700000),
(9, 2024, 300000)
ON CONFLICT (tabar_id, year) DO NOTHING;

-- budget_lines - סעיפי תקציב מפורטים
INSERT INTO budget_lines (tabar_id, code, description, allocated_amount, executed_amount) VALUES 
-- תב"ר 101 - הרחבת גן ילדים (ID: 1)
(1, '2211-001', 'עבודות בנייה ותשתית', 500000, 200000),
(1, '2211-002', 'ציוד חינוכי ומשחקים', 200000, 120000),
(1, '2211-003', 'תכנון ופיקוח', 100000, 52000),

-- תב"ר 202 - שדרוג כבישים (ID: 2)
(2, '3021-001', 'סלילה ואספלט', 800000, 800000),
(2, '3021-002', 'תאורה ושילוט', 300000, 300000),
(2, '3021-003', 'ביצוע ופיקוח', 100000, 100000),

-- תב"ר 1211 - על פי שיקול דעתו (ID: 5)
(5, '4013-001', 'בניית מבנה', 650000, 150000),
(5, '4013-002', 'ציוד ותכנון פנים', 200000, 30000),
(5, '4013-003', 'הכשרת שטח', 100000, 0),

-- תב"ר 7001155 - שדרוג כבישים (ID: 6)
(6, '5014-001', 'עבודות שיפוץ', 400000, 80000),
(6, '5014-002', 'ריהוט וציוד', 150000, 27000),
(6, '5014-003', 'מערכות מחשוב', 50000, 0),

-- תב"ר 7001144 - הרחבת גן ילדים (ID: 7)
(7, '6015-001', 'מצלמות ציוד', 800000, 800000),
(7, '6015-002', 'התקנה וחיווט', 400000, 400000),
(7, '6015-003', 'תוכנה ותחזוקה', 300000, 300000),

-- תב"ר 7001122 - הרחבת גן ילדים (ID: 9)
(9, '2211-INC', 'הכנסות מממשלה', 400000, 0),
(9, '2211-EXP', 'הוצאות פרויקט', 400000, 300000),
(9, '2211-MUN', 'השתתפות עירונית', 100000, 0)
ON CONFLICT DO NOTHING;

-- reports_sent_to_ministry - דיווחים למשרד
INSERT INTO reports_sent_to_ministry (tabar_id, report_date, file_url, status, remarks) VALUES 
(1, '2024-01-15', '/uploads/reports/report_101_q1_2024.pdf', 'התקבל', 'דוח רבעון ראשון - אושר'),
(1, '2024-04-15', '/uploads/reports/report_101_q2_2024.pdf', 'נשלח', 'דוח רבעון שני - ממתין'),
(2, '2023-12-31', '/uploads/reports/report_202_final_2023.pdf', 'התקבל', 'דוח סיום פרויקט'),
(5, '2024-02-20', '/uploads/reports/report_1211_progress_2024.pdf', 'נדחה', 'חסרים מסמכים נוספים'),
(6, '2024-03-10', '/uploads/reports/report_7001155_q1_2024.pdf', 'נשלח', 'דוח התקדמות'),
(7, '2024-01-01', '/uploads/reports/report_7001144_implementation.pdf', 'התקבל', 'דוח יישום מערכת'),
(9, '2024-02-01', '/uploads/reports/report_7001122_startup.pdf', 'התקבל', 'דוח פתיחת פרויקט')
ON CONFLICT DO NOTHING;

-- project_process_status - סטטוסים ניהוליים
INSERT INTO project_process_status (tabar_id, ministry_status, bank_status, approval_date, remarks) VALUES 
(1, 'מאושר', 'אושר', '2024-01-05', 'פרויקט מאושר במלואו'),
(2, 'מאושר', 'אושר', '2023-08-01', 'פרויקט הושלם בהצלחה'),
(5, 'ממתין', 'לא נבדק', NULL, 'ממתין לאישור תקציבי נוסף'),
(6, 'מאושר', 'אושר', '2024-02-10', 'אושר לביצוע שלב ראשון'),
(7, 'מאושר', 'אושר', '2023-11-15', 'פרויקט אסטרטגי - אושר במהירות'),
(8, 'מאושר', 'אושר', '2024-01-01', 'פרויקט מרכזי לשנת 2024'),
(9, 'ממתין', 'לא נבדק', NULL, 'פרויקט חדש - טרם נבדק'),
(10, 'ממתין', 'לא נבדק', NULL, 'פרויקט חדש - טרם נבדק')
ON CONFLICT (tabar_id) DO NOTHING;

-- הוספת עמודות חדשות לטבלת tabarim (אם נדרש)
ALTER TABLE tabarim ADD COLUMN IF NOT EXISTS priority_level TEXT CHECK (priority_level IN ('גבוה', 'בינוני', 'נמוך')) DEFAULT 'בינוני';
ALTER TABLE tabarim ADD COLUMN IF NOT EXISTS project_manager TEXT;
ALTER TABLE tabarim ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;

-- עדכון נתונים קיימים עם מידע נוסף
UPDATE tabarim SET 
    priority_level = 'בינוני',
    project_manager = 'שרה לוי',
    estimated_completion_date = '2024-08-31'
WHERE tabar_number = 101;

UPDATE tabarim SET 
    priority_level = 'גבוה',
    project_manager = 'דוד כהן',
    estimated_completion_date = '2024-12-31'
WHERE tabar_number = 202;

UPDATE tabarim SET 
    priority_level = 'נמוך',
    project_manager = 'מיכל אברהם',
    estimated_completion_date = '2024-06-30'
WHERE tabar_number = 1211; 