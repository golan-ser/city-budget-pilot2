
-- נתוני דוגמה לטבלת projects
INSERT INTO projects (name, type, department_id, start_date, end_date, budget_amount, status)
VALUES 
('שדרוג תשתיות מים', 'תבר', 1, '2024-01-01', '2025-01-01', 1500000, 'מאושר'),
('הקמת מרכז צעירים', 'קול קורא', 2, '2024-03-15', '2025-06-30', 950000, 'בביצוע');

-- נתוני דוגמה לטבלת reports
INSERT INTO reports (project_id, report_date, status, notes, created_by)
VALUES 
(1, '2024-06-01', 'טיוטה', 'דיווח ראשון לשדרוג מים', 10),
(2, '2024-06-05', 'בבדיקה', 'דיווח פתיחה למרכז צעירים', 11);

-- נתוני דוגמה לטבלת documents
INSERT INTO documents (report_id, file_name, file_path, uploaded_by)
VALUES 
(1, 'report1.pdf', '/uploads/report1.pdf', 10),
(2, 'report2.pdf', '/uploads/report2.pdf', 11);

-- נתוני דוגמה לטבלת milestones
INSERT INTO milestones (project_id, title, due_date, status, description)
VALUES 
(1, 'תחילת ביצוע', '2024-07-01', 'לא התחיל', 'בדיקת קווים'),
(2, 'אישור תוכניות', '2024-08-15', 'הושלם', 'אישור מול משרד ממשלתי');

-- נתוני דוגמה לטבלת comments
INSERT INTO comments (report_id, user_id, comment)
VALUES 
(1, 12, 'נא להוסיף מסמך תקציב'),
(2, 13, 'מאושר. יש לעדכן סטטוס.');

-- נתוני דוגמה לטבלת alerts
INSERT INTO alerts (project_id, message, alert_date, alert_type)
VALUES 
(1, 'הרשאה עומדת לפוג בעוד 30 יום', '2024-07-01', 'התראה'),
(2, 'נדרש דיווח חדש למשרד', '2024-07-10', 'התראה');

-- נתוני דוגמה לטבלת permissions
INSERT INTO permissions (project_id, year, ministry, amount, valid_until)
VALUES 
(1, 2024, 'משרד הפנים', 1000000, '2024-12-31'),
(2, 2024, 'משרד הרווחה', 800000, '2025-03-31');

-- נתוני דוגמה לטבלת funding_sources
INSERT INTO funding_sources (project_id, source_name, amount)
VALUES 
(1, 'קק"ל', 400000),
(2, 'קרן אריסון', 300000);
