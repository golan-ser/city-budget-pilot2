
# Backend לניהול תב"ר וקולות קוראים

שרת מבוסס Express ו-PostgreSQL עבור מערכת תקצוב עירונית.

## התקנה
1. התקן תלויות:
```bash
npm install
```

2. העתק את `.env.example` לקובץ `.env` והשלם פרטי התחברות ל-PostgreSQL

3. הפעל את השרת:
```bash
node server.js
```

## Endpoints לדוגמה
- `GET /api/projects`
- `POST /api/projects`
