-- מיגרציה להוספת עמודות חסרות לטבלת tabarim
-- תאריך: 22/06/2025 - שלב 2

-- הוספת העמודות החדשות (בלבד - ללא מחיקת עמודות קיימות)
ALTER TABLE tabarim
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS total_executed NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS latest_report_sent DATE;

-- עדכון נתונים לדוגמה בעמודות החדשות
UPDATE tabarim SET 
    short_description = 'הרחבת מתקני חינוך בעיר',
    total_executed = 372000,
    latest_report_sent = '2024-04-15'
WHERE tabar_number = 101;

UPDATE tabarim SET 
    short_description = 'שיפור תשתיות תחבורה עירוניות',
    total_executed = 1200000,
    latest_report_sent = '2023-12-31'
WHERE tabar_number = 202;

UPDATE tabarim SET 
    short_description = 'פרויקט על פי שיקול דעת',
    total_executed = 180000,
    latest_report_sent = '2024-02-20'
WHERE tabar_number = 1211;

UPDATE tabarim SET 
    short_description = 'שדרוג מערכות תשתית',
    total_executed = 107000,
    latest_report_sent = '2024-03-10'
WHERE tabar_number = 7001155;

UPDATE tabarim SET 
    short_description = 'הרחבת שירותי קהילה',
    total_executed = 800000,
    latest_report_sent = '2024-01-01'
WHERE tabar_number = 7001144;

UPDATE tabarim SET 
    short_description = 'שדרוג מערכות ביטחון',
    total_executed = 700000,
    latest_report_sent = '2024-02-01'
WHERE tabar_number = 7001133;

UPDATE tabarim SET 
    short_description = 'פיתוח מתקני חינוך נוספים',
    total_executed = 300000,
    latest_report_sent = '2024-01-15'
WHERE tabar_number = 7001122;

UPDATE tabarim SET 
    short_description = 'פרויקט פיתוח עירוני',
    total_executed = 0,
    latest_report_sent = NULL
WHERE tabar_number = 1234; 