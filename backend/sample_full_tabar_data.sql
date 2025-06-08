-- דוגמת תב"ר
INSERT INTO tabarim (year, tabar_number, name, ministry, total_authorized, municipal_participation, additional_funders, open_date, status)
VALUES
  (2024, 101, 'הרחבת גן ילדים', 'משרד החינוך', 800000, 200000, 'תרומות פרטיות', '2024-01-10', 'פעיל'),
  (2023, 202, 'שדרוג כבישים', 'משרד התחבורה', 1200000, 500000, 'קרן ממשלתית', '2023-08-15', 'סגור');

-- סעיפי תב"ר לדוגמה
INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
VALUES
  (1, 'בינוי', '201-22-001', 'קירות ותשתית', 400000, 'קבלן: ע.ב.ד. עבודות'),
  (1, 'ציוד', '201-22-002', 'ציוד משחקים', 80000, NULL),
  (2, 'סלילה', '302-11-013', 'אספלט ואבנים משתלבות', 900000, 'כולל תאורה');

-- תנועות כספיות לדוגמה
INSERT INTO tabar_transactions (tabar_id, item_id, transaction_type, transaction_date, order_number, amount, direction, status, description)
VALUES
  (1, 1, 'חשבונית', '2024-02-01', 'INV-455', 150000, 'חיוב', 'שולם', 'עבור עבודות תשתית'),
  (2, 3, 'תשלום', '2023-10-10', 'PAY-390', 500000, 'כניסה', 'שולם', 'השתתפות עירייה');

-- הרשאות/אישורים לדוגמה
INSERT INTO tabar_permissions (tabar_id, permission_number, ministry, amount, start_date, end_date, document_url)
VALUES
  (1, '2024/456/12', 'משרד החינוך', 600000, '2024-01-01', '2025-01-01', '/uploads/permission1.pdf'),
  (2, '2023/783/01', 'משרד התחבורה', 1200000, '2023-08-01', '2024-06-01', '/uploads/permission2.pdf');

-- מקורות מימון לדוגמה
INSERT INTO tabar_funding (tabar_id, funder_name, amount, percent, notes)
VALUES
  (1, 'עיריית מצפה מנות', 200000, 25, 'תקציב עירוני'),
  (1, 'תרומות פרטיות', 100000, 12.5, NULL),
  (1, 'משרד החינוך', 500000, 62.5, NULL),
  (2, 'משרד התחבורה', 1200000, 70, NULL),
  (2, 'קרן ממשלתית', 500000, 30, NULL);

-- מסמכים כלליים לדוגמה
INSERT INTO tabar_documents (tabar_id, description, file_url, uploaded_at)
VALUES
  (1, 'סיכום ישיבת תקציב', '/uploads/meeting1.pdf', '2024-02-15'),
  (2, 'צילום מצב התקדמות', '/uploads/photo1.jpg', '2023-09-20');
